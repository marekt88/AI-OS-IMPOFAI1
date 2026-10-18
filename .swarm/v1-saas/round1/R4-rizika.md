# R4 – Červený tím: V1 SaaS a fáza 2 (2026-10-18)

Stance: skeptik (rola). Odhady sú označené **(odhad)**. Fakty o produktoch sú overené k 18. 10. 2026. Väčšina zdrojov je sekundárna, preto ich pred rozhodnutím treba overiť v oficiálnej dokumentácii.

**Záver:**
- V1 nezabije technika, ale **aktivácia**. Kto nemá platené AI s MCP a nevie, čo je konektor, sa za 30 dní nedostane k hodnote.
- Druhá vec, ktorá V1 zabije, je **právo a prevádzka**:
  - od 1. 1. 2027 platia slovenské e-faktúry;
  - chýba DPA a zoznam subprocesorov;
  - live beží na jednom stroji spolu s dev prostredím a runnerom.
- Fáza 2 v tvare „všetky práva na serveri, kde beží live PM a DB“ je **najväčšie jednotlivé riziko celého plánu**.

## 1. V1 SaaS: trh, cena, prvý zákazník

### Pozícia na trhu
| Produkt | Stav | Čo to znamená pre V1 |
|---|---|---|
| Notion AI | Plné AI je len v pláne Business, ~20 USD/os. mesačne pri ročnej platbe; agentské kredity sa platia navyše ([krater.ai](https://krater.ai/blog/notion-ai-pricing), [automationatlas](https://automationatlas.io/answers/notion-pricing-explained-2026/)). Oficiálny remote MCP `mcp.notion.com/mcp` ([stacklok](https://docs.stacklok.com/toolhive/guides-mcp/notion-remote)). | Kto už má Notion, má aj „second brain cez MCP“. Notion je hlavný substitút. |
| ClickUp Brain | Brain je add-on za 7–9 USD, Everything AI ~28 USD ([eesel](https://eesel.ai/blog/clickup-brain), [agiled](https://agiled.app/blog/clickup-pricing)). Oficiálny MCP `mcp.clickup.com/mcp` vo všetkých plánoch ([ClickUp docs](https://developer.clickup.com/docs/connect-an-ai-assistant-to-clickups-mcp-server.md)). | ClickUp + Claude už pokrýva PM cez MCP. Náš rozdiel je iba second brain a štruktúra. |
| Mem, Tana, Reflect | 0–18 USD/mes ([costbench](https://www.costbench.com/compare/mem-vs-tana/)) | Lacné notes s vlastným AI. Bojujeme cenou za seat aj s nimi. |
| Rewind/Limitless | Meta ich kúpila 5. 12. 2025 a služba v EÚ skončila ([9to5mac](https://9to5mac.com/2025/12/05/rewind-limitless-meta-acquisition/)). | Kategória „pamäť“ sa konsoliduje do veľkých hráčov. To je varovanie aj príležitosť (EÚ hosting). |
| „Second brain MCP“ služby (napr. [hjarni](https://hjarni.com/docs/connect-claude-mcp)) | malé, lacné | Nízka bariéra vstupu, ľahko kopírovateľné. |

**Hlavná hrozba:**
- Claude, ChatGPT aj Gemini budujú vlastnú pamäť a projekty.
- Hodnota „AI si pamätá kontext“ sa presúva do samotného AI klienta.

**Obhájiteľná pozícia:**
- **zdieľaný** firemný mozog s prístupmi (folder/space), ktorý je nezávislý od dodávateľa AI;
- väzba na úlohy a výkazy času;
- hosting v EÚ.

To osobná pamäť v Claude nevie.

### Prečo zaplatiť 6 €/seat
- **Áno:** 6 € je pod Notion Business (~20 USD) aj pod ClickUp Brain add-on. Cenou nie je problém.
- **Problém:**
  - Kupujúci nevidí hodnotu v prvý deň. Second brain je prázdny a hodnota rastie týždne.
  - Pri cene 6 € si nemôžeme dovoliť ľudský onboarding: (odhad) 20 seatov × 6 € = 120 €/mes.
  - Hodina podpory na zákazníka zje maržu za mesiac.
- **Návrh:**
  - predávať firmám s 5–30 ľuďmi, ktoré už platia Claude Team alebo ChatGPT Business;
  - „aktivačný míľnik“ do 7 dní: 1 pripojený konektor, 20 poznámok a 1 naplánovaná úloha;
  - meraný funnel, nie predpoklad.

### Ideálny prvý zákazník
Malá agentúra alebo dev/AI tím (5–20 ľudí), kde:
- už všetci majú Claude Team/Pro alebo ChatGPT Business;
- je majiteľ „power user“, ktorý konektor nastaví za ostatných;
- je problém odovzdávať kontext klientov (Fireflies prepisy, e-maily) medzi ľudí.

Prakticky ide o firmy podobné IMPOFAI a ich klientov (Wellgard, Imagewell).

Nie je to: bežný jednotlivec, B2C, ani firma bez plateného AI.

### Riziko „žiadne AI v platforme“, bariéra MCP
- **Penetrácia plateného AI:**
  - ChatGPT má ~900 mil. WAU a ~50 mil. platiacich, teda ~5 % ([technologychecker](https://www.technologychecker.io/blog/chatgpt-statistics), [getairefs](https://getairefs.com/blog/chatgpt-statistics-june-2026/));
  - Claude čísla nezverejňuje, platené predplatné sa v 2026 „viac než zdvojnásobili“, ale je ďaleko za ChatGPT ([unite.ai](https://www.unite.ai/claude-paid-subscriptions-more-than-double-as-consumer-momentum-builds/), [TNW](https://thenextweb.com/news/anthropic-claude-paying-consumers-growth-chatgpt-indagari)).
  - **(odhad)** Pod 10 % bežnej populácie má platené AI. MCP konektor si sám pridá zlomok z nich, rádovo 1 %. V cieľovom segmente (AI-first tímy) je to 30–70 %.
- **Claude.ai:**
  - custom remote MCP je na všetkých plánoch, Free len 1 konektor, stále beta;
  - v Team/Enterprise ho musí pridať **Owner**, člen nie ([support.claude.com](https://support.claude.com/en/articles/11175166), [usecarly](https://www.usecarly.com/blog/claude-mcp/)).
  - Pozvaný člen firmy na Claude Team sa teda sám nepripojí. Onboarding pre pozvaných s tým musí počítať.
- **ChatGPT:**
  - Developer mode s plným MCP vrátane zápisov je pre Plus/Pro/Business/Enterprise/Edu, len na webe ([OpenAI docs](https://developers.openai.com/api/docs/guides/developer-mode));
  - každý zápis vyžaduje potvrdenie a nová konverzácia znova pýta;
  - OpenAI ho sám nazýva „powerful but dangerous“.
  - Pre bežného používateľa je to odstrašujúce: „developer mode“ a varovania.
- **Gemini:**
  - custom MCP v spotrebiteľskej appke je nejasný: podľa časti zdrojov len AI Ultra/Spark, US a angličtina ([harvv](https://harvv.com/install/gemini), [flowith](https://flowith.io/blog/gemini-spark-connected-apps-mcp-guide/));
  - Gemini Enterprise ho má cez admina ([Google Cloud](https://docs.cloud.google.com/gemini/enterprise/docs/connectors/custom-mcp-server/set-up-custom-mcp-server)).
  - **Gemini v onboardingu neponúkať ako rovnocennú voľbu.**
- **Voice s MCP:**
  - **Claude:** voice mód na mobile používa „the tools you've connected“, na všetkých plánoch, Free s 1 nástrojom ([support.claude.com voice](https://support.claude.com/en/articles/11101966-using-voice-mode-on-claude-mobile-apps)). Výslovne to platí pre Gmail, Calendar a Slack. Pre custom MCP to stránka nepíše, treba **otestovať s naším konektorom**. Mimo angličtiny je beta, čo pre slovenčinu znamená riziko.
  - **ChatGPT:** podľa komunity (máj–júl 2026) MCP/apps v hlasovom režime nefungujú ([OpenAI community](https://community.openai.com/t/chatgpt-support-of-mcp-in-voice-mode-on-web-and-android/1382072)).
  - **Hodnotový sľub „voice asistent riadi PM“ teda dnes platí reálne len pre Claude.**
- **Scheduled tasks:**
  - **Claude:** Cowork scheduled tasks sú pre Pro/Max/Team/Enterprise, bežia v cloude s konektormi ([support.claude.com](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork)). Claude Code routines bežia na Pro+ ([docs](https://code.claude.com/docs/en/routines.md)).
  - **ChatGPT:** Tasks môžu podľa sekundárneho zdroja od júna 2026 používať pripojené apps ([porteden](https://porteden.com/blog/chatgpt-scheduled-tasks-tools/)). Treba overiť pre custom MCP.
  - **Free používateľ automatické plnenie brainu nemá.**

## 2. Prevádzka a právo SaaS v EÚ
- **GDPR:**
  - Sme sprostredkovateľ dát zákazníka, potrebujeme DPA podľa čl. 28 a verejný zoznam subprocesorov: hosting, Stripe, e-mail provider a Fireflies, ak ho synchronizujeme my.
  - Kritické: **obsah brainu tečie k AI zákazníka** (Anthropic, OpenAI) cez MCP. Toto spracovanie robí zákazník, nie my. V DPA a podmienkach to treba výslovne napísať, inak sa očakáva, že ručíme za to, kam dáta odišli.
  - Treba poznať lokalitu servera (overiť poskytovateľa a EÚ región).
  - Zálohy: dnes sú to `predeploy-*.dump` na tom istom stroji (`/home/marek/impofai-pm/deploy/README.md`), čo nie je záloha.
- **Podmienky:** VOP, zásady ochrany súkromia, SLA „best effort“, obmedzenie zodpovednosti, zakázané použitie.
- **DPH a faktúry:**
  - B2C v EÚ: DPH krajiny zákazníka; nad 10 000 € ročne cez OSS.
  - B2B: reverse charge po overení IČ DPH vo VIES ([dodopayments](https://dodopayments.com/blogs/eu-vat-saas-guide-2026)). Stripe Tax to počíta, ale VIES validáciu a zodpovednosť nesieme my.
  - **Kritické a podcenené:** od **1. 1. 2027 sú domáce SK B2B faktúry povinne štruktúrované e-faktúry cez Peppol**, PDF nestačí, pokuty do 10 000 € ([tradeshift](https://tradeshift.com/resources/compliance/slovakia-b2b-e-invoicing-mandate-2027-tradeshift/), [fiscal-requirements](https://fiscal-requirements.com/news/5920-slovakia-prepares-for-mandatory-b2b-and-b2g-e-invoicing-from-january-2027)). PDF faktúra zo Stripe slovenskému B2B zákazníkovi nebude stačiť. Treba fakturačný systém s Peppol (napr. SuperFaktúra alebo iný certifikovaný poskytovateľ), napojený na Stripe webhook.
- **E-mail:**
  - V kóde nie je žiadny mailer (žiadny nodemailer/resend v `package.json`).
  - Treba transakčného providera (Postmark, Resend, SES EU) a SPF, DKIM a DMARC na `impofai.com`. Google a Yahoo to vyžadujú od roku 2024 ([Google](https://support.google.com/a/answer/81126)).
  - `noreply@` znižuje dôveru. Lepšie je `hello@` s odpoveďami do schránky.
  - Oddeliť transakčnú a marketingovú doménu, aby reklama nepokazila reset hesla.
- **Zámok po triale:**
  - Úplný zámok vrátane exportu je v rozpore s čl. 20 GDPR (prenosnosť) a pri B2B s Data Act (čl. 23–31, prepínanie poskytovateľov, platí od 9/2025). Je to aj zlé PR.
  - Návrh:
    - po triale čítanie a export (Markdown ZIP + JSON) ostáva 60–90 dní, zápis a MCP zápis sa zamknú;
    - MCP vráti zrozumiteľnú chybu s linkom na platbu, nie 401;
    - potom e-mail a zmazanie.
- **Multi-tenant:**
  - Jedna DB s `orgId` stĺpcami bez Postgres RLS. Izolácia stojí iba na aplikačnom kóde (`lib/permissions/index.ts`) a na ~140 MCP nástrojoch, kde stačí jeden zabudnutý filter.
  - Uploady sú na lokálnom volume. Dev a live DB bežia na rovnakom hoste, rovnako runner s `claude -p`.
  - Live heslá sú v `.swarm/pm-build/credentials.md`.
  - Návrh:
    - testy izolácie pre každý MCP nástroj (token org A sa nesmie dostať k ID z org B);
    - RLS alebo aspoň centrálny Prisma extension, ktorý vynúti `orgId`;
    - rate limit na token;
    - šifrované zálohy mimo stroja;
    - odstrániť credentials zo `.swarm`.

## 3. ClickUp prepojenie (realisticky)
- **Synchronizácia (ClickUp API ↔ PM):**
  - mesiace práce: mapovanie hierarchie, statusov a custom fields, webhooky, konflikty;
  - za 6 € sa to neoplatí.
- **Realistické V1 = „bring your own ClickUp MCP“:**
  - používateľ pripojí oficiálny ClickUp MCP a náš brain MCP vedľa seba;
  - šablóny promptov hovoria, ako ich kombinovať (úlohy v ClickUp, kontext v brain).
- **Pozor na limity:** ClickUp MCP bez Everything AI dáva podľa sekundárnych zdrojov ~50 volaní/24 h na Free a ~300 na Unlimited+ ([contextbolt](https://contextbolt.com/blog/clickup-mcp/)). Naplánované úlohy to rýchlo vyčerpajú.
- **Prípadne neskôr:** jednosmerný import ClickUp → brain (úlohy ako kontext), nie obojsmerná synchronizácia.

## 4. Fáza 2: coding agent „so všetkými právami“
**Riziká pri dnešnom stave:**
- Live PM, live DB, dev DB, runner aj Marekov Claude login sú na jednom stroji.
- Agent s plnými právami a Bash na tomto stroji vidí:
  - `~/impofai-pm-live/.env.live`;
  - Docker socket, a teda root-ekvivalent;
  - DB všetkých zákazníkov V1.
- Prompt injection prichádza cez:
  - text úlohy z hovoru;
  - obsah brainu;
  - issue a e-maily klientov.
- Jeden takýto incident = únik dát platiacich zákazníkov a GDPR incident s 72 h oznamovacou povinnosťou.
- „Live URL“ na rovnakom stroji znamená, že preview so zlým kódom môže zhodiť prod (RAM 1 GB limit, spoločný Caddy).

**Minimálne bezpečné nastavenie, ktoré stále splní „všetky práva“:**
- „Všetky práva“ = **plné práva vo vnútri sandboxu**, nie na hostiteľovi:
  - `bypassPermissions` v kontajneri alebo VM bez prod tajomstiev;
  - vlastná kópia DB zo seedu alebo anonymizovaného dumpu;
  - git push iba na vetvu;
  - deploy preview na samostatný subdoménový kontajner (`pr-123.preview…`) s limitom CPU/RAM.
- Ideálne **iný server alebo VM**. Merge do `main` a nasadenie robí Marek.
- Tajomstvá:
  - deploy kľúč iba na repo;
  - žiadny `.env.live`;
  - sieťový allowlist (npm, GitHub, Anthropic).

**Porovnanie spôsobov behu:**

| Možnosť | Fakty | Hodnotenie |
|---|---|---|
| Remote Control | Session beží lokálne, iba outbound HTTPS, Pro/Max/Team/Ent, API kľúče nie; `--permission-mode` pri serveri; Trusted Devices; po ~10 min výpadku server mode skončí ([docs](https://code.claude.com/docs/en/remote-control)) | Dobré na „Marek dohliada z mobilu“. Na automatické spúšťanie z PM sa nehodí: treba živý proces a tmux. Beží tam, kde ho spustíš, teda opäť na prod stroji. |
| `claude --cloud` / cloud sessions / routines | Anthropic VM, klonuje z GitHubu, Pro/Max/Team; routines bežia bez povolení, dajú sa spustiť cez API trigger, s konektormi; sieť Trusted allowlist ([docs](https://code.claude.com/docs/en/claude-code-on-the-web.md), [routines](https://code.claude.com/docs/en/routines.md)) | **Najbezpečnejší default:** „všetky práva“ v izolovanom VM, nič z prod stroja. Mínusy: vyžaduje GitHub (overiť, kde je repo PM; lokálne nemá `git remote`), preview URL nevznikne samo, routines sú research preview. |
| Self-hosted runner | `claude self-hosted-runner`, len Team/Enterprise, beta ([docs](https://code.claude.com/docs/en/self-hosted-environments)) | Dobré, ak treba vlastnú infra a preview na vlastnom stroji. Vyžaduje Team plán. |
| Vlastný worker s `claude -p` | Plná kontrola, napojenie na `agent_run_status` v PM | Najviac práce a najviac rizika (to, ako sandbox nastavíme). Beží na Marekovom Max predplatnom, čo je OK len pre jeho vlastnú prácu (R1 z P4). |

**Odporúčanie:** API trigger cloud routine (alebo `claude --cloud`) na GitHub repo. Preview build cez GitHub Action na **samostatný preview VM**. Fallback: vlastný `claude -p` worker v rootless kontajneri na inom VM.

## 5. Tabuľka rizík

| # | Riziko | Dopad | Zdroj | Mitigácia | Kedy |
|---|---|---|---|---|---|
| 1 | Aktivácia: používateľ bez plateného AI a MCP znalostí nedosiahne hodnotu v triale | kritický (žiadne konverzie) | 5 % platiacich ChatGPT; Claude Team konektor pridáva len Owner; ChatGPT „developer mode“ | ICP = AI-first tímy; aktivačný míľnik a meranie; prompt pre Ownera; Claude ako primárna cesta | pred reklamou |
| 2 | Coding agent na prod stroji s plnými právami | kritický (únik všetkých tenantov, výpadok) | `deploy/README.md`: live, dev, DB a runner na jednom hoste | Sandbox/cloud VM, žiadne prod tajomstvá, preview mimo prod, merge človek | pred fázou 2 |
| 3 | SK e-faktúra Peppol od 1. 1. 2027 | vysoký (pokuty, neplatné faktúry) | tradeshift, fiscal-requirements | Fakturačný systém s Peppol napojený na Stripe | pred prvou SK B2B platbou |
| 4 | Únik medzi tenantmi (chýba RLS, ~140 nástrojov) | kritický | `prisma/schema.prisma` `orgId`, aplikačné kontroly | Testy izolácie, vynútený `orgId`, rate limit, audit | pred 1. cudzou firmou |
| 5 | Chýba DPA, subprocesori, VOP, zálohy mimo stroja | vysoký | dumpy na rovnakom hoste | DPA, zoznam subprocesorov, offsite šifrované zálohy, runbook | pred spustením |
| 6 | Voice s MCP funguje len v Claude (ChatGPT nie, Gemini nejasné), slovenčina beta | stredný (sľub v reklame nesedí) | support.claude.com, OpenAI community | Marketing „pre Claude“, test nášho MCP vo voice, ostatné „čoskoro“ | pred landing page |
| 7 | Zámok po triale bez exportu | stredný (GDPR čl. 20, Data Act, PR) | GDPR, Data Act | Read-only + export 60–90 dní, potom zmazanie s upozornením | pri paywalle |
| 8 | E-maily v spame / chýba mailer | stredný (reset hesla nefunguje) | žiadny mailer v kóde | Postmark/SES EU, SPF/DKIM/DMARC, odpovedateľná adresa | pred signupom |
| 9 | Obojsmerná ClickUp synchronizácia | vysoký (čas) | ClickUp API, limity MCP 50/300 volaní | V1 = odporúčiť ClickUp MCP + šablóny | V1 |
| 10 | Substitúcia: Notion/ClickUp MCP a natívna pamäť v AI | vysoký (strednodobo) | Notion a ClickUp oficiálne MCP | Pozicionovanie: zdieľaný firemný mozog s prístupmi, EÚ, nezávislý od AI | stále |
| 11 | Podpora pri 6 €/seat zje maržu | stredný | (odhad) | Troubleshooting prompty, self-serve, minimálny počet seatov | V1 |
| 12 | Prompt injection cez brain → AI zákazníka zapíše/zmaže | vysoký | čl. P4 #3 | `readOnlyHint` na čítacích nástrojoch (ChatGPT podľa toho pýta potvrdenie), RESTRICTED tokeny default, soft-delete | V1 |

## 6. Ktoré riziká sú prehnané
- **„Žiadne AI v platforme je chyba“:** pre ICP (AI-first tímy s Claude Team) je to výhoda: nulové náklady na tokeny, žiadny problém s podmienkami Anthropic (R1 z P4 v V1 odpadá) a jednoduchší DPA. Problém je iba pre masový trh, ktorý nie je cieľ V1.
- **OSS a DPH v EÚ:** Stripe Tax to rieši a pod 10 000 € ročne B2C mimo SK sa účtuje slovenská DPH. Na začiatku sú to administratívne hodiny, nie blokér. (Peppol od 2027 prehnaný **nie je**.)
- **Gemini MCP:** netreba ho riešiť. Stačí Claude a ChatGPT, Gemini je „experimentálne“.
- **Konkurencia Notion/Mem/Tana v krátkom horizonte:** prvých 10–50 zákazníkov pôjde cez Marekovu sieť, nie cez porovnávanie funkcií.
- **Multi-tenant RLS „hneď“:** pre prvé 3–5 firiem stačia testy izolácie a audit. RLS je až pri škálovaní.
- **Remote Control ako bezpečnostná diera:** iba outbound, Trusted Devices, bez inbound portov. Riziko nie je v ňom, ale v tom, **kde** proces beží.
- **„Všetky práva“ ako požiadavka:** dá sa splniť bezpečne. Plné práva v sandboxe dávajú Marekovi presne to, čo chce (agent sa nepýta), bez prístupu k prod.
