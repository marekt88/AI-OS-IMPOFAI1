// Morning brief, step 2: turn the structured brief into call variables, place the outbound call through
// the ElevenLabs SIP trunk (Linphone) and wait for the call to finish. Writes call.json + transcript to RUN_DIR.
// Exit 0 = the call was placed and finished (answered or not); non-zero = the call could not be placed.
import fs from "node:fs";
import path from "node:path";

const def = JSON.parse(fs.readFileSync(new URL("./process.json", import.meta.url), "utf8")).call;
const { output } = JSON.parse(fs.readFileSync(process.env.RUN_OUTPUT, "utf8"));
const RUN_DIR = process.env.RUN_DIR;
const KEY = process.env.ELEVENLABS_API_KEY;
const API = "https://api.elevenlabs.io";
if (!KEY) {
  console.error("ELEVENLABS_API_KEY missing in ~/.aios-runner/secrets.env");
  process.exit(3);
}

const SOURCE_WORD = {
  "pm-brain-log": "second brain", "pm-brain-note": "second brain", "pm-call": "hovor", "pm-task": "úlohy v PM",
  "pm-notification": "notifikácie v PM", gmail: "e-mail", calendar: "kalendár", fireflies: "Fireflies",
};
const SECTIONS = [
  ["new", "Čo je nové"],
  ["today", "Čo urobiť dnes"],
  ["ideas", "Nápady na projekty"],
  ["comms", "Navrhované e-maily a meetingy"],
];

function briefText(o) {
  const parts = [];
  if (o.nothing_new) parts.push("Za toto obdobie nie je nič nové.");
  for (const [key, title] of SECTIONS) {
    const items = o[key] ?? [];
    parts.push(`## ${title}`);
    if (!items.length) parts.push("(nič)");
    for (const it of items) {
      const from = [...new Set(it.sources.map((s) => SOURCE_WORD[s.system] ?? s.system))].join(", ");
      parts.push(`- ${it.text} (zdroj: ${from})`);
    }
  }
  return parts.join("\n");
}

const TZ = "Europe/Bratislava";
const local = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat("sk-SK", { timeZone: TZ, day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
};

function briefDetails(o) {
  const lines = [];
  for (const [key, title] of SECTIONS) {
    (o[key] ?? []).forEach((it, i) => {
      const src = it.sources.map((s) => `${SOURCE_WORD[s.system] ?? s.system} ${s.ref}${s.at ? ` (${local(s.at)} miestneho času)` : ""}`).join("; ");
      lines.push(`${title} ${i + 1}: ${it.text}\n  Prečo: ${it.why}\n  Zdroje: ${src}`);
    });
  }
  const failed = (o.sources_checked ?? []).filter((s) => s.status === "failed").map((s) => s.source);
  if (failed.length) lines.push(`Zdroje, ktoré sa dnes nepodarilo prečítať: ${failed.join(", ")}.`);
  return lines.join("\n") || "(žiadne podrobnosti)";
}

async function api(method, url, body) {
  const res = await fetch(API + url, {
    method,
    headers: { "xi-api-key": KEY, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ElevenLabs ${method} ${url} → HTTP ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function placeCall(vars) {
  const r = await api("POST", "/v1/convai/sip-trunk/outbound-call", {
    agent_id: def.agentId,
    agent_phone_number_id: def.phoneNumberId,
    to_number: def.toNumber,
    conversation_initiation_client_data: { dynamic_variables: vars },
    telephony_call_config: { ringing_timeout_secs: def.ringingTimeoutSecs ?? 60 },
  });
  if (!r.success || !r.conversation_id) throw new Error(`call not started: ${r.message ?? JSON.stringify(r)}`);
  return r;
}

async function waitForEnd(conversationId) {
  const deadline = Date.now() + 30 * 60_000;
  let conv;
  while (Date.now() < deadline) {
    await sleep(15_000);
    conv = await api("GET", `/v1/convai/conversations/${conversationId}`);
    if (["done", "failed"].includes(conv.status)) return conv;
  }
  return conv;
}

const vars = {
  brief_text: briefText(output),
  brief_details: briefDetails(output),
  brief_period: output.period_label,
  brief_date: new Intl.DateTimeFormat("sk-SK", { timeZone: "Europe/Bratislava", dateStyle: "full" }).format(new Date()),
};
fs.writeFileSync(path.join(RUN_DIR, "call-variables.json"), JSON.stringify(vars, null, 2));

const attempts = [];
for (let attempt = 0; attempt <= (def.retries ?? 1); attempt++) {
  if (attempt > 0) await sleep((def.retryAfterMin ?? 10) * 60_000);
  const started = await placeCall(vars);
  console.log(`call ${attempt + 1} started: conversation ${started.conversation_id}`);
  const conv = await waitForEnd(started.conversation_id);
  const userTurns = (conv?.transcript ?? []).filter((t) => t.role === "user" && t.message).length;
  const info = {
    attempt: attempt + 1,
    conversation_id: started.conversation_id,
    sip_call_id: started.sip_call_id,
    status: conv?.status ?? "unknown",
    duration_secs: conv?.metadata?.call_duration_secs ?? null,
    termination_reason: conv?.metadata?.termination_reason ?? null,
    user_turns: userTurns,
    answered: userTurns > 0 || (conv?.metadata?.call_duration_secs ?? 0) > 15,
  };
  attempts.push(info);
  fs.writeFileSync(path.join(RUN_DIR, `call-${attempt + 1}-transcript.json`), JSON.stringify(conv?.transcript ?? [], null, 2));
  console.log(JSON.stringify(info));
  if (info.answered) break;
}
fs.writeFileSync(path.join(RUN_DIR, "call.json"), JSON.stringify({ attempts }, null, 2));
const last = attempts.at(-1);
if (!last.answered) console.log("call not answered (logged, not an error)");
