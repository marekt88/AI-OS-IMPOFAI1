// Step B of the IMPOFAI content system (navrh.md §3): script JSON from claude -p → kanban task (stage navrhnute).
// mode "new":      validate → task in the kanban list (in_review + label navrhnute) + attachment <slug>_script-v1.json
//                  (the machine source of truth; PM MCP cuts long descriptions) → the script waits for the idea
//                  (dependency), comment on the idea, idea complete + scenar-hotovy
// mode "revision": validate → description v(N+1) + attachment <slug>_script-v(N+1).json (the previous version stays as
//                  its own attachment) → comment with the changes, agent run needs_review (stage and status stay)
// A script that fails validation is never written: a comment explains why, the agent run is failed and the run fails.
// RUN_DRY=1: pmTool does not send writes; the rendered description is saved in RUN_DIR.
import fs from "node:fs";
import path from "node:path";
import { hasSecret, pmTool } from "../../runner/pm.mjs";
import { isDry, localParts, readJson, ROOT } from "../_lib/zdroje.mjs";
import { loadScript, machineScript, renderScript, validateScript } from "../_lib/scenar.mjs";

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
const scriptAttachment = (task, slug, version, script) =>
  pm("pm_upload_task_attachment", { task, file_name: `${slug}_script-v${version}.json`, mime_type: "application/json", content_text: JSON.stringify(script) });

async function createNew() {
  const idea = input.idea;
  if (!idea) throw new Error("input.idea chýba");
  if (s.skip_reason) {
    await pm("pm_add_task_comment", { task: idea, body: `**Scenár (krok B):** ${SKIP_TEXT[s.skip_reason]}${s.questions?.length ? `\n\n${s.questions.map((q) => `- ${q}`).join("\n")}` : ""}` });
    await pm("pm_remove_task_label", { task: idea, label: "scenar-bezi" });
    return { idea, skipped: s.skip_reason };
  }
  const v = validateScript(s);
  if (v.errors.length) {
    await pm("pm_add_task_comment", { task: idea, body: `**Scenár (krok B) neprešiel kontrolou, nič sa nezapísalo:**\n${v.errors.map((e) => `- ${e}`).join("\n")}` });
    await pm("pm_remove_task_label", { task: idea, label: "scenar-bezi" });
    throw new Error(`validácia: ${v.errors.join("; ")}`);
  }
  s._words = v.words;
  const meta = { idea, version: 1, projectDate: today };
  const description = renderScript(s, { ...meta, warnings: v.warnings });
  if (dry) fs.writeFileSync(path.join(RUN_DIR, "dry-scenar.md"), description);
  const task = await pm("pm_create_task", { task_list: kanban, name: `Scenár: ${s.name}`, status: "in_review", labels: ["navrhnute"], description });
  const key = task.key ?? "(dry-run)";
  if (task.key) {
    await scriptAttachment(task.key, s.slug, 1, { script: machineScript(s, meta), popis: { ...s.popis, cta_type: s.cta_type, valid_until: s.valid_until } });
    await pm("pm_add_task_dependency", { task: task.key, depends_on: idea });
  }
  await pm("pm_add_task_comment", { task: idea, body: `**Scenár:** ${key} (v1) v kanbane ${kanban}, etapa navrhnuté. Zmeny scenára píš do komentára v ňom.` });
  await pm("pm_add_task_label", { task: idea, label: "scenar-hotovy" });
  await pm("pm_remove_task_label", { task: idea, label: "scenar-bezi" });
  await pm("pm_update_task_status", { task: idea, status: "complete" });
  return { idea, script: key, words: v.words, duration: v.duration, warnings: v.warnings.length };
}

async function revise() {
  const key = input.task;
  if (!key) throw new Error("input.task chýba");
  const { script: prev } = await loadScript(pm, key);
  if (!prev) throw new Error(`${key}: scenár sa nedá načítať (chýba príloha *_script-vN.json aj blok json script)`);
  const v = validateScript(s);
  if (v.errors.length) {
    await pm("pm_add_task_comment", { task: key, body: `**Revízia scenára neprešla kontrolou, scenár ostáva v${prev.script_version}:**\n${v.errors.map((e) => `- ${e}`).join("\n")}` });
    throw new Error(`validácia: ${v.errors.join("; ")}`);
  }
  s._words = v.words;
  s.slug = prev.slug; // slug and project date never change between versions
  const version = prev.script_version + 1;
  const meta = { idea: prev.idea, version, projectDate: prev.project_date };
  const description = renderScript(s, { ...meta, changes: s.changes ?? [], warnings: v.warnings });
  if (dry) fs.writeFileSync(path.join(RUN_DIR, "dry-scenar.md"), description);
  await scriptAttachment(key, prev.slug, version, { script: machineScript(s, meta), popis: { ...s.popis, cta_type: s.cta_type, valid_until: s.valid_until } });
  await pm("pm_update_task", { task: key, description });
  await pm("pm_add_task_comment", { task: key, body: `**Scenár v${version}.** Zmeny: ${(s.changes ?? []).join("; ") || "—"}${s.questions?.length ? `\n\nOtázky:\n${s.questions.map((q) => `- ${q}`).join("\n")}` : ""}\n\nPredchádzajúca verzia ostáva v prílohe ${prev.slug}_script-v${prev.script_version}.json.` });
  await pm("pm_update_agent_run", { task: key, agent_run_status: "needs_review" });
  return { task: key, version, words: v.words, warnings: v.warnings.length };
}

try {
  console.log(JSON.stringify({ dry, mode, ...(mode === "new" ? await createNew() : await revise()) }));
} catch (err) {
  // a failed revision must not stay "running", otherwise the pipeline waits for it
  if (mode === "revision" && input.task) await pm("pm_update_agent_run", { task: input.task, agent_run_status: "failed" }).catch(() => {});
  throw err;
}
