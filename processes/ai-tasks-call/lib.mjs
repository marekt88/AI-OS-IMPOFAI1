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
export const RECENT_DONE_DAYS = 3; // completed tasks whose last message (deployed / next steps) is newer than this still count

const norm = (s) => String(s ?? "").toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** The worker's messages since the last reply of anyone else, if the newest one was not announced yet → a pending item. */
export function pendingItem(task, comments, announced) {
  const asc = [...comments].filter((c) => c.body).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  const isWorker = (c) => c.actor_type === "agent" && c.agent_name === WORKER_NAME;
  const last = asc[asc.length - 1];
  if (!last || !isWorker(last)) return null;
  if (announced?.[task.key] === last.id) return null;
  let i = asc.length - 1;
  while (i > 0 && isWorker(asc[i - 1]) && asc[i - 1].id !== announced?.[task.key]) i--;
  const run = asc.slice(i);
  return {
    key: task.key,
    name: task.name,
    comment_id: last.id,
    at: last.created_at,
    kind: kindOf(last.body),
    text: run.map((c) => speakable(c.body)).join("\n\n---\n\n").slice(0, 6000),
    preview_url: task.preview_url ?? null,
  };
}

/** What the worker wants: questions / preview (deploy or changes) / approval / failure / deployed / other. */
export function kindOf(body) {
  const b = String(body ?? "");
  if (/návrh ďalších krokov/i.test(b)) return "next_steps";
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
    .replace(/\*{0,2}Technické detaily\*{0,2}[\s\S]*$/i, "")
    .replace(/```[\s\S]*?```/g, " (technický výpis vynechaný) ")
    .replace(/https?:\/\/\S+/g, "(odkaz v úlohe)")
    .replace(/\b[A-Z]{2,}-\d+\b/g, "")
    .replace(/[*_`#>]+/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 3500);
}

const NEED = {
  questions: "Agent ešte nezačal. Vysvetli, čo chce postaviť a ako by to fungovalo, a prejdi s Marekom jeho otázky (aj doplňujúce: ako si funkciu predstavuje, ako ju chce nastaviť).",
  approval: "Agent potrebuje schválenie konkrétnej akcie. Vysvetli ju a prečo, a opýtaj sa, či ju schvaľuje.",
  preview: "Zmena je hotová na preview (odkaz je v úlohe). Vysvetli, čo sa zmenilo a ako to funguje, ako to otestovať, prejdi otázky a agentove návrhy, a opýtaj sa, či nasadiť do produkcie alebo aké zmeny chce.",
  deployed: "Zmena je nasadená v produkcii. Povedz, čo sa zmenilo a ako si to môže otestovať.",
  next_steps: "Zmena je nasadená a v AI tasks už nič nečaká. Povedz, ako to otestovať, a prediskutuj agentove návrhy ďalších krokov k cieľom V1 a V2. Opýtaj sa, s ktorým má agent pokračovať; každý odsúhlasený krok bude nová úloha.",
  failure: "Agentovi niečo zlyhalo. Povedz čo a prečo, a opýtaj sa, ako má agent pokračovať.",
  other: "Povedz, čo agent píše, a opýtaj sa, či k tomu má odpoveď.",
};

/** Dynamic variables of the call. Labels "Úloha 1…n" map to tasks only in call_details (never keys). */
export function callVariables(items) {
  const n = items.length;
  const plural = n === 1 ? "jedna úloha čaká" : n <= 4 ? `${n} úlohy čakajú` : `${n} úloh čaká`;
  const content = items
    .map((it, i) => `## Úloha ${i + 1}: ${it.name}\nČo od teba potrebuje: ${NEED[it.kind] ?? NEED.other}\nČo kódovací agent napísal:\n${it.text}`)
    .join("\n\n");
  const instructions = `Toto je hovor o AI úlohách. Kódovací agent na serveri (Claude Code) pracuje na úlohách a pripravil pre Mareka správy. Ty si jeho hlas: vysvetľuješ, diskutuješ a zbieraš Marekove odpovede. O ďalšom postupe nerozhoduješ ty, rozhoduje Marek na základe toho, čo navrhuje kódovací agent. Volá ti kvôli ${n === 1 ? "jednej úlohe" : `${n} úlohám`}.
Pre každú úlohu postupne:
(1) Povedz jej presný názov a jednou vetou stav.
(2) Vysvetli, čo agent zmenil v kóde a ako to teraz funguje, jednoducho a z pohľadu používateľa. Čo chce robiť ďalej.
(3) Prejdi otázky po jednej, aj s agentovým odporúčaním. Nespokoj sa s áno alebo nie: keď je odpoveď stručná, dopýtaj sa, ako si to Marek predstavuje, ako to chce nastaviť, kto to bude používať. Každú odpoveď jednou vetou zopakuj, aby ťa mohol opraviť.
(4) Agentov názor a návrhy: ak agent navrhuje iné riešenie alebo nesúhlasí, povedz to Marekovi aj s dôvodom a opýtaj sa, ako sa rozhodne. Ak má agent návrh na novú úlohu alebo zmenu tejto úlohy, predstav ho.
Je to brainstorming: keď Marek príde s nápadom, rozvi ho otázkami (prečo, pre koho, čo je najmenšia užitočná verzia) a navrhni, či z neho spraviť novú úlohu.
Nasadenie a schválenia: zopakuj presne „Takže úlohu <názov> nasadiť do produkcie, platí?“ (alebo „schvaľuješ <akciu> pri úlohe <názov>, platí?“) a za potvrdené ber len jasné áno.
Nová úloha (agentov návrh, ktorý Marek odsúhlasí, alebo Marekov nápad): zopakuj „Vytvorím v AI tasks novú úlohu <krátky názov>: <čo má robiť jednou vetou>. Platí?“ a vytvorí sa až po jasnom áno.
Ak Marek povie, že sa k úlohe vráti neskôr, preskoč ju. Ak chce zmeny, zapamätaj si ich presne.
Kódy úloh nikdy nehovor. Odkazy nečítaj, povedz len, že odkaz je v úlohe.
Na konci zhrň ku každej úlohe Marekovo rozhodnutie a všetky nové úlohy jednou vetou a povedz, že ich zapíšeš a kódovací agent bude pokračovať.`;
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

// ---------- after the call: new tasks ----------
const CREATE = /vytvor|pridaj|zalo[žz]|sprav|urob|pokra[čc]uj/i;
const nameInTurn = (turn, name) => taskNameHeard(turn, name) || norm(turn).includes(norm(name));

/**
 * A new task proposed by the model → { ok, reason }. Created only when Marek said it himself ("vytvor úlohu …",
 * "pokračuj s …" naming the task) or answered a plain yes right after the assistant's read-back
 * "Vytvorím v AI tasks novú úlohu <názov> …".
 */
export function newTaskCheck(nt, transcript) {
  if (!String(nt.name ?? "").trim() || !String(nt.prompt ?? "").trim()) return { ok: false, reason: "chýba názov alebo zadanie" };
  const tr = turns(transcript);
  const q = norm(nt.quote);
  const idx = tr.findIndex((t) => t.role === "user" && q && norm(t.text).includes(q));
  if (idx < 0) return { ok: false, reason: "citát sa nenašiel v Marekových vetách" };
  const prev = idx > 0 && tr[idx - 1].role === "agent" ? tr[idx - 1].text : "";
  const own = CREATE.test(nt.quote) && nameInTurn(nt.quote, nt.name);
  const confirmed = isAgreement(nt.quote) && /nov[úa]\s+úloh/i.test(prev) && nameInTurn(prev, nt.name);
  return own || confirmed ? { ok: true } : { ok: false, reason: "vytvorenie úlohy nezaznelo jednoznačne (chýba zopakovanie s názvom a áno)" };
}
