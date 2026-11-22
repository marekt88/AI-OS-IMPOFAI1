// claude-auth-watch: is Claude Code on the server logged in, as the runner sees it (checkAuth with claudeEnv)?
// Down → once per outage an urgent task for Marek (AI Bugs, assigned, due today) and a call from the assistant
// (callGuard: no calls in quiet hours; a reminder call at most every REMIND_H hours while it stays down).
// Up again → comment + complete the task. State: ~/.aios-runner/state/claude-auth-outage.json (state/claude-auth-watch.json belongs to the runner).
import path from "node:path";
import { checkAuth, SETUP_TOKEN_KEY, secrets } from "../../runner/core.mjs";
import { BUGS_LIST, pmTool } from "../../runner/pm.mjs";
import { callGuard, isDry, placeCallAndWait, readJson, STATE_DIR, writeJson } from "../../runner/voice-call.mjs";

const REMIND_H = 4;
const FILE = path.join(STATE_DIR, "claude-auth-outage.json");
const now = new Date();
const st = readJson(FILE, { down: false });
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
const guard = callGuard({ kind: "alert", now });
if (due && guard.allowed) {
  const r = await placeCallAndWait(
    {
      first_message: "Ahoj Marek, tu tvoj asistent. Volám kvôli poruche: Claude na serveri sa odhlásil.",
      call_instructions: "Povedz Marekovi stručne, že Claude Code na serveri nie je prihlásený, preto nebežia procesy s AI (novinky, nápady, videá, ranný brief). Povedz, ako to opraviť (call_content) a že úlohu má v KAPSA v AI Bugs. Nič iné neponúkaj a po potvrdení hovor ukonči.",
      call_content: fix.replace(/`/g, ""),
      call_details: `Výpadok od ${next.since}. Dôvod: ${auth.reason}`,
    },
    { runDir: process.env.RUN_DIR, kind: "alert" },
  ).catch((e) => (log(`call failed: ${e.message}`), null));
  if (r && !r.dryRun) next.lastCallAt = now.toISOString();
  log(`call: ${r?.dryRun ? "dry-run" : r?.answered ? "answered" : "not answered"}`);
} else log(`no call now (${due ? guard.reason : `last call ${st.lastCallAt}`})`);
if (!isDry()) writeJson(FILE, next);
