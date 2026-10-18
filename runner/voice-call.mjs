// Shared voice functions for processes (ElevenLabs SIP trunk → Linphone), used from after.mjs.
// - placeCallAndWait: places an outbound call with the agent's dynamic variables, waits for it to end,
//   saves the transcript and records the call in state/voice-usage.json. Fail-closed dry-run: see isDry().
// - startFollowup: hands a finished conversation to the `call-followup` process (K1 spawnProcess).
// - callGuard: quiet hours, daily callback limit and daily minute cap (K7).
// - elevenlabs(): read-only/any REST call (used by processes/inbound-call).
// Needs ELEVENLABS_API_KEY (from secrets.env, passed in by the runner).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { envForcesDry } from "./core.mjs";

const API = "https://api.elevenlabs.io";
export const DEFAULT_CALL = {
  agentId: "agent_7701m5254wcqektavn4skbrdn86n", // IMPOFAI - osobný asistent
  phoneNumberId: "phnum_1901m4zry0ehf5gtm609k8p4yqak", // Linphone trunk (sip.linphone.org)
  toNumber: "mtoth",
  ringingTimeoutSecs: 60,
  retries: 1,
  retryAfterMin: 10,
};
export const TZ = "Europe/Bratislava";
export const LIMITS = {
  quietFrom: "21:00", // no calls from 21:00 …
  quietTo: "07:30", // … until 7:30 (except kind brief / morning-brief / manual)
  callbacksPerDay: 3, // global, all callback runs together
  minutesPerDay: 60, // all calls (outbound + inbound) of the day, except kind manual
  maxCallbackDepth: 2, // depth = callbacks in the chain: call → callback (1) → one more callback (2), then the brief
};
const QUIET_EXEMPT = new Set(["brief", "morning-brief", "manual"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = process.env.AIOS_RUNNER_HOME || path.join(os.homedir(), ".aios-runner");
export const STATE_DIR = path.join(HOME, "state");
// FAIL-CLOSED: a real call only from a live runner after-step, i.e. RUN_DRY explicitly "0" AND RUN_ID set
// (runAfter sets both) AND no VOICE_NO_CALL=1 / envForcesDry(). Anything else (direct `node after.mjs`,
// tests, an older runner) is a dry-run.
export const isDry = () => envForcesDry() || process.env.VOICE_NO_CALL === "1" || process.env.RUN_DRY !== "0" || !process.env.RUN_ID;

export async function elevenlabs(method, url, body) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing (secrets.env is passed in by the runner)");
  const res = await fetch(API + url, {
    method,
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ElevenLabs ${method} ${url.split("?")[0]} → HTTP ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}
const api = elevenlabs;

export const localTime = (iso, tz = TZ) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : new Intl.DateTimeFormat("sk-SK", { timeZone: tz, day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
};

// ---------- state helpers ----------
export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}
export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

// ---------- usage + guard ----------
const USAGE_FILE = () => path.join(STATE_DIR, "voice-usage.json");
/** "YYYY-MM-DD" and minutes since midnight in Bratislava time. */
function localParts(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(now).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}
const hm = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

/**
 * voice-usage.json: { days: { "YYYY-MM-DD": { calls, callbacks, secs, unverified_calls, unverified_secs,
 *   entries: [{ id, at, kind, unverified, secs, conversation_id, answered, attempts: [{ n, status, secs, conversation_id }] }] } } }
 * calls/callbacks count RUNS (one per placeCallAndWait / inbound conversation), secs all attempts.
 * Unverified inbound callers are counted separately and never use up Marek's daily cap.
 */
export function readUsage() {
  return readJson(USAGE_FILE(), { days: {} });
}
export function usageToday(now = new Date()) {
  const d = readUsage().days[localParts(now).day] ?? {};
  return { calls: d.calls ?? 0, callbacks: d.callbacks ?? 0, minutes: Math.round(((d.secs ?? 0) / 60) * 10) / 10, unverifiedMinutes: Math.round(((d.unverified_secs ?? 0) / 60) * 10) / 10 };
}
function mutateUsage(fn, now = new Date()) {
  const u = readUsage();
  const day = localParts(now).day;
  const d = (u.days[day] ??= { calls: 0, callbacks: 0, secs: 0, unverified_calls: 0, unverified_secs: 0, entries: [] });
  const r = fn(d, day);
  for (const k of Object.keys(u.days).sort().slice(0, -30)) delete u.days[k];
  writeJson(USAGE_FILE(), u);
  return r;
}
/** Open a usage entry BEFORE the call is placed (counts the call / callback once per run). Returns a ref or null in dry-run. */
export function usageStart({ kind = "unknown", unverified = false, conversationId = null, now = new Date() } = {}) {
  if (isDry()) return null;
  const id = `${now.toISOString()}-${process.pid}-${Math.random().toString(36).slice(2, 6)}`;
  return mutateUsage((d, day) => {
    if (unverified) d.unverified_calls = (d.unverified_calls ?? 0) + 1;
    else d.calls += 1;
    if (kind === "callback" && !unverified) d.callbacks += 1;
    d.entries.push({ id, at: now.toISOString(), kind, unverified, secs: 0, conversation_id: conversationId, answered: null, attempts: [] });
    return { day, id, unverified };
  }, now);
}
/** Add one attempt (and its seconds) to an entry opened by usageStart. */
export function usageAttempt(ref, { n = 1, status = "unknown", secs = 0, conversationId = null, answered = null } = {}) {
  if (!ref) return;
  const u = readUsage();
  const d = u.days[ref.day];
  const e = d?.entries?.find((x) => x.id === ref.id);
  if (!e) return;
  const sec = Number(secs) || 0;
  e.attempts.push({ n, status, secs: sec, conversation_id: conversationId });
  e.secs += sec;
  if (conversationId) e.conversation_id = conversationId;
  if (answered != null) e.answered = Boolean(e.answered) || answered;
  if (ref.unverified) d.unverified_secs = (d.unverified_secs ?? 0) + sec;
  else d.secs += sec;
  writeJson(USAGE_FILE(), u);
}
/** One finished call in one step (inbound poller). */
export function recordUsage({ kind = "unknown", secs = 0, conversationId = null, answered = null, unverified = false, now = new Date() } = {}) {
  const ref = usageStart({ kind, unverified, conversationId, now });
  usageAttempt(ref, { n: 1, status: "done", secs, conversationId, answered });
}

/**
 * May a call of this kind be placed now? kind: brief | morning-brief | manual | callback | interview | …
 * Quiet hours 21:00–7:30 (except brief/manual), max 3 callbacks a day, max 60 minutes a day (except manual).
 */
export function callGuard({ kind = "unknown", now = new Date(), retry = false } = {}) {
  const { minutes } = localParts(now);
  const quiet = minutes >= hm(LIMITS.quietFrom) || minutes < hm(LIMITS.quietTo);
  if (quiet && !QUIET_EXEMPT.has(kind)) return { allowed: false, reason: `quiet-hours (${LIMITS.quietFrom}–${LIMITS.quietTo} ${TZ})` };
  const u = usageToday(now);
  // a retry belongs to a run that is already counted
  if (kind === "callback" && !retry && u.callbacks >= LIMITS.callbacksPerDay) return { allowed: false, reason: `daily-callback-limit (${u.callbacks}/${LIMITS.callbacksPerDay})` };
  if (kind !== "manual" && u.minutes >= LIMITS.minutesPerDay) return { allowed: false, reason: `daily-minute-cap (${u.minutes}/${LIMITS.minutesPerDay} min)` };
  return { allowed: true, reason: "ok" };
}

// ---------- outbound call ----------
// Every outbound call sends all agent variables: a missing one would fall back to the agent's
// placeholder, which is written for INBOUND calls ("Marek ti volá…").
const REQUIRED_VARS = { first_message: "Ahoj Marek, tu tvoj asistent.", call_instructions: "(žiadne)", call_content: "(žiadne)", call_details: "(žiadne)" };

/**
 * vars: { first_message, call_instructions, call_content, call_details }.
 * opts: { runDir, call: overrides of DEFAULT_CALL, kind: for voice-usage (default "unknown") }.
 * Returns { attempts, answered, transcript, conversationId, dryRun }.
 * The guard is NOT applied here (backward compatible); callers call callGuard() first.
 */
export async function placeCallAndWait(vars, { runDir, call = {}, kind = "unknown" } = {}) {
  const c = { ...DEFAULT_CALL, ...call };
  const dyn = { call_date: new Intl.DateTimeFormat("sk-SK", { timeZone: TZ, dateStyle: "full" }).format(new Date()), ...vars };
  for (const [k, v] of Object.entries(REQUIRED_VARS)) if (dyn[k] == null || String(dyn[k]).trim() === "") dyn[k] = v;
  for (const k of Object.keys(dyn)) dyn[k] = String(dyn[k]);
  fs.writeFileSync(path.join(runDir, "call-variables.json"), JSON.stringify(dyn, null, 2));
  if (isDry()) {
    const info = { status: "dry-run", kind, guard: callGuard({ kind }), to: c.toNumber, agent: c.agentId, attempts: [] };
    fs.writeFileSync(path.join(runDir, "call.json"), JSON.stringify(info, null, 2));
    console.log(`dry-run: call not placed (${kind}); variables in call-variables.json`);
    return { attempts: [], answered: false, transcript: [], conversationId: null, dryRun: true };
  }
  const attempts = [];
  let transcript = [];
  let conversationId = null;
  const callFile = path.join(runDir, "call.json");
  const writeCall = (status, extra = {}) => fs.writeFileSync(callFile, JSON.stringify({ status, kind, at: new Date().toISOString(), attempts, ...extra }, null, 2));
  // counted BEFORE the first POST: a crash or kill during the call still uses up the limit and leaves a trace
  let usage = null;
  try {
    usage = usageStart({ kind });
  } catch (err) {
    console.error(`voice-usage not updated: ${err.message}`);
  }
  const addAttempt = (info) => {
    try {
      usageAttempt(usage, { n: info.attempt, status: info.status, secs: info.duration_secs ?? 0, conversationId: info.conversation_id, answered: info.answered });
    } catch (err) {
      console.error(`voice-usage not updated: ${err.message}`);
    }
  };
  for (let attempt = 0; attempt <= c.retries; attempt++) {
    if (attempt > 0) {
      await sleep(c.retryAfterMin * 60_000);
      const g = callGuard({ kind, retry: true }); // the retry may fall into quiet hours or over the minute cap
      if (!g.allowed) {
        console.log(`retry ${attempt + 1} not placed: ${g.reason}`);
        attempts.push({ attempt: attempt + 1, status: "guard-blocked", reason: g.reason, answered: false });
        break;
      }
    }
    writeCall("placing", { placing_attempt: attempt + 1 });
    const started = await api("POST", "/v1/convai/sip-trunk/outbound-call", {
      agent_id: c.agentId,
      agent_phone_number_id: c.phoneNumberId,
      to_number: c.toNumber,
      conversation_initiation_client_data: { dynamic_variables: dyn },
      telephony_call_config: { ringing_timeout_secs: c.ringingTimeoutSecs },
    });
    if (!started.success || !started.conversation_id) {
      const msg = String(started.message ?? JSON.stringify(started));
      // the phone is offline / not registered / busy (SIP 408, 480, 486, 603…) = a missed call, retried
      if (/sip status: (408|480|486|487|600|603)/i.test(msg)) {
        const info = { attempt: attempt + 1, conversation_id: started.conversation_id ?? null, status: "unreachable", sip: msg.slice(0, 200), duration_secs: 0, answered: false };
        attempts.push(info);
        addAttempt(info);
        console.log(JSON.stringify(info));
        continue;
      }
      attempts.push({ attempt: attempt + 1, status: "not-started", error: msg.slice(0, 300), answered: false });
      writeCall("failed");
      throw new Error(`call not started: ${msg}`);
    }
    console.log(`call ${attempt + 1} started: ${started.conversation_id}`);
    writeCall("in-call", { conversation_id: started.conversation_id });
    let conv;
    const deadline = Date.now() + 40 * 60_000;
    while (Date.now() < deadline) {
      await sleep(15_000);
      conv = await api("GET", `/v1/convai/conversations/${started.conversation_id}`);
      if (["done", "failed"].includes(conv.status)) break;
    }
    transcript = (conv?.transcript ?? []).filter((t) => t.message).map((t) => ({ role: t.role, at_secs: t.time_in_call_secs, message: t.message }));
    const userTurns = transcript.filter((t) => t.role === "user").length;
    const info = {
      attempt: attempt + 1,
      conversation_id: started.conversation_id,
      status: conv?.status ?? "unknown",
      duration_secs: conv?.metadata?.call_duration_secs ?? null,
      termination_reason: conv?.metadata?.termination_reason ?? null,
      user_turns: userTurns,
      answered: userTurns > 0,
    };
    attempts.push(info);
    addAttempt(info);
    conversationId = started.conversation_id;
    fs.writeFileSync(path.join(runDir, `call-${attempt + 1}-transcript.json`), JSON.stringify(transcript, null, 2));
    console.log(JSON.stringify(info));
    if (info.answered) break;
  }
  writeCall("finished");
  return { attempts, answered: attempts.at(-1)?.answered ?? false, transcript, conversationId, dryRun: false };
}

// ---------- followup ----------
/**
 * Start the `call-followup` process in the background (its own run, log and error reporting).
 * Uses spawnProcess from runner/spawn.mjs (K1: waits for the lock instead of skipping, inherits RUN_DRY);
 * falls back to the old direct spawn while spawn.mjs does not exist yet.
 * Extra fields (K4): caller { external_number, verified }, caller_verified, depth.
 * VOICE_NO_SPAWN=1 (tests only): writes the input file and does not start anything.
 */
export async function startFollowup({ runDir, kind, purpose, content, transcript, conversationId, caller = null, depth = 0, label = "followup" }) {
  const input = {
    kind,
    purpose,
    source_run: process.env.RUN_ID,
    source_process: process.env.RUN_PROCESS,
    conversation_id: conversationId,
    ended_at: new Date().toISOString(),
    caller: caller ?? { external_number: DEFAULT_CALL.toNumber, verified: true, how: "outbound call to mtoth" },
    caller_verified: caller ? Boolean(caller.verified) : true,
    depth,
    dry_run: isDry(),
    call_content: content,
    transcript,
  };
  if (process.env.VOICE_NO_SPAWN === "1") {
    fs.writeFileSync(path.join(runDir, `${label}-input.json`), JSON.stringify(input, null, 2));
    console.log(`VOICE_NO_SPAWN: call-followup input written (${label}-input.json), not started`);
    return;
  }
  let spawnProcess = null;
  if (fs.existsSync(path.join(HERE, "spawn.mjs"))) ({ spawnProcess } = await import("./spawn.mjs"));
  if (spawnProcess) {
    await spawnProcess("call-followup", input, { fromRunDir: runDir, label });
  } else {
    const file = path.join(runDir, `${label}-input.json`);
    fs.writeFileSync(file, JSON.stringify(input, null, 2));
    const log = fs.openSync(path.join(runDir, `${label}.out`), "a");
    const child = spawn(process.execPath, [process.env.RUNNER ?? path.join(HERE, "run.mjs"), "run", "call-followup", "--input", file], { detached: true, stdio: ["ignore", log, log] });
    child.unref();
  }
  console.log(`call-followup started for ${conversationId} (${kind}, depth ${depth})`);
}

// ---------- pending callback (read by the morning brief, I4) ----------
export const PENDING_FILE = () => path.join(STATE_DIR, "pending-callback.json");
/** Append one undelivered callback; keeps the last 20. In dry-run it goes to <runDir>/pending-callback.dry.json. */
export function addPendingCallback(item, { runDir } = {}) {
  const file = isDry() && runDir ? path.join(runDir, "pending-callback.dry.json") : PENDING_FILE();
  const cur = readJson(file, { items: [] });
  cur.items = [...(cur.items ?? []), { at: new Date().toISOString(), ...item }].slice(-20);
  writeJson(file, cur);
  return file;
}
