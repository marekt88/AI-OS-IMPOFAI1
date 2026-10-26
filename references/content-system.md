# IMPOFAI content system (sociálne siete)

Návrh a rozhodnutia: `/home/marek/.swarm/impofai-content-system/navrh.md`, priebeh implementácie: `implementacia.md` v tom istom priečinku. Pravidlá značky a štýl videa sú v plugine `impofai-reels` (server: `/home/marek/impofai-content/plugin` → aktuálna verzia).

## Tok
```
ai-news (06:00) ─┐                       yt-transcripts (4× denne, vypnuté: čaká na proxy KYC)
                 └─► zdroje/index.jsonl ◄─┘
content-napady (spustí ai-news) → úlohy „Nápad: …“ v Internal / Ads and Socials / Nápady
content-scenare (pre každý nápad formátu A) → „Scenár: …“ v News posts, label navrhnute, IN_REVIEW
content-pipeline (*/5) → etapy kanbanu (labely):
  navrhnute ─(človek)→ schvalene-na-video ─(content-video)→ pripravene-na-audio ─(človek)→ schvalene-na-audio
  ─(content-audio)→ (človek) → ready-for-posting ─(FINALIZE: previewUrl)→ publikovanie (KAPSA, vetva content/posting)
```

## Ako s tým pracuje človek
- Scenár upravíš **komentárom** v úlohe (etapa navrhnute). Do 5 min vznikne nová verzia, stará ostáva v prílohe `<slug>_script-vN.json`. Description ručne neupravuj.
- Schválenie = prepnúť etapový label (vždy práve jeden; o jednu etapu ďalej). Späť sa dá kedykoľvek.
- Úloha bez etapového labelu alebo s dvoma dostane komentár `E_STAGE`.

## Procesy (`processes/`)
| Proces | Typ | Čo robí |
|---|---|---|
| `yt-transcripts` | bez LLM | RSS 11 creatorov, prepisy cez `youtube-transcript-api` s proxy (`YT_PROXY_URL`), súbory v `zdroje/youtube/` |
| `ai-news` | claude -p (WebSearch, WebFetch) | overené novinky, `zdroje/ai-news/<dátum>_ai-news.{json,md}` |
| `content-napady` | claude -p (opus, len čítanie) | 5–8 nápadov, zápis robí `after.mjs` s `CONTENT_PM_TOKEN` |
| `content-scenare` | claude -p (opus, len čítanie) | scenár vo formáte plugin 0.10 (avatar, scény, výslovnosť), validácia `_lib/scenar.mjs` |
| `content-pipeline` | bez LLM | stavový automat, revízie, finalizácia, blokery komentuje raz |
| `content-video`, `content-audio` | claude -p (vypnuté) | render HyperFrames a ozvučenie; čakajú na ffmpeg s libx264 a HyperFrames |

Spoločné knižnice: `processes/_lib/` (`zdroje.mjs`, `scenar.mjs`, `tts.mjs`, `upload.mjs`) s testami: `node --test processes/_lib/*.test.mjs processes/content-pipeline/lib.test.mjs`.

## Súbory a tajomstvá
- Dáta: `/home/marek/impofai-content/` (`zdroje/`, `state/pipeline/<KEY>.json`, `reels/`, `cache/tts/`, `assets/brand/`, `config/content.json`).
- `~/.aios-runner/secrets.env`: `CONTENT_PM_TOKEN` (KAPSA, Internal / Ads and Socials), `YT_PROXY_URL` (Bright Data), `ELEVENLABS_API_KEY`.
- ElevenLabs volá iba `processes/_lib/tts.mjs` (cache podľa textu, ten istý text sa neplatí dvakrát).
- PM MCP skracuje odpovede na 25 000 znakov: strojová verzia scenára je v prílohe `<slug>_script-vN.json`, nie v description.

## Keď niečo nejde
- Chyby behov idú do AI Bugs (runner). Stav úlohy v pipeline: `/home/marek/impofai-content/state/pipeline/<KEY>.json`.
- Ručný beh: `node runner/run.mjs run <proces> [--input súbor.json] [--dry-run]`.
