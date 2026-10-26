// Unit tests of the script helpers: node --test processes/_lib/scenar.test.mjs (no network).
import test from "node:test";
import assert from "node:assert/strict";
import { readBlock, renderScript, validateScript } from "./scenar.mjs";

const line = (i, o = {}) => ({
  t_from: i * 5, t_to: i * 5 + 5, titulky: "Toto je riadok o AI agentovi pre tvoju firmu dnes", elevenlabs: "Toto je riadok o ej-áj agentovi pre tvoju firmu dnes",
  avatar: "happy_point_right", set: "S:ustredna", metaphor: "V:konektor", action: "kábel sa zapojí do AI agenta", elements: ["X1", "X7", "K5", "K4:sipka"],
  highlight: "agent", on_screen: "AI MÁ PRÍSTUP", source_url: null, sound: "cvak", ...o,
});
const script = (o = {}) => ({
  ok: true, skip_reason: null, slug: "test", name: "Test", duration_s: 45, cta_type: "workshop", cta_text: "Prihlás sa na AI workshop · Košice alebo online · impofai.com/workshop",
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
