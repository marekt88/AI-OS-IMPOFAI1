# Spúšťač AI procesov (`runner/`)

Opakované AI procesy bežia na serveri `Projektovy-manazment` (rovnaký stroj ako IMPOFAI PM live) cez headless Claude Code `claude -p`, na predplatnom claude.ai Max, nie na API tokenoch. Rozhodnutia: [[decisions/log]] (2026-10-16).

## Ako to beží

- **Cron** (`crontab -l` používateľa `marek`) volá každých 5 minút `node runner/run.mjs tick`.
- **Tick** urobí štyri veci:
  1. `git pull --ff-only` v `/home/marek/brain-src/repo`. Push do `main` je teda nasadenie, do 5 minút je na serveri.
  2. Nájde procesy, ktorým v slovenskom čase (`Europe/Bratislava`, letný čas rieši kód) prišiel slot podľa `schedule`, a každý spustí v samostatnom procese.
  3. Spustí opakovaný pokus zlyhaného slotu, ak prišiel jeho čas (`pendingRetry`, pozri nižšie).
  4. Znova pošle hlásenia chýb, ktoré sa predtým nepodarilo doručiť.
- **Beh procesu:**
  1. Kontrola `claude auth status`. Musí ísť o prihlásenie claude.ai. `ANTHROPIC_API_KEY` a ďalšie premenné, ktoré by prepli účtovanie, runner pred spustením maže. Hodnoty zo `secrets.env` `claude -p` nedostane.
  2. `claude -p` s promptom, povolenými nástrojmi a prípadne s JSON schémou. Pri prechodnej chybe sa opakuje (nižšie).
  3. Voliteľne čakanie na `deliverAt` a krok `after.mjs`.

## Opakovanie pri prechodných chybách

**V rámci jedného behu** (`runner/core.mjs`, `classifyTransient`):
- Opakuje sa, keď `claude -p` zlyhá na:
  - obnove prihlásenia („Failed to refresh OAuth token“, „another Claude Code process is refreshing it“);
  - sieťovej chybe (`ECONNRESET`, `fetch failed`…);
  - 429, 529/overloaded alebo 5xx z API.
- Najviac 3 pokusy, čakanie 60 s a potom 120 s. Opakuje sa aj neúspešný `claude auth status`.
- Pozor: chyba z 18. 10. prišla so `subtype: "success"`, `is_error: true`, `terminal_reason: "api_error"` a textom chyby v `result`. Rozhoduje `is_error` a text, nie `subtype`.
- Neopakuje sa, ak model už zavolal zápisový nástroj (čokoľvek okrem `get/list/search/read/fetch` a `ToolSearch`), aby sa zápis nezdvojil. Dôvod je v `note` pokusu.
- Timeout sa v rámci behu neopakuje.
- Každý pokus je v `run.json` → `steps.claudeAttempts[]` (`attempt`, `at`, `phase`, `ms`, `exitCode`, `subtype`, `isError`, `transient`, `retried`, `note`, `message`). Prepis predchádzajúcich pokusov: `transcript-attemptN.jsonl`.
- Keď zlyhá aj posledný pokus na obnove prihlásenia, chyba je `auth` (hlásenie „obnova prihlásenia zlyhala aj po opakovaní“, odtlačok `runner:auth`). Sieť a 429 ostávajú `claude-error`.

**Zmeškaný naplánovaný slot** (`retrySlot`, `runner/cron.mjs` → `retryDecision`):
- Tick zapisuje `lastSlot` pred behom, preto by zlyhaný slot nikto neopakoval.
- Keď naplánovaný beh skončí chybou `auth`, `claude-error` alebo `timeout`, runner zapíše do `state/<proces>.json` `pendingRetry` (`slot`, `kind`, `at` = o 10 min, `deadline`, `failedRunId`). Tick ho spustí ako `run-scheduled <proces> <slot> --retry`.
- Opakuje sa raz. Opakovaný pokus sa už znova neplánuje.
- Neplánuje sa, ak zlyhaný beh už volal zápisový nástroj (opakovanie by zapisovalo dvakrát).
- Úspešný beh procesu (aj ručný) `pendingRetry` zruší. Tick ho zahodí aj vtedy, keď `lastSuccessAt` je novší ako zlyhanie, alebo keď je o viac než 60 min po svojom čase (pauza cronu).
- Po `timeout` sa ako odhad trvania berie celý `timeoutMin`.
- Neplánuje sa, ak rozvrh procesu má vlastný slot skôr než o 10 min (napr. `*/5`).
- Proces s `deliverAt` a `after.mjs` (brief): ak by druhý pokus mal výstup hotový po `deliverAt` + 30 min, nespustí sa a príde hlásenie „Opakovaný pokus procesu … sa už nestihne“. Odhad trvania je `lastPrepMs` z posledného úspešného behu, inak `timeoutMin`. Rovnaká kontrola prebehne aj v ticku tesne pred spustením.
- Hlásenie prvého zlyhania v AI Bugs uvádza čas ďalšieho pokusu. Pri úspechu pribudne komentár „Obnovené“.

## Pridanie nového procesu

Nový priečinok `processes/<meno>/`. Spúšťač sa nemení.

| Súbor | Povinný | Čo obsahuje |
|---|---|---|
| `process.json` | áno | definícia (nižšie) |
| `prompt.md` | áno | zadanie pre `claude -p`; premenné `{{since}}` (posledný úspešný beh, ISO), `{{now}}`, `{{today}}`, `{{tz}}`, `{{input}}`, `{{dry_run}}` (`"true"`/`"false"`) a premenné z `context` |
| `system.md` | nie | doplnok systémového promptu (rola, pravidlá) |
| `schema.json` | nie | JSON Schema výstupu (`--json-schema`). Ak má pole `ok`, `ok: false` znamená zlyhanie behu |
| `after.mjs` | nie | čo sa stane s výstupom (napr. zavolanie API). Dostane `RUN_OUTPUT`, `RUN_DIR`, `RUN_INPUT`, `RUN_SINCE`, `RUN_MANUAL`, `RUN_DRY` (`1` = testovací beh), `RUN_ID`, `RUN_PROCESS`, `RUNNER`, `RUN_ADVANCE_FILE` a hodnoty zo `secrets.env`. Nenulový exit = zlyhanie. Zápis `{"advance": false}` do `RUN_ADVANCE_FILE` = beh je úspešný, ale nedoručený (napr. nezdvihnutý brief): `lastSuccessAt` sa neposunie, ďalší beh pokryje to isté obdobie, stav `ok:not-delivered` |

`process.json`:

```json
{
  "description": "čo proces robí",
  "enabled": true,
  "schedule": "40 8 * * *",
  "tz": "Europe/Bratislava",
  "model": "sonnet",
  "maxTurns": 30,
  "timeoutMin": 20,
  "allowedTools": ["mcp__claude_ai_Projekt_manazment_-_IMPOFAI__pm_list_brain_log"],
  "requireTools": ["mcp__claude_ai_Projekt_manazment_-_IMPOFAI__pm_list_brain_log"],
  "builtinTools": [],
  "deliverAt": "09:00",
  "catchUpMin": 30,
  "firstSinceHours": 24
}
```

- `schedule`: cron s 5 poľami v `tz`. Hodnota `null` znamená iba ručné spúšťanie.
- `allowedTools`: presné mená MCP nástrojov. Nič iné proces nesmie (`--permission-mode dontAsk`). Zápisové nástroje sem nedávaj, kým to proces nepotrebuje.
- `requireTools`: nástroje, ktoré sa musia úspešne zavolať. Ak sa nezavolajú, beh je neúspešný, aj keď model niečo napísal.
- `builtinTools`: vstavané nástroje (`Read`, `Bash`…). Štandardne žiadne, `ToolSearch` je vždy zapnutý, inak by sa načítali schémy všetkých konektorov naraz a prompt pretiekol.
- `cwd`: `"repo"` spustí proces v repozitári, čím sa načíta `CLAUDE.md`. Inak beží v prázdnom pracovnom priečinku.
- `dryRunAllowedTools`, `dryRunRequireTools` (voliteľné): v dry-run nahradia `allowedTools` a `requireTools`. Keď chýba `dryRunRequireTools` a `dryRunAllowedTools` je zadané, v dry-run sa vyžadujú len tie nástroje z `requireTools`, ktoré `dryRunAllowedTools` povoľuje (prefix servera pokrýva jeho nástroje). Bez týchto polí platí to isté ako naživo.
- `keepRuns`: koľko behov držať (predvolene 30). `call-followup` a `action-executor` majú 365, lebo `output.json` je doklad potvrdení.
- `claude: false`: bez kroku `claude -p`, výstupom je JSON vstup (`--input`).
- `context`: výstupy iných procesov ako premenné promptu:
  - `{ "var": "last_followup", "process": "call-followup" }` (režim `last`, predvolený): posledný úspešný výstup, alebo text „(žiadny predchádzajúci výstup)“.
  - `{ "var": "followups", "process": "call-followup", "mode": "since" }`: JSON pole `[{ runId, at, finishedAt, output }]` všetkých úspešných behov, ktoré skončili po `{{since}}` (`lastSuccessAt`) aktuálneho procesu. Najstaršie prvé, najviac 20 najnovších (`"max"` to vie znížiť). Prázdne = `[]`. Dry-run behy sa nerátajú.
  - Ktoré behy išli do kontextu: `run.json` → `context`.

## Ručné spúšťanie a testovací režim

- `node runner/run.mjs run <meno> [--input súbor.json] [--dry-run] [--wait-lock]`: beh hneď, nečaká na `deliverAt`.
- `node runner/run.mjs list`: definície, rozvrhy, posledné výsledky, `pendingRetry` a posledný dry-run.

**`--dry-run`** (alebo env `RUN_DRY=1` či `VOICE_NO_CALL=1`):
- Poistka: keď proces zdedí `RUN_DRY=1` alebo `VOICE_NO_CALL=1`, alebo keď je vstup (`--input`) JSON s `"dry_run": true`, beh je vždy dry-run bez ohľadu na prepínače aj voľby `runProcess`. `RUN_DRY` sa v `after.mjs` nikdy neprepíše na `0`.
- `claude -p`, `after.mjs` aj procesy spustené cez `spawnProcess` dostanú `RUN_DRY=1`. V prompte `{{dry_run}}` = `"true"`, v logu `dryRun: true`.
- Beh je v `runs/<proces>/<čas>-dry/`. Dry-run behy sa držia zvlášť (posledných 20) a nevytláčajú ostré behy.
- Neposúva `lastSuccessAt`, `lastSuccessRunId` ani `successRuns`, nemení `lastStatus`. Zapíše len `lastDryRun`.
- Neposiela hlásenia do AI Bugs ani komentáre „Obnovené“ (`reportIssue` v dry-run nič neodošle, len vypíše).
- Nevolať telefón a nezapisovať do PM ani second brainu je úloha procesu (`after.mjs` podľa `RUN_DRY`, prompt podľa `{{dry_run}}`, prípadne `dryRunAllowedTools`). `pmTool()` z `runner/pm.mjs` zápisy v dry-run neposiela (nižšie).

**PM cez HTTP z `after.mjs`** (`runner/pm.mjs`):
- `pmTool(name, args, { token, tokenEnv })` zavolá jeden PM MCP nástroj priamo, bez Claude.
- Token:
  - `token` (explicitná hodnota) má prednosť;
  - potom `tokenEnv`, meno tajomstva zo `secrets.env`, napr. `"PM_ACTIONS_TOKEN"`. Ak chýba, volanie zlyhá a na iný token sa neprepne;
  - inak `PM_MCP_TOKEN` (token na hlásenie chýb).
- `hasSecret(name)` povie, či tajomstvo existuje, a jeho hodnotu nevráti.
- V dry-run `pmTool` zápisový nástroj (všetko okrem `get/list/search/read/fetch`) nepošle a vráti `{ dry_run: true, tool, args }`. Čítacie nástroje fungujú normálne.

**`--wait-lock`:** keď proces práve beží, beh čaká na zámok (kontrola každých 15 s, najviac 30 min) namiesto preskočenia. Keď čakanie vyprší, príde hlásenie do AI Bugs (`process:<meno>:lock-wait-timeout`) s príkazom na ručné spustenie s tým istým vstupom. Bez `--wait-lock` sa ručný beh pri bežiacom procese preskočí (exit 2).

## Spustenie procesu z iného procesu (`runner/spawn.mjs`)

```js
import { spawnProcess } from "../../runner/spawn.mjs";
spawnProcess("call-followup", inputObj, { fromRunDir: process.env.RUN_DIR, label: "followup" });
```

- Zapíše `inputObj` do `<fromRunDir>/<label>-input.json`. Ak súbor existuje, použije `<label>-2-input.json` atď.
- Spustí odpojene `node runner/run.mjs run <meno> --input <súbor> --wait-lock`, pri `RUN_DRY=1` aj s `--dry-run`.
- Výpis ide do `<fromRunDir>/<label>.out`.
- Predvolené hodnoty: `fromRunDir` = `RUN_DIR`, `label` = meno procesu.
- Vráti `{ pid, inputFile, outFile, dryRun }`.
- Dieťa nededí hodnoty zo `secrets.env` ani `RUN_*` rodiča (okrem `RUN_DRY`). Tajomstvá si načíta samo.
- Spustený beh má vlastný log, zámok a hlásenie chýb ako ručný beh.

## Čo zabezpečuje spúšťač pre všetky procesy

| Čo | Kde |
|---|---|
| log každého behu (čas, trvanie, výsledok, chyba, volané nástroje, pokusy) | `~/.aios-runner/runs/<proces>/<beh>/run.json`, prepis `transcript.jsonl`, výstup `output.json`; súhrn `~/.aios-runner/logs/runs.jsonl`; posledných `keepRuns` behov (predvolene 30, behy z indexu `successRuns` posledných 20 sa nemažú) |
| čas posledného úspešného behu | `~/.aios-runner/state/<proces>.json` → `lastSuccessAt` (len po úspechu celého behu vrátane `after.mjs`, nie v dry-run) |
| index úspešných behov | `state/<proces>.json` → `successRuns: [{ runId, at, finishedAt }]`, posledných 100; pri prvom použití sa doplní z priečinkov behov |
| opakovanie | prechodné chyby `claude -p` 3 pokusy (60 s, 120 s); zlyhaný slot jeden pokus o 10 min (`pendingRetry`) |
| ochrana proti súbežnému behu | `~/.aios-runner/locks/process-<proces>.lock` (PID a čas; mŕtvy zámok sa prevezme, aj keď PID medzitým dostal iný proces než node; prevzatie cez premenovanie, vyhrá len jeden čakateľ); `--wait-lock` čaká max 30 min |
| stav | `state/<proces>.json` sa zapisuje atomicky (dočasný súbor a `rename`) pod krátkym zámkom; poškodený súbor = chyba behu, nikdy sa ticho neprepíše prázdnym |
| jasné zlyhanie | nenulový exit, `is_error`, limit krokov/času, chýbajúci výstup podľa schémy, `ok:false`, nezavolaný `requireTools`, chyba `after.mjs`, chyba prihlásenia v MCP nástroji |
| hlásenie chýb | úloha typu bug v PM liste **Startups / Projekt Manazment / AI Bugs**, opakovanie = komentár, obnova = komentár „Obnovené“ |
| tajomstvá | `~/.aios-runner/secrets.env` (chmod 600, mimo gitu) |

Hlásenie chýb ide do PM cez obyčajné HTTP volanie PM MCP s vlastným tokenom (`PM_MCP_TOKEN`), nie cez Claude. Funguje teda aj vtedy, keď je problém práve v prihlásení Claude Code. Ak PM nie je dostupné, hlásenie čaká v `~/.aios-runner/state/undelivered.jsonl` a odošle sa pri ďalšom ticku. Hlásia sa aj zlyhaný `git pull`, neplatná definícia, súbežný beh a pád spúšťača. Neodhalí sa len to, že prestane bežať samotný cron.

## Keď niečo prestane fungovať

- **„Claude Code na serveri nie je prihlásený predplatným“**: na serveri spusti `~/.local/bin/claude`, potom `/login`.
- **„MCP konektor potrebuje znova prihlásiť“**: konektor si obnov v nastaveniach konektorov claude.ai.
- **Hlásenia nechodia do AI Bugs**: skontroluj `PM_MCP_TOKEN` v `secrets.env`, potom `node runner/run.mjs report-test`.

## Testovací proces a testy runnera

- `processes/test-pm-identity/` sa spúšťa len ručne. Cez PM MCP prečíta identitu a zapíše ju do `output.json`. Bez zápisov: `node runner/run.mjs run test-pm-identity --dry-run`.
- Testy runnera: `node --test 'runner/test/*.test.mjs'`. Bežia s falošným `claude` (`runner/test/fake-claude.mjs`), dočasným `AIOS_RUNNER_HOME` a dočasnými procesmi (`AIOS_PROCESSES_DIR`). Nevolajú Claude, PM ani telefón a nerobia `git pull` (`AIOS_NO_GIT_PULL=1`).
- Premenné len pre testy: `RUN_RETRY_DELAYS_MS` (napr. `0,0`), `RUN_WAIT_LOCK_MAX_MS`, `RUN_WAIT_LOCK_POLL_MS`.
