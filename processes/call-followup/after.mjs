// call-followup, step 2: deterministic checks of proposed_actions → action-executor, or straight to callback.
// The followup model only proposes. Here code decides what may be executed (lib.mjs) and starts the next
// process through runner/spawn.mjs (K1). RUN_DRY is inherited by the spawned processes.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { callbackInput, callerVerified, callNotePath, isDry, mayCallBack, precheck } from "./lib.mjs";

const RUN_DIR = process.env.RUN_DIR;
const saved = JSON.parse(fs.readFileSync(process.env.RUN_OUTPUT, "utf8"));
const o = saved.output;
const input = JSON.parse(fs.readFileSync(process.env.RUN_INPUT, "utf8"));
const dry = isDry() || input.dry_run === true;
const kind = input.kind ?? o.kind;
const depth = Number.isInteger(input.depth) ? input.depth : kind === "callback" ? 1 : 0;
const verified = callerVerified(input);
const source_run = process.env.RUN_ID;
const pm = await import("../../runner/pm.mjs");

// second guard against a duplicate followup of the same conversation (inbound poller crash, manual rerun)
function alreadyExecuted(conversationId) {
  if (!conversationId) return false;
  const file = path.join(process.env.AIOS_RUNNER_HOME || path.join(os.homedir(), ".aios-runner"), "logs", "actions.jsonl");
  if (!fs.existsSync(file)) return false;
  return fs.readFileSync(file, "utf8").split("\n").some((l) => {
    try {
      const e = JSON.parse(l);
      return e.conversation_id === conversationId && e.dry_run === false && ["executed", "approval"].includes(e.result);
    } catch {
      return false;
    }
  });
}

let { actions, rejected } = precheck(input, o);
const duplicate = alreadyExecuted(input.conversation_id);
if (duplicate) {
  rejected = [...rejected, ...actions.map((a) => ({ id: a.id, summary: a.summary, reason: "hovor už bol raz vykonaný (actions.jsonl), druhýkrát sa nevykonáva" }))];
  actions = [];
}
const mode = pm.hasSecret("PM_ACTIONS_TOKEN") ? "pmtool" : "model";

// confirmed but not executable (over the limit, weak confirmation) → open questions (K6) + callback questions
const toAsk = verified && !duplicate ? rejected : [];
const stamp = new Date().toISOString().slice(0, 10);
const asked = toAsk.map((r, i) => ({
  id: `Q-A${source_run.replace(/\D/g, "").slice(-6)}-${i + 1}`,
  question: r.overLimit ? `Mám ešte urobiť: ${r.summary}?` : `Potvrdzuješ: ${r.summary}? Povedz prosím kľúč úlohy.`,
  why: r.reason,
}));
let questionsWritten = null;
if (asked.length) {
  const rows = asked.map((q) => `| ${q.id} | ${q.question.replace(/\|/g, "/")} | ${q.why.replace(/\|/g, "/")} | akcie z hovoru | open | | hovor ${input.conversation_id ?? "?"} | ${stamp} |`);
  const text = `| id | otázka | prečo | téma | stav | odpoveď | zdroj | dátum |\n|---|---|---|---|---|---|---|---|\n${rows.join("\n")}`;
  if (dry || mode !== "pmtool") questionsWritten = { planned: true, text };
  else {
    try {
      await pm.pmTool("pm_append_brain_section", { note: "context/otvorene-otazky.md", heading: "Nevykonané akcie z hovorov", text, summary: `nevykonané akcie z hovoru ${input.conversation_id}` }, { tokenEnv: "PM_ACTIONS_TOKEN" });
      questionsWritten = { planned: false, text };
    } catch (err) {
      questionsWritten = { error: String(err.message).slice(0, 300), text };
    }
  }
}

const plan = { kind, depth, verified, dry_run: dry, mode, duplicate, actions: actions.map((a) => a.id), rejected, questions_added: asked, questions_written: questionsWritten };
fs.writeFileSync(path.join(RUN_DIR, "actions-plan.json"), JSON.stringify({ ...plan, actions }, null, 2));
// the brief reads followup outputs (K3): the code's decision is part of the output
fs.writeFileSync(process.env.RUN_OUTPUT, JSON.stringify({ ...saved, precheck: plan }, null, 2));
console.log(JSON.stringify({ ...plan, questions_written: questionsWritten ? (questionsWritten.error ? "error" : questionsWritten.planned ? "planned" : "written") : null }));

// spawn.mjs is loaded lazily so the checks above stay testable without it
const spawnNext = async (name, inputObj) => {
  const { spawnProcess } = await import("../../runner/spawn.mjs");
  spawnProcess(name, inputObj, { fromRunDir: RUN_DIR, label: name });
  console.log(`${name} started`);
};

const cb = verified && !duplicate && (o.callback?.needed || asked.length) ? o.callback ?? {} : null;
const cbQuestions = cb ? [...(cb.questions ?? []), ...asked].slice(0, 5) : [];
const cbInfo = cb ? { needed: true, say: cb.say ?? "", questions: cbQuestions } : { needed: false };
const meta = { source_run, call_source_run: input.source_run ?? null, conversation_id: input.conversation_id ?? null, kind, depth, dry_run: dry, call_note: callNotePath(o.notes_written) };
if (actions.length) {
  if (mode === "pmtool") {
    // the actions never enter the executor's prompt in this mode
    const file = path.join(RUN_DIR, "executor-actions.json");
    fs.writeFileSync(file, JSON.stringify({ actions, prechecked_skipped: rejected, callback: cbInfo }, null, 2), { mode: 0o600 });
    await spawnNext("action-executor", { ...meta, mode, actions_file: file });
  } else {
    await spawnNext("action-executor", { ...meta, mode, actions, prechecked_skipped: rejected, callback: cbInfo });
  }
} else if (cb) {
  const may = mayCallBack({ kind, depth, newResults: kind === "callback" ? false : true });
  if (!may.ok) console.log(`callback skipped: ${may.reason}`);
  else {
    await spawnNext("callback", callbackInput({
      say: cb.say,
      questions: cbQuestions,
      done: [],
      skipped: rejected.map((r) => `${r.summary}: ${r.reason}`),
      source_run,
      depth: depth + 1,
    }));
  }
} else console.log(duplicate ? "duplicate conversation, nothing executed" : "nothing to execute, no callback");
