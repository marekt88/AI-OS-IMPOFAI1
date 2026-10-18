# Spoločný kontext – plán AI platformy IMPOFAI (2026-10-18)

## Cieľ (vlastník: Marek Tóth, spoluzakladateľ IMPOFAI)
Úplné zadanie: `/home/marek/brain-src/repo/brainstorms/2026-10-16-ai-platforma-ciel-zdroje.md` (prečítaj celé).
V skratke: AI operačná vrstva pre firmu nad dnešnou PM aplikáciou.
- Každý používateľ má proaktívneho osobného agenta s vlastnými nástrojmi, knowledge a zdieľaným second brainom.
- Hlasové hovory: ranný brief, môžeš zavolať agentovi s úlohou, agent zavolá späť s výsledkom a otázkami, interview kampane.
- Sieť agentov: agenti si posielajú úlohy a knowledge s povoleniami. Serveroví Claude Code agenti (1 server = 1 projekt) robia zmeny kódu, otázky idú cez hlasového agenta, výsledok je preview URL v aktivite tasku.
- Custom konektory (aj cez AI chat), vlastné aplikácie a dashboardy, AI chat s projektmi, naplánované úlohy, chat s ľuďmi aj agentmi (Slack štýl).
- Žiadne API tokeny: predplatné (Claude Code / Codex / OpenAI login).

## Rozhodnutia vlastníka (potvrdené v hovoroch 16. a 17. 10.)
- Stavia sa najprv pre IMPOFAI interne. Stabilné časti (task management) idú súbežne do produkcie pre iných. Hlasový agent je zatiaľ test, mimo produkcie.
- Predplatné platí organizácia. Bez predplatného nie je prístup, prípadne 10-dňový free trial (návrh).
- Agent po hovore smie robiť všetko, na čo má vlastník práva (aj mazanie a financie), ale len to, čo v hovore potvrdil.
- Počas hovoru hlasový agent nevolá žiadne systémy. Zbiera a potvrdzuje, vykonáva sa až po hovore.
- Ľudia na projektoch: StartFin – Andrii Popovych, Wellgard – Filip Haraj, Bridgit – Martin Orolin, Zacharides/Imagewell – Marek s AI agentom, PlusReality – Marek a Leo (Leonard Tóth).
- Nezodpovedané otázky:
  - kde agenti bežia (centrálne alebo inštancia na zákazníka);
  - komu smie agent volať;
  - zdieľanie medzi agentmi;
  - prvý server pre serverových agentov a či smú nasadzovať do produkcie;
  - chat (Slack, WhatsApp alebo PM);
  - kde žijú vytvorené aplikácie a konektory;
  - ďalší krok;
  - úspech o 3 mesiace.

## Súčasný stav (čo existuje)
1. **IMPOFAI PM** (`/home/marek/impofai-pm`, live https://project-managment.impofai.com)
   - Stack: Next.js 15, Prisma, Postgres, Docker na tomto serveri.
   - Hierarchia org → workspace → space → folder → task list → task, timesheety, rates, boards.
   - Second brain (Karpathy wiki, full-text search, revízie, Fireflies sync, zálohy, GDPR), mapa firmy, financie (import bankových výpisov, priradenie k projektom, ziskovosť, len admin).
   - MCP server `/api/mcp` so ~140 nástrojmi (pm_*), tokeny FULL/RESTRICTED s rozsahom na spaces/folders, OAuth pre claude.ai konektor.
   - Úloha má pole `prompt` a `agent_run_status` (queued/running/needs_review/failed) a `preview_url`. To je zárodok serverových agentov.
   - V PM nebeží žiadne AI.
2. **AIOS repo** (`/home/marek/brain-src/repo`, Marekov osobný AI OS, git `marekt88/AI-OS-IMPOFAI1`) a v ňom **spúšťač AI procesov** (`runner/`, `processes/`, návod `references/ai-runner.md`):
   - cron tick každých 5 min, `claude -p` na predplatnom Max (claude.ai login, claude.ai konektory: PM, Gmail, Calendar, Fireflies, Drive…);
   - log, lock, `lastSuccessAt`, chyby ako bug úlohy do PM listu AI Bugs;
   - procesy so vstupom (`--input`), procesy bez claude kroku, kontext z iného procesu.
3. **Procesy**:
   - `morning-brief`: 8:30 zber, 9:00 hovor na Linphone `mtoth` cez ElevenLabs SIP trunk;
   - `call-followup`: po hovore `claude -p` s prepisom zapíše do second brainu a vykoná potvrdené akcie;
   - `voice-interview`: hovor s otázkami.
   Spoločný kód hovoru je `runner/voice-call.mjs`.
4. **ElevenLabs**:
   - agent „IMPOFAI - Osobný asistent“ (`agent_7701m5254wcqektavn4skbrdn86n`), generický, obsah a pokyny prichádzajú cez dynamické premenné;
   - Linphone číslo `phnum_1901m4zry0ehf5gtm609k8p4yqak` je na prichádzajúce hovory priradené testovaciemu PlusReality agentovi „IMPOFAI - manager“ (Petra), čiže zatiaľ neexistujú prichádzajúce hovory k osobnému asistentovi;
   - hostovaný ElevenLabs MCP nevie spustiť hovor, ten ide cez REST API s kľúčom na serveri.
5. **Overené fakty**:
   - `claude -p` na predplatnom funguje s claude.ai konektormi;
   - dlhodobý `setup-token` claude.ai konektory nenačíta;
   - ranný brief 17. 10. prebehol celý sám (zber 77 s, hovor 6,5 min, followup 65 s);
   - SIP 408 = telefón offline;
   - niektoré hovory sa prerušili zo strany klienta.

## Pravidlá pre všetkých agentov
- Píšeš len do svojho súboru. Nič nemeníš v kóde, v PM ani v ElevenLabs. Žiadne zápisy cez MCP.
- Slovenčina, konkrétne, s odkazmi na súbory a fakty. Odhady označ ako odhady.
