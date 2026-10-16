# Ranný brief

Každý deň o 9:00 slovenského času zavolá hlasový agent Marekovi na Linphone (`mtoth`). Povie, čo je nové od posledného briefu, čo urobiť dnes, nápady na projekty a navrhované e-maily a meetingy. Beží ako proces `processes/morning-brief/` v [[ai-runner]]. Rozhodnutia: [[decisions/log]] (2026-10-16, B1 a B2).

## Priebeh

| Čas (SK) | Krok |
|---|---|
| 8:30 | cron tick spustí `claude -p` (Sonnet, len čítacie nástroje) |
| ~8:31 | zber z PM, Gmailu, kalendára a Fireflies, výstup podľa `schema.json` (prvý test: 59 s) |
| 9:00 | `after.mjs` zavolá ElevenLabs SIP trunk outbound call |
| 9:00–9:10 | hovor; nezdvihnutý sa raz zopakuje po 10 minútach |

Zber má limit 25 minút. Ak nestihne, beh zlyhá a v AI Bugs pribudne úloha. Neskorý hovor s polovičnými dátami teda nikdy nepríde.

## Obdobie

Od `lastSuccessAt` (posledný úspešný brief) po teraz. Prvý beh pokrýva 24 hodín. Keď brief jeden deň vypadne, ďalší pokryje oba dni.

## Zdroje a šum

| Zdroj | Nástroj | Šum, ktorý sa vynecháva |
|---|---|---|
| PM second brain log | `pm_list_brain_log` (`since`) | system importy, indexovanie, drobné opravy |
| PM hovory a výťahy | `pm_list_brain_calls`, `pm_read_brain_note`, `pm_list_brain_call_queue` | hovory mimo okna |
| PM notifikácie | `pm_list_notifications` | jednotlivé zmeny stavu, zoskupujú sa po projektoch |
| PM moje úlohy | `pm_list_my_tasks` | blokované úlohy bez zmeny |
| PM aktivita v projektoch | `pm_list_tasks` (`updated_at`) | drobné presuny |
| Gmail `impofai.toth@gmail.com` | `search_threads` (`after:` unix čas), `get_thread` | Make.com, ClickUp, Meta, ElevenLabs, newslettre, denný report Bridgit, noreply |
| Kalendár `impofai.ai@gmail.com` | `list_events` (dnes a zajtra) | — |
| Fireflies | `fireflies_get_transcripts` | doplnok, keď hovor ešte nie je v PM |

Ak zdroj zlyhá, brief ide aj tak a v `sources_checked` je zlyhanie zapísané. Agent o ňom vie z podrobností. Ak sa nezavolá niektorý z povinných zdrojov (brain log, notifikácie, moje úlohy, Gmail, kalendár), beh zlyhá.

## Odkiaľ je ktorá informácia

Každá položka briefu má v `sources` systém, identifikátor (kľúč úlohy, id vlákna, cesta poznámky) a čas. Bez zdroja ju schéma neprijme.

Na serveri je pri každom behu v `~/.aios-runner/runs/morning-brief/<beh>/`:

- `output.json`: celý brief so zdrojmi;
- `call-variables.json`: presne to, čo dostal agent;
- `call.json` a `call-1-transcript.json`: priebeh a prepis hovoru;
- `transcript.jsonl`: všetky volania nástrojov počas zberu.

## ElevenLabs

- Agent **IMPOFAI - Ranný brief** (`agent_7701m5254wcqektavn4skbrdn86n`):
  - hovorí po slovensky hlasom `lcMyyd2HUfFzxdCaC4Ta`;
  - LLM Gemini 3 Flash s teplotou 0;
  - má nástroj `end_call`, aby mohol hovor sám ukončiť.
- Prompt smie čerpať len z `{{brief_text}}` a `{{brief_details}}`. Na všetko ostatné odpovie „To v dnešnom briefe nemám.“
- Prvá veta: „Dobré ráno, Marek. Tu je tvoj ranný brief za obdobie {{brief_period}}. Začnem tým, čo je nové.“
- Číslo: Linphone trunk `phnum_1901m4zry0ehf5gtm609k8p4yqak` (`sip.linphone.org`, TLS, používateľ trunku `mtothauto`), cieľ `to_number: "mtoth"`. Pre prichádzajúce hovory ostáva priradené agentovi „IMPOFAI - manager“.
- Hovor sa spúšťa REST volaním `POST /v1/convai/sip-trunk/outbound-call` s `ELEVENLABS_API_KEY` zo `~/.aios-runner/secrets.env`. Hostovaný ElevenLabs MCP nástroj na odchádzajúci hovor nemá.

## Ručné spustenie

`node runner/run.mjs run morning-brief` na serveri zavolá hneď, bez čakania na 9:00. Úspešný ručný beh posunie obdobie ďalšieho briefu.

## Neskôr (mimo rozsahu teraz)

- Akcie počas hovoru (úlohy, volanie developerom, koncepty e-mailov, meetingy, úpravy kódu): server tools na agentovi, ktoré volajú endpoint v PM (AI chat s OpenAI Agents SDK).
- Otázky agenta počas hovoru: nástroj `ask_brain` → vyhľadávanie v second braine.
- Indexovanie prepisu hovoru do second brainu: ElevenLabs post-call webhook → PM.
- `comms[]` má štruktúru (komu, o čom, prečo), takže z neho pôjdu robiť koncepty priamo.
