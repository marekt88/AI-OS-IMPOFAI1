// Shared outbound voice call for processes (ElevenLabs SIP trunk → Linphone), used from after.mjs.
// Places the call with the agent's dynamic variables, waits for it to end, saves the transcript and
// hands the conversation to the `call-followup` process (claude -p) which indexes it and runs the
// actions Marek confirmed. Needs ELEVENLABS_API_KEY (from secrets.env, passed in by the runner).
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const API = "https://api.elevenlabs.io";
export const DEFAULT_CALL = {
  agentId: "agent_7701m5254wcqektavn4skbrdn86n", // IMPOFAI - osobný asistent
  phoneNumberId: "phnum_1901m4zry0ehf5gtm609k8p4yqak", // Linphone trunk (sip.linphone.org)
  toNumber: "mtoth",
  ringingTimeoutSecs: 60,
  retries: 1,
  retryAfterMin: 10,
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, url, body) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing in ~/.aios-runner/secrets.env");
  const res = await fetch(API + url, {
    method,
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ElevenLabs ${method} ${url} → HTTP ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

export const localTime = (iso, tz = "Europe/Bratislava") => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : new Intl.DateTimeFormat("sk-SK", { timeZone: tz, day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
};

/**
 * vars: { first_message, call_instructions, call_content, call_details }.
 * Returns { attempts, answered, transcript, conversationId }.
 */
export async function placeCallAndWait(vars, { runDir, call = {} } = {}) {
  const c = { ...DEFAULT_CALL, ...call };
  const dyn = {
    call_date: new Intl.DateTimeFormat("sk-SK", { timeZone: "Europe/Bratislava", dateStyle: "full" }).format(new Date()),
    ...vars,
  };
  fs.writeFileSync(path.join(runDir, "call-variables.json"), JSON.stringify(dyn, null, 2));
  const attempts = [];
  let transcript = [];
  let conversationId = null;
  for (let attempt = 0; attempt <= c.retries; attempt++) {
    if (attempt > 0) await sleep(c.retryAfterMin * 60_000);
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
        const info = { attempt: attempt + 1, conversation_id: started.conversation_id ?? null, status: "unreachable", sip: msg.slice(0, 200), answered: false };
        attempts.push(info);
        console.log(JSON.stringify(info));
        continue;
      }
      throw new Error(`call not started: ${msg}`);
    }
    console.log(`call ${attempt + 1} started: ${started.conversation_id}`);
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
    conversationId = started.conversation_id;
    fs.writeFileSync(path.join(runDir, `call-${attempt + 1}-transcript.json`), JSON.stringify(transcript, null, 2));
    console.log(JSON.stringify(info));
    if (info.answered) break;
  }
  fs.writeFileSync(path.join(runDir, "call.json"), JSON.stringify({ attempts }, null, 2));
  return { attempts, answered: attempts.at(-1).answered, transcript, conversationId };
}

/** Start the `call-followup` process in the background (its own run, log and error reporting). */
export function startFollowup({ runDir, kind, purpose, content, transcript, conversationId }) {
  const file = path.join(runDir, "followup-input.json");
  fs.writeFileSync(file, JSON.stringify({ kind, purpose, source_run: process.env.RUN_ID, conversation_id: conversationId, ended_at: new Date().toISOString(), call_content: content, transcript }, null, 2));
  const log = fs.openSync(path.join(runDir, "followup.out"), "a");
  const child = spawn(process.execPath, [process.env.RUNNER, "run", "call-followup", "--input", file], { detached: true, stdio: ["ignore", log, log] });
  child.unref();
  console.log(`call-followup started for ${conversationId}`);
}
