// AI tasks voice assistant (internal test, IMPOFAI only): pure helpers for ai-tasks-call and ai-tasks-followup.
// The coding agent on the server (KAPSA AI tasks worker, token name WORKER_NAME) writes questions, previews and
// approval requests into the activity of tasks in "Startups / KAPSA / AI tasks". This assistant calls Marek about
// every new such message (several tasks in one call), and posts his answers back into the activity, where the
// worker picks them up. Tasks are always named by their name, never by key.
import { isAgreement, taskNameHeard } from "../call-followup/lib.mjs";

export const AI_TASKS_LIST = "Startups / KAPSA / AI tasks";
export const WORKER_NAME = process.env.AI_TASKS_WORKER_NAME || "Kapsa";
export const BATCH_WAIT_MIN = 20; // while the worker runs, wait up to this long so several tasks go into one call
export const MIN_GAP_MIN = 10; // between two calls
export const RETRY_UNANSWERED_MIN = 30; // after a call nobody picked up

const norm = (s) => String(s ?? "").toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** The newest comment of a task is from the worker and was not announced yet → a pending item. */
export function pendingItem(task, comments, announced) {
  const last = [...comments].filter((c) => c.body).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
  if (!last || last.actor_type !== "agent" || last.agent_name !== WORKER_NAME) return null;
  if (announced?.[task.key] === last.id) return null;
  return { key: task.key, name: task.name, comment_id: last.id, at: last.created_at, kind: kindOf(last.body), text: speakable(last.body), preview_url: task.preview_url ?? null };
}

/** What the worker wants: questions / preview (deploy or changes) / approval / failure / deployed / other. */
export function kindOf(body) {
  const b = String(body ?? "");
  if (/otázky pred začatím/i.test(b)) return "questions";
  if (/potrebujem schválenie/i.test(b)) return "approval";
  if (/preview je pripravený|preview znova beží/i.test(b)) return "preview";
  if (/nasadené do produkcie/i.test(b)) return "deployed";
  if (/zlyhal|chyba|nepodarilo/i.test(b)) return "failure";
  return "other";
}

/** Comment text the voice agent can read: no markdown, links, code or task keys. */
export function speakable(body) {
  return String(body ?? "")
    .replace(/```[\s\S]*?```/g, " (technický výpis vynechaný) ")
    .replace(/https?:\/\/\S+/g, "(odkaz v úlohe)")
    .replace(/\b[A-Z]{2,}-\d+\b/g, "")
    .replace(/[*_`#>]+/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 2500);
}

const NEED = {
  questions: "Kódovací agent má otázky pred začatím. Polož ich po jednej, aj s jeho odporúčaním.",
  approval: "Kódovací agent potrebuje schválenie konkrétnej akcie. Vysvetli ju jednou vetou a opýtaj sa, či ju schvaľuje.",
  preview: "Zmena je hotová na preview (odkaz je v úlohe). Opýtaj sa, či ju nasadiť do produkcie, alebo aké zmeny chce.",
  deployed: "Zmena bola nasadená. Len to oznám; ak Marek chce niečo doplniť, zaznač si to.",
  failure: "Agentovi niečo zlyhalo. Povedz čo, jednou vetou, a opýtaj sa, čo má agent urobiť.",
  other: "Povedz, čo agent píše, a opýtaj sa, či k tomu má odpoveď.",
};

/** Dynamic variables of the call. Labels "Úloha 1…n" map to tasks only in call_details (never keys). */
export function callVariables(items) {
  const n = items.length;
  const plural = n === 1 ? "jedna úloha čaká" : n <= 4 ? `${n} úlohy čakajú` : `${n} úloh čaká`;
  const content = items
    .map((it, i) => `## Úloha ${i + 1}: ${it.name}\nČo od teba potrebuje: ${NEED[it.kind] ?? NEED.other}\nČo kódovací agent napísal:\n${it.text}`)
    .join("\n\n");
  const instructions = `Toto je hovor o AI úlohách: kódovací agent na serveri pracuje na úlohách a potrebuje Marekove odpovede. Volá ti kvôli ${n === 1 ? "jednej úlohe" : `${n} úlohám`}.
Pre každú úlohu postupne: (1) povedz jej presný názov, (2) jednou až dvomi vetami, čo agent urobil alebo hlási, (3) čo od Mareka potrebuje. Otázky kladieš po jednej a počkaj na odpoveď. Každú odpoveď jednou vetou zopakuj, aby ťa mohol opraviť.
Nasadenie do produkcie a schválenia: keď Marek chce nasadiť alebo niečo schváliť, zopakuj presne „Takže úlohu <názov> nasadiť do produkcie, platí?“ (alebo „schvaľuješ <akciu> pri úlohe <názov>, platí?“) a za potvrdené ber len jasné áno.
Ak Marek povie, že sa k úlohe vráti neskôr, preskoč ju. Ak chce zmeny, zapamätaj si ich presne.
Kódy úloh nikdy nehovor. Odkazy nečítaj, povedz len, že odkaz na preview je v úlohe.
Na konci zhrň odpoveď ku každej úlohe jednou vetou a povedz, že ich zapíšeš do úloh a kódovací agent bude pokračovať.`;
  return {
    first_message: `Ahoj Marek, volám kvôli AI úlohám na serveri: ${plural} na teba. Máš chvíľu?`,
    call_instructions: instructions,
    call_content: content,
    call_details: items.map((it, i) => `Úloha ${i + 1} = ${it.name} (${it.kind})`).join("\n"),
  };
}

// ---------- after the call: validate Marek's answers ----------
const DEPLOY = /nasa[ďd]|nasadi|deploy|do produkcie|produkci/i;
const APPROVE = /schva[lľ]|schváľ|súhlas|suhlas|povoľ|povol/i;
const turns = (transcript) => (transcript ?? []).map((t) => ({ role: t.role, text: String(t.message ?? t.text ?? "") }));

/**
 * One answer from the model → { ok, body | reason }. A deploy or approval counts only when Marek said it himself
 * ("nasaď", "schvaľujem"…) or answered a plain yes right after the assistant's read-back that named the task and the action.
 */
export function answerComment(ans, tasks, transcript, whenLabel) {
  const task = tasks.find((t) => t.key === ans.task_key);
  if (!task) return { ok: false, reason: `neznáma úloha ${ans.task_key}` };
  if (["later", "none"].includes(ans.decision)) return { ok: false, reason: ans.decision };
  const tr = turns(transcript);
  const q = norm(ans.quote);
  const idx = tr.findIndex((t) => t.role === "user" && q && norm(t.text).includes(q));
  if (idx < 0) return { ok: false, reason: "citát sa nenašiel v Marekových vetách" };
  const prev = idx > 0 && tr[idx - 1].role === "agent" ? tr[idx - 1].text : "";
  const quoteLine = `Marekove slová: „${ans.quote.trim()}“`;
  if (ans.decision === "deploy" || ans.decision === "approve") {
    const re = ans.decision === "deploy" ? DEPLOY : APPROVE;
    const own = re.test(ans.quote);
    const confirmed = isAgreement(ans.quote) && re.test(prev) && taskNameHeard(prev, task.name);
    if (!own && !confirmed) {
      return { ok: true, downgraded: true, body: `Odpoveď z hlasového hovoru (${whenLabel}): ${ans.comment}\n\n${quoteLine}\n\n${ans.decision === "deploy" ? "Nasadenie" : "Schválenie"} nezaznelo jednoznačne, preto ho zatiaľ nevykonávaj a počkaj na ďalšiu odpoveď.` };
    }
    return { ok: true, body: `${ans.decision === "deploy" ? "deploy" : "schvaľujem"}\n\n(Potvrdené v hlasovom hovore ${whenLabel}. ${quoteLine})` };
  }
  if (ans.decision === "preview") return { ok: true, body: "preview" };
  return { ok: true, body: `Odpoveď z hlasového hovoru (${whenLabel}):\n${ans.comment}\n\n${quoteLine}` };
}
