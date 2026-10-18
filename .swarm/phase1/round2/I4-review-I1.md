# I4 → review I1 (runner: core, run, cron, spawn, pm, test)

Read-only. Žiadny živý beh, žiadny hovor.

**Testy:** `node --test 'runner/test/*.test.mjs'` → 30/30 pass (12,3 s). Testy bežia v dočasnom `AIOS_RUNNER_HOME` s falošným `claude`, reálny stav sa nemení.

## Čo je v poriadku (overené čítaním kódu)
- **Prechodné chyby `claude -p`** (`core.mjs:375-404`):
  - beh sa opakuje len pri `auth-refresh`/`network`/`rate`;
  - nikdy, ak už bežal zápisový nástroj (`classifyTransient` → `retrySafe`);
  - zápisy z jedného pokusu sa teda v rámci behu nezduplikujú.
- **Staré sloty po obnovení cronu:**
  - `floor = max(now − catchUpMin, lastSlot)` (`run.mjs:79`) spustí najviac slot z posledných `catchUpMin` minút (brief 20 min);
  - staré dni sa nedobiehajú;
  - pri brief so `since` = 17. 10. pokryje prvý beh celé obdobie, čo je správne.
- **Brief o 10:00 namiesto 9:00:**
  - retry má termín `deliverAt + 30 min` (9:30) a `pendingRetryDue` ho kontroluje aj v ticku;
  - 10:00 som nenašiel (len oneskorenie do ~9:40, pozri nález 6).
- **Fail-safe dry-run:**
  - `envForcesDry` (RUN_DRY / VOICE_NO_CALL) vyhrá v `main`, `runProcess`, `runAfter` (`RUN_DRY` sa nikdy nezníži) aj v `spawnProcess`;
  - `reportIssue`/`noteRecovered` v dry-run nepíšu;
  - stav sa nemení, mení sa len `lastDryRun`. Overil som to aj na reálnom stave po mojich 3 dry-run briefoch: `lastSuccessAt` ostal 17. 10.
- **`since`:**
  - používa `finishedAt > lastSuccessAt` (štart) aktuálneho procesu a kontext sa skladá na začiatku behu;
  - followup, ktorý dobehne počas zberu briefu, sa tak nestratí, príde v ďalšom briefe;
  - `pruneRuns` chráni posledných 20 behov z `successRuns`.

## Nálezy

### 1. Úspešný beh nezruší naplánovaný retry → druhý ranný hovor
- **Kde:**
  - `run.mjs:66-77` (tick spustí `pendingRetry`);
  - `run.mjs:163-168` (zápis `pendingRetry`);
  - `core.mjs:451-457` (úspech `pendingRetry` nemaže).
- **Čo je zle:** `pendingRetry` zruší len samotný tick, keď ho spustí alebo keď je neskoro. Úspešný beh toho istého procesu (ručný alebo iný) ho nechá v stave.
- **Scenár zlyhania:**
  1. 8:30 brief zlyhá na OAuth (`claude-error`/`auth`) a zapíše sa `pendingRetry` na 8:43.
  2. Marek alebo orchestrátor o 8:35 spustí `node runner/run.mjs run morning-brief`, ten zavolá hneď a uspeje.
  3. Tick o 8:45 spustí `run-scheduled --retry` a ten o 9:00 zavolá **druhý brief**, navyše s obdobím „od 8:35“.
  - Rovnako to dopadne, ak by retry naplánoval skorší beh a medzitým by uspel retry iného druhu.
- **Návrh opravy:**
  - v `runProcess` pri úspechu (nie dry-run) zapísať aj `pendingRetry: null`;
  - v ticku pred spustením retry preskočiť, ak `st.lastSuccessAt > st.pendingRetry.failedAt` (alebo `failedRunId` ≠ `lastRunId`);
  - test: zlyhaný slot → ručný úspech → tick nespustí retry.
- **Závažnosť:** major (dvojitý hovor Marekovi; reálne pravdepodobné práve pri ručnom „oprav a spusti“ po rannom výpadku).

### 2. Nezdvihnutý brief posunie `lastSuccessAt` → výsledky hovorov sa Marekovi nikdy nepovedia
- **Kde:**
  - `core.mjs:451-457` (úspech = posun `lastSuccessAt`);
  - `core.mjs:283-296` (`outputsSince` od `lastSuccessAt`);
  - spolu s `processes/morning-brief/after.mjs` (nezdvihnutý hovor = exit 0, tak to vyžaduje dnešný návrh).
- **Čo je zle:** obdobie kontextu `since` sa viaže na úspech behu, nie na doručenie. Ak Marek brief nezdvihne, beh je úspešný a ďalší brief vidí len followupy od dnešných 8:30.
- **Scenár zlyhania:**
  1. Večer 20:00 prebehne prichádzajúci hovor, followup a executor; spätný hovor sa kvôli tichým hodinám odloží.
  2. Ráno brief všetko zostaví, Marek nezdvihne (2 pokusy) a beh je `ok`.
  3. Zajtrajší brief má `since` = dnes 8:30, takže večerné `executed`/`skipped` (a nové PM zmeny z toho okna) sa **nikdy** nepovedia.
  - Odložený spätný hovor v `pending-callback.json` som v `after.mjs` ošetril (maže sa až po zdvihnutí). Followupy a executions ide ošetriť len v runneri.
- **Návrh opravy:**
  - after-step dá najavo „nedoručené“, napr. zapíše `RUN_DIR/advance-since.json {"advance": false}` alebo ukončí sa kódom 3 = ok, ale neposúvať;
  - runner potom beh započíta do `successRuns`, ale `lastSuccessAt` nechá;
  - I4 to v `after.mjs` doplní, keď I1 určí mechanizmus (1 riadok);
  - alternatíva: osobitný `contextSinceAt`.
- **Závažnosť:** major (cieľ fázy 1 „výsledky všetkých hovorov od posledného briefu“).

### 3. Neatomický zápis stavu a `readState` → `{}` pri chybe môžu zmazať `lastSuccessAt`, `successRuns` aj `pendingRetry`
- **Kde:** `core.mjs:110-121`.
- **Čo je zle:**
  - `writeState` je read-modify-write bez zámku s priamym `writeFileSync`;
  - `readState` vráti pri neúplnom alebo poškodenom JSON `{}` a ďalší `writeState` potom zapíše `{}` + patch;
  - do toho istého súboru pritom píšu tick (`lastSlot`, `pendingRetry`) aj bežiaci proces (`lastSuccessAt`, `successRuns`).
  - Číta ho aj iný proces: brief cez `outputsSince('call-followup')`.
- **Scenár zlyhania:**
  - tick o 9:10 zapíše `lastSlot` práve vtedy, keď brief po hovore zapisuje úspech: jeden zápis sa stratí;
  - horší prípad: tick prečíta polozapísaný súbor a uloží ho len s `lastSlot`;
  - následky: brief stratí `lastSuccessAt` (ďalší brief len 24 h), `pendingRetry` sa stratí, alebo pri `inbound-call` (`*/5`, tick aj beh každých 5 min) sa stratí stav.
- **Návrh opravy:**
  - zápis cez dočasný súbor a `rename` (atomický);
  - `readState` pri chybe parsovania vyhodiť a nič neprepísať (`{}` vracať len pri ENOENT);
  - voliteľne krátky zámok `state-<name>` okolo read-modify-write.
- **Závažnosť:** minor až major (nízka pravdepodobnosť, ale tichá strata dát; oprava je ~10 riadkov).

### 4. Prevzatie mŕtveho zámku má súbeh (TOCTOU) a rozbíja ho opakované použitie PID
- **Kde:** `core.mjs:124-147`.
- **Čo je zle:**
  - dvaja čakatelia (`--wait-lock` polluje každých 15 s, napr. followupy z callbacku a inboundu) môžu naraz prečítať mŕtvy PID;
  - A zmaže zámok a vytvorí svoj, B potom zmaže už **A-ho** zámok a vytvorí svoj, takže bežia dva behy toho istého procesu;
  - naopak, ak PID mŕtveho behu medzitým dostane iný proces, zámok sa považuje za živý až do reštartu: `--wait-lock` po 30 min vyprší a plánované behy sa preskakujú s hlásením „overlap“.
- **Scenár zlyhania:**
  - po páde followupu (zámok ostal) prídu dva followupy: oba bežia naraz a `executor` sa spustí dvakrát nad tými istými akciami;
  - executor má síce vlastný zámok, ale ten má rovnakú chybu.
- **Návrh opravy:**
  - pri prevzatí `rename` stale súboru na unikátne meno (vyhrá len jeden), potom `wx`;
  - po zápise overiť, že súbor obsahuje vlastný PID;
  - do zámku písať aj `startedAt` a zámok starší ako `timeoutMin + afterTimeoutMin + 5 min` považovať za mŕtvy aj pri živom PID.
- **Závažnosť:** minor (vyžaduje predchádzajúci pád), ale dopad na executor je duplicitný zápis.

### 5. retrySlot nekontroluje, či prvý pokus už zapisoval
- **Kde:** `run.mjs:161-168`, `cron.mjs:92` (`RETRY_KINDS` obsahuje `timeout` a `claude-error`).
- **Čo je zle:**
  - vnútorné opakovanie má poistku `retrySafe` (žiadne zápisové nástroje), opakovanie celého slotu po 10 min ju nemá;
  - `timeout` (claude zabitý v polovici) alebo `claude-error` po zápisoch sa zopakuje celé.
- **Scenár zlyhania:**
  - dnes sa to netýka (plánované sú len brief, ktorý iba číta, a `inbound-call` s `claude:false` a `*/5` → `next-slot`);
  - prvý plánovaný proces so zápisom (napr. denný report do PM) však po timeoute zapíše dvakrát.
- **Návrh opravy:**
  - `retryDecision` dostane `log.steps.claude.toolCalls`;
  - pri akomkoľvek `!isReadOnlyTool` vráti `{retry:false, reason:"writes"}`;
  - jeden test.
- **Závažnosť:** minor (preventívne).

### 6. Odhad času pre retry po timeoute je podhodnotený
- **Kde:** `run.mjs:35`, `run.mjs:165`, `cron.mjs:116`.
- **Čo je zle:** `estimateMs = lastPrepMs` z posledného úspechu (brief ~3 min). Po `timeout` (25 min) je to zlý odhad.
- **Scenár zlyhania:**
  1. Brief o 8:55 timeoutne, retry je o 9:05 s odhadom 3 min, teda „stihne“ do 9:30.
  2. Retry beží 20+ min a hovor príde ~9:28.
  3. Nezdvihnutý hovor sa opakuje o 10 min (voice-call), teda ~9:38–9:40.
- **Návrh opravy:** pri `kind === "timeout"` brať `estimateMs = max(lastPrepMs, timeoutMin*60_000)`. Pri brief to znamená „po timeoute už retry nie, len hlásenie“.
- **Závažnosť:** minor.

### 7. Obnovenie cronu: starý `pendingRetry` bez termínu sa spustí dni neskôr
- **Kde:** `cron.mjs:121-124`, `run.mjs:66-77`.
- **Čo je zle:**
  - proces bez `deliverAt` má `deadline: null`, takže `pendingRetryDue` ho spustí kedykoľvek, aj po týždni pauzy;
  - pri brief (`deadline` 9:30) sa po pauze vytvorí hlásenie „Opakovaný pokus sa už nestihne“ o starom dni (šum v AI Bugs).
  - Dnes v stave žiadny `pendingRetry` nie je, takže okamžitý dopad je nulový.
- **Návrh opravy:**
  - `pendingRetry` starší ako `RETRY_DELAY_MIN + 60 min` ticho zahodiť (len log);
  - hlásenie posielať len pri retry z dnešného slotu.
- **Závažnosť:** minor.

### 8. `pmTool` nemá dry-run poistku
- **Kde:** `pm.mjs:12`.
- **Čo je zle:**
  - dry-run chránia len `reportIssue` a `noteRecovered`;
  - `pmTool` je exportovaný a ktorýkoľvek `after.mjs` (napr. budúci deterministický executor podľa P3 review „pmTool cez HTTP“) by v dry-run zapisoval do PM.
  - Dnes ho žiadny proces nevolá (overené `grep`).
- **Návrh opravy:** keď je `RUN_DRY=1` a nástroj nie je `isReadOnlyTool`, nevolať ho a vrátiť `{dry_run:true}` + log.
- **Závažnosť:** minor (preventívne, zladí fail-safe s K2).

### Poznámka mimo I1 (pre I3)
- Pri obnovení cronu `inbound-call` (`*/5`) nemá v `state/inbound-call.json` nič okrem `lastDryRun`.
- Odporúčam overiť, že prvý ostrý beh nezoberie **všetky** staré prichádzajúce konverzácie agenta (napr. testy Petry / PlusReality) a nespustí na ne followupy.

## Zhrnutie
- 2× major (1: dvojitý brief po ručnom behu, 2: nezdvihnutý brief stratí výsledky hovorov), 6× minor.
- Blocker nie je. Pred zapnutím cronu odporúčam opraviť 1 a 3; nález 2 vyžaduje dohodu I1 + I4 o signáli „nedoručené“.
