// Step B of the IMPOFAI content system (navrh.md §3): script JSON from claude -p → kanban task (stage navrhnute).
// mode "new":      validate → task in the kanban list (in_review + label navrhnute) → the script waits for the idea
//                  (dependency), comment on the idea, idea complete + scenar-hotovy
// mode "revision": validate → previous description saved as <slug>_scenar-vN.md attachment → description v(N+1)
//                  → comment with the changes, agent run cleared (stage label and status stay)
// A script that fails validation is never written: a comment explains why and the run fails (AI Bugs).
// RUN_DRY=1: pmTool does not send writes; the rendered description is saved in RUN_DIR.
import fs from "node:fs";
import path from "node:path";
import { hasSecret, pmTool } from "../../runner/pm.mjs";
import { isDry, localParts, readJson, ROOT, writeJson } from "../_lib/zdroje.mjs";
import { readBlock, renderScript, validateScript } from "../_lib/scenar.mjs";

const RUN_DIR = process.env.RUN_DIR;
const dry = isDry();
const { output: s } = JSON.parse(fs.readFileSync(process.env.RUN_OUTPUT, "utf8"));
const input = process.env.RUN_INPUT && fs.existsSync(process.env.RUN_INPUT) ? JSON.parse(fs.readFileSync(process.env.RUN_INPUT, "utf8")) : {};
const cfg = readJson(path.join(ROOT, "config", "content.json"), {});
const tokenEnv = cfg.token_env || "CONTENT_PM_TOKEN";
const kanban = cfg.kanban_list;
const pm = (name, args) => pmTool(name, args, { tokenEnv });
const { date: today } = localParts();
const mode = input.mode === "revision" ? "revision" : "new";
if (!dry && !hasSecret(tokenEnv)) throw new Error(`${tokenEnv} chýba v ~/.aios-runner/secrets.env`);

const SKIP_TEXT = {
  expirovane: "Novinka expirovala, scenár nevznikol. Navrhujem zamietnuť (status zrušené) alebo presunúť do týždenného súhrnu.",
  "format-nie-A": "Formát nápadu nie je A (grafické video). Kanban zatiaľ spracúva iba formát A, scenár nevznikol.",
  "chybaju-fakty": "Na scenár chýbajú overené fakty, scenár nevznikol.",
};

async function finish(result) {
  console.log(JSON.stringify({ dry, mode, ...result }));
}

if (mode === "new") {
  const idea = input.idea;
  if (!idea) throw new Error("input.idea chýba");
  if (s.skip_reason) {
    await pm("pm_add_task_comment", { task: idea, body: `**Scenár (krok B):** ${SKIP_TEXT[s.skip_reason]}${s.questions?.length ? `\n\n${s.questions.map((q) => `- ${q}`).join("\n")}` : ""}` });
    await pm("pm_remove_task_label", { task: idea, label: "scenar-bezi" });
    await finish({ idea, skipped: s.skip_reason });
    process.exit(0);
  }
  const v = validateScript(s);
  if (v.errors.length) {
    await pm("pm_add_task_comment", { task: idea, body: `**Scenár (krok B) neprešiel kontrolou, nič sa nezapísalo:**\n${v.errors.map((e) => `- ${e}`).join("\n")}` });
    await pm("pm_remove_task_label", { task: idea, label: "scenar-bezi" });
    throw new Error(`validácia: ${v.errors.join("; ")}`);
  }
  s._words = v.words;
  const description = renderScript(s, { idea, version: 1, projectDate: today, warnings: v.warnings });
  if (dry) fs.writeFileSync(path.join(RUN_DIR, "dry-scenar.md"), description);
  const task = await pm("pm_create_task", { task_list: kanban, name: `Scenár: ${s.name}`, status: "in_review", labels: ["navrhnute"], description });
  const key = task.key ?? "(dry-run)";
  if (task.key) await pm("pm_add_task_dependency", { task: task.key, depends_on: idea });
  await pm("pm_add_task_comment", { task: idea, body: `**Scenár:** ${key} (v1) v kanbane ${kanban}, etapa navrhnuté. Zmeny scenára píš do komentára v ňom.` });
  await pm("pm_add_task_label", { task: idea, label: "scenar-hotovy" });
  await pm("pm_remove_task_label", { task: idea, label: "scenar-bezi" });
  await pm("pm_update_task_status", { task: idea, status: "complete" });
  await finish({ idea, script: key, words: v.words, duration: v.duration, warnings: v.warnings.length });
} else {
  const key = input.task;
  if (!key) throw new Error("input.task chýba");
  const cur = await pm("pm_get_task", { task: key });
  const prev = readBlock(cur.description, "script");
  if (!prev) throw new Error(`${key}: v description chýba blok json script`);
  const v = validateScript(s);
  if (v.errors.length) {
    await pm("pm_add_task_comment", { task: key, body: `**Revízia scenára neprešla kontrolou, scenár ostáva v${prev.script_version}:**\n${v.errors.map((e) => `- ${e}`).join("\n")}` });
    await pm("pm_update_agent_run", { task: key, agent_run_status: "failed" });
    throw new Error(`validácia: ${v.errors.join("; ")}`);
  }
  s._words = v.words;
  s.slug = prev.slug; // slug and project date never change between versions
  const version = prev.script_version + 1;
  const description = renderScript(s, { idea: prev.idea, version, projectDate: prev.project_date, changes: s.changes ?? [], warnings: v.warnings });
  if (dry) fs.writeFileSync(path.join(RUN_DIR, "dry-scenar.md"), description);
  await pm("pm_upload_task_attachment", { task: key, file_name: `${prev.slug}_scenar-v${prev.script_version}.md`, content_text: cur.description });
  await pm("pm_update_task", { task: key, description });
  await pm("pm_add_task_comment", { task: key, body: `**Scenár v${version}.** Zmeny: ${(s.changes ?? []).join("; ") || "—"}${s.questions?.length ? `\n\nOtázky:\n${s.questions.map((q) => `- ${q}`).join("\n")}` : ""}\n\nPredchádzajúca verzia je v prílohe ${prev.slug}_scenar-v${prev.script_version}.md.` });
  await pm("pm_update_agent_run", { task: key, agent_run_status: "needs_review" });
  await finish({ task: key, version, words: v.words, warnings: v.warnings.length });
}
if (dry) writeJson(path.join(RUN_DIR, "dry-output-summary.json"), { mode, input });
