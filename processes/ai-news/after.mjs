// Daily AI news (IMPOFAI content system, navrh.md §2), step 2: the structured output of claude -p → files.
// - re-checks verification deterministically (2 distinct source domains, facts point at existing sources)
// - dedup against zdroje/index.jsonl of the last 14 days (canonical URL of the first source + story_key)
// - writes zdroje/ai-news/<date>_ai-news.json (verified + "čaká na druhý zdroj") and .md (all, readable)
// - appends index lines and a run-complete line, then starts step A (content-napady) when it exists and is enabled
// RUN_DRY=1: files go to RUN_DIR only, step A is not started.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnProcess } from "../../runner/spawn.mjs";
import { appendIndex, canonicalUrl, isDry, localParts, normStoryKey, PATHS, readIndex, writeFileAtomic, writeJson } from "../_lib/zdroje.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUN_DIR = process.env.RUN_DIR;
const dry = isDry();
const now = new Date();
const nowIso = now.toISOString();
const { date: today, time: slot } = localParts(now);
const { output: o } = JSON.parse(fs.readFileSync(process.env.RUN_OUTPUT, "utf8"));

const host = (u) => {
  try {
    return new URL(u).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
};

// ---------- validate + normalise ----------
const recent = readIndex({ sinceIso: new Date(now.getTime() - 14 * 86400_000).toISOString() }).filter((l) => l.source === "ai-news");
const seenKeys = new Set(recent.map((l) => l.story_key).filter(Boolean));
const seenUrls = new Set(recent.map((l) => l.primary_url).filter(Boolean));

const items = [];
const dropped = [];
for (const raw of o.items ?? []) {
  const sources = (raw.sources ?? []).filter((s) => /^https?:\/\//.test(s.url ?? ""));
  if (!sources.length) {
    dropped.push({ title: raw.title_sk, why: "bez platnej URL" });
    continue;
  }
  const facts = (raw.facts ?? []).filter((f) => f.sources?.length && f.sources.every((i) => i < sources.length));
  const badFacts = (raw.facts ?? []).filter((f) => !facts.includes(f)).map((f) => ({ claim_sk: f.claim_sk, reason: "fakt odkazuje na neexistujúci zdroj" }));
  const domains = new Set(sources.map((s) => host(s.url)).filter(Boolean));
  let verification = raw.verification;
  if (verification === "2-zdroje" && domains.size < 2) verification = sources.some((s) => s.type === "primary") ? "iba-primarny" : "neoverene";
  const story_key = normStoryKey(raw.story_key);
  const dedup_key = `${story_key}|${raw.event_date}`;
  const primary_url = canonicalUrl((sources.find((s) => s.type === "primary") ?? sources[0]).url);
  const item = {
    ...raw,
    story_key,
    dedup_key,
    sources: sources.map((s) => ({ ...s, accessed_at: nowIso })),
    facts,
    do_not_claim: [...(raw.do_not_claim ?? []), ...badFacts],
    verification,
    valid_until: new Date(Date.parse(`${raw.event_date}T00:00:00Z`) + 72 * 3600_000).toISOString(), // event day + 48 h, rounded up to the end of the day
    primary_url,
    duplicate_of: null,
  };
  if (seenKeys.has(story_key) || seenUrls.has(primary_url)) {
    item.duplicate_of = recent.find((l) => l.story_key === story_key || l.primary_url === primary_url)?.id ?? "index";
  }
  seenKeys.add(story_key);
  seenUrls.add(primary_url);
  items.push(item);
}

const fresh = items.filter((i) => !i.duplicate_of);
const verified = fresh.filter((i) => i.verification === "2-zdroje");
const waiting = fresh.filter((i) => i.verification === "iba-primarny");
const unverified = fresh.filter((i) => i.verification === "neoverene");

// ---------- files ----------
const jsonDoc = { date: today, generated_at: nowIso, run_id: process.env.RUN_ID ?? null, items: verified, waiting_second_source: waiting, notes_sk: o.notes_sk ?? "", unclear: o.unclear ?? [] };
const md = [
  `# AI novinky ${today}`,
  "",
  `Overené (2 zdroje): ${verified.length} · Čaká na druhý zdroj: ${waiting.length} · Neoverené: ${unverified.length} · Duplicity: ${items.length - fresh.length} · Vyradené: ${dropped.length}`,
  "",
  o.notes_sk ? `> ${o.notes_sk}` : "",
  "",
  ...section("Overené", verified),
  ...section("Čaká na druhý zdroj", waiting),
  ...section("Neoverené (nič z toho netvrdiť)", unverified),
  ...(o.unclear?.length ? ["## Nejasné, vynechané", "", ...o.unclear.map((u) => `- ${u}`), ""] : []),
  ...(dropped.length ? ["## Vyradené kódom", "", ...dropped.map((d) => `- ${d.title} (${d.why})`), ""] : []),
].join("\n");

function section(title, list) {
  if (!list.length) return [];
  const out = [`## ${title}`, ""];
  for (const i of list) {
    out.push(`### ${i.title_sk}`, `${i.company} · ${i.category} · ${i.release_stage} · ${i.event_date} · EÚ: ${i.eu_availability} · \`${i.dedup_key}\``, "", i.summary_sk, "");
    for (const f of i.facts) out.push(`- ${f.claim_sk} (${f.sources.map((n) => `[${n + 1}]`).join("")})`);
    for (const d of i.do_not_claim) out.push(`- NETVRDIŤ: ${d.claim_sk} (${d.reason})`);
    for (const c of i.conflicts_sk ?? []) out.push(`- ROZPOR: ${c}`);
    out.push("", ...i.sources.map((s, n) => `[${n + 1}] ${s.publisher} (${s.type}): ${s.url}`), "");
  }
  return out;
}

const relJson = `zdroje/ai-news/${today}_ai-news.json`;
const relMd = `zdroje/ai-news/${today}_ai-news.md`;
const indexLines = [...verified, ...waiting].map((i) => ({
  id: `news:${i.dedup_key}`, source: "ai-news", story_key: i.story_key, primary_url: i.primary_url, title: i.title_sk, company: i.company,
  published_at: i.event_date, path: relJson, status: i.verification, valid_until: i.valid_until, added_at: nowIso,
}));
const runComplete = { type: "run-complete", source: "ai-news", date: today, slot, items: verified.length, ok: o.ok !== false, errors: [], at: nowIso, added_at: nowIso };

if (dry) {
  writeJson(path.join(RUN_DIR, "dry-ai-news.json"), jsonDoc);
  fs.writeFileSync(path.join(RUN_DIR, "dry-ai-news.md"), md);
  writeJson(path.join(RUN_DIR, "dry-index-lines.json"), [...indexLines, runComplete]);
} else {
  // a second run on the same day gets a suffix, files are never rewritten
  let jsonFile = path.join(PATHS.aiNews, `${today}_ai-news.json`);
  let mdFile = path.join(PATHS.aiNews, `${today}_ai-news.md`);
  for (let n = 2; fs.existsSync(jsonFile); n++) {
    jsonFile = path.join(PATHS.aiNews, `${today}_ai-news-${n}.json`);
    mdFile = path.join(PATHS.aiNews, `${today}_ai-news-${n}.md`);
  }
  writeFileAtomic(jsonFile, JSON.stringify(jsonDoc, null, 2) + "\n");
  writeFileAtomic(mdFile, md);
  const rel = `zdroje/ai-news/${path.basename(jsonFile)}`;
  appendIndex([...indexLines.map((l) => ({ ...l, path: rel })), runComplete]);
}

// ---------- step A ----------
const napady = path.join(HERE, "..", "content-napady", "process.json");
let stepA = "content-napady neexistuje";
if (fs.existsSync(napady)) {
  const def = JSON.parse(fs.readFileSync(napady, "utf8"));
  if (def.enabled === false) stepA = "content-napady je vypnutý";
  else if (dry) stepA = "dry-run: content-napady sa nespúšťa";
  else {
    const yt = readIndex({ sinceIso: new Date(now.getTime() - 12 * 3600_000).toISOString() }).some((l) => l.type === "run-complete" && l.source === "youtube" && l.date === today);
    spawnProcess("content-napady", { date: today, ai_news: relJson, youtube_complete: yt }, { label: "napady" });
    stepA = "content-napady spustený";
  }
}
console.log(JSON.stringify({ dry, verified: verified.length, waiting: waiting.length, unverified: unverified.length, duplicates: items.length - fresh.length, dropped: dropped.length, stepA, relMd }));
