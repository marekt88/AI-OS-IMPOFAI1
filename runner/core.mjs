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
  const dir = path.join(REPO, "processes");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, "process.json")))
    .map((d) => d.name)
    .sort();
}

export function loadProcess(name) {
  const dir = path.join(REPO, "processes", name);
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
    cwd: def.cwd === "repo" ? REPO : path.join(DIRS.work, name),
    catchUpMin: def.catchUpMin ?? 30,
    firstSinceHours: def.firstSinceHours ?? 24,
    deliverAt: def.deliverAt ?? null, // "HH:MM" in tz: the after-step waits until then (scheduled runs only)
    afterTimeoutMin: def.afterTimeoutMin ?? 15,
    keepRuns: def.keepRuns ?? 30,
    prompt: file("prompt.md"),
    system: file("system.md"),
    schema: file("schema.json"),
    after: file("after.mjs"),
  };
  if (!p.prompt) throw new Error(`process ${name}: prompt.md missing`);
  if (!Array.isArray(p.allowedTools)) throw new Error(`process ${name}: allowedTools must be an array`);
  return p;
}

// ---------- state ----------
export function readState(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DIRS.state, `${name}.json`), "utf8"));
  } catch {
    return {};
  }
}
export function writeState(name, patch) {
  const next = { ...readState(name), ...patch };
  fs.writeFileSync(path.join(DIRS.state, `${name}.json`), JSON.stringify(next, null, 2));
  return next;
}

// ---------- locking (one run per process; stale locks of dead pids are taken over) ----------
export function acquireLock(key) {
  const file = path.join(DIRS.locks, `${key}.lock`);
  for (let i = 0; i < 2; i++) {
    try {
      const fd = fs.openSync(file, "wx");
      fs.writeSync(fd, String(process.pid));
      fs.closeSync(fd);
      return () => fs.rmSync(file, { force: true });
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      const pid = Number(fs.readFileSync(file, "utf8"));
      let alive = false;
      try {
        process.kill(pid, 0);
        alive = true;
      } catch {
        alive = false;
      }
      if (alive) return null;
      fs.rmSync(file, { force: true });
    }
  }
  return null;
}

// ---------- auth ----------
const BILLING_ENV = ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_VERTEX", "CLAUDE_CODE_USE_FOUNDRY", "CLAUDE_CODE_OAUTH_TOKEN"];
export function claudeEnv() {
  const env = { ...process.env, PATH: `${path.dirname(CLAUDE_BIN)}:${process.env.PATH ?? ""}` };
  for (const k of BILLING_ENV) delete env[k]; // always the claude.ai subscription login, never API billing
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
const AUTH_PATTERNS = /(needs? (re-?)?authentication|not authenticated|unauthori[sz]ed|invalid[_ ]token|token (has )?expired|login expired|please run \/login|authentication required|401\b)/i;

function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

class RunError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

/**
 * Runs one process end to end. Returns the run log object. Throws nothing: failures are recorded
 * in the log and returned with ok=false (the caller reports them).
 */
export async function runProcess(p, { manual = false, slot = null, noDeliverWait = false } = {}) {
  const started = new Date();
  const runId = started.toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(DIRS.runs, p.name, runId);
  fs.mkdirSync(runDir, { recursive: true, mode: 0o700 });
  fs.mkdirSync(p.cwd, { recursive: true });
  const state = readState(p.name);
  const since = state.lastSuccessAt ? new Date(state.lastSuccessAt) : new Date(started.getTime() - p.firstSinceHours * 3600e3);
  const log = { process: p.name, runId, manual, slot, startedAt: started.toISOString(), since: since.toISOString(), ok: false, steps: {} };
  const save = () => fs.writeFileSync(path.join(runDir, "run.json"), JSON.stringify(log, null, 2));

  try {
    // 1. login
    const auth = checkAuth();
    log.steps.auth = auth;
    if (!auth.ok) throw new RunError("auth", auth.reason);

    // 2. claude -p
    const vars = {
      since: since.toISOString(),
      now: started.toISOString(),
      tz: p.tz,
      today: new Intl.DateTimeFormat("sk-SK", { timeZone: p.tz, dateStyle: "full" }).format(started),
    };
    const prompt = render(fs.readFileSync(p.prompt, "utf8"), vars);
    const args = ["-p", "--output-format", "stream-json", "--verbose", "--no-session-persistence",
      "--model", p.model, "--max-turns", String(p.maxTurns), "--permission-mode", "dontAsk",
      // no hooks/plugins/skills from the user profile; claude.ai connectors stay available
      "--settings", JSON.stringify({ disableAllHooks: true }), "--disable-slash-commands",
      "--tools", p.builtinTools.join(",")];
    if (p.effort) args.push("--effort", p.effort);
    if (p.allowedTools.length) args.push("--allowedTools", ...p.allowedTools);
    if (p.system) args.push("--append-system-prompt", render(fs.readFileSync(p.system, "utf8"), vars));
    if (p.schema) args.push("--json-schema", fs.readFileSync(p.schema, "utf8"));
    args.push("--", prompt);
    const t0 = Date.now();
    const out = await runClaude(args, p, path.join(runDir, "transcript.jsonl"));
    log.steps.claude = { ms: Date.now() - t0, exitCode: out.exitCode, timedOut: out.timedOut, turns: out.result?.num_turns ?? null,
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
    const failedTools = new Set(out.toolErrors.map((e) => e.tool));
    const missing = p.requireTools.filter((t) => !out.toolCalls.includes(t) || failedTools.has(t));
    if (missing.length) throw new RunError("required-tools", `required tools not called successfully: ${missing.join(", ")}`);
    let output = out.result.result;
    if (p.schema) {
      output = out.result.structured_output;
      if (output == null) throw new RunError("schema", "no structured output matching schema.json");
      // convention: a process reports its own failure with { "ok": false, "error": "..." }
      if (output.ok === false) throw new RunError("process-reported", `process reported failure: ${redact(output.error ?? "").slice(0, 500)}`);
    }
    fs.writeFileSync(path.join(runDir, "output.json"), JSON.stringify({ output, since: vars.since, now: vars.now }, null, 2));
    log.steps.output = { file: "output.json" };

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
      const a = await runAfter(p, runDir, { manual, since: vars.since });
      log.steps.after = { ms: Date.now() - t1, exitCode: a.exitCode, timedOut: a.timedOut, stdout: redact(a.stdout).slice(-2000), stderr: redact(a.stderr).slice(-2000) };
      if (a.timedOut) throw new RunError("after-timeout", `after.mjs exceeded ${p.afterTimeoutMin} min`);
      if (a.exitCode !== 0) throw new RunError("after-failed", `after.mjs exit ${a.exitCode}: ${redact(a.stderr || a.stdout).slice(-500)}`);
    }

    log.ok = true;
    writeState(p.name, { lastSuccessAt: started.toISOString(), lastRunAt: started.toISOString(), lastStatus: "ok", lastRunId: runId });
  } catch (err) {
    log.ok = false;
    log.error = { kind: err.kind ?? "crash", message: redact(err.message ?? String(err)) };
    writeState(p.name, { lastRunAt: started.toISOString(), lastStatus: `failed:${log.error.kind}`, lastRunId: runId });
  } finally {
    log.finishedAt = new Date().toISOString();
    log.durationMs = Date.now() - started.getTime();
    save();
    fs.appendFileSync(path.join(DIRS.logs, "runs.jsonl"),
      JSON.stringify({ process: p.name, runId, at: log.startedAt, ms: log.durationMs, ok: log.ok, manual, error: log.error ?? null }) + "\n");
    pruneRuns(p);
  }
  return log;
}

function runClaude(args, p, transcriptFile) {
  return new Promise((resolve) => {
    const child = spawn(CLAUDE_BIN, args, { cwd: p.cwd, env: claudeEnv(), stdio: ["ignore", "pipe", "pipe"] });
    const transcript = fs.createWriteStream(transcriptFile, { mode: 0o600 });
    let buf = "", stderr = "", result = null, timedOut = false;
    const toolNames = new Map(), toolCalls = [], toolErrors = [];
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
        for (const c of m.message?.content ?? []) if (c.type === "tool_use") { toolNames.set(c.id, c.name); toolCalls.push(c.name); }
      } else if (m.type === "user") {
        for (const c of m.message?.content ?? []) {
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
      resolve({ exitCode: code, timedOut, result, stderr, toolCalls, toolErrors });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      transcript.end();
      resolve({ exitCode: -1, timedOut, result: null, stderr: String(err.message), toolCalls, toolErrors });
    });
  });
}

function runAfter(p, runDir, { manual, since }) {
  return new Promise((resolve) => {
    const env = { ...process.env, ...secrets(), RUN_DIR: runDir, RUN_OUTPUT: path.join(runDir, "output.json"), RUN_MANUAL: manual ? "1" : "0", RUN_SINCE: since, RUN_PROCESS: p.name };
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

function pruneRuns(p) {
  const dir = path.join(DIRS.runs, p.name);
  const runs = fs.readdirSync(dir).sort();
  for (const old of runs.slice(0, Math.max(0, runs.length - p.keepRuns))) fs.rmSync(path.join(dir, old), { recursive: true, force: true });
}
