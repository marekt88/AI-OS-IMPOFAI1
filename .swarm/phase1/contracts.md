# Fáza 1 – zadanie a kontrakty (orchestrátor, 2026-10-18)

Repo: `/home/marek/brain-src/repo` (git, vetva main). Spúšťač: `runner/`, procesy `processes/`, návod `references/ai-runner.md`. Prečítaj aj `references/ranny-brief.md`.
Plán a recenzie: `.swarm/platform-plan/round1/*.md`, `round2/*.md`.

## Cieľ fázy 1 (overí Marek telefonicky)
1. **Spoľahlivosť:** brief nevypadne kvôli prechodnej chybe prihlásenia (18. 10.: „Failed to refresh OAuth token: another Claude Code process is refreshing it“). Followup sa nestratí kvôli zámku.
2. **Lepší brief:**
   - všetky aktívne projekty aj bez zmien a hlbšie detaily úloh;
   - výsledky všetkých hovorov od posledného briefu;
   - otázky z fronty otvorených otázok;
   - zopakovanie akcií s ID úloh.
3. **Bezpečné vykonávanie po hovore:** followup akcie iba navrhne a zapíše do second brainu. Vykoná ich samostatný proces `action-executor` s úzkym zoznamom nástrojov, ktorý dostane iba štruktúrované akcie, nie e-maily ani prepis.
4. **Marek zavolá agentovi:**
   - prichádzajúci hovor na Linphone číslo prevezme osobný asistent;
   - po hovore followup → executor → spätný hovor s výsledkom a otázkami;
   - akcie len od overeného volajúceho (Marek, `mtoth`).
5. **Spätný hovor** s výsledkom a otázkami, s poistkami: tiché hodiny, denný limit, strop minút.

## Vlastníctvo súborov (nikto nepíše mimo svojich)
- **I1 Spoľahlivosť a runner:** `runner/core.mjs`, `runner/run.mjs`, `runner/cron.mjs`, `runner/pm.mjs`, nový `runner/spawn.mjs`, `references/ai-runner.md`.
- **I2 Followup a executor:** `processes/call-followup/*`, nový `processes/action-executor/*`.
- **I3 Hlas:** `runner/voice-call.mjs`, nové `processes/inbound-call/*` a `processes/callback/*`, konfigurácia ElevenLabs (agent `agent_7701m5254wcqektavn4skbrdn86n`, číslo `phnum_1901m4zry0ehf5gtm609k8p4yqak`).
- **I4 Brief:** `processes/morning-brief/*`, `references/ranny-brief.md`.
- **Orchestrátor:** `CLAUDE.md`, `AGENTS.md`, `decisions/log.md`, `references/ai-platforma-*.md`, commity.

## Kontrakty
**K1 – spúšťanie procesov** (I1, `runner/spawn.mjs`):
- `export function spawnProcess(name, inputObj, { fromRunDir, label })` zapíše `inputObj` do `<fromRunDir>/<label>-input.json` a spustí odpojene `node runner/run.mjs run <name> --input <file> --wait-lock`. Log ide do `<fromRunDir>/<label>.out`.
- `--wait-lock` = keď proces beží, čaká na zámok (max 30 min) namiesto preskočenia. Keď čakanie vyprší, nahlási chybu do AI Bugs.
- `RUN_DRY` sa dedí.

**K2 – testovací režim** (I1):
- `run.mjs run <name> --dry-run` nastaví env `RUN_DRY=1` pre after-step, premennú `{{dry_run}}` = `"true"` alebo `"false"` v prompte a `log.dryRun`.
- V dry-run sa neposúva `lastSuccessAt`.
- Procesy v dry-run nevolajú telefón (I3) a nezapisujú do PM ani do second brainu (I2 to rieši promptom aj obmedzením nástrojov).

**K3 – kontext viacerých behov** (I1): v `process.json` `"context": [{ "var": "followups", "process": "call-followup", "mode": "since" }]`. Režim `since` vloží pole výstupov všetkých úspešných behov od `lastSuccessAt` aktuálneho procesu (najviac 20). Režim `last` (predvolený) ostáva ako dnes. Udržuj index úspešných behov v `state/<name>.json` (`successRuns: [{runId, at}]`, posledných 100). `keepRuns` pre `call-followup` a `action-executor` nastav na 365.

**K4 – výstup followupu** (`processes/call-followup/schema.json`, I2) obsahuje navyše:
- `proposed_actions[]`: `{ id, tool, args, summary, quote, at_secs, confirmed: true|false, risk: "normal"|"destructive"|"needs_approval" }`. `tool` je presné meno PM MCP nástroja bez prefixu, napr. `pm_create_task`.
- `callback`: `{ needed: bool, reason, say: string, questions: [{ id, question, why }] }`.
- `answered_questions[]`: `{ id, answer, quote }`.
- `caller_verified: bool` (z `input.caller`).
`kind` vo vstupe: `morning-brief` | `interview` | `inbound` | `callback`.

**K5 – executor** (I2):
- Proces `action-executor`, vstup `{ source_run, conversation_id, kind, actions: proposed_actions s confirmed=true, dry_run }`.
- Vykoná iba akcie zo zoznamu nástrojov a iba confirmed. `destructive` (mazanie) iba ak `quote` obsahuje kľúč úlohy alebo jej jednoznačný názov. Pred zmazaním `pm_get_task` záloha do výstupu. `needs_approval` (prístupy, členovia, financie, e-maily von) sa nevykonáva, namiesto toho vznikne úloha pre Mareka v liste AI Bugs.
- Limit 10 zápisov.
- Výstup: `{ ok, executed[], skipped[], approvals_created[], backups[] }`.
- Executor po skončení spustí (cez K1) `callback`, ak followup povedal `callback.needed`, alebo ak sú výsledky z `inbound`.

**K6 – otvorené otázky** (I2 zapisuje, I4 číta):
- Poznámka v second braine `context/otvorene-otazky.md` s tabuľkou: id (Q-001…), otázka, prečo, téma, stav open/answered, odpoveď, zdroj, dátum.
- Followup pridáva nové a uzatvára zodpovedané.
- Prvé naplnenie urobí I2 v testovacom behu, nie naživo.

**K7 – hlasové funkcie** (I3, `runner/voice-call.mjs`):
- **Spätná kompatibilita:** `placeCallAndWait(vars, {runDir, call})` a `startFollowup(...)` ostávajú. `startFollowup` interne používa `spawnProcess` z K1.
- **Nové:** `export function callGuard({ kind })` vráti `{ allowed, reason }` podľa tichých hodín 21:00–7:30 Europe/Bratislava (okrem brief a manual), limitu 3 spätných hovorov za deň a stropu minút za deň (60) zo `state/voice-usage.json`.
- **Dry-run:** keď `RUN_DRY=1`, nevolá a zapíše `call-variables.json` a `call.json` so `status: "dry-run"`.
- **inbound-call:** proces `claude:false`, `schedule "*/5 * * * *"`. Nájde dokončené konverzácie agenta s `direction: inbound` od posledného spracovania (`state`, nie `lastSuccessAt`), stiahne prepis a `metadata.phone_call.external_number` a pre každú spustí followup s `kind: "inbound"` a `caller`. Overený volajúci = `external_number` obsahuje `mtoth`. Neovereným sa len zapíše poznámka, žiadne akcie.
- **callback:** proces `claude:false`, vstup `{ say, questions, done[], skipped[], source_run }`, zavolá cez `placeCallAndWait` s pokynmi spätného hovoru a po hovore spustí followup s `kind: "callback"`.

**K8 – brief** (I4):
- Číta `{{followups}}` (K3, režim `since`) a otázky z `context/otvorene-otazky.md` (`pm_read_brain_note`).
- Prechádza všetky aktívne projekty z `pm_get_workspace_tree` aj bez zmien.
- Pri úlohách uvádza kľúč, názov, popis, riešiteľa a termín.
- Aliasy projektov (Imagewell = Zacharides).

## Spoločné pravidlá
- **Testuj iba v dry-run:** Marek nie je pri počítači. Žiadne reálne hovory a žiadne zápisy do PM ani do second brainu okrem toho, čo kontrakt výslovne povoľuje.
- **Iba čítanie:** PM a ElevenLabs smieš čítať.
- **Výnimka I3:** smie upraviť ElevenLabs agenta a priradiť Linphone číslo osobnému asistentovi (orchestrátor to schválil, testovacia Petra na tomto čísle je len PlusReality test). V reporte uveď, ako sa to vráti späť.
- **Syntax:** `node --check` na každom súbore.
- **Necommituj**, commity robí orchestrátor.
- **Tajomstvá:** nečítaj ani nevypisuj `~/.aios-runner/secrets.env`. Kľúče dostane after-step ako env od runnera.
- **Report:** `.swarm/phase1/round1/<I1|I2|I3|I4>.md` (čo, ako otestované, otvorené body, zmeny kontraktu, ak boli nutné).
