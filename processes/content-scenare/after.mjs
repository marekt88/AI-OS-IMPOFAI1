// Step B of the IMPOFAI content system (navrh.md §3): script JSON from claude -p → the SAME card on the board "Obsah"
// (Marek 2026-11-02: one card moves Nápad → Scenár → Video → …; until then a separate kanban task).
// mode "new":      validate → attachment <slug>_script-v1.json (the machine source of truth; PM MCP cuts long
//                  descriptions) + the original idea as <KEY>_napad.md → description = script + original idea,
//                  agent run needs_review (the card stays in Scenár; a person moves it to Video)
// mode "revision": validate → description v(N+1) + attachment <slug>_script-v(N+1).json (the previous version stays as
//                  its own attachment) → comment with the changes, agent run needs_review
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
const pm = (name, args) => pmTool(name, args, { tokenEnv });
const { date: today } = localParts();
const mode = input.mode === "revision" ? "revision" : "new";
if (!dry && !hasSecret(tokenEnv)) throw new Error(`${tokenEnv} chýba v ~/.aios-runner/secrets.env`);

const SKIP_TEXT = {
  expirovane: "Novinka expirovala, scenár nevznikol. Navrhujem presunúť kartu do Zrušené.",
  "format-nie-A": "Formát nápadu nie je A (grafické video), scenár nevznikol.",
  "chybaju-fakty": "Na scenár chýbajú overené fakty, scenár nevznikol.",
};
const DESC_MAX = 50000;
const scriptAttachment = (task, slug, version, script) =>
  pm("pm_upload_task_attachment", { task, file_name: `${slug}_script-v${version}.json`, mime_type: "application/json", content_text: JSON.stringify(script) });

/** The idea text without its machine block (the block stays in the <KEY>_napad.md attachment). */
const ideaForHumans = (d) => String(d ?? "").replace(/<!--[^]*?-->\s*/g, "").replace(/```json idea\n[^]*?\n```\s*/g, "").trim();
/** Card description: the script, then the original idea (attachment only, when both do not fit). */
function cardDescription(script, key, idea) {
  const full = idea ? `${script}\n\n---\n\n## Pôvodný nápad\n\n${ideaForHumans(idea)}` : script;
  return full.length <= DESC_MAX ? full : `${script}\n\n---\n\n## Pôvodný nápad\n\nV prílohe ${key}_napad.md.`;
}
/** The original idea of a card: attachment <KEY>_napad.md (null for cards from before 2026-11-02). */
async function readIdea(task) {
  const a = (task.attachments ?? []).find((x) => x.file_name === `${task.key}_napad.md`);
  if (!a) return null;
  return (await pm("pm_read_task_attachment", { attachment: a.id, max_chars: 100000 })).content ?? null;
}

async function createNew() {
  const key = input.idea;
  if (!key) throw new Error("input.idea chýba");
  const card = await pm("pm_get_task", { task: key });
  if (s.skip_reason) {
    await pm("pm_add_task_comment", { task: key, body: `**Scenár:** ${SKIP_TEXT[s.skip_reason]}${s.questions?.length ? `\n\n${s.questions.map((q) => `- ${q}`).join("\n")}` : ""}` });
    await pm("pm_update_agent_run", { task: key, agent_run_status: "failed" });
    return { idea: key, skipped: s.skip_reason };
  }
  const v = validateScript(s);
  if (v.errors.length) {
    await pm("pm_add_task_comment", { task: key, body: `**Scenár neprešiel kontrolou, nič sa nezapísalo:**\n${v.errors.map((e) => `- ${e}`).join("\n")}\n\nNapíš komentár a skúsi sa znova.` });
    await pm("pm_update_agent_run", { task: key, agent_run_status: "failed" });
    throw new Error(`validácia: ${v.errors.join("; ")}`);
  }
  s._words = v.words;
  const meta = { idea: key, version: 1, projectDate: today };
  let idea = await readIdea(card);
  if (!idea) {
    idea = String(card.description ?? "");
    await pm("pm_upload_task_attachment", { task: key, file_name: `${key}_napad.md`, mime_type: "text/markdown", content_text: idea || "(prázdny nápad)" });
  }
  const description = cardDescription(renderScript(s, { ...meta, warnings: v.warnings }), key, idea);
  if (dry) fs.writeFileSync(path.join(RUN_DIR, "dry-scenar.md"), description);
  await scriptAttachment(key, s.slug, 1, { script: machineScript(s, meta), popis: { ...s.popis, cta_type: s.cta_type, valid_until: s.valid_until } });
  await pm("pm_update_task", { task: key, name: String(card.name).replace(/^Nápad:\s*/, ""), description });
  await pm("pm_add_task_comment", { task: key, body: `**Scenár v1** je hotový (${v.words} slov, ${v.duration} s). Zmeny napíš do komentára, alebo presuň kartu do **Video** a spustí sa render.` });
  await pm("pm_update_agent_run", { task: key, agent_run_status: "needs_review" });
  return { idea: key, script: key, words: v.words, duration: v.duration, warnings: v.warnings.length };
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
  await pm("pm_update_task", { task: key, description: cardDescription(description, key, await readIdea(await pm("pm_get_task", { task: key }))) });
  await pm("pm_add_task_comment", { task: key, body: `**Scenár v${version}.** Zmeny: ${(s.changes ?? []).join("; ") || "—"}${s.questions?.length ? `\n\nOtázky:\n${s.questions.map((q) => `- ${q}`).join("\n")}` : ""}\n\nPredchádzajúca verzia ostáva v prílohe ${prev.slug}_script-v${prev.script_version}.json.` });
  await pm("pm_update_agent_run", { task: key, agent_run_status: "needs_review" });
  return { task: key, version, words: v.words, warnings: v.warnings.length };
}

try {
  console.log(JSON.stringify({ dry, mode, ...(mode === "new" ? await createNew() : await revise()) }));
} catch (err) {
  // a failed run must not stay "running", otherwise the pipeline waits for it
  const card = mode === "revision" ? input.task : input.idea;
  if (card) await pm("pm_update_agent_run", { task: card, agent_run_status: "failed" }).catch(() => {});
  throw err;
}
