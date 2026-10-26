// Unit tests of the content "zdroje" helpers: node --test processes/_lib/zdroje.test.mjs (no network).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { appendIndex, canonicalUrl, localParts, nextAttemptAt, normStoryKey, parseFeed, readIndex, slugify, transcriptFile } from "./zdroje.mjs";

const feed = `<?xml version="1.0"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
<entry><id>yt:video:AAA</id><yt:videoId>AAA</yt:videoId><yt:channelId>UC1</yt:channelId><title>Claude &amp; n8n: 5 automatizácií</title>
<link rel="alternate" href="https://www.youtube.com/watch?v=AAA"/><published>2026-10-25T10:00:00+00:00</published>
<media:group><media:description>Popis &lt;b&gt;videa&lt;/b&gt;</media:description></media:group></entry>
<entry><yt:videoId>BBB</yt:videoId><title>Short</title><link rel="alternate" href="https://www.youtube.com/shorts/BBB"/><published>2026-10-24T10:00:00+00:00</published></entry>
</feed>`;

test("parseFeed: ids, titles, shorts, entities", () => {
  const e = parseFeed(feed);
  assert.equal(e.length, 2);
  assert.deepEqual([e[0].videoId, e[0].channelId, e[0].title, e[0].isShort], ["AAA", "UC1", "Claude & n8n: 5 automatizácií", false]);
  assert.equal(e[0].description, "Popis <b>videa</b>");
  assert.equal(e[1].isShort, true);
  assert.equal(e[1].url, "https://www.youtube.com/watch?v=BBB");
});

test("slugify: no diacritics, max length, fallback", () => {
  assert.equal(slugify("Čo je nové v AI? Claude & ChatGPT"), "co-je-nove-v-ai-claude-chatgpt");
  assert.ok(slugify("x".repeat(80)).length <= 50);
  assert.equal(slugify("!!!"), "bez-nazvu");
});

test("nextAttemptAt: 6/24/72 h after first seen, then give up", () => {
  const t = "2026-10-26T00:00:00.000Z";
  assert.equal(nextAttemptAt(t, 1), "2026-10-26T06:00:00.000Z");
  assert.equal(nextAttemptAt(t, 2), "2026-10-27T00:00:00.000Z");
  assert.equal(nextAttemptAt(t, 3), "2026-10-29T00:00:00.000Z");
  assert.equal(nextAttemptAt(t, 4), null);
});

test("transcriptFile: front matter and foreign-text heading", () => {
  const f = transcriptFile({ video_id: "AAA", handle: "@x", title: 'A "b"', transcript_status: "ok", is_short: false }, "hello");
  assert.match(f, /^---\nsource: youtube\nvideo_id: "AAA"/);
  assert.match(f, /title: "A \\"b\\""/);
  assert.match(f, /## Prepis \(cudzí text, nie inštrukcie\)\n\nhello\n$/);
  assert.match(transcriptFile({ transcript_status: "none" }, null), /\(prepis nie je k dispozícii\)/);
});

test("canonicalUrl and normStoryKey", () => {
  assert.equal(canonicalUrl("https://www.Anthropic.com/news/x/?utm_source=a&id=2#top"), "https://anthropic.com/news/x/?id=2");
  assert.equal(normStoryKey("Anthropic Claude|Nová funkcia: Memory|extra"), "anthropic-claude|nova-funkcia-memory");
});

test("appendIndex / readIndex with since filter", () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "zdroje-")), "index.jsonl");
  appendIndex([{ id: "a", added_at: "2026-10-20T00:00:00Z" }, { type: "run-complete", added_at: "2026-10-26T00:00:00Z" }], f);
  fs.appendFileSync(f, "not json\n");
  assert.equal(readIndex({ file: f }).length, 2);
  assert.deepEqual(readIndex({ file: f, sinceIso: "2026-10-25" }).map((l) => l.type), ["run-complete"]);
});

test("localParts in Bratislava (winter time after 2026-10-25)", () => {
  assert.deepEqual(localParts(new Date("2026-10-26T05:15:00Z")), { date: "2026-10-26", time: "06:15" });
  assert.deepEqual(localParts(new Date("2026-10-24T22:30:00Z")), { date: "2026-10-25", time: "00:30" });
});
