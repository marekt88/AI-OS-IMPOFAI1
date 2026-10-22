// Shared, deterministic rules for call-followup and action-executor (no model involved here).
// The model proposes; this code decides what is allowed to reach the executor and when to call back.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const APPROVALS_LIST = "cmv0zalyu0009p327hpyvas8d"; // Startups / Projekt Manazment / AI Bugs
export const MAX_ACTIONS = 10; // executor writes per call (audit comments not counted)
export const MAX_CALLBACK_DEPTH = 2; // call → callback (1) → one more callback (2), never more

// Risk comes from the tool name (P4 review), the model can only raise it, never lower it.
const NORMAL = new Set([
  "pm_create_task", "pm_update_task", "pm_update_task_status", "pm_assign_task", "pm_set_task_priority",
  "pm_add_task_comment", "pm_move_task", "pm_add_task_label", "pm_create_task_list",
]);
const DESTRUCTIVE = new Set(["pm_delete_task"]);
const RANK = { normal: 0, destructive: 1, needs_approval: 2 };
export function codeRisk(tool) {
  if (NORMAL.has(tool)) return "normal";
  if (DESTRUCTIVE.has(tool)) return "destructive";
  return "needs_approval"; // access, members, finance, e-mails, anything unknown
}
export function effectiveRisk(tool, modelRisk) {
  const a = codeRisk(tool);
  const b = RANK[modelRisk] != null ? modelRisk : "normal";
  return RANK[b] > RANK[a] ? b : a;
}

const norm = (s) => String(s ?? "").toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const words = (s) => norm(s).split(" ").filter(Boolean);
const has = (hay, needle) => {
  const n = norm(needle);
  return n.length > 0 && ` ${norm(hay)} `.includes(` ${n} `);
};

// Voice agents name tasks by their name, not by key (Marek, 2026-10-22). A task counts as named when at least 70 %
// of the significant words of its name (≥ 4 letters, diacritics ignored, at least 2) were said.
const fold = (s) => norm(s).normalize("NFD").replace(/\p{M}+/gu, "");
export function taskNameHeard(heard, name) {
  const sig = [...new Set(fold(name).split(" ").filter((w) => w.length >= 4))];
  if (sig.length < 2) return false;
  const h = ` ${fold(heard)} `;
  return sig.filter((w) => h.includes(` ${w}`)).length / sig.length >= 0.7;
}
const taskHeard = (heard, key, name) => (key && has(heard, key)) || (!!name && taskNameHeard(heard, name));

// A reply that only agrees ("áno", "dobre, urob to") confirms nothing by itself: the read-back right before it must
// name the target (I1 review, finding 1).
const AGREE = new Set(("áno ano hej jasné jasne dobre ok okej okay súhlasím suhlasim potvrdzujem pokračuj pokracuj urob sprav spravte " +
  "urobte to tak presne môžeš mozes môžete mozete pokojne určite urcite samozrejme jasnačka daj poď pod ďalej dalej je správne spravne " +
  "prosím prosim teda no nuž hm hmm ehm uh aha áá aaa ja ty ten tú tu ju ho ich aj už uz po hovore potom hneď hned " +
  // the action verb itself („áno, môžeš ju zmazať“); negations (nemaž, nechaj) are not here and fail
  "zmaž zmaz zmažte zmazte zmazať zmazat vymaž vymaz vymažte vymazte vymazať vymazat vytvor vytvorte vytvoriť vytvorit pridaj pridajte pridať pridat " +
  "zapíš zapis zapíšte zapiste zapísať zapisat označ oznac označiť oznacit uzavri uzavrieť uzavriet presuň presun presunúť presunut").split(" "));
export const isAgreement = (q) => {
  const w = words(q);
  return w.length > 0 && w.every((x) => AGREE.has(x));
};

/** Share of the read-back's words that are covered by 4-word sequences also found in call_content (e-mails, task texts). */
export function contentCoverage(readback, callContent) {
  const r = words(readback);
  if (r.length < 4 || callContent == null) return 0;
  const leaves = [];
  const walk = (v) => (typeof v === "string" ? leaves.push(v) : Array.isArray(v) ? v.forEach(walk) : v && typeof v === "object" ? Object.values(v).forEach(walk) : null);
  walk(callContent);
  const grams = new Set();
  for (const leaf of leaves) {
    const w = words(leaf);
    for (let i = 0; i + 4 <= w.length; i++) grams.add(w.slice(i, i + 4).join(" "));
  }
  const covered = new Array(r.length).fill(false);
  for (let i = 0; i + 4 <= r.length; i++) if (grams.has(r.slice(i, i + 4).join(" "))) for (let j = i; j < i + 4; j++) covered[j] = true;
  return covered.filter(Boolean).length / r.length;
}
export const MAX_CONTENT_COVERAGE = 0.6;

// tools whose `task` argument must be the task Marek named (I1 review, finding 2)
export const TASK_TOOLS = new Set(["pm_update_task", "pm_update_task_status", "pm_assign_task", "pm_set_task_priority",
  "pm_add_task_comment", "pm_move_task", "pm_add_task_label", "pm_delete_task"]);

/** Was this person named? Tolerates Slovak inflection ("Lea", "Leonarda", "Danielovi"). */
export function nameHeard(name, heard) {
  const h = words(heard);
  const me = /^(me|marek|marekt0808@gmail\.com)$/i.test(String(name ?? "").trim());
  if (me) return h.some((w) => /^(mne|mňa|mna|seba|sebe|marek|mareka|marekovi|mňe)$/.test(w));
  const tokens = words(String(name ?? "").replace(/@.*$/, "").replace(/[._-]+/g, " ")).filter((t) => t.length >= 3);
  const common = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };
  return tokens.some((tok) => h.some((w) => common(w, tok) >= Math.min(3, tok.length)));
}

/** Who called: only outbound calls to Marek and inbound from the SIP identity `mtoth` count as Marek. */
// Only the number itself counts (caller.external_number or a plain string), never other fields such as
// caller.how, which mention "mtoth" in their text. An explicit verified/caller_verified false always wins.
export function callerVerified(input) {
  if (input.kind !== "inbound") return true;
  if (input.caller_verified === false || input.caller?.verified === false) return false;
  const num = String(typeof input.caller === "string" ? input.caller : input.caller?.external_number ?? "").trim();
  return /^(sips?:)?mtoth(@sip\.linphone\.org)?(;.*)?$/i.test(num); // same as inbound-call VERIFIED_IDENTITY
}

/**
 * Filters proposed_actions of a followup into what the executor may get.
 * Returns { actions, rejected: [{ id, summary, reason, overLimit? }] }.
 */
export function precheck(input, output) {
  const tr = (input.transcript ?? []).map((t) => ({ role: t.role, text: String(t.message ?? "") }));
  const agentTurns = tr.filter((t) => t.role === "agent").map((t) => t.text);
  const actions = [];
  const rejected = [];
  const reject = (a, reason) => rejected.push({ id: a.id, summary: a.summary, reason });
  if (!callerVerified(input)) {
    for (const a of output.proposed_actions ?? []) reject(a, "volajúci nie je overený (iba poznámka, žiadne akcie)");
    return { actions, rejected };
  }
  for (const a of output.proposed_actions ?? []) {
    if (a.confirmed !== true) continue; // unconfirmed items live in open_questions
    if (!/^pm_[a-z_]+$/.test(String(a.tool))) { reject(a, `neznámy nástroj ${a.tool}`); continue; }
    const risk = effectiveRisk(a.tool, a.risk);
    const why = checkConfirmation(a, tr, agentTurns, input.call_content);
    if (why) { reject(a, why); continue; }
    actions.push({ ...a, risk });
  }
  for (const a of actions.splice(MAX_ACTIONS)) rejected.push({ id: a.id, summary: a.summary, reason: `nad limit ${MAX_ACTIONS} akcií na hovor, nevykonané, ide do otázok`, overLimit: true });
  return { actions, rejected };
}

/** null = the action is backed by Marek's own words, else the reason why not. Tries every user turn containing the quote. */
export function checkConfirmation(a, tr, agentTurns, callContent) {
  const q = norm(a.quote);
  const idxs = tr.map((t, i) => (t.role === "user" && norm(t.text).includes(q) && q ? i : -1)).filter((i) => i >= 0);
  if (!idxs.length) return "citát sa nenašiel v žiadnej Marekovej vete prepisu";
  const agree = isAgreement(a.quote);
  if (!agree && words(a.quote).length < 3) return "citát je kratší ako 3 slová";
  const key = String(a.target_key ?? "").trim();
  const args = a.args ?? {};
  let last = "potvrdenie nesedí";
  for (const i of idxs) {
    const prev = i > 0 && tr[i - 1].role === "agent" ? tr[i - 1].text : null;
    // the target has to be in Marek's own words, otherwise in the read-back he answered right after
    const keyInQuote = taskHeard(a.quote, key, a.target_name);
    const needReadback = agree || (TASK_TOOLS.has(a.tool) && !keyInQuote);
    // key only in the read-back: Marek's words must be a plain "yes" to it ("nechaj tak" next to a key is no confirmation)
    if (TASK_TOOLS.has(a.tool) && !keyInQuote && !agree) { last = "úloha (názov ani kľúč) nie je v citáte a citát nie je čistý súhlas s read-backom"; continue; }
    if (a.tool === "pm_delete_task" && !keyInQuote) {
      const keys = new Set((prev ?? "").toUpperCase().match(/\b[A-Z]{2,}-\d+\b/g) ?? []);
      const named = keys.size === 1 || (keys.size === 0 && taskNameHeard(prev ?? "", a.target_name));
      if (!named || !/zmaž|zmaz|vymaž|vymaz/i.test(prev ?? "")) { last = "mazanie: read-back musí pomenovať práve jednu úlohu (názvom alebo kľúčom) a povedať, že sa zmaže"; continue; }
    }
    let rb = "";
    let rbTurn = null;
    if (needReadback) {
      if (!prev) { last = "chýba read-back asistenta tesne pred Marekovou odpoveďou"; continue; }
      if (a.readback && !norm(prev).includes(norm(a.readback))) { last = "read-back nie je veta asistenta tesne pred Marekovou odpoveďou"; continue; }
      rb = a.readback || prev;
      rbTurn = prev;
    } else if (a.readback) {
      rbTurn = agentTurns.find((t) => norm(t).includes(norm(a.readback)));
      if (!rbTurn) { last = "read-back sa nenašiel vo vetách asistenta"; continue; }
      rb = a.readback;
    }
    // judged on the whole agent turn, not on the excerpt the model picked
    if (rbTurn && contentCoverage(rbTurn, callContent) > MAX_CONTENT_COVERAGE) { last = "read-back je väčšinou citát z call_content (e-mail, podklady), nie potvrdenie"; continue; }
    const heard = `${a.quote} ${rb}`;
    if (TASK_TOOLS.has(a.tool)) {
      if (!key) { last = "chýba target_key"; continue; }
      if (String(args.task ?? "").trim().toUpperCase() !== key.toUpperCase()) { last = `args.task (${args.task}) nie je target_key (${key})`; continue; }
      if (!taskHeard(heard, key, a.target_name)) { last = `úloha ${key} (názov ani kľúč) nezaznela v citáte ani v read-backu`; continue; }
    }
    if (a.tool === "pm_assign_task" && !nameHeard(a.assignee_name || args.assignee, heard)) { last = "meno riešiteľa nezaznelo v citáte ani v read-backu"; continue; }
    if (agree && a.tool === "pm_create_task") {
      const list = String(args.task_list ?? "");
      const segs = list.split("/").map((s) => s.trim()).filter((s) => s.length >= 3);
      if (!args.name || !has(heard, args.name)) { last = "pri súhlase musí read-back obsahovať presný názov novej úlohy"; continue; }
      if (!segs.some((s) => has(heard, s)) || !list.includes("/")) { last = "pri súhlase musí read-back obsahovať projekt (cesta task listu)"; continue; }
    }
    if (agree && a.tool === "pm_create_task_list" && !has(heard, args.name)) { last = "pri súhlase musí read-back obsahovať názov listu"; continue; }
    return null;
  }
  return last;
}

/** May this run start another callback? depth = callbacks already in the chain before this call. */
export function mayCallBack({ kind, depth = kind === "callback" ? 1 : 0, newResults }) {
  if (depth + 1 > MAX_CALLBACK_DEPTH) return { ok: false, reason: `reťazenie spätných hovorov dosiahlo limit (${depth})` };
  if (kind === "callback" && !newResults) return { ok: false, reason: "spätný hovor bez nových výsledkov, ďalší sa nevolá" };
  return { ok: true };
}

/** Input for the `callback` process (K7) + depth. */
export function callbackInput({ say, questions = [], done = [], skipped = [], source_run, depth }) {
  return { say: say ?? "", questions, done, skipped, source_run, depth };
}

/** Permanent append-only action log outside pruneRuns (P4 guardrail 4). */
export function appendActionLog(entries) {
  const home = process.env.AIOS_RUNNER_HOME || path.join(os.homedir(), ".aios-runner");
  const dir = path.join(home, "logs");
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const at = new Date().toISOString();
  fs.appendFileSync(path.join(dir, "actions.jsonl"), entries.map((e) => JSON.stringify({ at, ...e })).join("\n") + (entries.length ? "\n" : ""));
}

export const isDry = () => process.env.RUN_DRY === "1";
