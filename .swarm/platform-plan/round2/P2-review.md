# P2 review (empirik, kolo 2)

Overoval som v kóde PM, v runneri a v `~/.aios-runner`. Celkom za 3 dni prebehlo 12 behov, z toho 2 plánované briefy a 1 úspešný.

## Pre P1

**1. F1 = nové tabuľky v PM nerieši ani jedno pozorované zlyhanie**
- **Kde:** §6, F1 (`AgentJob`, `AgentRun`, `Schedule`, 2–3 týždne).
- **Čo je zle:** reálne poruchy sú tieto:
  - race pri OAuth refreshi (`runs/morning-brief/2026-10-18T06-30-02-069Z/run.json`);
  - `Client disconnected: 1000` v 2 zo 4 zdvihnutých hovorov (`call.json`);
  - stratený followup hovoru `conv_4101…` zo 16. 10.;
  - kontext má len posledný followup (`lastOutput()` v `runner/core.mjs`).

  Presun logov do Postgresu nič z toho neopraví a pridá PM ako single point of failure (P1 to sám uvádza v §7.6).
- **Čo zmeniť:** F1 = opravy runnera a hlasová slučka. `AgentJob` až keď bude druhý používateľ alebo druhý worker.
- **Istota:** vysoká.

**2. Nová entita `Call` duplikuje `BrainCall`**
- **Kde:** §2, `Call`.
- **Čo je zle:** `BrainCall` už existuje (`prisma/schema.prisma:935`): `externalId`, `durationSec`, `participants`, `transcriptNoteId`, `summaryStatus` a `BrainCallRaw.source` (dnes `"fireflies"`). Hovory z ElevenLabs sa dnes do neho neukladajú, končia len ako poznámky `context/hovory/*`.
- **Čo zmeniť:** rozšíriť `BrainCall` o `source: "elevenlabs"`, `direction` a `purpose`. Fronta `pm_list_brain_call_queue` a nástroj `pm_save_brain_call_summary` potom fungujú bez nového kódu nástrojov.
- **Istota:** stredná. Či `syncFireflies` znesie aj iný zdroj, som nečítal.

**3. Riešenie predplatného prehliada pozorovaný problém**
- **Kde:** §4 (setup-token + `--mcp-config` na PM).
- **Čo je zle:** 18. 10. padol beh na zdieľanom interaktívnom logine („another Claude Code process is refreshing it“). Bežal pod rovnakým používateľom `marek` ako interaktívne relácie. Návrh síce rieši izoláciu cez `ComputeAccount` per unix user, ale až v F3–F4. Tvrdenie „potom stačí aj `setup-token`“ s PM ako jediným MCP nikto neoveril. Overené je len to, že `setup-token` nenačíta claude.ai konektory.
- **Čo zmeniť:** do F1 dať samostatný unix používateľ alebo `CLAUDE_CONFIG_DIR` pre runner. Experiment `setup-token` + `--mcp-config` (PM) urobiť ako 1-hodinový test, nie ako architektonický predpoklad.
- **Istota:** stredná. Príčina race je hypotéza.

**4. Dispečing serverového agenta je v PM hotovší, než P1 tvrdí**
- **Kde:** §3c, krok 2 (nový long-poll endpoint `agent-nodes/{id}/jobs`).
- **Čo je zle:** nie je to chyba, len zbytočná práca. Netreba ho:
  - `pm_list_tasks {agent_run_status:["queued"]}` funguje;
  - UI vie nastaviť stav (`components/tasks/task-detail.tsx:354`);
  - RESTRICTED token na projekt existuje („Imagewell - Eshop“ → `Clients / Zacharides / Eshop`, použitý 16. 10.).
- **Čo zmeniť:** prvý `AgentNode` = runner proces s týmto tokenom a pollingom cez MCP. Nová entita až pri viacerých strojoch.
- **Istota:** vysoká.

## Pre P3

**1. Balík B: spätný hovor sa môže ticho zahodiť na zámku**
- **Kde:** balík B (`call-followup/after.mjs` → `callback` → znova `call-followup`).
- **Čo je zle:** `call-followup` sa spúšťa príkazom `run`, čiže `manual=true` (`runner/voice-call.mjs`, `startFollowup`). Ak sa nový followup spustí, kým beží predchádzajúci, `run.mjs` vypíše „already running, skipped“ a pri `manual` **nič nenahlási** (`run.mjs`, vetva `!release`). Prepis spätného hovoru by sa stratil bez stopy. Rovnaké riziko vzniká pri súbehu inbound followupu a followupu po briefe.
- **Čo zmeniť:** followup musí čakať na zámok alebo vstup zaradiť do fronty (súbor v `state/`). Preskočenie treba hlásiť aj pri ručnom spustení. Patrí do balíka E.
- **Istota:** vysoká (kód), dopad je odhad.

**2. Balík E nerieši zmeškaný slot a klasifikáciu chyby**
- **Kde:** balík E.
- **Čo je zle:**
  - `tick()` zapíše `lastSlot` **pred** behom (`run.mjs`). Po zlyhaní teda nič neopakuje ďalší tick, retry je len vnútri behu.
  - `AUTH_PATTERNS` (`core.mjs`) frázu „refresh OAuth token“ nezachytí. Chyba z 18. 10. preto prišla ako `claude-error` (IMP-1496), nie ako `auth`.
  - `pruneRuns` (30 behov) maže `output.json`, jediný dôkaz potvrdení. Napríklad citát pred zmazaním IMP-1489.
- **Čo zmeniť:** pridať:
  - catch-up po zlyhaní (do `deliverAt`);
  - vzor pre refresh;
  - samostatnú `keepRuns` pre `call-followup` alebo archív potvrdení do PM komentára;
  - samostatný login runnera (P1, bod 3).
- **Istota:** vysoká.

**3. Balík A stojí na neoverenom predpoklade o SIP**
- **Kde:** balík A, prichádzajúci hovor.
- **Čo je zle:** `phnum_1901…` je trunk, cez ktorý ElevenLabs volá **na** Linphone účet `mtoth` (`DEFAULT_CALL`). Odkiaľ Marek zavolá **na** agenta (SIP adresa trunku? z Linphone appky?), v kóde ani v logoch nie je. Priradenie Petre poznáme len z `context.md`.
- **Čo zmeniť:** ako prvý krok balíka A spraviť 30-minútový spike, ktorý overí prichádzajúcu trasu. Ako záložnú cestu bez prepínania čísla navrhnúť „agent zavolá Marekovi na požiadanie“: úloha v PM alebo pravidelný hovor cez `voice-interview` s otázkou „čo chceš zadať?“.
- **Istota:** stredná.

**4. Balík C zväčšuje premenné hovoru bez merania**
- **Kde:** balík C, všetky aktívne projekty a detaily.
- **Čo je zle:** už dnes má `call_details` 14 477 znakov (beh 16. 10. 13:28, `after.log`). Limit dynamických premenných ElevenLabs ani vplyv na latenciu a prerušenia nie sú overené.
- **Čo zmeniť:** v teste merať dĺžky a `termination_reason`. Projekty bez zmeny dávať jednou vetou.
- **Istota:** nízka.

**Potvrdzujem:** fáza 2 („polia v PM už existujú“) platí vrátane UI. Prvý projekt Imagewell má token aj čerstvé použitie.

## Kde meníš svoju inventúru

- **Opravujem formuláciu:** „človek nastaví `queued` v UI“ som pôvodne netvrdil overene. Teraz je to overené (`task-detail.tsx:354`, `PATCH /api/v1/tasks/[id]` prijíma `agentRunStatus`).
- **Dopĺňam krehké miesto:** súbežný manuálny beh `call-followup` sa ticho preskočí.
- **Dopĺňam riadok 15 matice:** `BrainCall` je kandidát na hovory z ElevenLabs, nie len chýbajúca vec.
- **Zmierňujem tvrdenie z riadku 3:** neistota o prichádzajúcej trase je väčšia, než som uviedol.

## Zásadné nezhody

- **S P1 o obsahu fázy 1.** P1 chce 2–3 týždne kódu v PM (`AgentJob/AgentRun/Schedule`) pri dvoch plánovaných behoch a jednom používateľovi. Dáta ukazujú, že bolí spoľahlivosť a slučka hovoru, nie chýbajúca fronta. Stojím za P3: fáza 1 bez kódu v PM. Zmenu kódu v PM by som pripustil najskôr vo fáze 3.
- **S P3 o poradí E → A/B.** Balík E musí byť hotový **pred** B, nie súbežne. Bez opravy zámku a catch-upu pridá spätný hovor ďalšie tiché straty.
- **S oboma:** nikto nerieši oddelenie loginu runnera od interaktívnych relácií. Je to jediná dnes pozorovaná príčina zmeškaného briefu.
