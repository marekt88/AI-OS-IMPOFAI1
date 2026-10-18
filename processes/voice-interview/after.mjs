// Interview call: questions from the input → call → call-followup indexes the answers.
import fs from "node:fs";
import { callGuard, placeCallAndWait, startFollowup } from "../../runner/voice-call.mjs";

const { output: o } = JSON.parse(fs.readFileSync(process.env.RUN_OUTPUT, "utf8"));
if (!o?.questions?.length) {
  console.error("input needs { topic, intro, questions: [{ question, why }] }");
  process.exit(2);
}
const instructions = `Toto je rozhovor na tému: ${o.topic}.
${o.intro}
Polož otázky jednu po druhej v uvedenom poradí. Po každej odpovedi ju jednou vetou zhrň, aby ťa Marek mohol opraviť.
Ak je odpoveď nejasná alebo si protirečí s tým, čo povedal skôr, dopýtaj sa najviac dvakrát. Ak Marek otázku preskočí, pokračuj.
Nevysvetľuj mu jeho vlastný plán a neponúkaj riešenia, len zbieraj odpovede. Na konci sa opýtaj, či chce ešte niečo doplniť.`;
const vars = {
  first_message: `Ahoj Marek, tu tvoj asistent. Mám ${o.questions.length} otázok k téme ${o.topic}. Máš teraz chvíľu?`,
  call_instructions: instructions,
  call_content: o.questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n"),
  call_details: o.questions.map((q, i) => `${i + 1}. Prečo sa pýtam: ${q.why}`).join("\n"),
};
const guard = callGuard({ kind: "interview" });
if (!guard.allowed) {
  console.error(`interview call not allowed now: ${guard.reason}`);
  process.exit(4);
}
const r = await placeCallAndWait(vars, { runDir: process.env.RUN_DIR, kind: "interview" });
if (r.answered) startFollowup({ runDir: process.env.RUN_DIR, kind: "interview", depth: 0, purpose: o.topic, content: o, transcript: r.transcript, conversationId: r.conversationId });
else console.log("call not answered (logged, not an error)");
