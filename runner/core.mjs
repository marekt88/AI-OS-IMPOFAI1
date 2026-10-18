// Shared runner core: paths, secrets, process definitions, locking and one `claude -p` run.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { todayAt } from "./cron.mjs";

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOME = process.env.AIOS_RUNNER_HOME || path.join(os.homedir(), ".aios-runner");
export const DIRS = {
  home: HOME,
  state: path.join(HOME, "state"),
  runs: path.join(HOME, "runs"),
  work: path.join(HOME, "work"),
  locks: path.join(HOME, "locks"),
  logs: path.join(HOME, "logs"),
};
export const CLAUDE_BIN = process.env.CLAUDE_BIN || path.join(os.homedir(), ".local/bin/claude");
// process definitions; AIOS_PROCESSES_DIR only for tests (runner/test)
export const PROCESSES_DIR = process.env.AIOS_PROCESSES_DIR || path.join(REPO, "processes");
export const DEFAULT_TZ = "Europe/Bratislava";

export function ensureDirs() {
  for (const d of Object.values(DIRS)) fs.mkdirSync(d, { recursive: true, mode: 0o700 });
}

// ---------- secrets (~/.aios-runner/secrets.env, never in git) ----------
let secretsCache;
export function secrets() {
  if (secretsCache) return secretsCache;
  secretsCache = {};
  try {
    for (const line of fs.readFileSync(path.join(HOME, "secrets.env"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) secretsCache[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no secrets file yet */
  }
  return secretsCache;
}
/** Remove secret values from any text before it is logged or reported. */
export function redact(text) {
  let out = String(text ?? "");
  for (const v of Object.values(secrets())) if (v && v.length >= 8) out = out.split(v).join("[secret]");
  return out;
}

// ---------- process definitions (processes/<name>/process.json) ----------
export function listProcesses() {
  const dir = PROCESSES_DIR;
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, "process.json")))
    .map((d) => d.name)
    .sort();
}

export function loadProcess(name) {
  const dir = path.join(PROCESSES_DIR, name);
  const def = JSON.parse(fs.readFileSync(path.join(dir, "process.json"), "utf8"));
  const file = (f) => (fs.existsSync(path.join(dir, f)) ? path.join(dir, f) : null);
  const p = {
    name,
    dir,
    description: def.description ?? "",
    enabled: def.enabled !== false,
    schedule: def.schedule ?? null, // cron string or null = manual only
    tz: def.tz ?? DEFAULT_TZ,
    model: def.model ?? "sonnet",
    effort: def.effort ?? null,
    maxTurns: def.maxTurns ?? 30,
    timeoutMin: def.timeoutMin ?? 20,
    allowedTools: def.allowedTools ?? [],
    // built-in tools besides the always-present ToolSearch (it keeps MCP tool definitions deferred;
    // without it every connector's schema is loaded up front and the prompt overflows)
    builtinTools: ["ToolSearch", ...(def.builtinTools ?? [])],
    requireTools: def.requireTools ?? [], // tools that must have been called successfully, else the run fails
    // K2 extension: in dry-run these replace allowedTools / requireTools (missing = same as live)
    dryRunAllowedTools: def.dryRunAllowedTools ?? null,
    dryRunRequireTools: def.dryRunRequireTools ?? null,
    cwd: def.cwd === "repo" ? REPO : path.join(DIRS.work, name),
    catchUpMin: def.catchUpMin ?? 30,
    firstSinceHours: def.firstSinceHours ?? 24,
    deliverAt: def.deliverAt ?? null, // "HH:MM" in tz: the after-step waits until then (scheduled runs only)
    afterTimeoutMin: def.afterTimeoutMin ?? 15,
    keepRuns: def.keepRuns ?? 30,
    claude: def.claude !== false, // false = no claude -p step, the (JSON) input is the output
    // [{ "var": "last_followup", "process": "call-followup" }] → last successful output (mode "last", default)
    // [{ "var": "followups", "process": "call-followup", "mode": "since" }] → all successful outputs since lastSuccessAt (max 20)
    context: def.context ?? [],
    prompt: file("prompt.md"),
    system: file("system.md"),
    schema: file("schema.json"),
    after: file("after.mjs"),
  };
  if (p.claude && !p.prompt) throw new Error(`process ${name}: prompt.md missing`);
  if (!Array.isArray(p.allowedTools)) throw new Error(`process ${name}: allowedTools must be an array`);
  for (const k of ["dryRunAllowedTools", "dryRunRequireTools"]) if (p[k] != null && !Array.isArray(p[k])) throw new Error(`process ${name}: ${k} must be an array`);
  for (const c of p.context) {
    if (!c?.var || !c?.process) throw new Error(`process ${name}: context entries need "var" and "process"`);
    if (c.mode && !["last", "since"].includes(c.mode)) throw new Error(`process ${name}: context mode "${c.mode}" (use "last" or "since")`);
  }
  return p;
}

// ---------- state ----------
const stateFile = (name) => path.join(DIRS.state, `${name}.json`);
/** State of a process. Missing file = {}. A damaged file throws (never silently replaced by {}). */
export function readState(name) {
  let text;
  try {
    text = fs.readFileSync(stateFile(name), "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`state file ${stateFile(name)} is not valid JSON; fix or remove it by hand`);
  }
}
const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
/** Read-modify-write under a short lock (tick and runs write the same file), written atomically (tmp + rename). */
export function writeState(name, patch) {
  let release = null;
  for (let i = 0; i < 100 && !(release = acquireLock(`state-${name}`)); i++) sleepSync(20);
  try {
    const next = { ...readState(name), ...patch };
    const tmp = `${stateFile(name)}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2));
    fs.renameSync(tmp, stateFile(name));
    return next;
  } finally {
    release?.();
  }
}

// ---------- locking (one run per process; stale locks are taken over) ----------
/** false when the pid is gone or (Linux) was reused by a process that is not node. */
function lockOwnerAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
  } catch (err) {
    return err.code === "EPERM";
  }
  try {
    const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8");
    return /node/.test(cmd); // every lock holder is a node process (runner, after.mjs, tests)
  } catch {
    return true; // no /proc: trust kill(0)
  }
}
export function acquireLock(key) {
  const file = path.join(DIRS.locks, `${key}.lock`);
  const mine = `${process.pid} ${new Date().toISOString()}`;
  for (let i = 0; i < 3; i++) {
    try {
      const fd = fs.openSync(file, "wx");
      fs.writeSync(fd, mine);
      fs.closeSync(fd);
      // release only our own lock (never one that was taken over meanwhile)
      return () => {
        try {
          if (fs.readFileSync(file, "utf8") === mine) fs.rmSync(file, { force: true });
        } catch {
          /* already gone */
        }
      };
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      let seen;
      try {
        seen = fs.readFileSync(file, "utf8");
      } catch {
        continue; // removed meanwhile
      }
      if (lockOwnerAlive(Number(seen.split(" ")[0]))) return null;
      // take over a stale lock: move it aside under a unique name, so only one waiter wins
      const aside = `${file}.stale.${process.pid}.${Date.now()}`;
      try {
        fs.renameSync(file, aside);
      } catch {
        continue; // someone else moved it
      }
      const moved = fs.readFileSync(aside, "utf8");
      if (moved !== seen) {
        // we moved a fresh lock of another waiter: put it back unless a new one exists
        try {
          fs.linkSync(aside, file);
        } catch {
          /* a newer lock exists */
        }
        fs.rmSync(aside, { force: true });
        return null;
      }
      fs.rmSync(aside, { force: true });
    }
  }
  return null;
}

// ---------- auth ----------
const BILLING_ENV = ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_VERTEX", "CLAUDE_CODE_USE_FOUNDRY", "CLAUDE_CODE_OAUTH_TOKEN"];
export function claudeEnv() {
  const env = { ...process.env, PATH: `${path.dirname(CLAUDE_BIN)}:${process.env.PATH ?? ""}` };
  for (const k of BILLING_ENV) delete env[k]; // always the claude.ai subscription login, never API billing
  for (const k of Object.keys(secrets())) delete env[k]; // secrets.env is for after.mjs only, never for the model
  return env;
}

export function checkAuth() {
  const r = spawnSync(CLAUDE_BIN, ["auth", "status"], { env: claudeEnv(), encoding: "utf8", timeout: 60_000 });
  if (r.error) return { ok: false, reason: `claude CLI not runnable: ${r.error.message}` };
  let s = {};
  try {
    s = JSON.parse(r.stdout);
  } catch {
    /* fall through */
  }
  if (r.status !== 0 || !s.loggedIn) return { ok: false, reason: "Claude Code is not logged in (run `claude` → /login on the server)" };
  if (s.authMethod !== "claude.ai") return { ok: false, reason: `Claude Code uses "${s.authMethod}" instead of the claude.ai subscription` };
  return { ok: true, subscription: s.subscriptionType };
}

// ---------- one run ----------
/** Tools for this run: dry-run uses dryRunAllowedTools / dryRunRequireTools when the process defines them. */
export function toolsFor(p, dryRun) {
  if (!dryRun) return { allowed: p.allowedTools, require: p.requireTools };
  const allowed = p.dryRunAllowedTools ?? p.allowedTools;
  // without dryRunRequireTools: only the required tools that dryRunAllowedTools still allows (a server prefix covers its tools)
  const covered = (t) => allowed.some((a) => t === a || t.startsWith(a + "__"));
  const require = p.dryRunRequireTools ?? (p.dryRunAllowedTools ? p.requireTools.filter(covered) : p.requireTools);
  return { allowed, require };
}
const AUTH_PATTERNS = /(needs? (re-?)?authentication|not authenticated|unauthori[sz]ed|invalid[_ ]token|token (has )?expired|login expired|please run \/login|authentication required|401\b)/i;

// ---------- transient `claude -p` failures (retried inside one run) ----------
// 2026-10-18: "Failed to refresh OAuth token: another Claude Code process is refreshing it…" came back as
// subtype "success" with is_error=true, terminal_reason "api_error" and the message in `result`.
const TRANSIENT_AUTH = /failed to refresh oauth token|another claude code process is refreshing|oauth token refresh (failed|in progress)|exited mid-refresh/i;
const TRANSIENT_NETWORK = /\b(ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ENETUNREACH|EHOSTUNREACH|EPIPE|UND_ERR_[A-Z_]+)\b|socket hang up|fetch failed|network error|network is unreachable|connection (error|reset|refused|closed)|request timed out|timed out connecting/i;
const TRANSIENT_RATE = /\b(429|529)\b|rate[ _-]?limit|too many requests|overloaded|\b50[234]\b|service unavailable|bad gateway|internal server error/i;
const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504, 529]);
/** Default waits before attempt 2 and 3 (ms). RUN_RETRY_DELAYS_MS="0,0" only for tests. */
export function retryDelays() {
  const raw = process.env.RUN_RETRY_DELAYS_MS;
  if (raw != null && raw !== "") return raw.split(",").map((x) => Math.max(0, Number(x) || 0));
  return [60_000, 120_000];
}
/** A tool that only reads (safe to repeat). Everything else counts as a write. */
export function isReadOnlyTool(name) {
  const short = String(name).split("__").pop();
  return ["ToolSearch", "StructuredOutput", "Read", "Grep", "Glob"].includes(short) ||
    /^(pm_)?(get|list|search|read|fetch)(_|$)/.test(short) || /^(fireflies|creative|agents)_(get|list|search|fetch)/.test(short);
}

/**
 * Decides whether a finished `claude -p` attempt failed on a transient problem worth repeating.
 * Returns null when the attempt did not fail transiently, else
 * { cls: "auth-refresh"|"network"|"rate", text, retrySafe, why } (retrySafe=false when a write tool already ran).
 */
export function classifyTransient(out) {
  if (!out || out.timedOut) return null;
  const r = out.result;
  const failed = !r || r.is_error || r.subtype !== "success" || out.exitCode !== 0;
  if (!failed) return null;
  const texts = [];
  if (r && (r.is_error || r.subtype !== "success")) texts.push(String(r.result ?? ""));
  if (out.apiError?.text) texts.push(String(out.apiError.text));
  if (!r || out.exitCode !== 0) texts.push(String(out.stderr ?? "").slice(-2000));
  const text = texts.filter(Boolean).join(" | ");
  // network/rate patterns only for API-level failures (a model answer may mention "502" in a task key)
  const apiLike = !r || !!out.apiError || r.terminal_reason === "api_error" || r.api_error_status != null;
  let cls = null;
  if (TRANSIENT_AUTH.test(text)) cls = "auth-refresh";
  else if (apiLike && TRANSIENT_NETWORK.test(text)) cls = "network";
  else if (apiLike && (TRANSIENT_RATE.test(text) || TRANSIENT_STATUS.has(Number(r?.api_error_status)))) cls = "rate";
  else if (r?.terminal_reason === "api_error" && (r.num_turns ?? 0) <= 1 && !(out.toolCalls ?? []).length) cls = "rate"; // API error before any work
  if (!cls) return null;
  const writes = [...new Set((out.toolCalls ?? []).filter((t) => !isReadOnlyTool(t)))];
  return { cls, text: text.slice(0, 1000), retrySafe: writes.length === 0, why: writes.length ? `write tools already called: ${writes.join(", ")}` : null };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

class RunError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

/** Last successful output.json of a process (for `context` and later runs), or null. */
export function lastOutput(name) {
  const st = readState(name);
  if (!st.lastSuccessRunId) return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(DIRS.runs, name, st.lastSuccessRunId, "output.json"), "utf8"));
  } catch {
    return null;
  }
}

export const SUCCESS_INDEX_MAX = 100;
export const SINCE_MAX = 20;
/**
 * Index of successful (non dry-run) runs: [{ runId, at, finishedAt }], oldest first, at most 100.
 * Kept in state/<name>.json → successRuns. Built once from the run directories when missing.
 */
export function successRuns(name) {
  const st = readState(name);
  if (Array.isArray(st.successRuns)) return st.successRuns;
  const dir = path.join(DIRS.runs, name);
  const list = [];
  if (fs.existsSync(dir)) {
    for (const id of fs.readdirSync(dir).sort()) {
      try {
        const l = JSON.parse(fs.readFileSync(path.join(dir, id, "run.json"), "utf8"));
        if (l.ok && !l.dryRun) list.push({ runId: id, at: l.startedAt, finishedAt: l.finishedAt ?? l.startedAt });
      } catch {
        /* incomplete run */
      }
    }
  }
  return list.slice(-SUCCESS_INDEX_MAX);
}

/**
 * Outputs of all successful runs of `name` that finished after `sinceIso`, oldest first, at most `max`
 * (the newest ones). Each item: { runId, at, finishedAt, output }. Runs whose output.json was pruned are skipped.
 */
export function outputsSince(name, sinceIso, max = SINCE_MAX) {
  const since = Date.parse(sinceIso);
  const hits = successRuns(name).filter((r) => Date.parse(r.finishedAt ?? r.at) > since).slice(-max);
  const out = [];
  for (const r of hits) {
    try {
      const o = JSON.parse(fs.readFileSync(path.join(DIRS.runs, name, r.runId, "output.json"), "utf8"));
      out.push({ runId: r.runId, at: r.at, finishedAt: r.finishedAt ?? r.at, output: o.output });
    } catch {
      /* pruned */
    }
  }
  return out;
}

/**
 * Runs one process end to end. Returns the run log object. Throws nothing: failures are recorded
 * in the log and returned with ok=false (the caller reports them).
 *
 * dryRun: env RUN_DRY=1 for claude -p and after.mjs, {{dry_run}}="true", log.dryRun; the run directory ends
 * with "-dry" and state (lastSuccessAt, lastSuccessRunId, successRuns, lastStatus) is not touched, only lastDryRun.
 */
/** Fail-safe: an inherited RUN_DRY=1 or VOICE_NO_CALL=1 always means dry-run, whatever the options say. */
export function envForcesDry(env = process.env) {
  return env.RUN_DRY === "1" || env.VOICE_NO_CALL === "1";
}

/** Fail-safe: a JSON input with `"dry_run": true` means dry-run as well (manual tests of executors). */
export function inputForcesDry(inputFile) {
  if (!inputFile) return false;
  try {
    const v = JSON.parse(fs.readFileSync(inputFile, "utf8"));
    return v != null && typeof v === "object" && v.dry_run === true;
  } catch {
    return false; // not JSON / not readable: decided by the process
  }
}

export async function runProcess(p, { manual = false, slot = null, noDeliverWait = false, inputFile = null, dryRun = false, retryOf = null } = {}) {
  if (envForcesDry() || inputForcesDry(inputFile)) dryRun = true;
  if (dryRun) process.env.RUN_DRY = "1"; // claude -p, after.mjs and spawnProcess children inherit it
  const started = new Date();
  const runId = started.toISOString().replace(/[:.]/g, "-") + (dryRun ? "-dry" : "");
  const runDir = path.join(DIRS.runs, p.name, runId);
  fs.mkdirSync(runDir, { recursive: true, mode: 0o700 });
  fs.mkdirSync(p.cwd, { recursive: true });
  const state = readState(p.name);
  const since = state.lastSuccessAt ? new Date(state.lastSuccessAt) : new Date(started.getTime() - p.firstSinceHours * 3600e3);
  const input = inputFile ? fs.readFileSync(inputFile, "utf8") : "";
  if (inputFile) fs.copyFileSync(inputFile, path.join(runDir, "input.json"));
  const log = { process: p.name, runId, manual, slot, inputFile, dryRun, retryOf, startedAt: started.toISOString(), since: since.toISOString(), ok: false, steps: {} };
  const save = () => fs.writeFileSync(path.join(runDir, "run.json"), JSON.stringify(log, null, 2));

  try {
    const vars = {
      since: since.toISOString(),
      now: started.toISOString(),
      tz: p.tz,
      today: new Intl.DateTimeFormat("sk-SK", { timeZone: p.tz, dateStyle: "full" }).format(started),
      input,
      dry_run: dryRun ? "true" : "false",
    };
    log.context = [];
    for (const c of p.context) {
      if (c.mode === "since") {
        const items = outputsSince(c.process, vars.since, c.max ?? SINCE_MAX);
        vars[c.var] = JSON.stringify(items, null, 1);
        log.context.push({ var: c.var, process: c.process, mode: "since", runIds: items.map((i) => i.runId) });
      } else {
        const o = lastOutput(c.process);
        vars[c.var] = o ? JSON.stringify(o.output, null, 1) : "(žiadny predchádzajúci výstup)";
        log.context.push({ var: c.var, process: c.process, mode: "last", runId: o ? readState(c.process).lastSuccessRunId : null });
      }
    }
    let output;
    if (!p.claude) {
      try {
        output = JSON.parse(input || "{}");
      } catch {
        throw new RunError("input", "input is not valid JSON");
      }
    } else {
      // 1. + 2. login check and claude -p; transient failures (OAuth refresh race, network, 429/overloaded) are
      // repeated up to 3 attempts with 60 s and 120 s waits, each attempt logged in log.steps.claudeAttempts
      const tools = toolsFor(p, dryRun);
      log.tools = { allowed: tools.allowed, require: tools.require };
      const prompt = render(fs.readFileSync(p.prompt, "utf8"), vars);
      const args = ["-p", "--output-format", "stream-json", "--verbose", "--no-session-persistence",
        "--model", p.model, "--max-turns", String(p.maxTurns), "--permission-mode", "dontAsk",
        // no hooks/plugins/skills from the user profile; claude.ai connectors stay available
        "--settings", JSON.stringify({ disableAllHooks: true }), "--disable-slash-commands",
        "--tools", p.builtinTools.join(",")];
      if (p.effort) args.push("--effort", p.effort);
      if (tools.allowed.length) args.push("--allowedTools", ...tools.allowed);
      if (p.system) args.push("--append-system-prompt", render(fs.readFileSync(p.system, "utf8"), vars));
      if (p.schema) args.push("--json-schema", fs.readFileSync(p.schema, "utf8"));
      args.push("--", prompt);

      const delays = retryDelays();
      const attempts = (log.steps.claudeAttempts = []);
      const transcript = path.join(runDir, "transcript.jsonl");
      let out = null;
      let msTotal = 0;
      for (let i = 0; ; i++) {
        const last = i >= delays.length;
        const at = new Date().toISOString();
        const auth = checkAuth();
        log.steps.auth = auth;
        if (!auth.ok) {
          attempts.push({ attempt: i + 1, at, phase: "auth-status", ok: false, transient: !last, message: redact(auth.reason).slice(0, 300) });
          if (last) throw new RunError("auth", `${auth.reason} (${i + 1} pokusy)`);
          save();
          await sleep(delays[i]);
          continue;
        }
        if (i > 0 && fs.existsSync(transcript)) fs.renameSync(transcript, path.join(runDir, `transcript-attempt${i}.jsonl`));
        const t0 = Date.now();
        out = await runClaude(args, p, transcript);
        const ms = Date.now() - t0;
        msTotal += ms;
        const tr = classifyTransient(out);
        attempts.push({ attempt: i + 1, at, phase: "claude", ms, exitCode: out.exitCode, timedOut: out.timedOut, subtype: out.result?.subtype ?? null,
          isError: out.result?.is_error ?? null, terminalReason: out.result?.terminal_reason ?? null, ok: !tr && !!out.result && !out.result.is_error && out.result.subtype === "success" && out.exitCode === 0,
          transient: tr ? tr.cls : null, retried: !!(tr && tr.retrySafe && !last), note: tr && !tr.retrySafe ? tr.why : null,
          message: tr ? redact(tr.text).slice(0, 300) : null });
        if (!tr || !tr.retrySafe) break;
        if (last) {
          if (tr.cls === "auth-refresh") throw new RunError("auth", `claude -p: obnova prihlásenia zlyhala aj po ${i + 1} pokusoch: ${redact(tr.text).slice(0, 400)}`);
          break; // network / rate: falls through to the normal classification below (claude-error)
        }
        save();
        await sleep(delays[i]);
      }

      log.steps.claude = { ms: msTotal, attempts: attempts.length, exitCode: out.exitCode, timedOut: out.timedOut, turns: out.result?.num_turns ?? null,
        subtype: out.result?.subtype ?? null, toolCalls: out.toolCalls, toolErrors: out.toolErrors.map((e) => ({ tool: e.tool, text: redact(e.text).slice(0, 500) })) };
      if (out.timedOut) throw new RunError("timeout", `claude -p exceeded ${p.timeoutMin} min`);
      const authErr = out.toolErrors.find((e) => AUTH_PATTERNS.test(e.text)) || (AUTH_PATTERNS.test(out.result?.result ?? "") && out.result?.is_error ? { tool: "claude", text: out.result.result } : null);
      if (authErr) throw new RunError("mcp-auth", `login/token problem in ${authErr.tool}: ${redact(authErr.text).slice(0, 300)}`);
      if (!out.result) throw new RunError("no-result", `claude -p ended without a result (exit ${out.exitCode}): ${redact(out.stderr).slice(-500)}`);
      if (out.result.subtype !== "success" || out.result.is_error) {
        throw new RunError(out.result.subtype === "error_max_turns" ? "max-turns" : "claude-error", `claude -p: ${out.result.subtype}: ${redact(String(out.result.result ?? "")).slice(0, 500)}`);
      }
      if (out.exitCode !== 0) throw new RunError("claude-error", `claude -p exit code ${out.exitCode}`);
      if (/^Prompt is too long/i.test(String(out.result.result ?? ""))) throw new RunError("claude-error", redact(out.result.result).slice(0, 300));
      // a required tool counts once at least one of its calls succeeded (a failed retry before is fine)
      const missing = tools.require.filter((t) => !out.toolOk.includes(t));
      if (missing.length) throw new RunError("required-tools", `required tools not called successfully: ${missing.join(", ")}`);
      output = out.result.result;
      if (p.schema) {
        output = out.result.structured_output;
        if (output == null) throw new RunError("schema", "no structured output matching schema.json");
        // convention: a process reports its own failure with { "ok": false, "error": "..." }
        if (output.ok === false) throw new RunError("process-reported", `process reported failure: ${redact(output.error ?? "").slice(0, 500)}`);
      }
    }
    fs.writeFileSync(path.join(runDir, "output.json"), JSON.stringify({ output, since: vars.since, now: vars.now, dryRun }, null, 2));
    log.steps.output = { file: "output.json" };
    log.prepMs = Date.now() - started.getTime(); // until the output was ready (before deliverAt waiting)

    // 3. optional delivery time + after-step
    if (p.after) {
      if (p.deliverAt && !manual && !noDeliverWait) {
        const at = todayAt(p.deliverAt, p.tz, new Date());
        const wait = at ? at.getTime() - Date.now() : 0;
        if (wait > 0) {
          log.steps.deliverWaitMs = wait;
          save();
          await new Promise((r) => setTimeout(r, wait));
        }
      }
      const t1 = Date.now();
      const a = await runAfter(p, runDir, { manual, since: vars.since, dryRun });
      log.steps.after = { ms: Date.now() - t1, exitCode: a.exitCode, timedOut: a.timedOut, stdout: redact(a.stdout).slice(-2000), stderr: redact(a.stderr).slice(-2000) };
      if (a.timedOut) throw new RunError("after-timeout", `after.mjs exceeded ${p.afterTimeoutMin} min`);
      if (a.exitCode !== 0) throw new RunError("after-failed", `after.mjs exit ${a.exitCode}: ${redact(a.stderr || a.stdout).slice(-500)}`);
    }

    log.ok = true;
    if (dryRun) {
      writeState(p.name, { lastDryRun: { runId, at: started.toISOString(), ok: true } });
    } else {
      const index = [...successRuns(p.name), { runId, at: started.toISOString(), finishedAt: new Date().toISOString() }].slice(-SUCCESS_INDEX_MAX);
      // after.mjs may say "done, but not delivered" (e.g. the brief call was not answered): the run counts as a
      // success, but lastSuccessAt stays, so the next run covers this period again (context "since", {{since}})
      const advance = readAdvance(runDir);
      log.advanceSince = advance;
      const patch = { lastRunAt: started.toISOString(), lastStatus: advance ? "ok" : "ok:not-delivered", lastRunId: runId, lastSuccessRunId: runId,
        lastPrepMs: log.prepMs ?? null, successRuns: index, pendingRetry: null }; // a success also cancels a planned slot retry
      if (advance) patch.lastSuccessAt = started.toISOString();
      writeState(p.name, patch);
    }
  } catch (err) {
    log.ok = false;
    log.error = { kind: err.kind ?? "crash", message: redact(err.message ?? String(err)) };
    if (dryRun) writeState(p.name, { lastDryRun: { runId, at: started.toISOString(), ok: false, error: log.error.kind } });
    else writeState(p.name, { lastRunAt: started.toISOString(), lastStatus: `failed:${log.error.kind}`, lastRunId: runId });
  } finally {
    log.finishedAt = new Date().toISOString();
    log.durationMs = Date.now() - started.getTime();
    save();
    fs.appendFileSync(path.join(DIRS.logs, "runs.jsonl"),
      JSON.stringify({ process: p.name, runId, at: log.startedAt, ms: log.durationMs, ok: log.ok, manual, dryRun, retryOf, error: log.error ?? null }) + "\n");
    pruneRuns(p);
  }
  return log;
}

function runClaude(args, p, transcriptFile) {
  return new Promise((resolve) => {
    const child = spawn(CLAUDE_BIN, args, { cwd: p.cwd, env: claudeEnv(), stdio: ["ignore", "pipe", "pipe"] });
    const transcript = fs.createWriteStream(transcriptFile, { mode: 0o600 });
    let buf = "", stderr = "", result = null, timedOut = false, apiError = null;
    const toolNames = new Map(), toolCalls = [], toolErrors = [], toolOk = [];
    const onLine = (line) => {
      if (!line.trim()) return;
      transcript.write(line + "\n");
      let m;
      try {
        m = JSON.parse(line);
      } catch {
        return;
      }
      if (m.type === "assistant") {
        if (m.is_api_error_message || m.error) apiError = { error: m.error ?? null, text: (m.message?.content ?? []).map((c) => c.text ?? "").join(" ") };
        for (const c of m.message?.content ?? []) if (c.type === "tool_use") { toolNames.set(c.id, c.name); toolCalls.push(c.name); }
      } else if (m.type === "user") {
        for (const c of m.message?.content ?? []) {
          if (c.type === "tool_result" && !c.is_error) toolOk.push(toolNames.get(c.tool_use_id) ?? "?");
          if (c.type === "tool_result" && c.is_error) {
            const text = Array.isArray(c.content) ? c.content.map((x) => x.text ?? "").join(" ") : String(c.content ?? "");
            toolErrors.push({ tool: toolNames.get(c.tool_use_id) ?? "?", text });
          }
        }
      } else if (m.type === "result") result = m;
    };
    child.stdout.on("data", (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        onLine(buf.slice(0, i));
        buf = buf.slice(i + 1);
      }
    });
    child.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 10_000).unref();
    }, p.timeoutMin * 60_000);
    child.on("close", (code) => {
      clearTimeout(timer);
      if (buf) onLine(buf);
      transcript.end();
      resolve({ exitCode: code, timedOut, result, stderr, toolCalls, toolErrors, toolOk, apiError });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      transcript.end();
      resolve({ exitCode: -1, timedOut, result: null, stderr: String(err.message), toolCalls, toolErrors, toolOk, apiError });
    });
  });
}

function runAfter(p, runDir, { manual, since, dryRun }) {
  return new Promise((resolve) => {
    const env = { ...process.env, ...secrets(), RUN_DIR: runDir, RUN_OUTPUT: path.join(runDir, "output.json"), RUN_MANUAL: manual ? "1" : "0", RUN_INPUT: path.join(runDir, "input.json"), RUN_SINCE: since, RUN_PROCESS: p.name, RUN_ID: path.basename(runDir), RUNNER: path.join(REPO, "runner", "run.mjs"), RUN_DRY: dryRun || envForcesDry() ? "1" : "0", RUN_ADVANCE_FILE: path.join(runDir, ADVANCE_FILE) }; // never downgrade an inherited RUN_DRY=1
    const child = spawn(process.execPath, [p.after], { cwd: p.dir, env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "", stderr = "", timedOut = false;
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, p.afterTimeoutMin * 60_000);
    child.on("close", (code) => {
      clearTimeout(timer);
      fs.writeFileSync(path.join(runDir, "after.log"), redact(`--- stdout\n${stdout}\n--- stderr\n${stderr}`));
      resolve({ exitCode: code, timedOut, stdout, stderr });
    });
  });
}

/** <runDir>/advance-since.json { "advance": false } written by after.mjs → do not move lastSuccessAt. */
export const ADVANCE_FILE = "advance-since.json";
function readAdvance(runDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(runDir, ADVANCE_FILE), "utf8")).advance !== false;
  } catch {
    return true;
  }
}

export const KEEP_DRY_RUNS = 20;
/**
 * Keeps the newest `keepRuns` live runs and the newest 20 dry runs ("-dry"). The runs behind the newest
 * 20 entries of successRuns are never deleted (they feed `context` mode "since").
 */
export function pruneRuns(p) {
  const dir = path.join(DIRS.runs, p.name);
  if (!fs.existsSync(dir)) return;
  const all = fs.readdirSync(dir).sort();
  const protect = new Set(successRuns(p.name).slice(-SINCE_MAX).map((r) => r.runId));
  const live = all.filter((r) => !r.endsWith("-dry"));
  const dry = all.filter((r) => r.endsWith("-dry"));
  const drop = [...live.slice(0, Math.max(0, live.length - p.keepRuns)), ...dry.slice(0, Math.max(0, dry.length - KEEP_DRY_RUNS))];
  for (const old of drop) if (!protect.has(old)) fs.rmSync(path.join(dir, old), { recursive: true, force: true });
}
