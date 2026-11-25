// content-pipeline: the production poller of the IMPOFAI content system (navrh.md §1, §4). No claude -p.
// Every 5 min it reads the board "Obsah" (config kanban_list) whose custom statuses are the stages
// Nápad → Video → Ozvučenie → Hotové (Marek 2026-11-23: Nápad and Scenár merged, the idea carries its script). Per task:
//   - Nápad with agent run "queued" and no script (queued by content-napady): SCRIPT_NEW, one script at a time
//   - a person moved the card one column forward: VIDEO_JOB (Video, needs the script), AUDIO_JOB (Ozvučenie),
//     FINALIZE (Hotové: checks the final, sets previewUrl and the label ready-for-posting that Socials publishes);
//     back = RETURN (no job); a jump over columns is moved back with a comment (E_STAGE)
//   - new human comments: SCRIPT_NEW / SCRIPT_REVISION (Nápad), VIDEO_REVISION, AUDIO_REVISION, one reply in Hotové
// Jobs run as separate runner processes (content-scenare, content-video, content-audio) started with spawnProcess;
// heavy ones wait in agent run "queued" until their process is enabled, ffmpeg with libx264 is installed and
// disk/RAM are above the thresholds. Every blocker is commented once, not every tick.
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
import { artifacts, commentJob, humanComments, LEGACY_STAGE, resourceGate, stageOf, STAGES, transition } from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const dry = isDry();
const nowIso = new Date().toISOString();
const cfg = readJson(path.join(ROOT, "config", "content.json"), {});
const tokenEnv = cfg.token_env || "CONTENT_PM_TOKEN";
const STATE_DIR = path.join(ROOT, "state", "pipeline");
const JOB_STALE_MIN = 150; // a job without news for this long is considered dead (video timeout is 90 min)
const HEAVY = new Set(["VIDEO_JOB", "VIDEO_REVISION", "AUDIO_JOB", "AUDIO_REVISION"]);
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
  // one heavy job at a time on the whole server (render + Chrome in Docker); the others wait in the queue
  const other = heavyRunning();
  if (other) return { ok: false, code: "E_BUSY", why: `beží iný ťažký job (${other}), toto video je v poradí` };
  const r = resources();
  return r.ok ? { ok: true, proc } : r;
}
function runningOf(kinds) {
  if (!fs.existsSync(STATE_DIR)) return null;
  for (const f of fs.readdirSync(STATE_DIR)) {
    const st = readJson(path.join(STATE_DIR, f), null);
    if (st?.job && kinds.has(st.job.kind) && !st.job.done && Date.now() - Date.parse(st.job.started_at) < JOB_STALE_MIN * 60_000) return st.key;
  }
  return null;
}
const heavyRunning = () => runningOf(HEAVY);

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
const READY_LABEL = "ready-for-posting"; // Socials contract: IN_REVIEW (= Hotové) + this label
const SCRIPT_JOBS = new Set(["SCRIPT_NEW", "SCRIPT_REVISION"]);
const SCRIPT_NEW_PER_TICK = 3; // scripts a person asked for (comment)
let scriptNewStarted = 0;
let autoScriptStarted = false; // queued scripts of new ideas: one at a time (process lock waits max 30 min)
async function moveTo(task, stage) {
  log.push(`${task}: -> ${stage}`);
  if (!dry) await pm("pm_update_task_status", { task, custom_status: stage });
}
function start(task, st, job, input) {
  const proc = SCRIPT_JOBS.has(job) ? "content-scenare" : gate(job).proc;
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
  return { ok: true, id: final.id, name: final.file_name, duration: m.durationSec, url: `https://kapsa.impofai.com/api/v1/attachments/${final.id}/download` };
}

// ---------- main ----------
const tasks = [];
for (let offset = 0; ; ) {
  const page = await pm("pm_list_tasks", { task_list: cfg.kanban_list, custom_status: STAGES, limit: 100, offset });
  tasks.push(...(page.items ?? []));
  if (!page.has_more || !page.next_offset) break;
  offset = page.next_offset;
}
for (const t of tasks) {
  const key = t.key;
  const cur = stageOf(t);
  if (!cur) continue;
  const st = readJson(stateFile(key), { key, stage: null, cursor: null, notified: {}, job: null });
  if (st.stage && LEGACY_STAGE[st.stage]) st.stage = LEGACY_STAGE[st.stage]; // Scenár merged into Nápad (2026-11-23)
  if (st.stage && !STAGES.includes(st.stage)) st.stage = null; // state from the label era (before 2026-11-02) = first seen

  // finished jobs: the job process sets the agent run itself (needs_review / failed)
  if (st.job && !st.job.done && ["needs_review", "failed", null].includes(t.agent_run_status) && Date.now() - Date.parse(st.job.started_at) > 60_000) st.job.done = nowIso;

  // comments (cursor first, so a first-seen task does not react to its history)
  const act = await pm("pm_list_task_activity", { task: key, kind: "comments", order: "asc", limit: 100 });
  const items = act.items ?? [];
  const lastId = items.length ? items[items.length - 1].id : null;
  if (st.cursor === null) st.cursor = lastId ?? "start";
  const fresh = humanComments(items, { ownAgentNames: [me], afterId: st.cursor === "start" ? null : st.cursor });

  // attachments only when needed (an idea in Nápad without news is skipped cheaply; ~50 ideas every 5 min)
  const quiet = cur === "Nápad" && st.stage === "Nápad" && !fresh.length && t.agent_run_status !== "queued" && !(st.job && !st.job.done);
  if (quiet) {
    st.updated_at = nowIso;
    if (!dry) writeJson(stateFile(key), st);
    continue;
  }
  const full = await pm("pm_get_task", { task: key });
  const has = artifacts(full.attachments);

  // 1. stage transition
  const tr = transition(st.stage, cur, has);
  if (tr.kind === "no_script") {
    const writing = t.agent_run_status === "running" || t.agent_run_status === "queued";
    await comment(key, st, `E_SCRIPT:${nowIso.slice(0, 13)}`, writing
      ? "**Scenár sa ešte píše.** Karta je späť v Nápade, presuň ju do Video, keď bude scenár hotový."
      : "**Chýba scenár.** Karta je späť v Nápade. Napíš do karty komentár (napr. „scenár“) a scenár sa napíše; potom ju presuň do Video.");
    await moveTo(key, "Nápad");
  } else if (tr.kind === "invalid") {
    await comment(key, st, `E_STAGE:${st.stage}->${cur}`, `**E_STAGE:** z ${st.stage} rovno do ${cur} sa nedá, etapy idú po jednej. Karta je späť v ${st.stage}.`);
    await moveTo(key, st.stage);
  } else if (tr.kind === "return") {
    log.push(`${key}: RETURN ${st.stage} -> ${cur}`);
    if (!dry) {
      await pm("pm_update_agent_run", { task: key, preview_url: null, agent_run_status: cur === "Nápad" ? null : "needs_review" });
      if (st.stage === "Hotové") await pm("pm_remove_task_label", { task: key, label: READY_LABEL }); // Socials cancels unpublished posts
      await pm("pm_add_task_comment", { task: key, body: `Vrátené z ${st.stage} do ${cur}.${st.stage === "Hotové" ? " Nepublikované posty sa zrušia." : ""} Ďalší krok: komentár so zmenami alebo posun ďalej.` });
    }
    st.stage = cur;
    st.job = null;
    st.pending = null;
  } else if (tr.kind === "job") {
    if (tr.job === "FINALIZE") {
      const f = await finalize(key);
      log.push(`${key}: FINALIZE ${f.ok ? f.name : f.why}`);
      if (f.ok) {
        if (!dry) {
          await pm("pm_update_agent_run", { task: key, preview_url: f.url, agent_run_status: null });
          await pm("pm_add_task_label", { task: key, label: READY_LABEL });
          await pm("pm_add_task_comment", { task: key, body: `**Finál:** ${f.name} (príloha ${f.id}, ${f.duration} s). Na publikovanie presuň kartu do **Naplánované**: Socials ju zaradí do najbližšieho voľného slotu (8:00, 12:00, 20:00) a pošle cez Postiz.` });
        }
        st.stage = cur;
      } else {
        if (!dry) await pm("pm_add_task_comment", { task: key, body: `**E_FINAL:** ${f.why} Karta je späť v Ozvučení.` });
        await moveTo(key, "Ozvučenie");
        st.stage = "Ozvučenie";
      }
    } else {
      const g = gate(tr.job);
      if (!g.ok) {
        await comment(key, st, `${tr.job}:${g.code}:${g.why}`, `**${tr.job} čaká (${g.code}):** ${g.why}. Spustí sa samo, keď to bude vyriešené.`);
        await agentRun(key, "queued");
        st.pending = tr.job;
        st.stage = cur;
      } else if (!jobBusy(st)) {
        start(key, st, tr.job, { mode: "new", task: key, stage: cur });
        await agentRun(key, "running");
        st.stage = cur;
        st.pending = null;
      }
    }
  } else if (tr.kind === "script_then_video") {
    // entered Video from outside the pipeline without a script: write it from the card, then the video (section 3)
    if (!dry) await pm("pm_add_task_comment", { task: key, body: "**Karta prišla do Video bez scenára.** Najprv z nej napíšem scenár, video sa spustí hneď po ňom." });
    log.push(`${key}: script then video`);
    start(key, st, "SCRIPT_NEW", { mode: "new", idea: key, picked: true });
    await agentRun(key, "running");
    st.stage = cur;
    st.pending = "VIDEO_JOB";
  } else if (tr.kind === "first") {
    st.stage = cur;
  }

  // 2. human comments (only when no transition consumed this tick)
  if (fresh.length && ["none", "first"].includes(tr.kind) && !st.pending) {
    const job = commentJob(cur, t.agent_run_status, has);
    const payload = fresh.map((c) => ({ id: c.id, author: c.author?.name ?? c.agent_name ?? "?", at: c.created_at, body: c.body }));
    if (job === "REPLY") {
      if (!dry) await pm("pm_add_task_comment", { task: key, body: "Karta je v Hotové, video sa tu už nemení. Na publikovanie ju presuň do Naplánované; na úpravu späť (Ozvučenie, Video alebo Nápad pre scenár) a napíš zmenu znova." });
      st.cursor = fresh[fresh.length - 1].id;
    } else if (job === "SCRIPT_NEW" || job === "SCRIPT_REVISION") {
      if (!jobBusy(st) && (job === "SCRIPT_REVISION" || scriptNewStarted++ < SCRIPT_NEW_PER_TICK)) {
        start(key, st, job, job === "SCRIPT_NEW" ? { mode: "new", idea: key, picked: true, comments: payload } : { mode: "revision", task: key, comments: payload });
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
    }
  }

  // 2b. a new idea queued by content-napady gets its script (one at a time, video and audio never start by themselves)
  if (cur === "Nápad" && t.agent_run_status === "queued" && !has.script && !jobBusy(st) && !autoScriptStarted) {
    const other = runningOf(SCRIPT_JOBS);
    if (other) log.push(`${key}: script waits (${other})`);
    else {
      start(key, st, "SCRIPT_NEW", { mode: "new", idea: key, picked: true });
      await agentRun(key, "running");
      autoScriptStarted = true;
    }
  }

  // 3. a queued heavy job whose blocker is gone (a video waiting for its script needs the script first)
  if (st.pending === "VIDEO_JOB" && !has.script && !jobBusy(st)) {
    const fresh2 = artifacts((await pm("pm_get_task", { task: key })).attachments);
    if (fresh2.script) has.script = true;
    else if (st.job?.done && SCRIPT_JOBS.has(st.job.kind)) {
      await comment(key, st, `E_SCRIPT:${nowIso.slice(0, 13)}`, "**Scenár sa nepodarilo napísať**, video sa nespustilo. Karta je späť v Nápade: napíš do nej komentár so zadaním a scenár sa napíše znova, potom ju presuň do Video.");
      await moveTo(key, "Nápad");
      st.stage = "Nápad";
      st.pending = null;
    }
  }
  if (st.pending && !jobBusy(st) && (st.pending !== "VIDEO_JOB" || has.script)) {
    const g = gate(st.pending);
    if (g.ok) {
      start(key, st, st.pending, { mode: "new", task: key, stage: cur });
      await agentRun(key, "running");
      st.pending = null;
    }
  }
  st.updated_at = nowIso;
  if (!dry) writeJson(stateFile(key), st);
}
console.log(JSON.stringify({ dry, tasks: tasks.length, log }));
