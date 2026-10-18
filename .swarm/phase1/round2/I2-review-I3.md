# I2 → review I3 (hlas: voice-call, inbound-call, callback)

Iba čítanie. Testy bežali s `VOICE_NO_CALL=1 --dry-run` a `AIOS_RUNNER_HOME` v scratchpade, žiadny hovor nevznikol:
- `run callback --dry-run` s `depth: 1`: `call.json` má `status: dry-run`, followup sa nespustil;
- `run callback --dry-run` s `depth: 3`: zápis do `pending-callback.dry.json` v behu;
- `callGuard` na hranách 20:59, 21:00, 7:29, 7:30 a pre brief o 6:00 vracia správne výsledky.

## Čo sedí (bez výhrad)
- **Reťaz callback → followup → executor → callback:**
  - `depth` = počet callbackov v reťazi vrátane aktuálneho;
  - callback ho odovzdá followupu nezmenený, `call-followup/lib.mjs` a `action-executor` pridajú +1;
  - callback odmietne `depth > 2`;
  - kontrola je dvojitá a konzistentná.
- **Volajúci:**
  - `caller {external_number, verified}` a `caller_verified` zodpovedajú K4;
  - regex `VERIFIED_IDENTITY` neprepustí `mtothauto`;
  - `lib.mjs` (I2) som zosúladil na ten istý regex a berie iba `external_number`. Pole `caller.how` obsahuje text „mtoth“, takže hľadanie v celom objekte by prepustilo každého. To bola chyba na mojej strane, je opravená.
- **Dry-run:** `pending-callback` v dry-run ide do run dir. Runner teraz vynúti dry-run aj z env (`envForcesDry`).

## Nálezy

### 1. Dry-run je „fail-open“: hovor odíde vždy, keď chýba `RUN_DRY`
- **Kde:** `runner/voice-call.mjs:37` (`isDry`), `:137` (jediná brána pred `POST /sip-trunk/outbound-call`).
- **Čo je zle:** `isDry()` je `true` iba pri `RUN_DRY === "1"` alebo `VOICE_NO_CALL === "1"`. Bez premenných (`RUN_DRY` unset) hovor odíde. Overené: `isDry()` vráti `false` pri nenastavenom `RUN_DRY`.
- **Scenár zlyhania:**
  - Spustenie `node processes/callback/after.mjs` priamo pri ladení, test, ktorý importuje `voice-call.mjs`, alebo starší/iný runner, ktorý `--dry-run` nepozná, zavolá Marekovi naostro.
  - Presne takto vyzerá incident `~/.aios-runner/runs/callback/2026-10-18T14-45-33-674Z`:
    - beh bez prípony `-dry`, s testovacím vstupom (`source_run: "test-run"`, IMP-1500);
    - je tam `call-variables.json`, ale chýba `run.json` aj `call.json` (proces zabitý počas čakania na hovor).
- **Návrh opravy (fail-closed):**
  - `isDry = () => process.env.RUN_DRY !== "0" || process.env.VOICE_NO_CALL === "1"`. Runner v `runAfter` nastavuje `RUN_DRY: "0"` pri ostrom behu výslovne, takže ostré behy cez runner sa nezmenia;
  - pre istotu vyžadovať aj `RUN_ID`, aby sa dalo volať iba z after-stepu runnera.
- **Závažnosť:** blocker.

### 2. Hovor sa zaeviduje až po skončení, takže limity a audit sa dajú obísť
- **Kde:** `runner/voice-call.mjs:148–193` (`recordUsage` až po 40-minútovom pollingu), `:155–163` (nedostupný telefón sa neeviduje).
- **Čo je zle:**
  - Pred `POST` nevznikne žiadny záznam. `callbacks` sa pripočíta až na konci a pre každý pokus zvlášť.
  - Pokusy so SIP 408/480/486 sa nezapíšu vôbec.
- **Scenár zlyhania:**
  - Proces spadne alebo ho zabije `afterTimeoutMin` počas hovoru (incident vyššie: chýba `voice-usage.json` aj `call.json`). Hovor sa nezaráta do 3/deň ani do 60 min a neostane po ňom stopa.
  - Nezdvihnutý callback s `retries: 1` zje 2 z 3 denných callbackov.
  - Vypnutý telefón nezje nič, takže limit nič nebrzdí.
- **Návrh opravy:**
  - pred `POST` zapísať `call.json {status: "placing", at, kind}`;
  - `recordUsage` volať pri **začatí** behu (callback = +1 za beh, nie za pokus);
  - na konci doplniť sekundy;
  - nedostupné pokusy evidovať s `secs: 0`.
- **Závažnosť:** major.

### 3. Opakovaný pokus po 10 minútach nekontroluje `callGuard`
- **Kde:** `runner/voice-call.mjs:147` (`retryAfterMin`). Guard sa volá iba raz, v `processes/callback/after.mjs:36`.
- **Čo je zle:** druhý pokus môže padnúť do tichých hodín alebo za minútový strop.
- **Scenár zlyhania:** callback o 20:55 Marek nezdvihne, druhý pokus zazvoní o 21:05.
- **Návrh opravy:**
  - `placeCallAndWait` pred každým pokusom s `attempt > 0` zavolá `callGuard({kind})`, keď nejde o `QUIET_EXEMPT`;
  - pri zamietnutí končí ako „not answered“, takže obsah ide do `pending-callback`;
  - alternatíva: `retries: 0` pre callback.
- **Závažnosť:** minor.

### 4. Neoverení volajúci míňajú denný strop minút
- **Kde:** `processes/inbound-call/after.mjs:69` (`recordUsage` pre každý prichádzajúci hovor, aj neoverený).
- **Čo je zle:** strop 60 min/deň je spoločný. Cudzí volajúci ho vie vyčerpať.
- **Scenár zlyhania:** niekto (alebo spam) volá na Linphone číslo spolu hodinu. Všetky Marekove callbacky v ten deň skončia v `pending-callback` s `daily-minute-cap`.
- **Návrh opravy:**
  - neoverené hovory evidovať zvlášť (`unverified_secs`) a do stropu callbackov ich nerátať, alebo im dať vlastný strop;
  - pri prekročení poslať hlásenie do AI Bugs;
  - obmedziť dĺžku neoverených hovorov v ElevenLabs agentovi (`max_duration`).
- **Závažnosť:** minor (obsah sa nestratí, dostane ho brief).

### 5. Inbound: duplicitný followup pri páde medzi spustením a uložením kurzora
- **Kde:** `processes/inbound-call/after.mjs:76–91`. Najprv `startFollowup`, potom `processed.add` + `save()`. Do toho `afterTimeoutMin: 5` s HTTP timeoutmi 60 s.
- **Čo je zle:** keď proces zabije timeout alebo zlyhá zápis kurzora po spustení followupu, ďalší tick ten istý hovor spracuje znova.
- **Scenár zlyhania:** dva followupy toho istého hovoru vedú k dvom executorom, takže úloha vznikne dvakrát (mazanie druhýkrát zlyhá bez škody).
- **Návrh opravy:**
  - pred spustením zapísať id do `processed` so stavom `spawning`, po spustení `spawned`;
  - pri `spawning` z minulého behu skontrolovať, či v run dir existuje `followup-<id>-input.json`, a nespúšťať znova;
  - z mojej strany ako druhá poistka: `call-followup/after.mjs` môže odmietnuť `conversation_id`, ktorý už je v `~/.aios-runner/logs/actions.jsonl` s `dry_run: false` (pridám v ďalšom kole, ak orchestrátor súhlasí).
- **Závažnosť:** minor.

### 6. Inbound: hovor „uviaznutý“ viac ako 3 h sa ticho zahodí
- **Kde:** `processes/inbound-call/after.mjs:55`.
- **Čo je zle:** hovor sa označí ako spracovaný bez followupu aj bez hlásenia.
- **Scenár zlyhania:** výpadok ElevenLabs (stav `processing` dlhšie ako 3 h) a Marekov hovor s úlohami sa stratí.
- **Návrh opravy:** pri `stuck` poslať hlásenie (`reportIssue`) s `conversation_id`, alebo ho dať do `pending-callback`, aby ho spomenul brief.
- **Závažnosť:** minor.

### 7. `voice-interview` volá bez `kind` a bez guardu
- **Kde:** `processes/voice-interview/after.mjs:21`. Mimo K7, len pre úplnosť.
- **Čo je zle:** eviduje sa ako `kind: "unknown"` a nekontrolujú sa tiché hodiny.
- **Návrh opravy:** `kind: "interview"` + `callGuard`.
- **Závažnosť:** minor.

## Zhrnutie
- Blocker je bod 1: brána dry-run musí byť fail-closed, inak sa incident zopakuje pri prvom ručnom ladení.
- Bod 2 (evidencia pred hovorom) je druhý najdôležitejší, lebo bez neho nefungujú limity ani audit pri páde.
- Formáty medzi procesmi (`depth`, `caller`, `caller_verified`, `kind`) sú v poriadku.
