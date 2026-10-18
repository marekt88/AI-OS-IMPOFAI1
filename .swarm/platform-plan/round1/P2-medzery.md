# P2 Inventár a medzery (empirik, 2026-10-18)

Zdroj: kód PM (`/home/marek/impofai-pm`, HEAD `a9df682`), runner (`runner/*.mjs`, `processes/*`), logy `~/.aios-runner/runs|state|logs`, dve čítania cez PM MCP (`pm_list_tasks` s filtrom agent run, `pm_list_mcp_tokens`). Plány a brainstormy beriem len ako cieľ, nie ako dôkaz.

## 1. Matica schopností

| # | Schopnosť z cieľa | Stav | Kde | Čo chýba |
|---|---|---|---|---|
| 1 | Osobný agent pre každého | čiastočne (len Marek) | `runner/`, `processes/*`, ElevenLabs `agent_7701m…` | Všetko je natvrdo pre jedného človeka: `toNumber: "mtoth"` (`runner/voice-call.mjs`), jeden claude.ai login, jeden `PM_MCP_TOKEN`. Agent nemá vlastnú pamäť ani stav okrem `lastOutput()` |
| 2 | Hlasový ranný brief | hotové (test) | `processes/morning-brief/` | Beží, ale bez opakovania pri zlyhaní (pozri §3). 18. 10. nebol |
| 3 | Prichádzajúci hovor agentovi | nič | – | Linphone číslo `phnum_1901…` je priradené agentovi Petra (PlusReality). Chýba webhook alebo poller, ktorý po hovore spustí `call-followup` |
| 4 | Spätný hovor s výsledkom | nič | – | `call-followup` vráti `summary` a `open_questions` (`processes/call-followup/schema.json`). Nikto ich nezavolá späť, prečíta ich až ďalší brief cez `context.last_followup` |
| 5 | Vykonanie potvrdeného po hovore | hotové | `processes/call-followup/prompt.md` | Funguje: IMP-1490 vytvorená, IMP-1489 zmazaná. Chýba audit, kto čo potvrdil, mimo `output.json` (ten sa po 30 behoch zmaže) |
| 6 | Interview / kampane | čiastočne | `processes/voice-interview/` (`claude:false`, `--input`) | Len ručne, len Marek, jeden hovor. Chýba kampaň (zoznam ľudí, opakovanie, pokračovanie po prerušení) |
| 7 | Serveroví agenti (1 server = 1 projekt) | čiastočne (dáta áno, logika nie) | `Task.prompt`, `agentRunStatus`, `previewUrl`, `pm_update_agent_run`, `AGENT_WORKFLOW` v `lib/mcp/tools/tasks.ts:54` | Nič nedispečuje úlohy v stave `QUEUED`. Jediná úloha s agent run je seed IMP-1057 (`preview.impofai.dev/labs/testgen`, 1. 10.), v reálnej prevádzke sa nepoužíva. Existujú projektové tokeny „Plus reality claude code“, „Imagewell - Eshop“ a „wellgard claude code“; prvé dva boli použité 16. 10. |
| 8 | Agent↔agent (úlohy, knowledge) | nič | – | Agent = MCP token (`lib/services/mcp.ts:231`, `agentName = token.name`). Chýba model agenta, schránka a povolenia na zdieľanie |
| 9 | Otázky serverového agenta cez hlas | nič | – | Chýba kanál otázka → hovor → odpoveď späť do úlohy |
| 10 | Custom konektory (aj cez chat) | nič v PM | `lib/brain-hub/connect-guide.ts` je len návod na pripojenie PM MCP | Registrácia a priradenie konektorov |
| 11 | Aplikácie/dashboardy od agenta | nič | – | Hosting a schvaľovanie |
| 12 | AI chat s projektmi | nič | PM nemá AI závislosť (`package.json`: žiadny anthropic/openai SDK) | Celé |
| 13 | Plánované úlohy | čiastočne (mimo PM) | `runner/cron.mjs`, `process.json.schedule`; v PM len `lib/services/brain/scheduler.ts` (Fireflies a záloha) | UI a model pre používateľské plány. Teraz plán = súbor v gite |
| 14 | Chat s ľuďmi a agentmi | nič | Komentáre úloh + `Notification` (iba v aplikácii, kind `AGENT_UPDATE`) | Kanály, @agent, real-time |
| 15 | Second brain zber | hotové (Fireflies + hovory) | `BrainNote/Revision/Chunk/Call`, `lib/services/brain/*`, 25 nástrojov v `lib/mcp/tools/brain.ts` | E-maily ani Drive nikto automaticky nezbiera. ElevenLabs hovory nejdú do `BrainCall` (ten pozná len `source: "fireflies"`), ukladajú sa len ako poznámky `context/hovory/*` |
| 16 | Mapa firmy | hotové | `MemberProfile` (title, team, phone, managerUserId), `lib/services/orgmap.ts`, `app/(app)/org-map` | Kto s kým komunikuje (žiadne dáta) |
| 17 | Mapa procesov | nič | – | Žiadny model ani nástroj |
| 18 | Manažérske analýzy | čiastočne (financie) | `lib/services/finance/*`, `pm_get_profitability_report` | Analýzy, ktoré samy spustia interview |
| 19 | Predplatné namiesto API | hotové pre server a 1 účet | `claudeEnv()` maže `ANTHROPIC_API_KEY` a ďalšie (`runner/core.mjs`) | Viac účtov, OpenAI/Codex login, platba organizácie |
| 20 | Role a odvetvia | čiastočne | `OrgRole {ADMIN, USER}`, `AccessGrant`, `BrainAccess`, `BrainScopeMap` | Rola manažér, admin odvetvia a skupiny |
| 21 | Drafty e-mailov v štýle človeka | nič | brief Gmail iba číta | – |

## 2. Znovupoužiteľné časti

- **Runner ako exekučný engine.** `runner/core.mjs` (`runProcess`, `requireTools`, JSON schéma, `ok:false`, redakcia tajomstiev), `runner/run.mjs` (tick, `--input`, `run-scheduled`), `runner/pm.mjs` (`pmTool()`, teda priame HTTP volanie PM MCP bez Claude, a `reportIssue` s odtlačkom). Nový agentický krok = nový priečinok v `processes/`.
- **Hovor.** `placeCallAndWait(vars, {call})` a `startFollowup()` v `runner/voice-call.mjs` sú generické: dynamické premenné `first_message / call_instructions / call_content / call_details` a `call.toNumber` sa dá prepísať.
- **Followup ako vykonávateľ.** `processes/call-followup` (prompt, schéma s `actions_done.quote`, `actions_skipped`, `open_questions`). Rovnaký vzor poslúži aj pre „úlohu zadanú hlasom“.
- **Serverový agent v PM.** `Task.prompt`, `AgentRunStatus`, `previewUrl`, `pm_update_agent_run` (zapíše aktivitu `AGENT_RUN_CHANGED` a notifikáciu `AGENT_UPDATE` riešiteľovi, `lib/services/tasks.ts:799–820`), filter `pm_list_tasks {agent_run_status:["queued"]}`, `AGENT_WORKFLOW` text. Toto je hotové API pre dispečing.
- **Identita agenta.** `McpToken` + `McpTokenScope` (FULL/RESTRICTED na space/folder/list), `ActorType.AGENT`, `ActivityEvent.agentName`. Existujúce projektové tokeny (PlusReality, Imagewell, Wellgard) sú pripravené pre „1 server = 1 projekt“.
- **Second brain.** `BrainRevision` (verzie, `agentName`, `tokenId`), `pm_save_brain_call_summary`, `pm_list_brain_log` (čo sa zmenilo), `pm_list_brain_call_queue`, access pravidlá `BrainSettings.accessRules`.
- **Mapa firmy.** `MemberProfile.phone` je budúci adresár „komu môže agent zavolať“, `managerUserId` dáva hierarchiu pre eskaláciu.
- **OAuth pre claude.ai konektor** (`app/api/oauth/*`, `OAuthGrant`), takže každý zamestnanec sa vie pripojiť cez vlastné predplatné bez nového kódu.

## 3. Technický dlh a krehké miesta (dôkazy z logov)

1. **Dnešný brief (18. 10.) nebol.** Beh `morning-brief/2026-10-18T06-30-02-069Z` skončil po 9 s chybou `Failed to refresh OAuth token: another Claude Code process is refreshing it`. Bol klasifikovaný ako `claude-error`, nie ako `auth`, lebo `AUTH_PATTERNS` v `core.mjs` frázu „refresh OAuth token“ nezachytí. Bug IMP-1496 vznikol, ale **nebol žiadny retry**: `lastSlot` sa zapíše pred behom a `catchUpMin: 20`. Moja hypotéza (neoverená): race s interaktívnymi Claude Code reláciami na tom istom účte, napríklad s týmto swarmom. Zdieľaný login je teda single point of failure.
2. **Prerušené hovory.** V 2 zo 4 zdvihnutých hovorov je `termination_reason: "Client disconnected: 1000"` (brief 16. 10. 13:28, 247 s; interview 16. 10., 141 s). Pri interview zostali zodpovedané 2 z 10 otázok a zvyšok sa nikdy nedopýtal. Neexistuje pokračovanie ani nový pokus.
3. **SIP 408 zhodil after-step** (16. 10. 13:25, IMP-1489). Regex v `voice-call.mjs` to už rieši, ale nezdvihnutý hovor sa skúsi len raz po 10 min (`retries: 1`) a potom sa ticho zaloguje bez notifikácie.
4. **Stratený hovor.** Prvý brief 16. 10. 10:48 (`conv_4101…`, 12 replík Mareka) nemá `followup-input.json`. `startFollowup` vtedy ešte neexistoval a hovor nikto nespracoval.
5. **Kontext je len posledný followup.** `context: last_followup` berie iba `lastSuccessRunId`. Brief 17. 10. tak dostal výstup interview (13:39) a nie followup briefu (13:35). Otvorené otázky sa medzi hovormi strácajú.
6. **Silné akcie z prepisu reči.** Followup 17. 10. zmazal IMP-1489 na základe vety „Ó, keď proces potom prebehol úspešne, tak ten môžeš zmazať“. Pravidlo funguje, ale STT chyba môže spôsobiť deštruktívnu akciu. Dôkaz o potvrdení je len v `output.json`, ktorý `pruneRuns` po 30 behoch zmaže.
7. **Medzery v prístupoch blokujú akcie.** Followup 17. 10. nemohol priradiť Leonarda Tótha (v `PlusReality / AI Bugs` sú priraditeľní len Daniel Lokaj a Marek). Akcia zostala v `actions_skipped`.
8. **Ostatné:**
   - `git pull` je nasadenie bez testov;
   - `runAfter` dáva `after.mjs` **všetky** tajomstvá;
   - `deliverAt` drží lock a proces až 30 min (brief 17. 10. trval 2245 s, z toho Claude len 78 s);
   - výpadok samotného cronu nikto nehlási (`references/ai-runner.md`);
   - natvrdo zapísané `BUGS_LIST`, URL PM a `agentId`;
   - chyba nástroja `pm_get_workspace_tree: Workspace not found` (16. 10.);
   - `CLAUDE.md` tvrdí, že procesy second brain „iba čítajú“, ale `call-followup` doň zapisuje.
9. **Tokeny.** 7 aktívnych MCP tokenov, z toho 3 FULL nikdy nepoužité („Full access - AI-OS…“, „IMPOFAI - Second Brain“, „Claude desktop - test“). Runner ide cez FULL token „Claude code -PM“.

## 4. Čo má fáza 1 využiť bez nového kódu v PM

- **Serverový agent cez existujúce API.** Na projektovom serveri (začať PlusReality alebo Imagewell, tokeny už existujú) beží runner proces s plánom `*/5`. Proces volá `pm_list_tasks {agent_run_status:["queued"]}` → `pm_get_task` (prompt) → práca → `pm_update_agent_run {preview_url, needs_review}` → komentár. Človek nastaví `queued` v UI.
- **„Zavolaj agentovi s úlohou“ bez prichádzajúceho hovoru.** `voice-interview` s `--input` (otázka: „čo chceš urobiť?“) → `call-followup`. Ide o novú konfiguráciu procesu, nie o kód PM.
- **Spätný hovor.** Nový `after.mjs` pre `call-followup`: ak `actions_done` alebo `open_questions` nie sú prázdne, zavolá `placeCallAndWait` so `summary`. Je to len kód runnera.
- **Kampane interview** pre Andrii, Filip, Martin, Leo: `call.toNumber` + otázky z `--input`. Čísla treba doplniť do `MemberProfile.phone` cez `pm_update_person_profile`, ktorý už existuje.
- **Notifikácie** cez `AGENT_UPDATE` (už sa spúšťajú pri `pm_update_agent_run` aj pri agentových komentároch).
- **Opravy runnera, ktoré sú najlacnejšie:** retry pri prechodných chybách OAuth, kontext = všetky followupy od posledného briefu, archivácia `output.json` followupov do second brainu (poznámka už vzniká).

## 5. Kde som najmenej istý

- **Príčina chyby z 18. 10.** Súbeh s inými Claude reláciami je hypotéza. Netestoval som, ako často k nej dochádza ani či ju retry naozaj vyrieši.
- **Projektové tokeny ako „serveroví agenti“.** Vidím len `last_used_at`. Neviem, čo s nimi kto robil, ani na akom serveri bežia. Nijaký kód takého agenta som v repozitároch nenašiel.
- **Stav live PM oproti HEAD.** Deploy log končí pri `8f9f49d` a HEAD je `a9df682` (iba záznam deployu), takže predpokladám zhodu. Bežiaci kontajner som neoveroval.
- **ElevenLabs.** Nastavenia agentov, webhooky a priradenie čísel poznám len z `context.md`, sám som ich nečítal. Riadok 3 matice (prichádzajúce hovory) preto stojí na cudzom tvrdení.
- **Seed vs. reálne dáta.** IMP-1057 pokladám za seed podľa domény `preview.impofai.dev` a dátumov. Ide o úsudok.
- **UI.** `app/(app)/**` som prešiel len podľa štruktúry a grepu („chat“ v UI nie je). Detail obrazoviek úlohy (zobrazenie promptu a agent run) som nečítal riadok po riadku.
