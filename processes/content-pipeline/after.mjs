// content-pipeline: the production poller of the IMPOFAI content system (navrh.md §1, §4). No claude -p.
// Every 5 min it reads the kanban list (config kanban_list), and per task with a stage label:
//   - stage transitions (label changed by a human): VIDEO_JOB, AUDIO_JOB, FINALIZE, RETURN, invalid jumps (E_STAGE)
//   - new human comments: SCRIPT_REVISION (navrhnute), VIDEO_REVISION, AUDIO_REVISION, one reply in ready-for-posting
// Heavy jobs run as separate runner processes (content-scenare, content-video, content-audio) started with
// spawnProcess; they wait in agent run "queued" until their process exists and is enabled, the tools are installed
// (ffmpeg with libx264) and disk/RAM are above the thresholds. Every blocker is commented once, not every tick.
// State: /home/marek/impofai-content/state/pipeline/<KEY>.json. All writes go through CONTENT_PM_TOKEN as agent
// "Socials", so the poller never mistakes its own comments for a human's.
// RUN_DRY=1: reads only, decisions are printed, nothing is written or spawned.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasSecret, pmTool } from "../../runner/pm.mjs";
import { spawnProcess } from "../../runner/spawn.mjs";
import { isDry, readJson, ROOT, writeJson } from "../_lib/zdroje.mjs";
import { commentJob, humanComments, resourceGate, stageOf, STAGES, transition } from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const dry = isDry();
const nowIso = new Date().toISOString();
const cfg = readJson(path.join(ROOT, "config", "content.json"), {});
const tokenEnv = cfg.token_env || "CONTENT_PM_TOKEN";
const STATE_DIR = path.join(ROOT, "state", "pipeline");
const JOB_STALE_MIN = 90; // a job without news for this long is considered dead and may be started again
if (!hasSecret(tokenEnv)) throw new Error(`${tokenEnv} chýba v ~/.aios-runner/secrets.env`);

const log = [];
const pm = (name, args) => pmTool(name, args, { tokenEnv });
const me = (await pm("pm_get_current_identity", {})).token?.name ?? "Socials";

// ---------- environment checks ----------
function processReady(name) {
  const f = path.join(HERE, "..", name, "process.json");
  if (!fs.existsSync(f)) return { ok: false, why: `proces ${name} ešte neexistuje` };
  return JSON.parse(fs.readFileSync(f, "utf8")).enabled === false ? { ok: false, why: `proces ${name} je vypnutý` } : { ok: true };
}
function ffmpegReady() {
  for (const bin of [path.join(os.homedir(), ".local/bin/ffmpeg"), "/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg"]) {
    if (!fs.existsSync(bin)) continue;
    try {
      const enc = execFileSync(bin, ["-hide_banner", "-encoders"], { encoding: "utf8", timeout: 20_000 });
      if (/\blibx264\b/.test(enc) && /\baac\b/.test(enc)) return { ok: true, bin };
      return { ok: false, why: `${bin} nevie H.264/AAC` };
    } catch {}
  }
  return { ok: false, why: "ffmpeg s H.264 (libx264) nie je nainštalovaný" };
}
function resources() {
  const st = fs.statfsSync("/");
  const mem = Object.fromEntries(fs.readFileSync("/proc/meminfo", "utf8").split("\n").filter(Boolean).map((l) => [l.split(":")[0], Number(l.split(/\s+/)[1])]));
  return resourceGate({ diskFreeGb: (st.bavail * st.bsize) / 1e9, memAvailableMb: Math.round(mem.MemAvailable / 1024), swapFreeMb: Math.round(mem.SwapFree / 1024) });
}
function gate(job) {
  const proc = { VIDEO_JOB: "content-video", VIDEO_REVISION: "content-video", AUDIO_JOB: "content-audio", AUDIO_REVISION: "content-audio" }[job];
  const checks = [processReady(proc)];
  checks.push(ffmpegReady());
  const failed = checks.find((c) => !c.ok);
  if (failed) return { ok: false, code: "E_TOOL", why: failed.why };
  const r = resources();
  return r.ok ? { ok: true, proc } : r;
}

// ---------- helpers ----------
const stateFile = (key) => path.join(STATE_DIR, `${key}.json`);
async function comment(task, st, sig, body) {
  if (st.notified?.[sig]) return; // the same blocker is commented once
  log.push(`${task}: comment ${sig}`);
  if (!dry) await pm("pm_add_task_comment", { task, body });
  (st.notified ??= {})[sig] = nowIso;
}
async function agentRun(task, status) {
  if (!dry) await pm("pm_update_agent_run", { task, agent_run_status: status });
}
function jobBusy(st) {
  return st.job && Date.now() - Date.parse(st.job.started_at) < JOB_STALE_MIN * 60_000 && !st.job.done;
}
function start(task, st, job, input) {
  const proc = job === "SCRIPT_REVISION" ? "content-scenare" : gate(job).proc;
  log.push(`${task}: spawn ${proc} (${job})`);
  if (!dry) spawnProcess(proc, input, { label: `${job.toLowerCase()}-${task}` });
  st.job = { kind: job, started_at: nowIso, input_comment_ids: input.comments?.map((c) => c.id) ?? [] };
}

/** FINALIZE (no LLM): the newest <KEY>_result-vN.json must point at an existing <KEY>_final-vN.mp4 without problems. */
async function finalize(key) {
  const t = await pm("pm_get_task", { task: key });
  const att = t.attachments ?? [];
  const results = att.map((a) => ({ a, n: Number(a.file_name.match(new RegExp(`^${key}_result-v(\\d+)\\.json$`))?.[1] ?? 0) })).filter((x) => x.n).sort((x, y) => y.n - x.n);
  if (!results.length) return { ok: false, why: "chýba manifest <KEY>_result-vN.json (ozvučenie neprebehlo)." };
  const { a, n } = results[0];
  const r = await pm("pm_read_task_attachment", { attachment: a.id, max_chars: 20000 });
  let m;
  try {
    m = JSON.parse(r.content);
  } catch {
    return { ok: false, why: `manifest ${a.file_name} sa nedá prečítať.` };
  }
  const final = att.find((x) => x.id === m.finalAttachmentId);
  if (!final || final.file_name !== `${key}_final-v${n}.mp4`) return { ok: false, why: `manifest v${n} neukazuje na prílohu ${key}_final-v${n}.mp4.` };
  if (m.problems?.length) return { ok: false, why: `finál v${n} neprešiel kontrolou: ${m.problems.join("; ")}.` };
  if (!(m.durationSec >= 3 && m.durationSec <= 90) || final.size_bytes > 25 * 1024 * 1024) return { ok: false, why: `finál v${n}: dĺžka ${m.durationSec} s alebo veľkosť mimo limitov.` };
  return { ok: true, id: final.id, name: final.file_name, duration: m.durationSec, url: `https://project-managment.impofai.com/api/v1/attachments/${final.id}/download` };
}

// ---------- main ----------
const list = await pm("pm_list_tasks", { task_list: cfg.kanban_list, status: ["to_do", "in_progress", "in_review"], label: STAGES, limit: 100 });
for (const t of list.items ?? []) {
  const key = t.key;
  const st = readJson(stateFile(key), { key, stage: null, cursor: null, notified: {}, job: null });
  const s = stageOf(t.labels);
  if (s.error) {
    await comment(key, st, `E_STAGE:${s.error}`, `**E_STAGE:** ${s.error}. Nechaj na úlohe práve jeden etapový label (navrhnute → schvalene-na-video → pripravene-na-audio → schvalene-na-audio → ready-for-posting).`);
    if (!dry) writeJson(stateFile(key), st);
    continue;
  }
  const cur = s.stage;

  // finished jobs: the job process sets the agent run itself (needs_review / failed)
  if (st.job && !st.job.done && ["needs_review", "failed", null].includes(t.agent_run_status) && Date.now() - Date.parse(st.job.started_at) > 60_000) st.job.done = nowIso;

  // comments (cursor first, so a first-seen task does not react to its history)
  const act = await pm("pm_list_task_activity", { task: key, kind: "comments", order: "asc", limit: 100 });
  const items = act.items ?? [];
  const lastId = items.length ? items[items.length - 1].id : null;
  if (st.cursor === null) st.cursor = lastId ?? "start";
  const fresh = humanComments(items, { ownAgentNames: [me], afterId: st.cursor === "start" ? null : st.cursor });

  // 1. stage transition
  const tr = transition(st.stage, cur);
  if (tr.kind === "invalid") {
    await comment(key, st, `E_STAGE:${st.stage}->${cur}`, `**E_STAGE:** prechod ${st.stage} → ${cur} nie je povolený (etapy idú po jednej). Vráť label na ${st.stage} alebo nasledujúcu etapu.`);
  } else if (tr.kind === "return") {
    log.push(`${key}: RETURN ${st.stage} -> ${cur}`);
    if (!dry) {
      await pm("pm_update_agent_run", { task: key, preview_url: null, agent_run_status: cur === "navrhnute" ? null : "needs_review" });
      await pm("pm_add_task_comment", { task: key, body: `Vrátené z etapy ${st.stage} na ${cur}.${st.stage === "ready-for-posting" ? " Publikovanie musí zrušiť naplánované posty." : ""} Ďalší krok: komentár so zmenami alebo nové schválenie.` });
    }
    st.stage = cur;
    st.job = null;
  } else if (tr.kind === "job") {
    if (tr.job === "FINALIZE") {
      const f = await finalize(key);
      log.push(`${key}: FINALIZE ${f.ok ? f.name : f.why}`);
      if (!dry) {
        if (f.ok) {
          await pm("pm_update_agent_run", { task: key, preview_url: f.url, agent_run_status: null });
          await pm("pm_add_task_comment", { task: key, body: `**Finál:** ${f.name} (príloha ${f.id}, ${f.duration} s). Úloha je pripravená na publikovanie.` });
        } else {
          await pm("pm_update_agent_run", { task: key, preview_url: null, agent_run_status: "failed" });
          await pm("pm_add_task_comment", { task: key, body: `**E_FINAL:** ${f.why} Publikovanie úlohu nevezme. Vráť etapu na schvalene-na-audio.` });
        }
      }
      st.stage = cur;
    } else {
      const g = gate(tr.job);
      if (!g.ok) {
        await comment(key, st, `${tr.job}:${g.code}:${g.why}`, `**${tr.job} čaká (${g.code}):** ${g.why}. Spustí sa samo, keď to bude vyriešené.`);
        await agentRun(key, "queued");
        st.pending = tr.job; // stage stays the previous one until the job really starts
      } else if (!jobBusy(st)) {
        start(key, st, tr.job, { mode: "new", task: key, stage: cur });
        await agentRun(key, "running");
        st.stage = cur;
        st.pending = null;
      }
    }
  } else if (tr.kind === "first") {
    st.stage = cur;
  }

  // 2. human comments (only when no transition consumed this tick)
  if (fresh.length && tr.kind !== "job" && tr.kind !== "return") {
    const job = commentJob(cur, t.agent_run_status);
    const payload = fresh.map((c) => ({ id: c.id, author: c.author?.name ?? c.agent_name ?? "?", at: c.created_at, body: c.body }));
    if (job === "REPLY") {
      if (!dry) await pm("pm_add_task_comment", { task: key, body: "Úloha je v etape ready for posting, tu sa už nič nemení. Na úpravu vráť etapu na schvalene-na-audio, pripravene-na-audio alebo navrhnute a napíš zmenu znova." });
      st.cursor = fresh[fresh.length - 1].id;
    } else if (job === "SCRIPT_REVISION") {
      if (!jobBusy(st)) {
        start(key, st, job, { mode: "revision", task: key, comments: payload });
        await agentRun(key, "running");
        st.cursor = fresh[fresh.length - 1].id; // comments written during the run start exactly one more revision
      }
    } else if (job) {
      const g = gate(job);
      if (!g.ok) await comment(key, st, `${job}:${g.code}:${g.why}`, `**${job} čaká (${g.code}):** ${g.why}. Tvoje zmeny si pamätám a spustím ich, keď to bude vyriešené.`);
      else if (!jobBusy(st)) {
        start(key, st, job, { mode: "revision", task: key, stage: cur, comments: payload });
        await agentRun(key, "running");
        st.cursor = fresh[fresh.length - 1].id;
      }
    } else {
      st.cursor = fresh[fresh.length - 1].id;
    }
  }

  // 3. a queued job whose blocker is gone
  if (st.pending && !jobBusy(st)) {
    const g = gate(st.pending);
    if (g.ok) {
      start(key, st, st.pending, { mode: "new", task: key, stage: cur });
      await agentRun(key, "running");
      st.stage = cur;
      st.pending = null;
    }
  }
  st.updated_at = nowIso;
  if (!dry) writeJson(stateFile(key), st);
}
console.log(JSON.stringify({ dry, tasks: list.items?.length ?? 0, log }));
