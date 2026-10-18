# Spoločný kontext – V1 SaaS a nové zadanie (2026-10-18)

## Kto a čo
Marek Tóth (IMPOFAI) vlastní:
- **IMPOFAI PM**: `/home/marek/impofai-pm`, live https://project-managment.impofai.com; Next.js 15, Prisma, Postgres, Docker na tomto serveri. Obsahuje task management, timetracking, second brain (Karpathy wiki), mapu firmy, financie a MCP server `/api/mcp` (~140 nástrojov, tokeny FULL/RESTRICTED, OAuth pre claude.ai).
- **AIOS runner**: `/home/marek/brain-src/repo/runner`, hlasové procesy cez ElevenLabs. Dlhodobý cieľ a plán sú v `/home/marek/brain-src/repo/references/ai-platforma-ciel.md` a `/home/marek/brain-src/repo/references/ai-platforma-plan.md`.

## Nové zadanie (Marek, 18. 10.)
1. Hlasový agent ostáva na Linphone, každý agent bude mať Linphone účet, alebo neskôr vlastná appka pre iOS a Android.
2. Analyzovať, či sa používateľ môže prihlásiť svojím Claude predplatným a my spúšťať AI procesy cez jeho predplatné (`claude -p`). Analyzovať https://kylon.io/, ktorý to robí s Claude Code a Codex predplatnými.
3. **Fáza 2, serverový agent.** Marek povie hlasovému agentovi zmenu v PM platforme → agent na PM spracuje požiadavku, vytvorí prompt a pošle ho Claude Code agentovi na serveri projektu (rovnaký CLAUDE.md a nástroje ako náš orchestrátor) → ten zmení kód, vytvorí live URL, zapíše úlohu do PM pre Mareka (kde otestovať) a pošle PM agentovi prehľad → PM agent zavolá Marekovi cez hlasového agenta. Coding agent môže klásť otázky alebo pýtať povolenia (Marek mu však chce dať všetky práva) a otázky idú cez PM agenta do hovoru. Prvý projekt: „tento projekt“ (Zacharides/Imagewell, alebo PM platforma; nejasné).
4. **V1 SaaS** na samostatný predaj = dnešný task management + timetracking + second brain, plne cez MCP. **V platforme nie je žiadne AI.** Používateľ používa vlastné AI (Claude, OpenAI, Gemini…) ako chat aj voice agenta a cez MCP plní second brain a riadi PM.
   - **Hodnota:**
     - second brain sa plní z každodennej práce s vlastným AI a naplánovanými úlohami;
     - voice režim jeho AI (napr. Claude) s MCP slúži ako asistent, ktorému povie zmeny v PM, draft e-mailu a pod.;
     - interview hlasom, ktoré dopĺňa chýbajúci kontext.
   - **Doplnky:**
     - priame prepojenie s ClickUp pre tých, čo nechcú naše PM;
     - odporúčanie Fireflies na prepisy meetingov.
   - **Onboarding:**
     - vysvetlí, prečo je second brain potrebný a prečo ho prepojiť s PM; jednoducho opíše dlhodobé plnenie a hlasových agentov, s grafikou;
     - otázky: ClickUp alebo naše PM, aké AI (Claude/OpenAI/Gemini/iné), vek, meno;
     - pripojenie MCP konektora: vysvetliť MCP; najprv FULL token na setup, potom restricted kľúče; zdieľanie second brainu a prístupy.
   - **MCP stránka:**
     - hore „Easy setup“ prompt s MCP URL, ktorý z AI urobí onboarding agenta. Ten:
       1. vysvetlí, čo MCP vie, a definuje minimálny úspešný setup;
       2. dá link na PM na vytvorenie FULL prístupu a po pripojení vedie interview o štruktúre second brainu a PM;
       3. navrhne nahrať do second brainu všetko, čo o používateľovi vie;
       4. vypíše a doplní konektory, skilly a naplánované úlohy (Fireflies, Gmail, zmeny v PM…);
       5. navrhne voice mód a interview prompt.
     - Po skopírovaní promptu stránka „vlož prompt do AI…“ s tlačidlami Skip / Setup úspešný / Niečo sa pokazilo (troubleshooting prompty).
   - **Stránka šablón** (nová): prompty pre chat, prompty pre voice agenta, naplánované úlohy, skilly, tipy.
     - Napr. interviewer na doplnenie medzier;
     - ranný brief ako naplánovaná úloha do Google Drive + voice prompt, ktorý ho prečíta;
     - draft e-mailu cez voice agenta;
     - skill na písanie e-mailov podľa histórie odoslaných.
     - Po šablónach (aspoň jedna otvorená) guide ukáže mapu second brainu a potom vysvetlí ľudí, spaces, foldre, task listy, timetracking, timesheety a prístupy.
   - **Prístupy** upravovať priamo na folderi, space a task liste v sidebar strome (nová funkcia). Vysvetliť, ako sa dnes obmedzuje prístup k second brainu a čo pri zmene jeho štruktúry.
   - **Na build** (až po otázkach a odpovediach):
     - landing page pre reklamy s grafikou;
     - onboarding s guide spustiteľným z „?“;
     - stránka šablón;
     - signup s 30-dňovým trialom;
     - e-maily (reset hesla, pozvánky) a úloha pre Mareka na prístup k noreply adrese;
     - signup pozvaných (vidia, že boli pozvaní do organizácie, dostanú e-mail, iný onboarding: čo vidia a že o viac majú požiadať ownera, iný MCP prompt; owner určí read alebo read+write do second brainu);
     - zjednodušiť `/brain/start` na prompt + skill (podľa zvoleného modelu, ostatné viditeľné), autofill = šablóny naplánovaných úloh na plnenie brainu.
   - **Paywall po triale:** zámok platformy aj MCP, e-mail a stránka s cenníkom:
     - 6 €/seat/mesiac;
     - 45 € „Always on proaktívni agenti, AI hovory, custom konektory, dashboardy“ (vypredané);
     - Enterprise (custom aplikácie a automatizácie).
     Stripe, plus úloha pre Mareka na prístup k Stripe.
5. **Zápisy do PM:**
   - úlohy pre Mareka: list `cmve9cm4h00pjnw28a6zystko`;
   - nápady: list `cmv0zartz000bp327tim8wtqw`;
   - čo treba dokončiť do V1 go-to-market: list `cmve9eet500plnw28cvblp8a0`;
   - dokumenty: folder `cmv0zaecp0005p327r1jt0ttn` (Startups / Projekt Manazment) – definícia V1 a celkový cieľ.

## Pravidlá
- **Toto kolo je analýza a návrh.** Nič nemeň v kóde, v PM, v ElevenLabs ani v DB.
- **PM:** smieš čítať cez MCP nástroje (`mcp__claude_ai_Projekt_manazment_-_IMPOFAI__*`, načítaj cez ToolSearch) a čítať kód.
- **Výstup:** slovensky, konkrétne, s cestami k súborom a zdrojmi (URL). Odhady označ.
