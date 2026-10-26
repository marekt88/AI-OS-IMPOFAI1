// YouTube transcripts collector (IMPOFAI content system, navrh.md §2). No claude -p ("claude": false).
// 1. New videos per creator from the channel RSS feed (no key, no quota).
// 2. Transcript per new video: youtube-transcript-api through a proxy (WEBSHARE_PROXY_USERNAME/PASSWORD or YT_PROXY_URL
//    in secrets.env; the server IP itself is blocked by YouTube, checked 2026-10-26). Supadata (SUPADATA_API_KEY) stays
//    supported when "supadata" is listed in creators.json settings.providers (Marek chose a proxy, 2026-10-26).
// 3. One immutable file per video in zdroje/youtube/<handle>/, one line in zdroje/index.jsonl, and a run-complete
//    line at the end. Videos without a transcript are retried 6/24/72 h after first seen, then written with
//    transcript_status none/blocked (metadata only).
// RUN_DRY=1: feeds and transcripts are fetched read-only, nothing is written outside RUN_DIR, no AI Bugs report.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reportIssue } from "../../runner/pm.mjs";
import {
  appendIndex, isDry, localParts, nextAttemptAt, parseFeed, PATHS, readJson, ROOT, slugify, transcriptFile,
  writeFileAtomic, writeJson,
} from "../_lib/zdroje.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PY = process.env.CONTENT_PYTHON || path.join(ROOT, ".venv/bin/python");
const RUN_DIR = process.env.RUN_DIR || fs.mkdtempSync("/tmp/yt-transcripts-");
const dry = isDry();
const now = new Date();
const nowIso = now.toISOString();
const { date: today, time: slot } = localParts(now);

const cfg = readJson(PATHS.creators, null);
if (!cfg?.creators?.length) {
  console.error(`no creators in ${PATHS.creators}`);
  process.exit(1);
}
const settings = { include_shorts: false, first_run_days: 7, max_transcripts_per_run: 25, ...cfg.settings };
const state = readJson(PATHS.ytState, { videos: {}, feeds: {}, initialized_at: null });
const firstRun = !state.initialized_at;
const errors = [];
const stats = { feeds_ok: 0, feeds_failed: 0, new_videos: 0, ok: 0, no_captions: 0, blocked: 0, failed: 0, final: 0, skipped: 0 };

async function fetchText(url, tries = 2) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { "user-agent": "Mozilla/5.0 impofai-content" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (err) {
      last = err;
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
  throw last;
}

// ---------- transcript providers ----------
async function supadata(videoId) {
  const key = process.env.SUPADATA_API_KEY;
  const base = "https://api.supadata.ai/v1/transcript";
  const q = new URLSearchParams({ url: `https://www.youtube.com/watch?v=${videoId}`, lang: "en", text: "true", mode: "native" });
  const headers = { "x-api-key": key };
  let r = await fetch(`${base}?${q}`, { headers, signal: AbortSignal.timeout(60_000) });
  let body = await r.json().catch(() => ({}));
  if (r.status === 202 && body.jobId) {
    for (let i = 0; i < 20; i++) {
      await new Promise((res) => setTimeout(res, 5000));
      r = await fetch(`${base}/${body.jobId}`, { headers, signal: AbortSignal.timeout(30_000) });
      const job = await r.json().catch(() => ({}));
      if (job.status === "completed") {
        body = job;
        break;
      }
      if (job.status === "failed") return { status: "failed", error: `supadata job failed: ${JSON.stringify(job.error ?? "")}`.slice(0, 300) };
    }
  }
  if (r.status === 206 || body.error === "transcript-unavailable") return { status: "no-captions", error: "transcript-unavailable" };
  if (!r.ok || typeof body.content !== "string") return { status: "failed", error: `supadata HTTP ${r.status} ${body.error ?? ""}`.trim() };
  return { status: "ok", kind: "native", language: body.lang ?? null, text: body.content, duration_s: null };
}

function youtubeTranscriptApi(videoId) {
  try {
    const out = execFileSync(PY, ["-I", path.join(HERE, "fetch_transcript.py"), videoId], { encoding: "utf8", timeout: 90_000 });
    return JSON.parse(out.trim().split("\n").pop());
  } catch (err) {
    return { status: "failed", error: `fetch_transcript.py: ${String(err.message).slice(0, 300)}` };
  }
}

let freeBlockedInRow = 0; // circuit breaker: after 3 blocks in a row the free provider is not called again this run
async function getTranscript(videoId) {
  const providers = settings.providers ?? ["supadata", "youtube-transcript-api"];
  let res = { status: "failed", error: "no provider available" };
  for (const p of providers) {
    if (p === "supadata") {
      if (!process.env.SUPADATA_API_KEY) continue;
      res = await supadata(videoId).catch((err) => ({ status: "failed", error: `supadata: ${err.message}` }));
    } else if (p === "youtube-transcript-api") {
      if (freeBlockedInRow >= 3) {
        res = { status: "blocked", error: "skipped: YouTube blocked the server IP 3× in a row in this run" };
        continue;
      }
      res = youtubeTranscriptApi(videoId);
      freeBlockedInRow = res.status === "blocked" ? freeBlockedInRow + 1 : 0;
    } else continue;
    res.provider = p;
    if (res.status === "ok" || res.status === "no-captions") return res; // a definite answer, no need for the next provider
  }
  return res;
}

// ---------- 1. feeds ----------
const indexLines = [];
for (const c of cfg.creators.filter((x) => x.active !== false && x.platform === "youtube")) {
  const feedState = (state.feeds[c.channel_id] ??= { failures: 0 });
  let entries;
  try {
    entries = parseFeed(await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${c.channel_id}`));
    feedState.failures = 0;
    feedState.last_ok_at = nowIso;
    stats.feeds_ok++;
  } catch (err) {
    feedState.failures++;
    stats.feeds_failed++;
    errors.push(`feed ${c.handle}: ${err.message}`);
    continue;
  }
  for (const e of entries) {
    if (state.videos[e.videoId]) continue;
    stats.new_videos++;
    const base = { handle: c.handle, channel_id: c.channel_id, title: e.title, url: e.url, published_at: e.published, is_short: e.isShort, description: e.description, first_seen_at: nowIso, attempts: 0 };
    const tooOld = firstRun && Date.parse(e.published) < now.getTime() - settings.first_run_days * 86400_000;
    if (tooOld) {
      state.videos[e.videoId] = { ...base, status: "skipped-old", description: undefined };
      stats.skipped++;
    } else if (e.isShort && !(c.include_shorts ?? settings.include_shorts)) {
      state.videos[e.videoId] = { ...base, status: "skipped-short", description: undefined };
      indexLines.push({ id: `yt:${e.videoId}`, source: "youtube", creator: c.handle, published_at: e.published, title: e.title, url: e.url, path: null, status: "skipped-short", added_at: nowIso });
      stats.skipped++;
    } else {
      state.videos[e.videoId] = { ...base, status: "pending", next_attempt_at: nowIso };
    }
  }
}

// ---------- 2. transcripts ----------
const due = Object.entries(state.videos)
  .filter(([, v]) => ["pending", "no-captions", "blocked", "failed"].includes(v.status) && v.next_attempt_at && v.next_attempt_at <= nowIso)
  .sort((a, b) => String(a[1].published_at).localeCompare(String(b[1].published_at)))
  .slice(0, settings.max_transcripts_per_run);

const writeVideo = (id, v, res, finalStatus) => {
  const day = String(v.published_at ?? nowIso).slice(0, 10);
  const rel = path.join("youtube", v.handle.replace(/^@/, ""), `${day}_${id}_${slugify(v.title)}.md`);
  const meta = {
    video_id: id, channel_id: v.channel_id, handle: v.handle, title: v.title, url: v.url, is_short: v.is_short, published_at: v.published_at,
    fetched_at: nowIso, duration_s: res.duration_s ?? null, transcript_status: finalStatus, transcript_kind: res.kind ?? "none",
    language: res.language ?? null, provider: res.provider ?? null, description: v.description,
  };
  const content = transcriptFile(meta, res.status === "ok" ? res.text : null);
  if (dry) fs.writeFileSync(path.join(RUN_DIR, `dry-${id}.md`), content);
  else writeFileAtomic(path.join(ROOT, "zdroje", rel), content);
  indexLines.push({ id: `yt:${id}`, source: "youtube", creator: v.handle, published_at: v.published_at, title: v.title, url: v.url, path: `zdroje/${rel}`, status: finalStatus, added_at: nowIso });
  return rel;
};

for (const [id, v] of due) {
  const res = await getTranscript(id);
  v.attempts++;
  v.last_attempt_at = nowIso;
  v.last_error = res.error ?? null;
  v.provider = res.provider ?? null;
  if (res.status === "ok") {
    v.file = writeVideo(id, v, res, "ok");
    v.status = "ok";
    v.next_attempt_at = null;
    stats.ok++;
    continue;
  }
  const statKey = res.status === "no-captions" ? "no_captions" : res.status;
  stats[statKey] = (stats[statKey] ?? 0) + 1;
  const next = nextAttemptAt(v.first_seen_at, v.attempts);
  if (next) {
    v.status = res.status;
    v.next_attempt_at = next;
  } else {
    const finalStatus = res.status === "no-captions" ? "none" : res.status; // blocked / failed stay visible as such
    v.file = writeVideo(id, v, res, finalStatus);
    v.status = finalStatus;
    v.next_attempt_at = null;
    stats.final++;
  }
}
// descriptions are needed only until the file is written
for (const v of Object.values(state.videos)) if (v.file || v.status?.startsWith("skipped")) delete v.description;

// ---------- 3. health ----------
const issues = [];
for (const c of cfg.creators) {
  const f = state.feeds[c.channel_id];
  if (f?.failures >= 2) issues.push({ fingerprint: `content:yt-transcripts:feed:${c.channel_id}`, title: `YouTube feed ${c.handle} zlyhal ${f.failures}× po sebe`, details: errors.filter((e) => e.includes(c.handle)).join("\n") });
}
const attempts = due.length;
if (attempts >= 4 && (stats.blocked + stats.failed) / attempts > 0.5) {
  const proxy = process.env.WEBSHARE_PROXY_USERNAME || process.env.YT_PROXY_URL;
  const why = proxy ? "aj cez proxy" : "proxy nie je nastavené (WEBSHARE_PROXY_USERNAME/PASSWORD alebo YT_PROXY_URL), YouTube blokuje IP servera";
  issues.push({ fingerprint: "content:yt-transcripts:blocked", title: `Prepisy YouTube: ${stats.blocked + stats.failed}/${attempts} zlyhalo (${why})`, details: due.map(([id, v]) => `${id} ${v.status} ${v.last_error ?? ""}`).join("\n") });
}
const newest = Math.max(0, ...Object.values(state.videos).map((v) => Date.parse(v.published_at) || 0));
if (!firstRun && newest && now.getTime() - newest > 72 * 3600_000) {
  issues.push({ fingerprint: "content:yt-transcripts:silent", title: "YouTube zberač: 72 h žiadne nové video zo žiadneho kanála", details: `najnovšie video: ${new Date(newest).toISOString()}` });
}
for (const i of issues) await reportIssue({ ...i, process: "yt-transcripts", runId: process.env.RUN_ID ?? null });

// ---------- 4. write state, index, run-complete ----------
const runComplete = { type: "run-complete", source: "youtube", date: today, slot, items: indexLines.filter((l) => l.status === "ok").length, ok: errors.length === 0 && issues.length === 0, errors, at: nowIso, added_at: nowIso };
if (dry) {
  writeJson(path.join(RUN_DIR, "dry-state.json"), state);
  writeJson(path.join(RUN_DIR, "dry-index-lines.json"), [...indexLines, runComplete]);
} else {
  state.initialized_at ??= nowIso;
  writeJson(PATHS.ytState, state);
  appendIndex([...indexLines, runComplete]);
  const health = readJson(PATHS.health, {});
  health.youtube = { last_run_at: nowIso, ...stats, errors: errors.length, issues: issues.map((i) => i.title) };
  writeJson(PATHS.health, health);
}
// a broken feed or mass blocking is reported in AI Bugs; the run itself stays successful so the slot is not retried
console.log(JSON.stringify({ dry, first_run: firstRun, ...stats, due: due.length, errors, issues: issues.map((i) => i.title) }));
