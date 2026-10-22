// Callback (K7): call Marek back with the result of the executed actions and open questions.
// Input (= output, claude:false): { say, questions: [{ id, question, why }], done: [], skipped: [], source_run, depth }.
// callGuard (quiet hours, 3 callbacks/day, 60 min/day) or depth > LIMITS.maxCallbackDepth (2) → no call, the content goes to
// ~/.aios-runner/state/pending-callback.json and the next morning brief says it. Exit 0 in that case.
// After an answered call: call-followup with kind "callback" and the same depth (it counts callbacks in the
// chain; call-followup/action-executor add 1 when they start the next callback, max 2 = one more after a callback).
import fs from "node:fs";
import { addPendingCallback, callGuard, isDry, LIMITS, placeCallAndWait, startFollowup } from "../../runner/voice-call.mjs";

const RUN_DIR = process.env.RUN_DIR;
const { output: o = {} } = JSON.parse(fs.readFileSync(process.env.RUN_OUTPUT, "utf8"));
const done = Array.isArray(o.done) ? o.done : [];
const skipped = Array.isArray(o.skipped) ? o.skipped : [];
const questions = (Array.isArray(o.questions) ? o.questions : []).filter((q) => q && (q.question || typeof q === "string"));
// depth = number of callbacks in the chain including this one (1 = first callback), same as call-followup/lib.mjs mayCallBack
const depth = Number.isInteger(o.depth) && o.depth > 0 ? o.depth : 1;
const say = String(o.say ?? "").trim();

if (!say && !done.length && !skipped.length && !questions.length) {
  console.log("nothing to say (no say, done, skipped or questions): no call");
  process.exit(0);
}

// ---------- text helpers (items from action-executor: strings or objects) ----------
const keyOf = (x) => x?.task_key ?? x?.key ?? x?.result?.key ?? x?.result?.task_key ?? x?.backup?.key ?? null;
const textOf = (x) => (typeof x === "string" ? x : x?.summary ?? x?.text ?? x?.name ?? x?.title ?? x?.tool ?? JSON.stringify(x));
const whyOf = (x) => (typeof x === "string" ? null : x?.reason ?? x?.why ?? x?.error ?? null);
const doneLine = (x) => `- ${textOf(x)}${keyOf(x) ? ` (${keyOf(x)})` : ""}`;
const skippedLine = (x) => `- ${textOf(x)}${keyOf(x) ? ` (${keyOf(x)})` : ""}${whyOf(x) ? `: ${whyOf(x)}` : ""}`;
const plural = (n, one, few, many) => `${n} ${n === 1 ? one : n >= 2 && n <= 4 ? few : many}`;
const qText = (q) => (typeof q === "string" ? q : q.question);

const pendingItem = (reason) => ({ reason, source_run: o.source_run ?? null, callback_run: process.env.RUN_ID ?? null, depth, say, done, skipped, questions });

// ---------- guard ----------
const guard = callGuard({ kind: "callback" });
const tooDeep = depth > LIMITS.maxCallbackDepth;
if (!guard.allowed || tooDeep) {
  const reason = tooDeep ? `callback-depth (${depth} > ${LIMITS.maxCallbackDepth})` : guard.reason;
  const file = addPendingCallback(pendingItem(reason), { runDir: RUN_DIR });
  console.log(`callback not placed: ${reason}; saved for the morning brief in ${file}${isDry() ? " [dry-run]" : ""}`);
  process.exit(0);
}

// ---------- call variables ----------
const content = [];
if (say) content.push(`## Úvod\n${say}`);
content.push(`## Hotové (${done.length})\n${done.map(doneLine).join("\n") || "Nič sa nevykonalo."}`);
if (skipped.length) content.push(`## Nepodarilo sa alebo čaká (${skipped.length})\n${skipped.map(skippedLine).join("\n")}`);
if (questions.length) content.push(`## Otázky (${questions.length})\n${questions.map((q, i) => `${i + 1}. ${qText(q)}`).join("\n")}`);

const details = [
  ...done.map((x) => `HOTOVÉ: ${JSON.stringify(x)}`),
  ...skipped.map((x) => `NEPODARILO SA / ČAKÁ: ${JSON.stringify(x)}`),
  ...questions.map((q, i) => `OTÁZKA ${i + 1}${q.id ? ` (${q.id})` : ""}: ${qText(q)}${q.why ? `\n  Prečo sa pýtam: ${q.why}` : ""}`),
  o.source_run ? `Zdroj: beh ${o.source_run}` : null,
].filter(Boolean);

const instructions = `Toto je spätný hovor. Marekovi voláš s výsledkom toho, čo ti zadal v predchádzajúcom hovore.
Poradie:
(1) Výsledok: čo je hotové. Pri každej hotovej úlohe povedz jej presný názov. Kód úlohy (napríklad IMP-1481) nikdy nehovor nahlas.
(2) Čo sa nepodarilo alebo čaká na jeho schválenie a prečo, jednou vetou na položku.
(3) Otázky: polož ich jednu po druhej, počkaj na odpoveď a každú odpoveď jednou vetou zhrň, aby ťa mohol opraviť.
Po výsledku sa krátko opýtaj, či k tomu má otázku. Keď ti Marek zadá novú úlohu alebo zmenu, postupuj podľa pravidiel v časti „Počas hovoru nič nevykonávaš“: zopakuj ju presne a nechaj si ju potvrdiť.
Ak nie je čo hlásiť ani sa pýtať, povedz to jednou vetou a hovor ukonči.`;

const vars = {
  first_message: `Ahoj Marek, tu tvoj asistent. Volám s výsledkom: ${plural(done.length, "hotová vec", "hotové veci", "hotových vecí")}${skipped.length ? `, ${plural(skipped.length, "nevyšla alebo čaká", "nevyšli alebo čakajú", "nevyšlo alebo čaká")}` : ""}${questions.length ? ` a mám ${plural(questions.length, "otázku", "otázky", "otázok")}` : ""}. Máš chvíľu?`,
  call_instructions: instructions,
  call_content: content.join("\n\n"),
  call_details: details.join("\n") || "(žiadne)",
};
console.log(`callback: done ${done.length}, skipped ${skipped.length}, questions ${questions.length}, depth ${depth}`);

const r = await placeCallAndWait(vars, { runDir: RUN_DIR, kind: "callback" });
if (r.dryRun) {
  console.log("dry-run: no call, no followup");
} else if (!r.answered) {
  const file = addPendingCallback(pendingItem("not-answered"), { runDir: RUN_DIR });
  console.log(`callback not answered (logged, not an error); saved for the morning brief in ${file}`);
} else {
  await startFollowup({ runDir: RUN_DIR, kind: "callback", purpose: "Spätný hovor s výsledkom a otázkami", content: o, transcript: r.transcript, conversationId: r.conversationId, depth });
}
