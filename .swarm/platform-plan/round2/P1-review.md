# P1 Architekt: cross-review (kolo 2)

## Pre P3

- **Kde:** Fáza 1, balíky A–D (prichádzajúci hovor, spätný hovor, fronta otázok).
- **Čo je zle alebo chýba:** Fáza 1 znásobí počet zápisov, ktoré vychádzajú z hlasu (prichádzajúci hovor, followup, spätný hovor a znova followup). Pritom nepreberá ochranné pravidlá z P4 §2. `call-followup` ostáva s celým PM serverom v `allowedTools` a `maxTurns: 120`.
- **Čo zmeniť:** Pridať balík F „návrh a vykonanie“. Followup vráti `proposed_actions[]` s citátom, akcie vykoná kód podľa allowlistu, `pm_delete_*`, `pm_grant_access` a finančné nástroje sa vypnú. Prvé 2 týždne pre prichádzajúce hovory beží `dryRun`. Bez toho nespúšťať balík A.
- **Istota:** vysoká

- **Kde:** Kontrakt K2, fronta otázok ako tabuľka v poznámke `context/otvorene-otazky.md`.
- **Čo je zle alebo chýba:** Do markdown tabuľky zapisuje viac behov naraz (brief, followup, callback). Ak dva followupy prepíšu poznámku súčasne, otázka sa stratí. Tabuľka tiež nemá stabilné ID pre prepojenie so zdrojovým hovorom.
- **Čo zmeniť:** Ponechať ju ako dočasné riešenie, ale polia nastaviť 1:1 podľa budúcej entity `AgentQuestion` (`id`, `fromProcess`, `callId`, `status`, `answer`, `answeredVia`, `quote`). Zapisovať cez `pm_append_brain_section` (append) a nie celým prepisom poznámky. Neskorší presun do PM bude potom len mapovanie, nie refaktor, čo P3 sám uvádza ako svoju slabinu.
- **Istota:** stredná

- **Kde:** Poradie fáz: fáza 2 (serverový agent) ide pred fázou 3 (viditeľnosť v PM).
- **Čo je zle alebo chýba:** Serverový agent mení kód klienta. Audit by pritom existoval len v `~/.aios-runner/runs`, ktorý `pruneRuns` po 30 behoch zmaže (P2 §3.6).
- **Čo zmeniť:** Z fázy 3 vytiahnuť minimum pred fázu 2: trvalý záznam behu v PM. Stačí komentár s `run.json` cez `pm_add_task_comment` a `pm_update_agent_run`, bez novej stránky. Stránka „Môj agent“ môže ostať vo fáze 3.
- **Istota:** stredná

- **Kde:** Fáza 4, veta „alebo beží na Marekovom“.
- **Čo je zle alebo chýba:** Podľa citácie podmienok v P4 #1 je táto možnosť vylúčená. Okrem toho dôkaz z 18. 10. (súbeh pri obnove OAuth tokenu) ukazuje, že jeden login nezvládne ani viac súbežných procesov jedného človeka.
- **Čo zmeniť:** Za podmienku fázy 4 dať vlastný Claude login kolegu (seat platený firmou) a samostatného unix používateľa na serveri.
- **Istota:** vysoká

## Pre P4

- **Kde:** #1, mitigácia „Produkt pre iných: API kľúč alebo Bedrock/Vertex“.
- **Čo je zle alebo chýba:** Návrh je v rozpore s rozhodnutím vlastníka „bez API tokenov“, no P4 ho podáva ako odporúčanie. Pritom citácia, ktorú P4 uvádza („Each end user must authenticate with their own credentials“), pripúšťa cestu, ktorá víziu zachová: každý používateľ sa prihlási vlastným predplatným a firma mu platí seat.
- **Čo zmeniť:** Ako hlavnú cestu uviesť vlastné predplatné každého používateľa (Team/Enterprise seat, firma platí, človek sa prihlási sám). API nechať len ako záložný adapter pre zákazníkov, ktorí seat mať nechcú. Otázku č. 1 pre Mareka preformulovať podľa toho.
- **Istota:** stredná. Či automatizovaný headless beh v mene vlastníka seatu spĺňa „ordinary, individual usage“, treba overiť priamo u Anthropic.

- **Kde:** Pravidlo 2, druhé potvrdenie mimo hlasu pre každé mazanie aj pre Mareka.
- **Čo je zle alebo chýba:** Je to plošné a ide proti cieľu, že potvrdenia majú ísť ideálne hlasom. Zmazanie úlohy, ktorú agent sám vytvoril v ten istý deň, je iné riziko než zmazanie poznámky v second braine alebo zmena rate.
- **Čo zmeniť:** Úrovne podľa vratnosti a vlastníctva.
  - LOW (vrátiteľné, vlastné objekty agenta alebo Mareka): stačí hlas s read-backom a ID.
  - HIGH (mazanie cudzích objektov, práva): klik v PM.
  - FINANCE a odoslanie mimo firmy: vždy mimo hlasu.
- **Istota:** stredná

- **Kde:** Tabuľka rizík, #10 (single point of failure).
- **Čo je zle alebo chýba:** Chýba konkrétny dôkaz, ktorý už nastal. Brief 18. 10. padol, pretože iný Claude proces obnovoval OAuth token (P2 §3.1). Ide o súbeh na jednom loginu, nie o výpadok servera. Bude sa zhoršovať s každým ďalším procesom, a teda aj s každým serverovým agentom na tom istom účte.
- **Čo zmeniť:** Zaradiť to ako samostatné riziko s pravdepodobnosťou vysoká a mitigáciou „na jeden login beží naraz najviac jeden `claude -p`, ostatné čakajú vo fronte“ plus retry. Interaktívna práca (swarm) nech beží na inom účte ako produkčný runner.
- **Istota:** vysoká

- **Kde:** #6, „Žiadny agent na stroji s PM live“.
- **Čo je zle alebo chýba:** Pre serverových agentov s `Bash` je to správne. Pre osobného agenta bez `Bash`, ktorý volá iba MCP, je to vo fáze 1 neprimerané a zbytočne blokuje.
- **Čo zmeniť:** Pravidlo obmedziť na procesy s `builtinTools` obsahujúcimi `Bash` alebo `git`.
- **Istota:** stredná

## Kde meníš svoj návrh

- **ComputeAccount sa nezdieľa.** Ruším „1 org = N účtov zdieľaných cez round-robin“. Nové pravidlo: `ComputeAccount.userId` je povinný, agent používateľa X beží len na účte X, organizácia platí seaty. Serverový agent beží na účte človeka, ktorý úlohu zadal (zapíše sa do `AgentJob.requestedByUserId`), alebo na seate vývojára projektu. Pre produkt pridávam `provider` adapter (CLAUDE_SEAT | CODEX | API) ako záložnú cestu.
- **Zámok na účet.** Worker spustí na jeden `ComputeAccount` naraz najviac jeden proces, ostatné joby čakajú v `QUEUED`. Retry pri chybe obnovy OAuth tokenu.
- **Approval ako deterministický vykonávač.** V mojom návrhu model zapisoval sám a `Approval` ho len brzdil. Teraz model nemá zápisové nástroje s rizikom HIGH ani FINANCE vôbec. Vracia `proposed_actions` a vykonáva ich PM kód podľa tabuľky `Approval`. Jednu vec beriem od P4 a jednu ponechávam vlastnú:
  - od P4: ako potvrdenie platia len `user` turny;
  - vlastné: úrovne rizika podľa vratnosti.
- **Fáza 1 od P3 platí.** Moju F1 (`AgentJob` a `AgentRun` v PM) presúvam za fázu 1 P3, ale pred jeho fázu 4. Kontrakty K1 a K2 majú tvar `Call` a `AgentQuestion`.

## Zásadné nezhody

- **S P3, PM až vo fáze 3.** Podľa mňa minimálna trvalá stopa v PM (záznam behu a dôkaz potvrdenia) musí existovať pred serverovým agentom a pred akýmkoľvek mazaním z prichádzajúceho hovoru. Bez nej sa chyba z prepisu nedá ani spätne dohľadať. Netreba stránku, stačia komentáre a `pm_update_agent_run`.
- **S P4, API ako cesta pre produkt.** Nesúhlasím, že treba opustiť model predplatného. Opustiť treba zdieľanie predplatného. Vlastný seat na človeka ostáva v súlade s citovanými podmienkami aj s rozhodnutím vlastníka.
- **S P4, druhé potvrdenie mimo hlasu pre každé mazanie.** Úrovne podľa vratnosti dávajú rovnakú ochranu tam, kde je riziko, a nerozbijú hlasový zážitok, ktorý je jadrom vízie.
- **S P3 aj P4 (doplnok):** obaja považujú prichádzajúci hovor za lacný. Podľa P2 je však Linphone číslo priradené Petre, takže to závisí od rozhodnutia o čísle. Navrhujem druhé, samostatné číslo pre osobného agenta namiesto prepínania.
