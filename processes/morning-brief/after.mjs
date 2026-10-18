// Morning brief, step 2: structured brief → call variables → call on Linphone → call-followup (after the call).
// Exit 0 = the call was placed and finished (answered or not; not answered → {"advance": false} in RUN_ADVANCE_FILE);
// non-zero = the call could not be placed.
// Dry-run (RUN_DRY=1 or VOICE_NO_CALL=1): placeCallAndWait writes call-variables.json + call.json without calling;
// no followup, pending callback untouched.
import fs from "node:fs";
import path from "node:path";
import { envForcesDry } from "../../runner/core.mjs";
import { isDry, localTime, PENDING_FILE, placeCallAndWait, startFollowup } from "../../runner/voice-call.mjs";

const RUN_DIR = process.env.RUN_DIR;
const DRY = isDry() || envForcesDry();
const { output: o } = JSON.parse(fs.readFileSync(process.env.RUN_OUTPUT, "utf8"));
const PENDING = PENDING_FILE(); // ~/.aios-runner/state/pending-callback.json, written by processes/callback (addPendingCallback)
const MAX_DETAILS = 28_000; // call_details budget (chars); the whole agent prompt goes to the LLM on every turn
const PENDING_MIN_SECS = 60; // deferred items count as delivered only after a call this long that the agent ended itself

// --- deferred callback (written by the callback process when a call could not be placed: quiet hours, limits, not answered) ---
// Shape (I3): { items: [{ at, reason, source_run, callback_run, depth, say, done[], skipped[], questions[{id, question, why}] }] }.
// Also accepted: a bare array or a single item. done/skipped items are strings or executor objects.
function readPending() {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(PENDING, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") console.log(`pending-callback.json unreadable, ignored: ${err.message}`);
    return [];
  }
  const items = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : raw && typeof raw === "object" ? [raw] : [];
  return items.filter((i) => i && (i.say || i.done?.length || i.skipped?.length || i.questions?.length));
}
const pending = readPending();
// same helpers as processes/callback/after.mjs: keep task keys and reasons
const keyOf = (x) => x?.task_key ?? x?.key ?? x?.result?.key ?? x?.result?.task_key ?? x?.backup?.key ?? null;
const textOf = (x) => (typeof x === "string" ? x : x?.what ?? x?.summary ?? x?.text ?? x?.name ?? x?.title ?? x?.request ?? x?.tool ?? JSON.stringify(x));
const whyOf = (x) => (typeof x === "string" ? null : x?.reason ?? x?.why ?? x?.error ?? null);
const doneText = (x) => `${textOf(x)}${keyOf(x) && !textOf(x).includes(keyOf(x)) ? ` (${keyOf(x)})` : ""}`;
const skippedText = (x) => `${doneText(x)}${whyOf(x) ? `, dôvod: ${whyOf(x)}` : ""}`;

const WORD = { "pm-brain-log": "second brain", "pm-brain-note": "second brain", "pm-call": "hovor", "pm-task": "úlohy v PM", "pm-tree": "štruktúra PM", "pm-notification": "notifikácie v PM", "pm-company-map": "mapa firmy", gmail: "e-mail", calendar: "kalendár", fireflies: "Fireflies", "call-followup": "spracovanie hovoru", "action-executor": "vykonávač akcií", "open-questions": "otvorené otázky" };
const KIND = { "morning-brief": "ranný brief", interview: "interview", inbound: "tvoj hovor", callback: "spätný hovor" };
const STATUS = { to_do: "nezačatá", in_progress: "rozpracovaná", in_review: "na kontrole", complete: "hotová" };
const clip = (s = "", n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const from = (sources = []) => [...new Set(sources.map((s) => WORD[s.system] ?? s.system))].join(", ");
const src = (sources = []) => sources.map((s) => `${WORD[s.system] ?? s.system} ${s.ref}${s.at ? ` (${localTime(s.at)})` : ""}`).join("; ");
const taskHead = (t) => `${t.key} „${t.name}“: ${STATUS[t.status] ?? t.status}; rieši ${t.assignee || "nikto"}${t.due ? `; termín ${t.due}` : "; bez termínu"}${t.priority ? `; priorita ${t.priority}` : ""}; zmena: ${t.change}`;
const taskLine = (t) => `${taskHead(t)}\n    Popis: ${clip(t.description, 300) || "(bez popisu)"}`;
const sent = (s = "") => (s.trim() && !/[.!?…]$/.test(s.trim()) ? `${s.trim()}.` : s.trim());
const list = (xs, f) => xs.map((x) => `- ${f(x)}`).join("\n");
const followups = o.followups ?? [];
const changed = o.projects.filter((p) => p.changed);
const unchanged = o.projects.filter((p) => !p.changed);

// --- questions: deferred callback first, then the brief's; one per id (the brief's copy wins, it has the topic) or per text ---
const norm = (s = "") => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const briefQs = o.questions.map((q) => ({ ...q, id: q.id ?? "" }));
const seen = new Set(briefQs.flatMap((q) => [q.id && `id:${q.id}`, `t:${norm(q.question)}`].filter(Boolean)));
const pendingQs = [];
for (const q of pending.flatMap((p) => p.questions ?? [])) {
  const item = { id: q.id ?? "", question: q.question ?? textOf(q), why: q.why ?? "", topic: "odložené zo spätného hovoru" };
  const keys = [item.id && `id:${item.id}`, `t:${norm(item.question)}`].filter(Boolean);
  if (keys.some((k) => seen.has(k))) continue;
  keys.forEach((k) => seen.add(k));
  pendingQs.push(item);
}
const allQs = [...pendingQs, ...briefQs];

// --- what the agent says (in this order); no ids like Q-001 here, TTS would read them ---
const say = [];
if (pending.length) {
  say.push(`## Odložené zo spätného hovoru\n${pending.map((p) => [p.say, p.done?.length ? `Urobené: ${p.done.map(doneText).join("; ")}.` : "", p.skipped?.length ? `Neurobené: ${p.skipped.map(skippedText).join("; ")}.` : ""].filter(Boolean).join(" ")).join("\n")}`);
}
if (followups.length) {
  say.push(`## Po hovoroch od posledného briefu\n${list(followups, (f) => `${KIND[f.kind] ?? f.kind} ${localTime(f.at)}: ${sent(f.summary)}${f.executed.length ? ` Urobené: ${f.executed.join("; ")}.` : ""}${f.skipped.length ? ` Neurobené: ${f.skipped.join("; ")}.` : ""}${f.approvals.length ? ` Čaká na tvoje schválenie: ${f.approvals.join("; ")}.` : ""}`)}`);
} else if (o.followup_report) say.push(`## Po poslednom hovore\n${o.followup_report}`);
if (o.nothing_new) say.push("Za toto obdobie nie je nič nové.");
say.push(`## Bugy (AI Bugs)\n${o.bugs.length ? list(o.bugs, (b) => `${b.key} ${b.name} (${b.change}; rieši ${b.assignee || "nikto"})`) : "Žiadne otvorené bugy."}`);
for (const p of changed) {
  say.push(`## Projekt ${p.name}\nNové a čo sa rieši: ${p.summary}\nZmenených úloh: ${p.changed_tasks.length}, otvorených: ${p.open_count}.\nPriority na dnes:\n${list(p.today, (t) => `${t.text} → ${t.who}${t.task_key ? ` (${t.task_key})` : ""}`) || "- (bez priority)"}`);
}
if (unchanged.length) say.push(`## Projekty bez zmeny\n${list(unchanged, (p) => `${p.name}: ${p.summary}`)}`);
if (o.new_tasks.length) say.push(`## Nové úlohy (${o.new_tasks.length})\n${list(o.new_tasks, (t) => `${t.key} ${t.name} (${t.assignee || "bez riešiteľa"})`)}`);
say.push(`## Dôležité e-maily\n${o.emails.length ? list(o.emails, (e) => `od ${e.from}: ${e.subject}${e.needs_reply ? " (čaká na odpoveď)" : ""}`) : "Nič dôležité."}`);
say.push(`## Tvoje úlohy na dnes\n${list(o.today, (i) => `${i.text} (zdroj: ${from(i.sources)})`) || "(nič)"}`);
if (o.ideas.length) say.push(`## Nápady\n${list(o.ideas, (i) => i.text)}`);
if (o.comms.length) say.push(`## Navrhované e-maily a meetingy\n${list(o.comms, (i) => i.text)}`);
say.push(`## Otázky pre Mareka\n${allQs.map((q, i) => `${i + 1}. ${q.question}`).join("\n") || "(žiadne)"}`);

// --- everything the agent may need for follow-up questions ---
// Each line has a cut level: 0 = never shortened (aliases, deferred callback, calls, bugs, projects, new tasks, e-mails,
// today, questions); 1 = open tasks of unchanged projects; 2 = open tasks of changed projects; 3 = descriptions of
// changed tasks (alt = without description); 4 = details of ideas and comms (alt = short). Shortened from the end of
// each level until call_details fits MAX_DETAILS.
const det = [];
const add = (text, level = 0, alt = null) => det.push({ text, level, alt });
const aliases = o.projects.filter((p) => p.aliases?.length).map((p) => `${p.name} = ${p.aliases.join(" = ")}`);
if (aliases.length) add(`ALIASY PROJEKTOV (rovnaký projekt): ${aliases.join("; ")}`);
for (const p of pending) {
  add(`ODLOŽENÉ ZO SPÄTNÉHO HOVORU${p.at ? ` (${localTime(p.at)})` : ""}${p.reason ? `, dôvod odloženia: ${p.reason}` : ""}\n  ${p.say ?? ""}\n  Urobené: ${(p.done ?? []).map(doneText).join("; ") || "-"}\n  Neurobené: ${(p.skipped ?? []).map(skippedText).join("; ") || "-"}`);
}
for (const f of followups) add(`HOVOR (${KIND[f.kind] ?? f.kind}, ${localTime(f.at)}): ${f.summary}\n  Urobené: ${f.executed.join("; ") || "-"}\n  Neurobené: ${f.skipped.join("; ") || "-"}\n  Na schválenie: ${f.approvals.join("; ") || "-"}\n  Zdroje: ${src(f.sources)}`);
for (const b of o.bugs) add(`BUG ${taskLine(b)}`);
for (const p of o.projects) {
  add(`PROJEKT ${p.name}${p.aliases?.length ? ` (iné mená: ${p.aliases.join(", ")})` : ""}, cesta ${p.path}; ${p.changed ? "zmeny v okne" : "bez zmeny v okne"}; posledná zmena ${p.last_change_at ? localTime(p.last_change_at) : "neznáma"}; otvorených úloh ${p.open_count}; najbližší termín: ${p.next_due || "žiadny"}\n  Ľudia na úlohách: ${p.people.join(", ") || "-"}; potvrdené priradenie: ${p.owners || "nepotvrdené"}\n  Zhrnutie: ${p.summary}`);
  for (const t of p.changed_tasks) add(`  zmena ${taskLine(t)}`, 3, `  zmena ${taskHead(t)}`);
  for (const t of p.in_progress) add(`  otvorená ${taskLine(t)}`, p.changed ? 2 : 1);
  for (const t of p.today) add(`  priorita dnes: ${t.text} → ${t.who}${t.task_key ? ` (${t.task_key})` : ""}. Prečo: ${t.why}`);
}
for (const t of o.new_tasks) add(`NOVÁ ÚLOHA ${taskLine(t)}`);
for (const e of o.emails) add(`E-MAIL od ${e.from} na ${e.to || "?"}, ${localTime(e.received_at)}, predmet „${e.subject}“${e.needs_reply ? ", čaká na odpoveď" : ""}\n  Účet: ${e.account || "v maile neuvedené"}\n  Obsah: ${clip(e.content, 1500)}\n  Prečo dôležité: ${e.why}`);
for (const i of o.today) add(`DNES: ${i.text}\n  Detaily: ${i.details}\n  Prečo: ${i.why}\n  Zdroje: ${src(i.sources)}`);
for (const [k, title] of [["ideas", "NÁPAD"], ["comms", "NÁVRH KOMUNIKÁCIE"]]) {
  for (const i of o[k]) add(`${title}: ${i.text}\n  Detaily: ${i.details}\n  Prečo: ${i.why}\n  Zdroje: ${src(i.sources)}`, 4, `${title}: ${i.text}`);
}
for (const q of allQs) add(`OTÁZKA${q.id ? ` ${q.id}` : ""} (${q.topic}): ${q.question}\n  Prečo sa pýtam: ${q.why}`);
const failed = o.sources_checked.filter((s) => s.status === "failed").map((s) => s.source);
if (failed.length) add(`Zdroje, ktoré sa dnes nepodarilo prečítať: ${failed.join(", ")}.`);

const CUT_NOTE = "Podrobnosti sú skrátené (otvorené úlohy alebo popisy). Čo tu nie je, zistím po hovore.";
const size = () => det.reduce((n, d) => n + (d.text?.length ?? 0) + 1, 0) + CUT_NOTE.length;
let cut = 0;
for (let level = 1; level <= 4 && size() > MAX_DETAILS; level++) {
  for (let i = det.length - 1; i >= 0 && size() > MAX_DETAILS; i--) {
    if (det[i].level !== level || det[i].text == null) continue;
    det[i].text = det[i].alt; // null = dropped
    det[i].level = 0;
    cut++;
  }
}
if (cut) add(CUT_NOTE);
const details = det.map((d) => d.text).filter((t) => t != null).join("\n");
if (details.length > MAX_DETAILS) console.log(`WARNING: call_details ${details.length} chars over budget ${MAX_DETAILS} even after cutting (only never-cut parts left)`);

const instructions = `Toto je ranný brief za obdobie ${o.period_label}.
Poradie: (1) odložené zo spätného hovoru, ak niečo je, (2) čo sa urobilo po hovoroch od posledného briefu: pri každom hovore čo sa urobilo a čo nie a prečo, (3) bugy, (4) projekty so zmenami: čo je nové, čo sa rieši, priorita na dnes a kto ju má riešiť, (5) projekty bez zmeny jednou vetou každý, (6) nové úlohy, (7) dôležité e-maily, (8) Marekove úlohy na dnes, (9) nápady, (10) navrhované e-maily a meetingy, (11) otázky.
Hovor najprv krátko, detaily hovor až na požiadanie. V podrobnostiach máš pri každej úlohe kľúč, názov, popis, riešiteľa, stav a termín, pri e-mailoch odosielateľa, adresu, účet a obsah. Keď sa Marek pýta na konkrétne úlohy (napr. čo presne niekto dokončil), vymenuj ich s kľúčom a názvom. Označenia otázok (Q a číslo) nikdy nečítaj nahlas.
Po každom bloku sa krátko opýtaj, či má otázku alebo či pokračovať.
Otázky polož na konci, jednu po druhej, a počkaj na odpoveď. Ak sa otázka týka projektu, o ktorom práve hovoríte, môžeš ju položiť hneď tam.
Mená projektov: ${aliases.join("; ") || "pozri podrobnosti"}. Ak Marek povie meno človeka alebo projektu, ktoré presne nesedí na nikoho v podkladoch alebo sedí na viac možností (napríklad „IME“, „Leo“), nehádaj potichu a dopýtaj sa: „Myslíš projekt Zacharides, teda Imagewell?“ alebo „Myslíš Leonarda Tótha?“.
Marek ti môže zadať nové úlohy pre seba alebo developerov. Postupuj podľa pravidiel v časti „Počas hovoru nič nevykonávaš“. Pri každej akcii si over projekt, task list, presný názov, riešiteľa celým menom a termín, ak ho Marek povedal.
Pred ukončením hovoru zopakuj všetky dohodnuté akcie po jednej. Toto je výnimka z pravidla, že kľúče úloh hovoríš len na požiadanie: pri záverečnom zopakovaní kľúč vyslov vždy. Pri existujúcej úlohe povedz kľúč (napríklad IMP-1491), pri novej úlohe projekt a task list, potom čo sa má urobiť, meno riešiteľa a termín. Po každej akcii sa opýtaj „Platí?“ a počkaj na áno alebo opravu. Akciu, ktorú Marek nepotvrdí, nevykonáš. Až potom hovor ukonči nástrojom end_call.`;

const vars = {
  first_message: `Dobré ráno, Marek. Mám pre teba ranný brief za obdobie ${o.period_label}. Môžem začať?`,
  call_instructions: instructions,
  call_content: say.join("\n\n"),
  call_details: details || "(žiadne podrobnosti)",
};
console.log(`variables: content ${vars.call_content.length} chars, details ${vars.call_details.length} chars${cut ? ` (${cut} lines shortened to fit ${MAX_DETAILS})` : ""}, projects ${o.projects.length} (${changed.length} changed), questions ${allQs.length}, followups ${followups.length}, pending callback items ${pending.length}${DRY ? ", DRY RUN" : ""}`);

// dry-run: placeCallAndWait writes the variables and call.json (status dry-run, guard) and does not call
const result = await placeCallAndWait(vars, { runDir: RUN_DIR, kind: "morning-brief" });
if (DRY || result.dryRun) {
  console.log("dry run: call not placed, no followup, pending callback untouched");
  process.exit(0);
}
if (!result.answered) {
  // not answered / unreachable: the run is ok, but the runner keeps lastSuccessAt, so the next brief covers this period
  // again (incl. the followups and executions in it). RUN_ADVANCE_FILE is set by core.mjs (I1).
  if (process.env.RUN_ADVANCE_FILE) {
    fs.writeFileSync(process.env.RUN_ADVANCE_FILE, JSON.stringify({ advance: false, reason: "brief not answered", attempts: result.attempts.length }, null, 2));
  }
  console.log("call not answered (logged, not an error); period not advanced, pending callback kept for the next brief");
  process.exit(0);
}
await startFollowup({ runDir: RUN_DIR, kind: "morning-brief", purpose: "Ranný brief", content: { ...o, deferred_callback: pending }, transcript: result.transcript, conversationId: result.conversationId });

if (pending.length) {
  // delivered = the agent ended the call itself (end_call, i.e. after the summary) and it lasted long enough;
  // otherwise (hang-up after a few seconds, SIP drop) the items stay for the next brief: repeating beats losing them
  const last = result.attempts.at(-1) ?? {};
  const delivered = /end_call/i.test(String(last.termination_reason ?? "")) && (last.duration_secs ?? 0) >= PENDING_MIN_SECS;
  if (!delivered) {
    console.log(`pending callback kept: call ${last.duration_secs ?? "?"} s, ended by "${last.termination_reason ?? "?"}" (needs end_call and ≥ ${PENDING_MIN_SECS} s)`);
  } else {
    fs.writeFileSync(path.join(RUN_DIR, "pending-callback.json"), JSON.stringify({ items: pending }, null, 2));
    // remove only the delivered items (a callback may have appended one during the call)
    const key = (i) => `${i.at}|${i.callback_run ?? ""}|${i.say ?? ""}`;
    const said = new Set(pending.map(key));
    const left = readPending().filter((i) => !said.has(key(i)));
    fs.writeFileSync(PENDING, JSON.stringify({ items: left }, null, 2));
    console.log(`pending callback: ${pending.length} item(s) delivered and removed, ${left.length} left`);
  }
}
