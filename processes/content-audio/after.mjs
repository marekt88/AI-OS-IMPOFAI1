// content-audio, step 2: final video + cover + popis + manifest → task attachments (in this order; the version is
// valid only with its manifest <KEY>_result-vN.json). Stage stays schvalene-na-audio, agent run → needs_review;
// the human then switches to ready-for-posting (FINALIZE in content-pipeline sets previewUrl).
import fs from "node:fs";
import path from "node:path";
import { pmTool } from "../../runner/pm.mjs";
import { readJson, ROOT, writeJson } from "../_lib/zdroje.mjs";
import { nextVersion, uploadTaskFile } from "../_lib/upload.mjs";

const { output: o } = JSON.parse(fs.readFileSync(process.env.RUN_OUTPUT, "utf8"));
const input = fs.existsSync(process.env.RUN_INPUT ?? "") ? JSON.parse(fs.readFileSync(process.env.RUN_INPUT, "utf8")) : {};
const key = input.task;
const pm = (n, a) => pmTool(n, a, { tokenEnv: "CONTENT_PM_TOKEN" });

const t = await pm("pm_get_task", { task: key });
if (!(t.labels ?? []).some((l) => l.name === "schvalene-na-audio") || t.status === "cancelled") {
  await pm("pm_add_task_comment", { task: key, body: `**E_STATE_CHANGED:** počas ozvučenia sa etapa zmenila, nič som nenahral. Súbory ostávajú na serveri: ${o.final_file ?? "—"}.` });
  process.exit(0);
}
if (!o.ok || !o.final_file || !fs.existsSync(o.final_file)) {
  await pm("pm_add_task_comment", { task: key, body: `**${o.error_code ?? "E_AUDIO"}:** finálne video sa nepodarilo vyrobiť. ${o.notes_sk}${o.tts_characters_sent ? `\n\nElevenLabs: odoslaných ${o.tts_characters_sent} znakov (cache sa pri ďalšom pokuse použije).` : ""}` });
  await pm("pm_update_agent_run", { task: key, agent_run_status: "failed" });
  process.exit(1);
}
const problems = [];
if (!(o.duration_s >= 3 && o.duration_s <= 90)) problems.push(`dĺžka ${o.duration_s} s mimo 3–90 s`);
if (o.width !== 1080 || o.height !== 1920) problems.push(`rozlíšenie ${o.width}×${o.height}`);
if (!/h264|avc/i.test(o.video_codec ?? "")) problems.push(`video kodek ${o.video_codec}`);
if (!/aac/i.test(o.audio_codec ?? "")) problems.push(`audio kodek ${o.audio_codec}`);

const n = nextVersion(t.attachments, key, "final");
const up = {};
up.final = await uploadTaskFile(key, o.final_file, { name: `${key}_final-v${n}.mp4` });
if (o.cover_file && fs.existsSync(o.cover_file)) up.cover = await uploadTaskFile(key, o.cover_file, { name: `${key}_cover-v${n}.jpg` });
if (o.popis_file && fs.existsSync(o.popis_file)) up.popis = await uploadTaskFile(key, o.popis_file, { name: `${key}_popis-v${n}.json` });
const manifest = {
  finalAttachmentId: up.final.id ?? null, finalFileName: `${key}_final-v${n}.mp4`, coverAttachmentId: up.cover?.id ?? null, popisAttachmentId: up.popis?.id ?? null,
  thumbOffsetMs: 0, durationSec: o.duration_s, width: o.width, height: o.height, fps: o.fps, videoCodec: o.video_codec, audioCodec: o.audio_codec,
  lufs: o.lufs, truePeak: o.true_peak, sizeBytes: o.size_bytes, ttsCharacters: o.tts_characters_sent, ttsCacheHits: o.tts_cache_hits,
  masterPath: o.final_file, problems, createdAt: new Date().toISOString(),
};
const mf = path.join(process.env.RUN_DIR, `${key}_result-v${n}.json`);
writeJson(mf, manifest);
await uploadTaskFile(key, mf, { name: `${key}_result-v${n}.json` });
await pm("pm_update_task_status", { task: key, status: "in_review" });
await pm("pm_update_agent_run", { task: key, agent_run_status: problems.length ? "failed" : "needs_review" });
await pm("pm_add_task_comment", {
  task: key,
  body: `**Finálne video v${n}** (${o.duration_s} s, ${(o.size_bytes / 1048576).toFixed(1)} MB, ${o.lufs} LUFS): ${key}_final-v${n}.mp4 + cover + popis.\nElevenLabs: odoslaných ${o.tts_characters_sent} znakov, z cache ${o.tts_cache_hits} take.\n\n${o.notes_sk}${problems.length ? `\n\n**Kontrola neprešla:** ${problems.join("; ")}` : "\n\nZmeny napíš sem, alebo prepni etapu na **ready-for-posting**."}`,
  ...(up.final.id ? { attachment_ids: [up.final.id] } : {}),
});
const sf = path.join(ROOT, "state", "pipeline", `${key}.json`);
const st = readJson(sf, null);
if (st && process.env.RUN_DRY !== "1") writeJson(sf, { ...st, job: { ...(st.job ?? {}), done: new Date().toISOString() } });
console.log(JSON.stringify({ task: key, version: n, problems }));
