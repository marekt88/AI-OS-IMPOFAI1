# P1 Architekt: cieľová architektúra platformy nad IMPOFAI PM

Postoj: ambiciózny staviteľ. Hlavná myšlienka je, že **PM bude riadiaca vrstva (control plane)** a AI sa vykonáva **mimo PM** vo workeroch. Všetky stavy, oprávnenia, fronty a audit sú v Postgrese PM. Workery sú hlúpe: vezmú job, spustia `claude -p` alebo codex a výsledok zapíšu cez PM MCP. Dnešný runner (`runner/core.mjs`) sa stane prvým workerom.

## 1. Komponenty

| # | Komponent | Zodpovednosť | Čo existuje dnes |
|---|---|---|---|
| 1 | **PM jadro** | Hierarchia, úlohy, second brain, financie, oprávnenia, MCP | `/home/marek/impofai-pm`: `prisma/schema.prisma`, `lib/permissions/index.ts` (jediné miesto s pravidlami P1–P13), `lib/mcp/tools/*` (~140 `pm_*`) |
| 2 | **Agentová vrstva** | Jeden `Agent` na používateľa: profil, inštrukcie, nástroje, pamäť (poznámky v second braine pod `agents/<user>/`), proaktívne pravidlá | Nič. Dnes ho nahrádzajú prompty v `processes/*/prompt.md` |
| 3 | **Fronta a plánovač** | Tabuľka `AgentJob` v Postgrese (`SELECT … FOR UPDATE SKIP LOCKED`), cron plány ako `Schedule`, retry, `lastSuccessAt`, zámky | `runner/cron.mjs`, `runner/run.mjs tick`, `~/.aios-runner/state`, `locks` |
| 4 | **Vykonávač (worker)** | Démon na hostiteľovi, ťahá joby, spúšťa `claude -p` / `codex exec` pod správnym `ComputeAccount`, posiela log a výsledok | `runner/core.mjs` (auth check, mazanie `ANTHROPIC_API_KEY`, `--permission-mode dontAsk`, `requireTools`, `--json-schema`) |
| 5 | **Hlasová vrstva** | Odchádzajúce a prichádzajúce hovory, dynamické premenné, prepis, post-call webhook do PM | `runner/voice-call.mjs`, ElevenLabs agent `agent_7701m5254wcqektavn4skbrdn86n`, trunk `phnum_1901…` |
| 6 | **Konektory (MCP brána)** | PM drží OAuth prihlásenia používateľov ku Gmailu, Kalendáru, Drive, Notionu, ERP a vystavuje ich ako MCP nástroje cez `/api/mcp`, filtrované oprávneniami | OAuth server pre claude.ai v PM (`OAuthClient`, `OAuthGrant`); externé konektory dnes len cez claude.ai |
| 7 | **Serveroví agenti** | `AgentNode` = projektový server s workerom v režime „code“. Robí zmeny v repe, nasadí preview, zapíše `previewUrl` | `Task.prompt`, `agentRunStatus`, `previewUrl`, `pm_update_agent_run`, `AGENT_WORKFLOW` v `lib/mcp/tools/tasks.ts:54` |
| 8 | **Chat** | Kanály (projekt, DM, agent), @mention agenta vytvorí `AgentJob` | `ActivityEvent` s `actorType AGENT` (komentáre na úlohe) |
| 9 | **Aplikácie a artefakty** | Malé HTML/JS appky a dashboardy, ktoré vytvára agent. Hosťuje ich PM pod `/apps/<id>` v sandboxed iframe a dáta berú cez obmedzený token | `File`, `storage.ts` |
| 10 | **Schvaľovanie** | Jednotná fronta `Approval` (web, hovor, chat). Bez schválenia sa citlivý krok nevykoná | Implicitne v `call-followup` (vykoná len „potvrdené v hovore“) |

## 2. Dátový model (nové entity v Prisma)

- **Agent**: `id, orgId, ownerUserId? (null = serverový/systémový agent), kind (PERSONAL|SERVER|SYSTEM), name, instructions, voiceAgentId, phoneTarget, computeAccountId, defaultModel, status`. Patrí k nemu `McpToken` s novým `agentId`, takže `Actor.actorType = AGENT` a `agentName` sa vyplnia z DB, nie z hlavičky.
- **ComputeAccount**: `id, orgId, provider (CLAUDE|CODEX|OPENAI), label, hostId, unixUser, authStatus, lastAuthCheckAt, planTier, dailyBudgetRuns`. Predstavuje jedno predplatné prihlásené na konkrétnom stroji.
- **AgentNode** (host): `id, orgId, name, kind (SHARED|PROJECT), spaceId?/folderId? (projekt), publicBaseUrl, lastHeartbeatAt, capabilities Json`.
- **AgentJob**: `id, orgId, agentId, requestedByUserId, requestedByAgentId?, source (SCHEDULE|CALL|CHAT|TASK|AGENT|MANUAL), taskId?, callId?, processKey, input Json, status (QUEUED|CLAIMED|RUNNING|WAITING_INPUT|NEEDS_REVIEW|DONE|FAILED), nodeId?, attempts, notBefore, deliverAt, parentJobId?`.
- **AgentRun**: `id, jobId, startedAt, endedAt, exitReason, toolsCalled String[], output Json, transcriptFileId, costTurns`. Nahrádza `~/.aios-runner/runs/*/run.json`.
- **AgentQuestion**: `id, jobId, fromAgentId, toUserId, question, why, answer?, answeredVia (CALL|CHAT|WEB), status`. Otázky serverového agenta čakajú tu, kým ich osobný agent nezbalí do hovoru.
- **Call**: `id, orgId, agentId, userId, direction (OUT|IN), purpose (BRIEF|CALLBACK|INTERVIEW|ADHOC), elevenConversationId, status, variables Json, transcriptNoteId (BrainNote), followupJobId, startedAt, durationSec`.
- **Approval**: `id, orgId, agentId, userId, jobId?, callId?, action (nástroj + argumenty Json), risk (LOW|HIGH|FINANCE|DELETE), status, decidedVia, evidence (citát z prepisu, riadok)`.
- **AgentPermissionGrant**: `id, orgId, granteeAgentId, grantorUserId, resource (BRAIN_SCOPE|SPACE|FOLDER|CONNECTOR|AGENT_TASKING|CALL_USER), resourceId, level (READ|ASK|WRITE), expiresAt, requiresConsentEach`.
- **Connector** a **ConnectorCredential**: `Connector(id, orgId, kind (GMAIL|GCAL|DRIVE|NOTION|CUSTOM_MCP|HTTP), config Json, createdBy)`, `ConnectorCredential(id, connectorId, userId, encryptedTokens, scopes, expiresAt)`.
- **App**: `id, orgId, ownerUserId, agentId, name, entryFileId, scopeTokenId, visibility`.
- **Channel / ChannelMember / Message**: `Message(id, channelId, authorUserId?, authorAgentId?, body, threadId?, jobId?)`.
- **Schedule**: `id, agentId, cron, tz, processKey, input, enabled, lastSuccessAt`. Nahrádza `process.json.schedule` a `~/.aios-runner/state`.
- **ProcessDef**: `key, version, prompt, system, schema, allowedTools, requireTools, maxTurns, timeoutMin`. Dnešné `processes/*` sa importujú ako záznamy.

## 3. Toky

**(a) Ranný brief**
1. `Schedule` (8:30, Bratislava) vloží `AgentJob(processKey=morning-brief, deliverAt=09:00)` pre každého používateľa so zapnutým briefom.
2. Worker si job vezme, spustí `claude -p` s jediným MCP serverom (PM `/api/mcp`, token agenta). Gmail a kalendár idú cez MCP bránu PM, nie cez claude.ai konektory.
3. Výstup podľa `schema.json` sa uloží do `AgentRun.output` a vznikne `Call(purpose=BRIEF)`.
4. O 9:00 hlasová služba v PM spustí hovor (`POST /v1/convai/sip-trunk/outbound-call`) s premennými a k nim pridá otvorené `AgentQuestion` daného používateľa.
5. Post-call webhook ElevenLabs → `POST /api/v1/voice/webhook` → prepis do `BrainNote` → `AgentJob(call-followup)`.
6. Z followupu vzniknú `Approval` záznamy s citátom z prepisu ako dôkazom. LOW riziko sa vykoná hneď, HIGH (mazanie, financie) len s doslovným potvrdením v prepise.

**(b) Marek zavolá agentovi → agent pracuje → zavolá späť**
1. Prichádzajúci hovor ide na číslo osobného agenta. ElevenLabs `conversation_initiation` webhook → PM podľa čísla volajúceho nájde `Agent` a vráti mu kontext (otvorené joby a otázky).
2. Počas hovoru sa nevolá žiadny systém (rozhodnutie vlastníka), agent len zbiera a potvrdzuje.
3. Po hovore webhook → `Call` → `AgentJob(source=CALL, processKey=call-task)`.
4. Worker vykoná úlohu v rámci práv majiteľa. Ak niečo chýba, vytvorí `AgentQuestion` a job prejde do `WAITING_INPUT`.
5. Na konci vznikne `AgentJob(callback)` → `Call(purpose=CALLBACK)` s výsledkom a otázkami. Odpovede z neho opäť idú cez followup.

**(c) Úloha pre serverového agenta**
1. Z hovoru alebo chatu osobný agent vytvorí `Task` s `prompt`, v projekte, ku ktorému patrí `AgentNode(kind=PROJECT)`, a nastaví `agentRunStatus=QUEUED`.
2. Worker na projektovom serveri sa pripája **odchádzajúcim** spojením (long-poll `GET /api/v1/agent-nodes/{id}/jobs`), takže netreba otvárať porty, a vezme si job.
3. `claude -p` v repe projektu dostane RESTRICTED token len na daný space. Postup ide podľa `AGENT_WORKFLOW` (running, komentáre).
4. Otázka → `pm_ask_owner` (nový nástroj) → `AgentQuestion`, task má `WAITING_INPUT`. Osobný agent otázky zbalí, zavolá alebo napíše do chatu a odpoveď vráti do jobu (`--resume` session alebo nový beh s históriou).
5. Nasadenie na preview → `pm_update_agent_run {preview_url, needs_review}` → notifikácia `AGENT_UPDATE` → osobný agent zavolá s výsledkom. Do produkcie len cez `Approval(risk=HIGH)`.

**(d) Agent A žiada knowledge od agenta B**
1. Agent A zavolá `pm_agent_request {toAgent: B, need: "…", purpose}`.
2. PM overí `AgentPermissionGrant(grantee=A, resource=BRAIN_SCOPE…)`.
   - Ak existuje READ, výsledok je priame vyhľadávanie v rozsahu, ktorý vidí B, prienik s grantom.
   - Ak ASK alebo nič, vznikne `AgentJob` pre B. Ten pripraví odpoveď (zhrnutie, nie surové poznámky) a cez `Approval` sa spýta svojho majiteľa (chat, alebo pridá otázku do najbližšieho hovoru).
3. Po schválení dostane A odpoveď a voliteľne aj trvalý grant s `expiresAt`. Všetko sa zapíše do `BrainAudit`.

## 4. Predplatné a výpočet

- **Identita**: jedno predplatné = jeden `ComputeAccount` = **jeden Linux používateľ (alebo kontajner) s vlastným `~/.claude` / `~/.codex`** na hostiteľovi. Worker spúšťa `claude -p` cez `sudo -u <unixUser>` alebo v kontajneri s namountovaným home. Skúsenosť z runnera (`references/ai-runner.md`) hovorí, že `setup-token` nenačíta claude.ai konektory. Preto **konektory nepôjdu cez claude.ai, ale cez MCP bránu PM**. Potom stačí aj `setup-token` a jeden `--mcp-config` na PM.
- **Prihlásenie**: v UI PM „Pripojiť predplatné“ spustí na workeri `claude setup-token` / `codex login --device-auth` a zobrazí device kód. Stav sa kontroluje pri každom jobe (`claude auth status`, ako dnes).
- **Organizácie**: predplatné platí organizácia (rozhodnutie vlastníka). Model **1 org = 1 až N ComputeAccountov**, osobní agenti v org ich zdieľajú cez frontu s férovým plánovaním (round-robin podľa agenta). Odhad: 1 Max účet unesie jednotky až nízke desiatky jobov denne, čo treba zmerať.
- **Izolácia**: kontajner na job (read-only rootfs, tmp workdir, žiadny `Bash` okrem serverových agentov), env bez `ANTHROPIC_API_KEY`, token PM s platnosťou na job (`McpToken.expiresAt` = koniec jobu). Serveroví agenti bežia na vlastnom stroji projektu, teda fyzická izolácia.
- **Limity**: `ComputeAccount.dailyBudgetRuns`, `maxTurns`/`timeoutMin` z `ProcessDef`. Pri rate-limit odpovedi ide job späť do fronty s `notBefore` a nespadne ako bug.

## 5. Oprávnenia a bezpečnosť

- `Actor` v `lib/permissions/index.ts` sa rozšíri o `agentId` a `onBehalfOfUserId`. **Efektívne právo agenta = právo majiteľa ∩ rozsah tokenu jobu ∩ granty.** Dnešný prienik pre RESTRICTED token (P12) sa len zovšeobecní.
- Osobný agent dostane pre každý job FULL token majiteľa (rozhodnutie: smie všetko, na čo má majiteľ práva), ale **zápisové nástroje s rizikom HIGH/FINANCE/DELETE prejdú cez `Approval`**. Kontrolu robí MCP vrstva v PM, nie prompt.
- Serverový agent: vždy RESTRICTED na svoj space, bez financií a bez brain notes s `access=ADMIN`.
- Agent cudzieho používateľa: len cez `AgentPermissionGrant`. Osobné dáta (`MemberProfile`, Gmail) nikdy nejdú bez `requiresConsentEach`.
- `CALL_USER` grant určuje, komu smie agent volať. Predvolene len vlastníkovi.
- Admin role: org ADMIN spravuje `ComputeAccount`, `AgentNode`, `Connector`. USER spravuje svojho agenta a svoje `ConnectorCredential`.

## 6. Čo sa presunie z AIOS runnera do PM a kedy

| Fáza | Čo | Odkiaľ → kam |
|---|---|---|
| F1 (teraz, 2–3 týždne, odhad) | `AgentJob`, `AgentRun`, `Schedule`. Runner zapisuje behy do PM namiesto `~/.aios-runner/runs`. Chyby idú stále do AI Bugs | `runner/core.mjs`, `runner/pm.mjs` → nové `/api/v1/agent-jobs` |
| F2 | `Call` a post-call webhook. `voice-call.mjs` sa stane službou v PM (`lib/voice/`). `call-followup` sa spúšťa z webhooku, nie pollingom | `runner/voice-call.mjs` → `impofai-pm/lib/voice` |
| F3 | `ProcessDef` v DB, worker sa stane samostatným balíkom `impofai-pm/worker/`, cron prejde na plánovač v PM. AIOS repo ostane Marekovým osobným playgroundom | `processes/*` → DB seed |
| F4 | MCP brána konektorov (Gmail, Kalendár), `Agent` pre Andriiho, Filipa, Martina a Lea, prvý `AgentNode` pre projekt | nové |
| F5 | Chat, `App`, agent-to-agent | nové |

## 7. Najslabšie miesta návrhu

1. **Predplatné vo viacpoužívateľskom režime je právne aj technicky šedá zóna.** Zdieľanie jedného Max účtu medzi viacerými ľuďmi a automatizovaný headless beh pre org môže byť v rozpore s podmienkami Anthropic a OpenAI. Limity Max sú pri desiatkach agentov neznáme. Celý bod 4 stojí na predpoklade, ktorý som neoveril.
2. **MCP brána pre konektory je veľká stavba.** Vlastné OAuth ku Gmailu a Drive (Google verifikácia citlivých scope, šifrovanie tokenov, refresh) je samostatný produkt. Bez nej však platí, že `setup-token` konektory nenačíta, takže každé predplatné potrebuje interaktívny claude.ai login. Jedna z týchto dvoch ciest bolí.
3. **„Potvrdené v hovore“ ako bezpečnostná hranica je krehké.** Prepis môže byť chybný, hovory sa prerušujú (overený fakt) a LLM vo followupe interpretuje súhlas. `Approval.evidence` s citátom pomáha, ale pri mazaní a financiách to stále stojí na interpretácii modelu.
4. **Pokračovanie jobu po otázke (WAITING_INPUT)** pri `claude -p` nie je jasne vyriešené. `--resume` drží session lokálne na konkrétnom hostiteľovi a po hodinách až dňoch sa kontext stráca. Nový beh s históriou je drahší a menej presný.
5. **Rozsah.** 14 nových entít a 10 komponentov pre firmu s ~5 ľuďmi, kde PM beží na jednom serveri v Dockeri. Hrozí, že F4 a F5 sa nikdy nedokončia a chat a apps ostanú poloprázdne. Najväčšie riziko je, že sa stavia platforma skôr, než sa potvrdí, že ranný brief a callback reálne šetria čas.
6. **PM sa stáva single point of failure.** Dnešný runner hlási chyby aj pri výpadku PM (`undelivered.jsonl`). Keď sa fronta presunie do PM, výpadok PM zastaví všetkých agentov. Lokálny fallback workera treba zachovať.
