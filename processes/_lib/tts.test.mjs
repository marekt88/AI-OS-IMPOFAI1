// node --test processes/_lib/tts.test.mjs (no network: fetch is mocked)
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { cacheKey, mapToCaptions, synthesize, wordsFromAlignment } from "./tts.mjs";

const al = (text) => {
  const characters = [...text];
  return { characters, character_start_times_seconds: characters.map((_, i) => i * 0.1), character_end_times_seconds: characters.map((_, i) => i * 0.1 + 0.1) };
};

test("words from alignment, tags and punctuation removed", () => {
  const w = wordsFromAlignment(al("[confident] Ahoj, ej-áj agent."));
  assert.deepEqual(w.map((x) => x[0]), ["Ahoj", "ej-áj", "agent"]);
  assert.ok(w[1][1] < w[1][2]);
});

test("map back to caption spelling", () => {
  const tts = wordsFromAlignment(al("Volá ej-áj asistent"));
  assert.deepEqual(mapToCaptions(tts, "Volá AI asistent.").map((x) => x[0]), ["Volá", "AI", "asistent"]);
  assert.deepEqual(mapToCaptions(tts, "Volá AI asistent.")[1].slice(1), tts[1].slice(1));
  assert.equal(mapToCaptions(tts, "Volá umelá inteligencia asistent").length, 4); // proportional fallback
});

test("synthesize: one API call, then cache; errors are coded", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tts-"));
  let calls = 0;
  const ok = async () => {
    calls++;
    return { ok: true, status: 200, text: async () => JSON.stringify({ audio_base64: Buffer.from("mp3").toString("base64"), alignment: al("ahoj") }) };
  };
  const a = await synthesize({ text: "ahoj", cacheDir: dir, apiKey: "k", fetchImpl: ok });
  const b = await synthesize({ text: "ahoj", cacheDir: dir, apiKey: "k", fetchImpl: ok });
  assert.equal(calls, 1);
  assert.equal(a.cached, false);
  assert.equal(b.cached, true);
  assert.notEqual(cacheKey({ text: "ahoj", take: 1 }), cacheKey({ text: "ahoj", take: 2 }));
  const err = (status) => async () => ({ ok: false, status, text: async () => "{}" });
  await assert.rejects(synthesize({ text: "x", cacheDir: dir, apiKey: "k", fetchImpl: err(401) }), /E_ACCESS/);
  await assert.rejects(synthesize({ text: "y", cacheDir: dir, apiKey: "k", fetchImpl: err(402) }), /E_CREDITS/);
  await assert.rejects(synthesize({ text: "z", cacheDir: dir, apiKey: null }), /E_ACCESS/);
  assert.equal((await synthesize({ text: "dry", cacheDir: dir, dry: true })).dry, true);
});
