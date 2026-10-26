// content-video, step 2: the silent preview → task attachment <KEY>_video-vN.mp4, stage → pripravene-na-audio.
// The stage is re-read first: when a human moved the task meanwhile, nothing is uploaded (E_STATE_CHANGED) and the
// file stays in the work folder. Failures: comment with the code, agent run failed, stage unchanged.
import fs from "node:fs";
import path from "node:path";
import { pmTool } from "../../runner/pm.mjs";
import { readJson, ROOT, writeJson } from "../_lib/zdroje.mjs";
import { nextVersion, uploadTaskFile } from "../_lib/upload.mjs";

const { output: o } = JSON.parse(fs.readFileSync(process.env.RUN_OUTPUT, "utf8"));
const input = fs.existsSync(process.env.RUN_INPUT ?? "") ? JSON.parse(fs.readFileSync(process.env.RUN_INPUT, "utf8")) : {};
const key = input.task;
const pm = (n, a) => pmTool(n, a, { tokenEnv: "CONTENT_PM_TOKEN" });
const stateFile = path.join(ROOT, "state", "pipeline", `${key}.json`);

const t = await pm("pm_get_task", { task: key });
const labels = (t.labels ?? []).map((l) => l.name);
const expected = input.mode === "revision" ? "pripravene-na-audio" : "schvalene-na-video";
if (!labels.includes(expected) || t.status === "cancelled") {
  await pm("pm_add_task_comment", { task: key, body: `**E_STATE_CHANGED:** počas renderu sa etapa zmenila, video som nenahral. Súbor ostáva na serveri: ${o.video_file ?? "—"}. Napíš „použi video“, ak ho chceš.` });
  process.exit(0);
}
if (!o.ok || !o.video_file || !fs.existsSync(o.video_file)) {
  await pm("pm_add_task_comment", { task: key, body: `**${o.error_code ?? "E_VIDEO"}:** video sa nepodarilo vyrobiť. ${o.notes_sk}\n\nPo oprave napíš „skús znova“ alebo prepni etapu znova.` });
  await pm("pm_update_agent_run", { task: key, agent_run_status: "failed" });
  process.exit(1);
}
const n = nextVersion(t.attachments, key, "video");
const name = `${key}_video-v${n}.mp4`;
const up = await uploadTaskFile(key, o.video_file, { name });
if (input.mode !== "revision") {
  await pm("pm_add_task_label", { task: key, label: "pripravene-na-audio" });
  await pm("pm_remove_task_label", { task: key, label: "schvalene-na-video" });
}
await pm("pm_update_task_status", { task: key, status: "in_review" });
await pm("pm_update_agent_run", { task: key, agent_run_status: "needs_review" });
await pm("pm_add_task_comment", {
  task: key,
  body: `**Video v${n}** (tichý náhľad, ${o.duration_s ?? "?"} s): ${name}.\n\n${o.notes_sk}\n\nZmeny napíš sem, alebo prepni etapu na **schvalene-na-audio** a spustí sa ozvučenie (ElevenLabs).`,
  ...(up.id ? { attachment_ids: [up.id] } : {}),
});
// the poller must see the automatic stage change as its own
const st = readJson(stateFile, null);
if (st && process.env.RUN_DRY !== "1") writeJson(stateFile, { ...st, stage: "pripravene-na-audio", job: { ...(st.job ?? {}), done: new Date().toISOString() } });
console.log(JSON.stringify({ task: key, uploaded: name, version: n }));
