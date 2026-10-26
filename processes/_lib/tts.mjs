// ElevenLabs text-to-speech for the IMPOFAI content system (navrh.md §4, plugin voiceover 0.10).
// Deterministic code, never an LLM, calls the paid API: POST /v1/text-to-speech/{voice}/with-timestamps.
// Cache: key = sha256(voice, model, settings, text) → <cacheDir>/<hash>.mp3 + .json (alignment). The same text is
// never generated twice, so retries and revisions without text changes cost no credits.
// CLI (used by the audio job): node tts.mjs <script.json> <outDir> [--takes 2] [--dry]
//   script.json = the ```json script``` block (voice_text = ElevenLabs spelling); writes take-N.mp3/.json and tts.json.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const VOICE_ID = "8zZZVbHbPmbH2dgRv87g"; // Brian - Calm & Young (chosen by Marek, plugin voiceover)
export const MODEL_ID = "eleven_v4";
export const API = "https://api.elevenlabs.io";

export const cacheKey = ({ voiceId, modelId, settings, text, take }) =>
  crypto.createHash("sha256").update(JSON.stringify([voiceId, modelId, settings ?? null, text, take ?? 1])).digest("hex");

/** Word timings from ElevenLabs character alignment: [[word, start, end], …]. */
export function wordsFromAlignment(al) {
  const chars = al?.characters ?? [];
  const st = al?.character_start_times_seconds ?? [];
  const en = al?.character_end_times_seconds ?? [];
  const out = [];
  let cur = null;
  chars.forEach((c, i) => {
    if (/\s/.test(c)) {
      if (cur) out.push(cur), (cur = null);
      return;
    }
    if (!cur) cur = ["", st[i], en[i]];
    cur[0] += c;
    cur[2] = en[i];
  });
  if (cur) out.push(cur);
  return out.map(([w, s, e]) => [w.replace(/^[„"“(]+|[.,!?;:…"“”)]+$/g, ""), s, e]).filter(([w]) => w && !/^\[.*\]$/.test(w));
}

/**
 * Maps TTS words (pronunciation spelling) back to caption words (normal spelling) in the same order, so captions and
 * the avatar show "AI" while the timing comes from "ej-áj". Emotion tags ([confident]) are not words.
 * Returns caption words with times; when the counts differ, the times are spread proportionally.
 */
export function mapToCaptions(ttsWords, captionText) {
  const cap = String(captionText).split(/\s+/).map((w) => w.replace(/^[„"“(]+|[.,!?;:…"“”)]+$/g, "")).filter(Boolean);
  if (!ttsWords.length) return [];
  if (cap.length === ttsWords.length) return cap.map((w, i) => [w, ttsWords[i][1], ttsWords[i][2]]);
  const t0 = ttsWords[0][1];
  const t1 = ttsWords[ttsWords.length - 1][2];
  const step = (t1 - t0) / cap.length;
  return cap.map((w, i) => [w, +(t0 + i * step).toFixed(3), +(t0 + (i + 1) * step).toFixed(3)]);
}

/** One take, from the cache when possible. fetchImpl is injectable for tests. */
export async function synthesize({ text, voiceId = VOICE_ID, modelId = MODEL_ID, settings = null, take = 1, cacheDir, apiKey, fetchImpl = fetch, dry = false }) {
  const key = cacheKey({ voiceId, modelId, settings, text, take });
  const mp3 = path.join(cacheDir, `${key}.mp3`);
  const meta = path.join(cacheDir, `${key}.json`);
  if (fs.existsSync(mp3) && fs.existsSync(meta)) return { cached: true, mp3, ...JSON.parse(fs.readFileSync(meta, "utf8")) };
  if (dry) return { cached: false, dry: true, characters: [...text].length };
  if (!apiKey) throw new Error("E_ACCESS: ELEVENLABS_API_KEY chýba");
  const res = await fetchImpl(`${API}/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: modelId, ...(settings ? { voice_settings: settings } : {}) }),
    signal: AbortSignal.timeout(180_000),
  });
  const body = await res.text();
  if (res.status === 401 || res.status === 403) throw new Error(`E_ACCESS: ElevenLabs HTTP ${res.status}`);
  if (res.status === 402 || /quota|credits/i.test(body.slice(0, 300))) throw new Error(`E_CREDITS: ElevenLabs HTTP ${res.status}`);
  if (!res.ok) throw new Error(`E_AUDIO: ElevenLabs HTTP ${res.status}: ${body.slice(0, 200)}`);
  const j = JSON.parse(body);
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(mp3, Buffer.from(j.audio_base64, "base64"));
  const info = { characters: [...text].length, alignment: j.alignment ?? j.normalized_alignment ?? null, voiceId, modelId, take, created_at: new Date().toISOString() };
  fs.writeFileSync(meta, JSON.stringify(info));
  return { cached: false, mp3, ...info };
}

// ---------- CLI ----------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [scriptFile, outDir] = process.argv.slice(2);
  const takes = Number(process.argv[process.argv.indexOf("--takes") + 1]) || 2;
  const dry = process.argv.includes("--dry");
  if (!scriptFile || !outDir) {
    console.error("usage: node tts.mjs <script.json> <outDir> [--takes 2] [--dry]");
    process.exit(2);
  }
  const s = JSON.parse(fs.readFileSync(scriptFile, "utf8"));
  const cacheDir = path.join(process.env.CONTENT_ROOT || "/home/marek/impofai-content", "cache", "tts");
  fs.mkdirSync(outDir, { recursive: true });
  const result = { voice: VOICE_ID, model: MODEL_ID, takes: [], characters_sent: 0, cache_hits: 0 };
  for (let take = 1; take <= takes; take++) {
    const r = await synthesize({ text: s.voice_text, take, cacheDir, apiKey: process.env.ELEVENLABS_API_KEY, dry });
    if (r.dry) {
      result.takes.push({ take, dry: true, characters: r.characters });
      continue;
    }
    if (r.cached) result.cache_hits++;
    else result.characters_sent += r.characters;
    fs.copyFileSync(r.mp3, path.join(outDir, `take-${take}.mp3`));
    const words = mapToCaptions(wordsFromAlignment(r.alignment), s.captions_text);
    fs.writeFileSync(path.join(outDir, `take-${take}.json`), JSON.stringify({ words, alignment: r.alignment }));
    result.takes.push({ take, mp3: `take-${take}.mp3`, words: words.length, cached: r.cached });
  }
  fs.writeFileSync(path.join(outDir, "tts.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}
