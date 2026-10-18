// action-executor, step 2.
// mode "pmtool" (PM_ACTIONS_TOKEN set): the actions are executed here over HTTP, no model involved.
// mode "model": the claude step executed them; here every write call in transcript.jsonl is compared with the
// approved actions. Anything else = urgent AI Bugs report + executor_mismatch in the output.
// Then: output.json is rewritten with the verified result, the permanent action log, and the callback (K5/K7).
import fs from "node:fs";
import path from "node:path";
import { appendActionLog, callbackInput, isDry, mayCallBack } from "../call-followup/lib.mjs";
import { runDeterministic, transcriptCalls, verifyModelRun } from "./lib.mjs";

const RUN_DIR = process.env.RUN_DIR;
const outFile = process.env.RUN_OUTPUT;
const saved = JSON.parse(fs.readFileSync(outFile, "utf8"));
const input = JSON.parse(fs.readFileSync(process.env.RUN_INPUT, "utf8"));
const dry = isDry() || input.dry_run === true;
const kind = input.kind;
const depth = Number.isInteger(input.depth) ? input.depth : kind === "callback" ? 1 : 0;
const ctx = { conversation_id: input.conversation_id ?? null, kind, source_run: input.source_run ?? null };

// pmtool mode keeps the actions out of the model's prompt: they are in a file of the followup run
let actions = input.actions ?? [];
let callback = input.callback ?? { needed: false };
let prechecked = input.prechecked_skipped ?? [];
if (input.mode === "pmtool") {
  const runsRoot = path.resolve(RUN_DIR, "..", "..");
  const file = path.resolve(String(input.actions_file ?? ""));
  if (!file.startsWith(runsRoot + path.sep)) throw new Error(`actions_file outside the runs directory: ${file}`);
  const side = JSON.parse(fs.readFileSync(file, "utf8"));
  ({ actions = [], callback = { needed: false }, prechecked_skipped: prechecked = [] } = side);
}
const byId = new Map(actions.map((a) => [a.id, a]));

const pm = await import("../../runner/pm.mjs");
let result;
if (input.mode === "pmtool") {
  result = await runDeterministic(actions, ctx, { pmTool: pm.pmTool, dry });
} else {
  result = verifyModelRun(transcriptCalls(path.join(RUN_DIR, "transcript.jsonl")), actions, saved.output, ctx);
  result.dry_run = dry;
  if (dry && result.mismatch.length === 0) {
    // nothing was written; keep the model's description of the plan
    result.planned = saved.output?.executed ?? [];
    result.executed = [];
    const planned = new Set(result.planned.map((e) => e.action_id));
    result.skipped = result.skipped.filter((s) => !planned.has(s.action_id));
  }
}
result = { ...result, source_run: ctx.source_run ?? "", conversation_id: ctx.conversation_id ?? "", kind: kind ?? "" };
if (result.mismatch?.length) result.executor_mismatch = true;
fs.writeFileSync(outFile, JSON.stringify({ ...saved, output: result, model_output: input.mode === "pmtool" ? undefined : saved.output }, null, 2));

// permanent log: only proven calls (dry-run entries are marked)
const base = { dry_run: dry, mode: result.mode, conversation_id: ctx.conversation_id, kind, source_run: ctx.source_run, executor_run: process.env.RUN_ID };
const q = (id) => byId.get(id)?.quote ?? null;
appendActionLog([
  ...result.executed.map((e) => ({ ...base, result: "executed", action_id: e.action_id, tool: e.tool, ref: e.ref, what: e.what, quote: q(e.action_id), args: byId.get(e.action_id)?.args ?? null })),
  ...result.approvals_created.map((e) => ({ ...base, result: "approval", action_id: e.action_id, ref: e.task_key, what: e.what, quote: q(e.action_id) })),
  ...result.skipped.map((e) => ({ ...base, result: "skipped", action_id: e.action_id, reason: e.reason, quote: q(e.action_id) })),
  ...result.backups.map((b) => ({ ...base, result: "backup", action_id: b.action_id, ref: b.task_key, task_json: b.task_json })),
  ...(result.mismatch ?? []).map((m) => ({ ...base, result: "mismatch", ...m })),
]);
console.log(`${result.mode}: ${result.executed.length} executed, ${result.approvals_created.length} approvals, ${result.skipped.length} skipped, ${result.mismatch?.length ?? 0} mismatch${dry ? " (dry-run)" : ""}`);
for (const w of result.warnings ?? []) console.log(`warning: ${w}`);

if (result.mismatch?.length && !dry) {
  await pm.reportIssue({
    fingerprint: `process:action-executor:mismatch:${process.env.RUN_ID}`,
    title: "URGENTNÉ: action-executor zapísal do PM niečo mimo schválených akcií",
    details: `Hovor ${ctx.conversation_id} (${kind}), beh followupu ${ctx.source_run}, beh executora ${process.env.RUN_ID}.\n\nZápisy mimo schválených akcií:\n\n\`\`\`json\n${JSON.stringify(result.mismatch, null, 2).slice(0, 4000)}\n\`\`\`\n\nSkontroluj dotknuté úlohy v PM a \`~/.aios-runner/logs/actions.jsonl\`.`,
    process: "action-executor",
    runId: process.env.RUN_ID,
  }).catch((err) => console.error(`mismatch report failed: ${err.message}`));
}

// callback: when the followup asked for it, or always after an inbound call with results
const done = [...result.executed.map((e) => e.what), ...result.approvals_created.map((a) => `${a.what} (čaká na tvoje schválenie${a.task_key ? `, ${a.task_key}` : ""})`)];
if (dry) done.push(...(result.planned ?? []).map((e) => `(dry-run) ${e.what}`));
const skipped = [...result.skipped.map((s) => `${byId.get(s.action_id)?.summary ?? s.action_id}: ${s.reason}`), ...prechecked.map((r) => `${r.summary}: ${r.reason}`)];
if (result.mismatch?.length) skipped.push("Pozor: vykonávač urobil v PM zmenu mimo schválených akcií, je to nahlásené v AI Bugs.");
const newResults = done.length + skipped.length > 0;
const wanted = callback?.needed || (kind === "inbound" && newResults);
if (!wanted) {
  console.log("no callback requested");
} else {
  const may = mayCallBack({ kind, depth, newResults });
  if (!may.ok) console.log(`callback skipped: ${may.reason}`);
  else {
    const { spawnProcess } = await import("../../runner/spawn.mjs");
    spawnProcess("callback", callbackInput({ say: callback?.say ?? "", questions: callback?.questions ?? [], done, skipped, source_run: process.env.RUN_ID, depth: depth + 1 }),
      { fromRunDir: RUN_DIR, label: "callback" });
    console.log("callback started");
  }
}
// a mismatch does not fail the run: the verified output must stay visible to the brief (K3 since)
