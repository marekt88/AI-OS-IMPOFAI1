# KAPSA V1 – second brain + task management (definícia)

## 0. Rozhodnutia vlastníka (2026-10-19)
- **Značka:** KAPSA („vrecko“: firemné znalosti vo vrecku, útulné slovenské slovo). Doména zatiaľ ostáva, nová príde neskôr.
- **Onboarding:** vek je povinný, k nemu rola a veľkosť tímu.
- **Tier 45 €:** waitlist („čoskoro“), nie „vypredané“.
- **Gemini:** iba „iné (experimentálne)“.
- **Second brain:** čítanie/zápis pre pozvaných **nie vo V1**, prístup obmedzujú foldre a mapovanie.
- **Po triale:** úplný zámok webu aj MCP, export dát a fakturácia ostávajú dostupné.
- **E-mail:** provider a adresa zatiaľ chýbajú (Marek ich vytvorí). Kód je pripravený na Resend alebo SMTP cez env, v dev sa e-maily len logujú.
- **Fakturácia:** Stripe a slovenský Peppol poskytovateľ (napr. SuperFaktúra).
- **Jazyk:** slovenčina aj angličtina od začiatku pre web, auth, onboarding, guide, šablóny, e-maily a paywall. Voice šablóny Claude sú v angličtine, lebo Claude voice ide len po anglicky.
- **Prvý kanál:** Marekova sieť a AI workshopy pre majiteľov firiem a nadšencov, kde sa KAPSA predvedie. Reklamy až potom.
- **Fáza 2 (coding agent):** prvý projekt je samotná PM/KAPSA platforma.
- **Konektory vo V1 (2026-10-21):** KAPSA nemá vlastné konektory. Externé zdroje (Fireflies, Gmail, Drive…) číta AI používateľa cez svoje konektory (Claude, ChatGPT) a výsledky zapisuje do KAPSA cez MCP. Fireflies: používateľ si založí účet na fireflies.ai a pridá Fireflies konektor do svojho AI. Šablóna najprv zaindexuje všetko, čo chýba, potom navrhne dennú naplánovanú úlohu na schválenie. Serverový Fireflies sync nie je súčasť zákazníckeho setupu. Vlastné konektory v KAPSA až v ďalšej verzii.
- **Setup pre Claude (2026-10-20):** KAPSA plugin (konektor + pravidlá pri štarte session + skills kontext, second brain, úlohy, poradca + príkazy /kapsa-dnes, /kapsa-uloz) na stiahnutie na /brain/start a /mcp. Onboarding: najprv plugin, potom onboarding cez AI chat. Web a mobil claude.ai pluginy nepodporujú: konektor + skill + globálne inštrukcie.
- **Globálne inštrukcie a skill (2026-10-20):** AI zapisuje nové fakty a úlohy sám, mazanie len po potvrdení, kódy úloh nehovorí, urguje termíny. Skill je všeobecný pre každú firmu.
- **Šablóny (2026-10-20):** dizajn podľa Higgsfield, grafika ku každej šablóne, „Vyskúšať v Claude / ChatGPT“ s predvyplneným promptom (záloha: schránka).
- **Ranný brief a osobný priestor (2026-10-21):** brief sa nastavuje v rozhovore (konektory, témy z webu, systémy) a ukladá do osobného priestoru mozgu `osobne/<id>/`, ktorý vidí len daný človek (ani admin). Nie do Google Drive.
- **Vlastné konektory (2026-10-21):** zdroj bez hotového konektora rieši šablóna „Vlastný konektor v Claude Code“ (Claude desktop záložka Code alebo claude.ai/code s GitHubom), nie terminál. Lokálny konektor funguje len na danom počítači, konektor v cloude všade.


Stav: **záväzná definícia od 2026-10-19, aktualizovaná 2026-10-21** (Marekove rozhodnutia sú v kapitole 0). Značka produktu: **KAPSA**. Celkový cieľ: [[ai-platforma-ciel]], plán: [[ai-platforma-plan]]. Podklady: swarm R1–R4 v `.swarm/v1-saas/`.

## 1. Čo je V1 jednou vetou
Zdieľaný firemný mozog (second brain) a task management s prístupmi, ktoré používateľ ovláda vlastným AI (Claude, ChatGPT…) cez MCP. V platforme nebeží žiadne AI a neplatí sa za tokeny.

## 2. Pre koho (ICP)
- **Prvý zákazník:** AI-first malé tímy a agentúry (2–20 ľudí), kde majiteľ alebo manažér už platí Claude (Pro, Max, Team) a chce, aby AI poznalo firmu, klientov a úlohy.
- **Prvý kanál:** Marekova sieť a klienti IMPOFAI (prvých 5–10 firiem s meranou aktiváciou), až potom reklamy.

## 3. Hodnota
1. **AI pozná tvoju firmu.** Klienti, ľudia, rozhodnutia a hovory sú v jednom mozgu, ktorý číta každé AI tímu cez MCP.
2. **Plní sa sám.** Naplánované úlohy vlastného AI zapisujú prepisy z Fireflies, dôležité e-maily a zmeny v úlohách.
3. **Asistent, ktorý vie o všetkom.** V Claude (aj hlasom) povieš „presuň úlohu“, „napíš draft klientovi“ alebo „čo sme dohodli s X“ a AI to urobí s plným kontextom.
4. **Doplnenie medzier.** AI ako interviewer sa pýta na to, čo v mozgu chýba.
5. **Zdieľanie s prístupmi.** Owner určí, kto vidí ktoré projekty a ich časť mozgu. Dáta sú v EÚ a nie sú viazané na jedno AI.

## 4. Rozsah V1
### Je vo V1 (dnes hotové)
Task management (spaces, foldre, task listy, úlohy, závislosti, štítky, prílohy), timetracking a timesheety, ľudia a pozvánky, prístupy (space/folder), second brain (Karpathy wiki, hľadanie, revízie, mapovanie klientov na foldre, Fireflies sync), mapa firmy, MCP server (~140 nástrojov, FULL/RESTRICTED tokeny, OAuth pre Claude).

### Treba dorobiť (go-to-market)
1. **Landing page pre reklamy a sieť:**
   - hodnota, grafika slučky (človek → jeho AI → MCP → mozog + úlohy → späť);
   - cenník 6 €/seat (dnes chybne 4 €), FAQ, CTA na 30-dňový trial;
   - voice len ako „v Claude“ a až po teste.
2. **Signup s 30-dňovým trialom:** overenie e-mailu, reset hesla, transakčné e-maily (noreply cez EÚ providera, SPF/DKIM/DMARC).
3. **Pozvaní:** e-mailová pozvánka, landing „boli ste pozvaní do <org>“, vlastný onboarding (čo vidia, o viac požiadajú ownera) a vlastný MCP prompt.
4. **Onboarding ownera** (~6 krokov, do 10 minút po prvý zápis do mozgu):
   1. Prečo (1 obrazovka s grafikou).
   2. O tebe: meno, rola, veľkosť tímu.
   3. Tvoje AI: Claude odporúčané, ChatGPT, iné.
   4. Úlohy: naše PM alebo ClickUp.
   5. Pripoj AI: FULL prístup na setup, Easy setup prompt, živá detekcia prvého MCP volania, Skip/Úspech/Problém.
   6. Prvé výsledky a šablóny.
   Potom guide: mapa mozgu, ľudia, spaces, foldre, listy, timetracking, timesheety, prístupy. Spustiteľné kedykoľvek cez „?“.
5. **Easy setup prompt na `/mcp`:** z AI urobí onboarding agenta. Ten:
   1. definuje minimálny úspešný setup;
   2. vysvetlí MCP a overí pripojenie;
   3. cez interview založí štruktúru PM a mozgu a namapuje klientov na foldre;
   4. zapíše firmu, ľudí a klientov;
   5. skontroluje konektory, skilly a naplánované úlohy;
   6. navrhne Fireflies, Gmail a ranný brief;
   7. ponúkne voice interview.
   Varianty pre Claude (aj Claude Team: Owner pridáva konektor) a ChatGPT (developer mode). Troubleshooting prompty.
6. **Stránka Šablóny:** filtre chat, voice, naplánované úlohy, skilly, tipy; 15–20 šablón (zoznam v kapitole 7).
7. **`/brain/start` zjednodušiť:** jeden prompt a jeden skill pre zvolené AI, ostatné AI zbalené. Autofill = šablóny naplánovaných úloh na plnenie mozgu.
8. **Prístupy priamo v strome** (sidebar): „Zdieľať“ na space a folderi, vo V1 bez task listov.
9. **Second brain úroveň čítanie / čítanie+zápis** pre pozvaných a tokeny (ak to Marek potvrdí, pozri otázku 4).
10. **Paywall:**
    - po 30 dňoch zámok webu aj MCP (MCP vráti chybu s linkom) a e-mail;
    - stránka s cenníkom: 6 €/seat/mesiac; 45 € (proaktívni agenti, AI hovory, custom konektory, dashboardy, „čoskoro“ alebo waitlist); Enterprise (custom aplikácie a automatizácie);
    - Stripe Checkout, Portal a webhook;
    - export dát ostáva dostupný.
11. **Hardening pre cudzie firmy:**
    - testy izolácie organizácií;
    - odstrániť IMPOFAI konštanty (MCP URL, interní klienti, Fireflies);
    - GDPR purge aj v zálohách, zmazanie účtu a organizácie;
    - offsite zálohy;
    - VOP, DPA a zoznam subprocesorov;
    - fakturácia (SK e-faktúra Peppol od 1. 1. 2027).
12. **ClickUp:** vo V1 len cesta „pripoj oficiálny ClickUp MCP“ + šablóny, bez synchronizácie.
13. **Fireflies:** odporúčanie v onboardingu a šablóna Fireflies → mozog (s pripojením Fireflies konektora vo vlastnom AI).

### Nie je vo V1
AI v platforme, hlasové hovory od platformy, always-on agenti, custom konektory a dashboardy (tier 45 €), ClickUp synchronizácia, Gemini ako podporovaná voľba, granty na úrovni task listu, marketingové e-mailové sekvencie, Google signup.

## 5. Prístup k second brainu: ako funguje dnes a čo sa mení
**Dnes** (tri vrstvy, platia naraz):
1. **Rola:** admin vidí a píše všetko, člen len podľa mapovania. `/brain` prehliadanie je len pre admina.
2. **Prístup poznámky** (`admin` / `projekt`): odvodí sa z cesty a frontmatteru (`klient`, `projekt`, `pristup`) podľa pravidiel. Bez zhody platí admin.
3. **Mapovanie klient/projekt → space/folder:** člen vidí poznámku `projekt`, ak má prístup k namapovanému folderu (a token ho tam pustí).

Kto poznámku vidí, môže do nej písať (WIKI vrstva). Úroveň „len čítať“ dnes neexistuje.

**Čo sa stane pri zmene štruktúry mozgu:**
- **Nový priečinok mimo známych ciest:** poznámky v ňom sú len pre admina, kým sa nepridá pravidlo podľa cesty.
- **Premenovaný klient (slug):** poznámky zmiznú členom, kým sa nenamapuje nový slug.
- **Zmazaný folder:** zmaže sa aj mapovanie a poznámky potichu prejdú na admin.
- **Prepisy mimo `context/prepisy/`:** prestanú byť nemenné.

**Navrhované úpravy pre V1:**
- mapovanie aj podľa prefixu cesty;
- záverečné pravidlo „poznámka s klientom = projekt“ pre nové organizácie;
- pri zmazaní foldra mapovanie ostane ako „bez kontajnera“ a ukáže sa v admin UI;
- nástroj na premenovanie klienta;
- presun poznámky;
- konfigurovateľné „raw“ cesty;
- Easy setup prompt po vytvorení foldrov sám založí mapovanie, inak pozvaný v novej organizácii nevidí nič;
- úroveň mozgu NONE / READ / WRITE na členovi a pozvánke a príznak „zápis do mozgu“ na tokene (efektívne = menšie z oboch), ak sa potvrdí.

## 6. Aktivácia a metriky
- **Aktivovaný používateľ:** do 7 dní ≥1 MCP volanie, ≥5 zápisov do mozgu v ≥2 rôznych dňoch, ≥1 naplánovaná úloha (proxy: zápisy bez interakcie).
- **Ďalšie metriky:** čas po prvé MCP volanie (< 10 min), podiel „Niečo sa pokazilo“ podľa AI, owner s ≥1 pozvaným do 14 dní, konverzia trial → platba.

## 7. Šablóny V1 (prvá sada)
| # | Názov | Kategória | AI |
|---|---|---|---|
| 1 | Interviewer: doplň medzery v mozgu | chat + voice | Claude, ChatGPT (chat) |
| 2 | Ranný brief (osobný priestor v KAPSA) | naplánovaná úloha + chat | Claude, ChatGPT |
| 3 | Prečítaj mi ranný brief | voice | Claude |
| 4 | Draft e-mailu hlasom | voice | Claude |
| 5 | Skill: píš e-maily ako ja (z odoslaných) | skill | Claude, ChatGPT |
| 6 | Hlasom zmeň úlohy a zapíš čas | voice | Claude |
| 7 | Meetingy z Fireflies do second brainu (Fireflies konektor AI) | naplánovaná úloha + chat | Claude, ChatGPT |
| 8 | Nové e-maily → mozog | naplánovaná úloha | Claude |
| 9 | Týždenný report klientovi z úloh a času | naplánovaná úloha | Claude |
| 10 | Doplnenie timesheetu z kalendára | naplánovaná úloha + voice | Claude |
| 11 | Príprava na meeting | chat | všetky |
| 12 | Onboarding nového kolegu z mozgu | chat | všetky |
| 13 | Z chaotickej poznámky úlohy | chat | všetky |
| 14 | Týždenná kontrola zdravia mozgu | naplánovaná úloha | Claude |
| 15 | Skill: indexuj do mozgu | skill | všetky |
| 16 | Skill: mapa procesov | skill | Claude, ChatGPT |
| 17 | Tip: 1 klient = 1 Claude Project | tip | Claude, ChatGPT |
| 18 | Tip: full vs. obmedzený token | tip | všetky |
| 19 | Správa pre Ownera Claude Team (pridaj konektor) | tip | Claude Team |
| 20 | ClickUp + mozog: úlohy v ClickUp, kontext v mozgu | chat + tip | Claude, ChatGPT |
| 21 | Vlastný konektor v Claude Code | chat (len kopírovať) | Claude |

## 8. Ceny
- Trial 30 dní bez karty.
- **Tím:** 6 €/seat/mesiac.
- **Agenti (45 €):** proaktívni agenti, AI hovory, custom konektory, dashboardy, zatiaľ waitlist.
- **Enterprise:** custom aplikácie a automatizácie, dohodou.

## 9. Otvorené otázky pre Mareka
1. Vek v onboardingu: navrhujeme nahradiť rolou a veľkosťou tímu (GDPR minimalizácia). Súhlas?
2. Tier 45 €: „vypredané“ pôsobí ako falošná vzácnosť. Navrhujeme „čoskoro, pridaj sa na waitlist“. Súhlas?
3. Gemini: dnes nemá použiteľnú podporu vlastných MCP konektorov. Vo V1 iba ako „iné (experimentálne)“?
4. Second brain čítanie / čítanie+zápis pre pozvaných: chceš vo V1, alebo stačí, že prístup obmedzujú foldre?
5. Po triale: úplný zámok s dostupným exportom (jednoduché), alebo read-only 60 dní (drahšie)?
6. E-mail provider pre noreply: Postmark, Resend, SES (EÚ)? Aká doména (napr. `noreply@impofai.com`)?
7. Fakturácia: Stripe Tax + faktúry, a Peppol e-faktúra cez slovenského poskytovateľa (napr. SuperFaktúra)?
8. Jazyk produktu a landingu: SK a EN súčasne, alebo najprv jeden?
9. Doména produktu: ostáva `project-managment.impofai.com` (preklep v „managment“), alebo nová značka a doména?
10. Prvých zákazníkov získaš sám zo siete, alebo hneď reklamy?
