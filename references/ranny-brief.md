# Ranný brief

Každý deň o 9:00 slovenského času zavolá hlasový agent Marekovi na Linphone (`mtoth`). Povie, čo sa urobilo po hovoroch od posledného briefu, čo je nové vo všetkých aktívnych projektoch, čo urobiť dnes, nápady na projekty, navrhované e-maily a meetingy a otázky z fronty otvorených otázok. Beží ako proces `processes/morning-brief/` v [[ai-runner]]. Rozhodnutia: [[decisions/log]] (2026-10-16, B1 a B2).

## Priebeh

| Čas (SK) | Krok |
|---|---|
| 8:30 | cron tick spustí `claude -p` (Sonnet, len čítacie nástroje) |
| ~8:31 | zber z PM, second brainu, Gmailu, kalendára a Fireflies, výstup podľa `schema.json` (cieľ do 15 min, limit 25) |
| 9:00 | `after.mjs` zavolá ElevenLabs SIP trunk outbound call |
| 9:00–9:10 | hovor; nezdvihnutý sa raz zopakuje po 10 minútach |
| po hovore | `call-followup` (návrh akcií, zápis do second brainu) → `action-executor` → prípadne spätný hovor |

Zber má limit 25 minút. Ak nestihne, beh zlyhá a v AI Bugs pribudne úloha. Neskorý hovor s polovičnými dátami teda nikdy nepríde.

## Obdobie

Od `lastSuccessAt` (posledný úspešný brief) po teraz. Prvý beh pokrýva 24 hodín. Keď brief jeden deň vypadne, ďalší pokryje oba dni.

## Čo brief obsahuje (v3, fáza 1)

| Časť | Odkiaľ | Čo agent povie |
|---|---|---|
| Odložené zo spätného hovoru | `~/.aios-runner/state/pending-callback.json` (píše `processes/callback`, keď nemohol volať) | blok „Odložené zo spätného hovoru“ na začiatku |
| Po hovoroch od posledného briefu | `{{followups}}` = všetky úspešné `call-followup` od posledného briefu, `{{executions}}` = výstupy `action-executor` (režim `since`, K3) | pri každom hovore: čo sa urobilo (`executed`), čo nie a prečo (`skipped`), čo čaká na schválenie |
| Bugy | všetky task listy AI Bugs | kľúč, názov, riešiteľ |
| Projekty | `pm_get_workspace_tree` (`delivery`, `labs`) | **všetky aktívne projekty** (aspoň 1 otvorená úloha alebo potvrdené priradenie). So zmenami: zhrnutie a priority. Bez zmeny: „bez zmeny od …, otvorené N, najbližší termín, kto“ |
| Úlohy | `pm_list_tasks`, `pm_get_task` | pri každej úlohe kľúč, názov, popis v 1–2 vetách, riešiteľ, stav, termín (v podrobnostiach) |
| Aliasy a tím | `context/projekty-a-tim.md` | napr. Zacharides = Imagewell; potvrdené priradenie ľudí (`owners`). Na priradenie sa brief už nepýta, ak je potvrdené |
| E-maily | Gmail | odosielateľ, adresa príjemcu, **účet** (služba, organizácia, kľúč), obsah s číslami |
| Otázky | `context/otvorene-otazky.md` (K6, píše `call-followup`) | 2–3 najstaršie otvorené otázky s id `Q-…`, potom nové otázky zo zberu (spolu max 6) |

Pokyny pre hlasového agenta (`call_instructions`):

- najprv krátko, detaily na požiadanie (úlohy s kľúčom a názvom, e-maily s účtom);
- pri nejasnom mene človeka alebo projektu sa dopýta („Myslíš projekt Zacharides, teda Imagewell?“), nehádá;
- pred koncom hovoru zopakuje každú dohodnutú akciu s ID úlohy (výslovná výnimka z pravidla agenta „kľúče len na požiadanie“) (alebo projektom a task listom pri novej), menom riešiteľa a termínom a pri každej čaká na „áno“. Nepotvrdená akcia sa nevykoná.

Odložený spätný hovor sa z `pending-callback.json` vymaže, len keď agent hovor ukončil sám (`end_call`, teda po zhrnutí) a hovor trval aspoň 60 s. Zmažú sa iba položky, ktoré agent dostal, kópia ostane v behu ako `pending-callback.json`. Krátky alebo prerušený hovor, nezdvihnutý brief a dry-run ich nechajú, takže sa radšej zopakujú, než stratia. Pri odložených výsledkoch agent povie kľúč úlohy a pri neurobených aj dôvod.

**Nezdvihnutý brief neposúva obdobie.** `after.mjs` zapíše `{"advance": false}` do `RUN_ADVANCE_FILE` a runner nechá `lastSuccessAt` (stav `ok:not-delivered`). Ďalší brief tak pokryje to isté obdobie vrátane hovorov a výsledkov executora.

**Veľkosť podrobností:** `call_details` má rozpočet 28 000 znakov (celý prompt agenta ide LLM pri každom turne). Pri prekročení sa skracuje v tomto poradí:
1. otvorené úlohy projektov bez zmeny;
2. otvorené úlohy projektov so zmenami;
3. popisy zmenených úloh (ostane kľúč, názov, stav, riešiteľ, termín);
4. detaily nápadov a navrhovanej komunikácie.

Nikdy sa neskracujú bugy, odložené a hovory, projekty, nové úlohy, e-maily, Marekove úlohy na dnes ani otázky. Popis úlohy má najviac 300 znakov a obsah e-mailu 1 500 znakov (aj `maxLength` v schéme).

Otázky sa deduplikujú podľa `id` aj podľa textu. Id otázok (`Q-…`) sú len v podrobnostiach, do reči sa neposielajú.

## Zdroje a šum

| Zdroj | Nástroj | Šum, ktorý sa vynecháva |
|---|---|---|
| PM second brain log | `pm_list_brain_log` (`since`) | system importy, indexovanie, drobné opravy |
| PM hovory a výťahy | `pm_list_brain_calls`, `pm_read_brain_note`, `pm_list_brain_call_queue` | hovory mimo okna |
| PM notifikácie | `pm_list_notifications` | jednotlivé zmeny stavu, zoskupujú sa po projektoch |
| PM moje úlohy | `pm_list_my_tasks` | blokované úlohy bez zmeny |
| PM aktivita v projektoch | `pm_list_tasks` (`updated_at`) | drobné presuny |
| PM štruktúra | `pm_get_workspace_tree` (`delivery`, `labs`) | prázdne priečinky bez úloh a bez priradenia |
| Projekty bez zmeny | `pm_list_tasks` (`folder`, otvorené, podľa termínu) | — |
| Tím, aliasy, otázky | `pm_read_brain_note` `context/projekty-a-tim.md`, `context/otvorene-otazky.md` | zodpovedané otázky |
| Gmail `impofai.toth@gmail.com` | `search_threads` (`after:` unix čas), `get_thread` | Make.com, ClickUp, Meta, ElevenLabs, newslettre, denný report Bridgit, noreply |
| Kalendár `impofai.ai@gmail.com` | `list_events` (dnes a zajtra) | — |
| Fireflies | `fireflies_get_transcripts` | doplnok, keď hovor ešte nie je v PM |

Ak zdroj zlyhá, brief ide aj tak a v `sources_checked` je zlyhanie zapísané. Agent o ňom vie z podrobností. Ak sa nezavolá niektorý z povinných nástrojov (`pm_get_workspace_tree`, `pm_list_tasks`, notifikácie, moje úlohy, Gmail, kalendár), beh zlyhá. Chýbajúca poznámka `context/otvorene-otazky.md` nie je chyba.

## Odkiaľ je ktorá informácia

Každá položka briefu má v `sources` systém, identifikátor (kľúč úlohy, id vlákna, cesta poznámky) a čas. Bez zdroja ju schéma neprijme.

Na serveri je pri každom behu v `~/.aios-runner/runs/morning-brief/<beh>/`:

- `output.json`: celý brief so zdrojmi;
- `call-variables.json`: presne to, čo dostal agent (`first_message`, `call_instructions`, `call_content`, `call_details`);
- `call.json` a `call-1-transcript.json`: priebeh a prepis hovoru;
- `transcript.jsonl`: všetky volania nástrojov počas zberu.

## ElevenLabs

- Agent **IMPOFAI - Ranný brief** (`agent_7701m5254wcqektavn4skbrdn86n`):
  - hovorí po slovensky hlasom `lcMyyd2HUfFzxdCaC4Ta`;
  - LLM Gemini 3 Flash s teplotou 0;
  - má nástroj `end_call`, aby mohol hovor sám ukončiť.
- Premenné hovoru: `call_instructions`, `call_content`, `call_details`, `first_message`, `call_date` (zostavuje `after.mjs`). Na všetko mimo nich agent odpovie, že to v briefe nemá.
- Prvá veta: „Dobré ráno, Marek. Mám pre teba ranný brief za obdobie …. Môžem začať?“
- Číslo: Linphone trunk `phnum_1901m4zry0ehf5gtm609k8p4yqak` (`sip.linphone.org`, TLS, používateľ trunku `mtothauto`), cieľ `to_number: "mtoth"`. Pre prichádzajúce hovory ostáva priradené agentovi „IMPOFAI - manager“.
- Hovor sa spúšťa REST volaním `POST /v1/convai/sip-trunk/outbound-call` s `ELEVENLABS_API_KEY` zo `~/.aios-runner/secrets.env`. Hostovaný ElevenLabs MCP nástroj na odchádzajúci hovor nemá.

## Ručné spustenie

- `node runner/run.mjs run morning-brief` na serveri zavolá hneď, bez čakania na 9:00. Úspešný ručný beh posunie obdobie ďalšieho briefu.
- `node runner/run.mjs run morning-brief --dry-run` urobí celý zber, zostaví `call-variables.json` a `call.json` so `status: "dry-run"`, ale nezavolá, nespustí followup, nevymaže odložený spätný hovor a neposunie obdobie. Rovnako sa správa pri `VOICE_NO_CALL=1`. Beh je v `runs/morning-brief/<čas>-dry/`.

## Neskôr (mimo rozsahu teraz)

- Akcie počas hovoru (úlohy, volanie developerom, koncepty e-mailov, meetingy, úpravy kódu): server tools na agentovi, ktoré volajú endpoint v PM (AI chat s OpenAI Agents SDK).
- Otázky agenta počas hovoru: nástroj `ask_brain` → vyhľadávanie v second braine (dnes len fronta `context/otvorene-otazky.md`).
- Indexovanie prepisu hovoru do second brainu: ElevenLabs post-call webhook → PM.
- `comms[]` má štruktúru (komu, o čom, prečo), takže z neho pôjdu robiť koncepty priamo.
