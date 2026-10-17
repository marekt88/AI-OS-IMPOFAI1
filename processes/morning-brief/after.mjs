// Morning brief, step 2: structured brief → call variables → call on Linphone → call-followup (after the call).
// Exit 0 = the call was placed and finished (answered or not); non-zero = the call could not be placed.
import fs from "node:fs";
import { localTime, placeCallAndWait, startFollowup } from "../../runner/voice-call.mjs";

const RUN_DIR = process.env.RUN_DIR;
const { output: o } = JSON.parse(fs.readFileSync(process.env.RUN_OUTPUT, "utf8"));

const WORD = { "pm-brain-log": "second brain", "pm-brain-note": "second brain", "pm-call": "hovor", "pm-task": "úlohy v PM", "pm-notification": "notifikácie v PM", "pm-company-map": "mapa firmy", gmail: "e-mail", calendar: "kalendár", fireflies: "Fireflies", "call-followup": "spracovanie hovoru" };
const from = (sources = []) => [...new Set(sources.map((s) => WORD[s.system] ?? s.system))].join(", ");
const src = (sources = []) => sources.map((s) => `${WORD[s.system] ?? s.system} ${s.ref}${s.at ? ` (${localTime(s.at)})` : ""}`).join("; ");
const taskLine = (t) => `${t.key} „${t.name}“: ${t.change}; stav ${t.status}; rieši ${t.assignee || "nikto"}${t.priority ? `; priorita ${t.priority}` : ""}${t.due ? `; termín ${t.due}` : ""}`;

// --- what the agent says (in this order) ---
const say = [];
if (o.followup_report) say.push(`## Po poslednom hovore\n${o.followup_report}`);
if (o.nothing_new) say.push("Za toto obdobie nie je nič nové.");
say.push(`## Bugy (AI Bugs)\n${o.bugs.length ? o.bugs.map((b) => `- ${b.name} (${b.change}; rieši ${b.assignee || "nikto"})`).join("\n") : "Žiadne otvorené bugy."}`);
for (const p of o.projects) {
  say.push(`## Projekt ${p.name}\nNové a čo sa rieši: ${p.summary}\nZmenených úloh: ${p.changed_tasks.length}.\nPriority na dnes:\n${p.today.map((t) => `- ${t.text} → ${t.who}`).join("\n") || "- (bez priority)"}`);
}
if (o.new_tasks.length) say.push(`## Nové úlohy (${o.new_tasks.length})\n${o.new_tasks.map((t) => `- ${t.name} (${t.assignee || "bez riešiteľa"})`).join("\n")}`);
say.push(`## Dôležité e-maily\n${o.emails.length ? o.emails.map((e) => `- od ${e.from}: ${e.subject}${e.needs_reply ? " (čaká na odpoveď)" : ""}`).join("\n") : "Nič dôležité."}`);
say.push(`## Tvoje úlohy na dnes\n${o.today.map((i) => `- ${i.text} (zdroj: ${from(i.sources)})`).join("\n") || "(nič)"}`);
if (o.ideas.length) say.push(`## Nápady\n${o.ideas.map((i) => `- ${i.text}`).join("\n")}`);
if (o.comms.length) say.push(`## Navrhované e-maily a meetingy\n${o.comms.map((i) => `- ${i.text}`).join("\n")}`);
say.push(`## Otázky pre Mareka\n${o.questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n") || "(žiadne)"}`);

// --- everything the agent may need for follow-up questions ---
const det = [];
for (const b of o.bugs) det.push(`BUG ${taskLine(b)}\n  Popis: ${b.description || "(bez popisu)"}`);
for (const p of o.projects) {
  det.push(`PROJEKT ${p.name} (${p.path}); ľudia: ${p.people.join(", ") || "-"}`);
  for (const t of p.changed_tasks) det.push(`  zmena ${taskLine(t)}\n    Popis: ${t.description || "(bez popisu)"}`);
  for (const t of p.in_progress) det.push(`  rieši sa ${taskLine(t)}`);
  for (const t of p.today) det.push(`  priorita dnes: ${t.text} → ${t.who}${t.task_key ? ` (${t.task_key})` : ""}. Prečo: ${t.why}`);
}
for (const t of o.new_tasks) det.push(`NOVÁ ÚLOHA ${taskLine(t)}\n  Popis: ${t.description || "(bez popisu)"}`);
for (const e of o.emails) det.push(`E-MAIL od ${e.from}, ${localTime(e.received_at)}, predmet „${e.subject}“${e.needs_reply ? ", čaká na odpoveď" : ""}\n  Obsah: ${e.content}\n  Prečo dôležité: ${e.why}`);
for (const [k, title] of [["today", "DNES"], ["ideas", "NÁPAD"], ["comms", "NÁVRH KOMUNIKÁCIE"]]) {
  for (const i of o[k]) det.push(`${title}: ${i.text}\n  Detaily: ${i.details}\n  Prečo: ${i.why}\n  Zdroje: ${src(i.sources)}`);
}
for (const q of o.questions) det.push(`OTÁZKA (${q.topic}): ${q.question}\n  Prečo sa pýtam: ${q.why}`);
const failed = o.sources_checked.filter((s) => s.status === "failed").map((s) => s.source);
if (failed.length) det.push(`Zdroje, ktoré sa dnes nepodarilo prečítať: ${failed.join(", ")}.`);

const instructions = `Toto je ranný brief za obdobie ${o.period_label}.
Poradie: (1) čo sa urobilo po poslednom hovore, ak niečo, (2) bugy, (3) projekt po projekte: čo je nové, čo sa rieši, priorita na dnes a kto ju má riešiť, (4) nové úlohy, (5) dôležité e-maily, (6) Marekove úlohy na dnes, (7) nápady, (8) navrhované e-maily a meetingy, (9) otázky.
Pri projektoch povedz zhrnutie a priority. Jednotlivé zmenené úlohy vymenuj, len keď sa Marek spýta, máš ich v podrobnostiach s názvami a popismi. Pri e-mailoch vieš povedať ich obsah.
Po každom bloku sa krátko opýtaj, či má otázku alebo či pokračovať.
Otázky polož na konci, jednu po druhej, a počkaj na odpoveď. Ak sa otázka týka projektu, o ktorom práve hovoríte, môžeš ju položiť hneď tam.
Marek ti môže zadať nové úlohy pre seba alebo developerov. Postupuj podľa pravidiel v časti „Počas hovoru nič nevykonávaš“.`;

const vars = {
  first_message: `Dobré ráno, Marek. Mám pre teba ranný brief za obdobie ${o.period_label}. Môžem začať?`,
  call_instructions: instructions,
  call_content: say.join("\n\n"),
  call_details: det.join("\n") || "(žiadne podrobnosti)",
};
console.log(`variables: content ${vars.call_content.length} chars, details ${vars.call_details.length} chars`);

const result = await placeCallAndWait(vars, { runDir: RUN_DIR });
if (!result.answered) {
  console.log("call not answered (logged, not an error)");
} else {
  startFollowup({ runDir: RUN_DIR, kind: "morning-brief", purpose: "Ranný brief", content: o, transcript: result.transcript, conversationId: result.conversationId });
}
