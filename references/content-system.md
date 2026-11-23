# IMPOFAI content system (sociálne siete)

Návrh a rozhodnutia: `/home/marek/.swarm/impofai-content-system/navrh.md`, priebeh implementácie: `implementacia.md` v tom istom priečinku. Pravidlá značky a štýl videa sú v plugine `impofai-reels` (server: `/home/marek/impofai-content/plugin` → aktuálna verzia).

## Tok
```
ai-news (06:00, iba 5 okruhov) → content-napady → karta „Nápad: …“ na boarde Internal / Obsah a sociálne siete / Obsah, stav Nápad,
  labely zdroj-novinky / zdroj-pripadovka + okruh-1..5 (okruh 5 = priorita Vysoká), agent run Queued
  → content-pipeline hneď napíše scenár do tej istej karty (content-scenare, po jednom); video a hlas nikdy samé
Claude Desktop scheduled task (YouTube) → tiež karta v stave Nápad, label zdroj-youtube
yt-transcripts (4× denne, prepisy cez Apify, aj shorts) → zdroje/index.jsonl

Board Obsah = vlastné stavy listu (KAPSA, od 2026-11-02; Nápad a Scenár zlúčené 2026-11-23):
  Nápad (so scenárom) ─(človek)→ Video ─(človek)→ Ozvučenie ─(človek)→ Hotové ─(človek)→ Naplánované ─(Socials + Postiz)→ Publikované   (+ Zrušené)
  Naplánované: Socials (KAPSA) zaradí kartu do najbližšieho voľného slotu 8:00 / 12:00 / 20:00 (max 3 denne na sieť, Socials → Nastavenia → Ciele),
  3 h pred slotom nahrá video do Postiz a založí post; po zverejnení karta → Publikované. Kľúč Postiz: Socials → Nastavenia → Účty.
  content-pipeline (*/5): scenár pre nové nápady (Queued) a na komentár v Nápade; pri presune karty o jeden stĺpec spustí:
  Video = content-video (iba keď karta má scenár, inak ju vráti do Nápadu),
  Ozvučenie = content-audio, Hotové = FINALIZE (kontrola finálu, previewUrl, label ready-for-posting pre Socials)
```

## Ako s tým pracuje človek
- Nápad prichádza rovno so scenárom. Description: **Zhrnutie** (max. 5 viet, rozhodnutie za 30 s), hooky (vybraný ✓), scenár, CTA, čo si divák odnesie, zdroj nápadu, okruh; nižšie popisy pre siete, podklady, fakty a pôvodný nápad. Príloha `<slug>_script-vN.json`, pôvodný nápad v `<KEY>_napad.md`.
- Video z nápadu: presuň kartu z **Nápad** do **Video**. Zmena scenára: komentár v Nápade (nová verzia). Starší nápad bez scenára: komentár (napr. „scenár“) ho napíše.
- Kým job beží, karta má agent run Running. Keď skončí, Needs review: pozri výsledok a buď napíš **komentár** (revízia v tom istom stĺpci), alebo kartu posuň o stĺpec ďalej (schválenie).
- Späť sa dá kedykoľvek (bez jobu). Preskočiť stĺpec sa nedá: pipeline kartu vráti s komentárom E_STAGE.
- Labely na boarde = zdroj nápadu (`zdroj-novinky`, `zdroj-youtube`, `zdroj-instagram`, `zdroj-pripadovka`) a okruh (`okruh-1` … `okruh-5`). Labely publikovania (`ready-for-posting`, `naplanovane`, `publikovane`, …) nastavuje automat a Socials.
- Description scenára ručne neupravuj, zmeny píš do komentára.

## Procesy (`processes/`)
| Proces | Typ | Čo robí |
|---|---|---|
| `yt-transcripts` | bez LLM | RSS 11 creatorov (videá aj shorts), prepisy cez Apify MCP server `heyitsgautham/video-transcripts` (`APIFY_TOKEN`, $0.003/prepis, dávky po 25, `processes/yt-transcripts/apify.mjs`), súbory v `zdroje/youtube/`. Záložne vie `youtube-transcript-api` s proxy alebo Supadata (`settings.providers` v `zdroje/config/creators.json`) |
| `ai-news` | claude -p (WebSearch, WebFetch) | overené novinky, `zdroje/ai-news/<dátum>_ai-news.{json,md}` |
| `content-napady` | claude -p (opus, len čítanie) | 5–8 nápadov, zápis robí `after.mjs` s `CONTENT_PM_TOKEN` |
| `content-scenare` | claude -p (opus, len čítanie) | scenár vo formáte plugin 0.10 (avatar, scény, výslovnosť) do tej istej karty, validácia `_lib/scenar.mjs` |
| `content-pipeline` | bez LLM | stavový automat podľa stavu karty (scenár max 3 za tick), revízie, finalizácia, blokery komentuje raz |
| `content-video`, `content-audio` | claude -p | render HyperFrames (`--docker`) a ozvučenie |

Spoločné knižnice: `processes/_lib/` (`zdroje.mjs`, `scenar.mjs`, `tts.mjs`, `upload.mjs`) s testami: `node --test processes/_lib/*.test.mjs processes/content-pipeline/lib.test.mjs`.

## Súbory a tajomstvá
- Dáta: `/home/marek/impofai-content/` (`zdroje/`, `state/pipeline/<KEY>.json`, `reels/`, `cache/tts/`, `assets/brand/`, `config/content.json`).
- `~/.aios-runner/secrets.env`: `CONTENT_PM_TOKEN` (KAPSA, Internal / Obsah a sociálne siete), `APIFY_TOKEN` (prepisy YouTube), `YT_PROXY_URL` (Bright Data, nepoužíva sa), `ELEVENLABS_API_KEY`.
- ElevenLabs volá iba `processes/_lib/tts.mjs` (cache podľa textu, ten istý text sa neplatí dvakrát).
- PM MCP skracuje odpovede na 25 000 znakov: strojová verzia scenára je v prílohe `<slug>_script-vN.json`, nie v description.

## Keď niečo nejde
- Claude Code na serveri musí byť prihlásený. Trvalo: `claude setup-token` → `~/.aios-runner/secrets.env` `CLAUDE_SETUP_TOKEN=...` (runner ho dá procesom ako predplatné). Výpadok stráži `processes/claude-auth-watch` (úloha v AI Bugs + hovor).
- Chyby behov idú do AI Bugs (runner). Stav úlohy v pipeline: `/home/marek/impofai-content/state/pipeline/<KEY>.json`.
- Ručný beh: `node runner/run.mjs run <proces> [--input súbor.json] [--dry-run]`.
