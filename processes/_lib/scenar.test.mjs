// Unit tests of the script helpers: node --test processes/_lib/scenar.test.mjs (no network).
import test from "node:test";
import assert from "node:assert/strict";
import { fitSummary, readBlock, renderScript, sentences, validateScript } from "./scenar.mjs";

const line = (i, o = {}) => ({
  t_from: i * 5, t_to: i * 5 + 5, titulky: "Toto je riadok o AI agentovi pre tvoju firmu dnes", elevenlabs: "Toto je riadok o ej-áj agentovi pre tvoju firmu dnes",
  avatar: "happy_point_right", set: "S:ustredna", metaphor: "V:konektor", action: "kábel sa zapojí do AI agenta", elements: ["X1", "X7", "K5", "K4:sipka"],
  highlight: "agent", on_screen: "AI MÁ PRÍSTUP", source_url: null, sound: "cvak", ...o,
});
const script = (o = {}) => ({
  ok: true, skip_reason: null, slug: "test", name: "Test", summary: "Video ukáže AI agenta v praxi. Grafika so 3D rekvizitami, 40 s.", okruh: 1,
  idea_source: { label: "Anthropic blog", url: "https://www.anthropic.com/news" }, duration_s: 45, cta_type: "workshop", cta_text: "Prihlás sa na AI workshop · Košice alebo online · impofai.com/workshop",
  valid_until: null, pointa: "p", open_loop: "o", chosen_hook: 1, hook_why: "w",
  hooks: [1, 2, 3].map((n) => ({ archetype: `a${n}`, voice: "v", on_screen: "t", frame0: "f" })),
  lines: Array.from({ length: 9 }, (_, i) => line(i)),
  cover_text: "c", popis: { instagram: "i", facebook: "f", youtube: { title: "Krátky titul", description: "d" }, linkedin: "l", tiktok: { title: "t", text: "x" }, first_comment: null, hashtags: ["#AI"] },
  assets: [], facts: [], do_not_claim: [], brand_check: [{ item: "slovenčina", ok: true, note: "" }], questions: [], changes: [], ...o,
});

test("valid script passes", () => {
  const v = validateScript(script());
  assert.deepEqual(v.errors, []);
  assert.equal(v.words, 90);
  assert.equal(v.duration, 45);
});

test("unknown pose, element, missing metaphor and TTS spelling are errors", () => {
  const s = script();
  s.lines[0] = line(0, { avatar: "dance", elements: ["X99"], metaphor: "konektor", titulky: "Klód je super a ej-áj tiež" });
  s.lines[1] = line(1, { elevenlabs: "Claude to vie" });
  const e = validateScript(s).errors.join("\n");
  for (const m of ["neznáma póza", "neznámy prvok „X99“", "metafora musí byť V:*", "výslovnostný pravopis", "normálny pravopis"]) assert.match(e, new RegExp(m));
});

test("new set and metaphor may carry a description in parentheses", () => {
  const s = script();
  s.lines[0] = line(0, { set: "S:nova-serverovna (tmavá: rad serverových skríň)", metaphor: "V:nova-stit (agent kryje IT)" });
  assert.deepEqual(validateScript(s).errors, []);
  s.lines[0] = line(0, { set: "serverovna (tmavá)", metaphor: "V:stit popis bez zátvoriek" });
  assert.equal(validateScript(s).errors.length, 2);
});

test("titles, hook count, forbidden text", () => {
  const s = script({ hooks: [], popis: { ...script().popis, youtube: { title: "x".repeat(71), description: "" } } });
  s.cta_text = "Workshop každú sobotu";
  const e = validateScript(s).errors.join("\n");
  assert.match(e, /hookov je 0/);
  assert.match(e, /YouTube title > 70/);
  assert.match(e, /zakázaný text/);
});

test("render → readBlock round trip", () => {
  const s = script();
  const d = renderScript(s, { idea: "IMP-1", version: 2, projectDate: "2026-10-26", changes: ["kratší hook"] });
  assert.match(d, /\*\*Verzia:\*\* v2 · \*\*Zmeny oproti v1:\*\* kratší hook/);
  const m = readBlock(d, "script");
  assert.equal(m.script_version, 2);
  assert.equal(m.slug, "test");
  assert.equal(m.beats.length, 9);
  assert.match(m.voice_text, /ej-áj/);
  assert.equal(readBlock(d, "popis").youtube.title, "Krátky titul");
  assert.equal(readBlock("bez bloku", "script"), null);
});

test("summary: required, max 5 sentences; card starts with it, then hooks, script, CTA, takeaway, source, okruh", () => {
  assert.equal(sentences("Prvá veta. Druhá má 2.5 s! Tretia? Štvrtá… Piata."), 5);
  assert.equal(sentences("Video otvára hook „Hodina s maklérom. A záujemca nemá kapitál.“ s hodinami. Mapa s pečiatkou 12+ mil. € a sito."), 2);
  assert.match(validateScript(script({ summary: "" })).errors.join("\n"), /chýba zhrnutie/);
  assert.match(validateScript(script({ summary: "A. B. C. D. E. F." })).errors.join("\n"), /6 viet/);
  const d = renderScript(script(), { idea: "IMP-1", version: 1, projectDate: "2026-11-23" });
  assert.ok(d.startsWith("## Zhrnutie\nVideo ukáže AI agenta"));
  const order = ["## Zhrnutie", "## Hooky", "## Scenár", "## CTA", "## Čo si divák odnesie", "## Zdroj nápadu", "## Okruh", "## Popis pre platformy"].map((h) => d.indexOf(h));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(order.every((i) => i >= 0));
  assert.match(d, /\[Anthropic blog\]\(https:\/\/www\.anthropic\.com\/news\)/);
  assert.match(d, /\| 1 ✓ \|/);
});

test("fitSummary keeps the first 5 sentences, quotes stay whole", () => {
  const s = { summary: "Jedna. Hook „Hodina. A nič.“ ide prvý. Tri. Štyri. Päť. Šesť je navyše." };
  assert.equal(fitSummary(s), 1);
  assert.equal(s.summary, "Jedna. Hook „Hodina. A nič.“ ide prvý. Tri. Štyri. Päť.");
  assert.equal(fitSummary(s), 0);
});
