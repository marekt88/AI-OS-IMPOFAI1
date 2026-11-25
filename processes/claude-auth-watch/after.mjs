// claude-auth-watch: is Claude Code on the server logged in, as the runner sees it (checkAuth with claudeEnv)?
// Down → once per outage an urgent task for Marek (AI Bugs, assigned, due today) and a call from the assistant
// (callGuard: no calls in quiet hours; a reminder call at most every REMIND_H hours while it stays down).
// Up again → comment + complete the task. State: ~/.aios-runner/state/claude-auth-outage.json (state/claude-auth-watch.json belongs to the runner).
import crypto from "node:crypto";
import path from "node:path";
import { checkAuth, markSetupTokenRevoked, probeSetupToken, SETUP_TOKEN_KEY, secrets, setupTokenRevoked } from "../../runner/core.mjs";
import { BUGS_LIST, pmTool } from "../../runner/pm.mjs";
import { CALLS_ENABLED, callGuard, isDry, placeCallAndWait, readJson, STATE_DIR, writeJson } from "../../runner/voice-call.mjs";

const REMIND_H = 4;
const FILE = path.join(STATE_DIR, "claude-auth-outage.json");
const now = new Date();
const st = readJson(FILE, { down: false });
// ---- 1. the setup token (25. 11. 2026: revoked at night, `auth status` still said ok): a real tiny call every hour
const TOKEN_FILE = path.join(STATE_DIR, "claude-setup-token-watch.json");
const tk = readJson(TOKEN_FILE, {});
if (secrets()[SETUP_TOKEN_KEY] && !setupTokenRevoked() && (!tk.lastProbeAt || now - Date.parse(tk.lastProbeAt) >= 60 * 60_000)) {
  const pr = isDry() ? { ok: true } : probeSetupToken();
  tk.lastProbeAt = now.toISOString();
  tk.lastProbe = pr.ok ? "ok" : pr.reason;
  if (pr.rejected) markSetupTokenRevoked(pr.reason);
  console.log(`setup token probe: ${pr.ok ? "ok" : pr.reason}`);
}
// a setup token lives 1 year: remember when this token first appeared and open a renewal task a month before
if (secrets()[SETUP_TOKEN_KEY]) {
  const h = crypto.createHash("sha256").update(secrets()[SETUP_TOKEN_KEY]).digest("hex").slice(0, 16);
  if (tk.hash !== h) Object.assign(tk, { hash: h, firstSeenAt: now.toISOString(), renewTaskKey: null });
  const ageDays = (now - Date.parse(tk.firstSeenAt)) / 86400_000;
  if (ageDays >= 330 && !tk.renewTaskKey && !isDry()) {
    const due = new Date(Date.parse(tk.firstSeenAt) + 350 * 86400_000).toISOString().slice(0, 10);
    const t = await pmTool("pm_create_task", {
      task_list: BUGS_LIST, name: "Obnov trvalý token Claude na serveri (o mesiac mu končí platnosť)", priority: "high", assignee: "me", due_date: due,
      description: `Trvalý token (CLAUDE_SETUP_TOKEN) je na serveri od ${tk.firstSeenAt.slice(0, 10)} a platí približne rok.\n\n**Oprava:** na serveri spusti \`claude setup-token\` a nový token vlož do \`~/.aios-runner/secrets.env\` ako \`CLAUDE_SETUP_TOKEN=...\`.`,
    }).catch((e) => (console.log(`renew task failed: ${e.message}`), null));
    if (t?.key) tk.renewTaskKey = t.key;
  }
}
const revoked = setupTokenRevoked();
if (revoked && !tk.taskKey && !isDry()) {
  const t = await pmTool("pm_create_task", {
    task_list: BUGS_LIST,
    name: "Obnov trvalý token Claude na serveri (CLAUDE_SETUP_TOKEN)",
    priority: "high",
    assignee: "me",
    due_date: now.toISOString().slice(0, 10),
    description: `Od ${revoked.at} Anthropic odmieta trvalý token (${revoked.reason}).\n\nProcesy zatiaľ bežia cez bežné prihlásenie, ktoré sa môže odhlásiť (tak padali behy 18.–22. 11.).\n\n**Oprava:** na serveri spusti \`claude setup-token\`, nový token vlož do \`~/.aios-runner/secrets.env\` ako \`CLAUDE_SETUP_TOKEN=...\` (nahraď starý). Strážca nový token overí a úlohu dokončí sám.`,
  }).catch((e) => (console.log(`token task failed: ${e.message}`), null));
  if (t?.key) tk.taskKey = t.key;
  console.log(`setup token revoked since ${revoked.at}, task ${t?.key ?? "?"}`);
} else if (!revoked && tk.taskKey && tk.lastProbe === "ok" && !isDry()) {
  await pmTool("pm_add_task_comment", { task: tk.taskKey, body: `Nový trvalý token funguje (${now.toISOString()}). Procesy sú znova na trvalom tokene.` }).catch(() => {});
  await pmTool("pm_update_task_status", { task: tk.taskKey, status: "complete" }).catch(() => {});
  tk.taskKey = null;
}
if (!isDry()) writeJson(TOKEN_FILE, tk);

// ---- 2. the interactive login (fallback, and morning-brief with Gmail/Calendar/Fireflies)
const auth = checkAuth();
const fix = secrets()[SETUP_TOKEN_KEY]
  ? "Na serveri spusti `claude setup-token`, nový token vlož do `~/.aios-runner/secrets.env` ako `CLAUDE_SETUP_TOKEN=...`."
  : "Na serveri spusti `claude setup-token` a token vlož do `~/.aios-runner/secrets.env` ako `CLAUDE_SETUP_TOKEN=...` (trvalé prihlásenie). Rýchla náhrada: `claude` → `/login`.";
const log = (m) => console.log(m);

if (auth.ok) {
  if (st.down) {
    log(`recovered after ${Math.round((now - Date.parse(st.since)) / 60000)} min`);
    if (!isDry() && st.taskKey) {
      await pmTool("pm_add_task_comment", { task: st.taskKey, body: `Obnovené ${now.toISOString()}: Claude Code na serveri je znova prihlásený (${auth.method ?? "login"}). Procesy pobežia od najbližšieho slotu.` }).catch((e) => log(`comment failed: ${e.message}`));
      await pmTool("pm_update_task_status", { task: st.taskKey, status: "complete" }).catch((e) => log(`complete failed: ${e.message}`));
    }
  } else log(`ok (${auth.method ?? "login"})`);
  if (!isDry()) writeJson(FILE, { down: false, lastOkAt: now.toISOString() });
  process.exit(0);
}

const next = { ...st, down: true, since: st.since ?? now.toISOString(), reason: auth.reason };
log(`DOWN since ${next.since}: ${auth.reason}`);
if (!st.taskKey && !isDry()) {
  const t = await pmTool("pm_create_task", {
    task_list: BUGS_LIST,
    name: "URGENTNÉ: Claude Code na serveri nie je prihlásený, procesy nebežia",
    priority: "urgent",
    assignee: "me",
    due_date: now.toISOString().slice(0, 10),
    description: `Od ${next.since} neprejde \`claude auth status\` (${auth.reason}).\n\nNebežia procesy s AI: AI novinky, nápady, scenáre, video, audio, ranný brief, hovory.\n\n**Oprava:** ${fix}\n\nStrážca (\`processes/claude-auth-watch\`) túto úlohu dokončí sám, keď prihlásenie znova funguje.`,
  }).catch((e) => (log(`task failed: ${e.message}`), null));
  if (t?.key) next.taskKey = t.key;
}
const due = !st.lastCallAt || now - Date.parse(st.lastCallAt) >= REMIND_H * 3600_000;
const guard = CALLS_ENABLED ? callGuard({ kind: "alert", now }) : { allowed: true, reason: "e-mail" }; // an e-mail may go at night
if (due && guard.allowed) {
  const r = await placeCallAndWait(
    {
      first_message: "Claude Code na serveri nie je prihlásený, procesy s AI nebežia (novinky, nápady, scenáre, videá, ranný brief).",
      call_instructions: "Povedz Marekovi stručne, že Claude Code na serveri nie je prihlásený, preto nebežia procesy s AI (novinky, nápady, videá, ranný brief). Povedz, ako to opraviť (call_content) a že úlohu má v KAPSA v AI Bugs. Nič iné neponúkaj a po potvrdení hovor ukonči.",
      call_content: fix.replace(/`/g, ""),
      call_details: `Výpadok od ${next.since}. Dôvod: ${auth.reason}`,
    },
    { runDir: process.env.RUN_DIR, kind: "alert" },
  ).catch((e) => (log(`call failed: ${e.message}`), null));
  if (r && !r.dryRun && (r.emailed || r.answered || r.attempts?.length)) next.lastCallAt = now.toISOString();
  log(`alert: ${r?.dryRun ? "dry-run" : r?.emailed ? "e-mailed" : r?.answered ? "answered" : "not delivered"}`);
} else log(`no call now (${due ? guard.reason : `last call ${st.lastCallAt}`})`);
if (!isDry()) writeJson(FILE, next);
