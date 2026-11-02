# IMPOFAI content system (sociálne siete)

Návrh a rozhodnutia: `/home/marek/.swarm/impofai-content-system/navrh.md`, priebeh implementácie: `implementacia.md` v tom istom priečinku. Pravidlá značky a štýl videa sú v plugine `impofai-reels` (server: `/home/marek/impofai-content/plugin` → aktuálna verzia).

## Tok
```
ai-news (06:00) → content-napady → karta „Nápad: …“ na boarde Internal / Ads and Socials / Obsah, stav Nápad, label zdroj-novinky / zdroj-pripadovka
Claude Desktop scheduled task (YouTube) → tiež karta v stave Nápad, label zdroj-youtube
yt-transcripts (vypnuté: čaká na proxy KYC) → zdroje/index.jsonl

Board Obsah = vlastné stavy listu (KAPSA, od 2026-11-02; predtým labely etáp):
  Nápad ─(človek)→ Scenár ─(človek)→ Video ─(človek)→ Ozvučenie ─(človek)→ Hotové ─(Socials)→ Publikované   (+ Zrušené)
  content-pipeline (*/5) pri presune karty o jeden stĺpec spustí: Scenár = content-scenare, Video = content-video,
  Ozvučenie = content-audio, Hotové = FINALIZE (kontrola finálu, previewUrl, label ready-for-posting pre Socials)
```

## Ako s tým pracuje človek
- Video z nápadu: presuň kartu z **Nápad** do **Scenár** (Board view alebo stav v detaile). Do 5 min sa spustí scenár a zapíše sa do tej istej karty (description = scenár + pôvodný nápad, príloha `<slug>_script-vN.json`, pôvodný nápad aj v `<KEY>_napad.md`).
- Kým job beží, karta má agent run Running. Keď skončí, Needs review: pozri výsledok a buď napíš **komentár** (revízia v tom istom stĺpci), alebo kartu posuň o stĺpec ďalej (schválenie).
- Späť sa dá kedykoľvek (bez jobu). Preskočiť stĺpec sa nedá: pipeline kartu vráti s komentárom E_STAGE.
- Labely na boarde = iba zdroj nápadu: `zdroj-novinky`, `zdroj-youtube`, `zdroj-instagram`, `zdroj-pripadovka`. Labely publikovania (`ready-for-posting`, `naplanovane`, `publikovane`, …) nastavuje automat a Socials.
- Description scenára ručne neupravuj, zmeny píš do komentára.

## Procesy (`processes/`)
| Proces | Typ | Čo robí |
|---|---|---|
| `yt-transcripts` | bez LLM | RSS 11 creatorov, prepisy cez `youtube-transcript-api` s proxy (`YT_PROXY_URL`), súbory v `zdroje/youtube/` |
| `ai-news` | claude -p (WebSearch, WebFetch) | overené novinky, `zdroje/ai-news/<dátum>_ai-news.{json,md}` |
| `content-napady` | claude -p (opus, len čítanie) | 5–8 nápadov, zápis robí `after.mjs` s `CONTENT_PM_TOKEN` |
| `content-scenare` | claude -p (opus, len čítanie) | scenár vo formáte plugin 0.10 (avatar, scény, výslovnosť) do tej istej karty, validácia `_lib/scenar.mjs` |
| `content-pipeline` | bez LLM | stavový automat podľa stavu karty (scenár max 3 za tick), revízie, finalizácia, blokery komentuje raz |
| `content-video`, `content-audio` | claude -p | render HyperFrames (`--docker`) a ozvučenie |

Spoločné knižnice: `processes/_lib/` (`zdroje.mjs`, `scenar.mjs`, `tts.mjs`, `upload.mjs`) s testami: `node --test processes/_lib/*.test.mjs processes/content-pipeline/lib.test.mjs`.

## Súbory a tajomstvá
- Dáta: `/home/marek/impofai-content/` (`zdroje/`, `state/pipeline/<KEY>.json`, `reels/`, `cache/tts/`, `assets/brand/`, `config/content.json`).
- `~/.aios-runner/secrets.env`: `CONTENT_PM_TOKEN` (KAPSA, Internal / Ads and Socials), `YT_PROXY_URL` (Bright Data), `ELEVENLABS_API_KEY`.
- ElevenLabs volá iba `processes/_lib/tts.mjs` (cache podľa textu, ten istý text sa neplatí dvakrát).
- PM MCP skracuje odpovede na 25 000 znakov: strojová verzia scenára je v prílohe `<slug>_script-vN.json`, nie v description.

## Keď niečo nejde
- Chyby behov idú do AI Bugs (runner). Stav úlohy v pipeline: `/home/marek/impofai-content/state/pipeline/<KEY>.json`.
- Ručný beh: `node runner/run.mjs run <proces> [--input súbor.json] [--dry-run]`.
