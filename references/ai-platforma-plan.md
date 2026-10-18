# AI platforma IMPOFAI – plán

Stav: 2026-10-18. Cieľ: [[ai-platforma-ciel]]. Plán vznikol zo swarmu štyroch agentov (architektúra, inventúra, roadmapa, červený tím) s krížovou recenziou. Podklady sú v `.swarm/platform-plan/`. Nezhody, ktoré swarm nevyriešil, sú na konci ako rozhodnutia pre Mareka.

## Princípy plánu
1. **Každá fáza prinesie Marekovi použiteľnú vec** a otestuje sa telefonicky alebo v PM. Žiadna fáza nie je len infraštruktúra.
2. **Najprv dokázať hodnotu v AIOS runneri, potom presúvať do PM.** Runner (`runner/`, `processes/`) je laboratórium. Čo sa osvedčí, presunie sa do PM ako produkt (fáza 3+). Kontrakty sa už teraz navrhujú v tvare budúcich entít PM (Agent, AgentRun, Call, Approval, Question), aby presun bol migráciou, nie prerábkou.
3. **Model navrhuje, kód vykonáva.** Agent, ktorý číta e-maily a prepisy, nemá práva na zápis. Zápisy robí samostatný krok s úzkym zoznamom nástrojov a auditom.
4. **Jeden človek, jedno prihlásenie.** Predplatné sa nezdieľa medzi ľudí. Je to podmienka Anthropic, pozri riziko R1.
5. **Spoľahlivosť pred rozširovaním.** Hovor, ktorý nepríde, alebo stratený výsledok ničí dôveru rýchlejšie než chýbajúca funkcia.

## Fázy

### Fáza 0 – Spoľahlivosť (súčasť fázy 1)
- Opakovanie pri prechodnej chybe `claude -p` (18. 10. brief vypadol na súbehu obnovy OAuth tokenu).
- Druhý pokus o zmeškaný slot, čakanie na zámok namiesto tichého preskočenia.
- Archív výstupov followupov a executorov (365 behov).
- Neskôr: externý heartbeat cronu a oddelený login runnera od interaktívnych relácií (`CLAUDE_CONFIG_DIR`, vyžaduje Marekov `/login`).

### Fáza 1 – Hlasová slučka „zavolaj – urobí – zavolá späť“ a lepší brief *(rozpracované, 2026-10-18)*
- **Prichádzajúci hovor:**
  - Marek zavolá na Linphone číslo a osobný asistent prevezme úlohu, nápad alebo otázku;
  - spracovanie po hovore cez polling ElevenLabs (bez verejného webhooku);
  - akcie len od overeného volajúceho (`mtoth`).
- **Followup** iba zapíše hovor do second brainu a navrhne akcie s citátom.
- **`action-executor`** vykoná potvrdené akcie:
  - úzky zoznam nástrojov, limit 10 zápisov;
  - záloha pred zmazaním;
  - audit komentárom na úlohe;
  - prístupy, členovia, financie a e-maily von idú len ako úloha na schválenie.
- **Spätný hovor** s výsledkom a otázkami. Tiché hodiny 21:00–7:30, max 3 za deň, strop 60 min hovorov za deň. Čo sa nestihne, povie ranný brief.
- **Brief v3:**
  - všetky aktívne projekty aj bez zmien a detaily úloh (kľúč, popis, riešiteľ, termín);
  - výsledky všetkých hovorov od posledného briefu;
  - fronta otvorených otázok `context/otvorene-otazky.md`;
  - zopakovanie dohodnutých akcií s ID.
- **Testovací režim** `--dry-run` pre každý proces, bez hovorov a zápisov.
- **Hotovo =** Marek ráno dostane brief, ktorý odpovie na otázky typu „čo presne dokončil Andrii“. Cez deň zavolá s úlohou a do 30 minút mu zazvoní spätný hovor s ID vytvorenej úlohy. Ďalší brief už vybavené nespomína a otázky sa postupne zodpovedajú.

### Fáza 2 – Prvý serverový agent (1 projekt)
1. „Klient chce zmenu X na projekte Y“ v hovore.
2. Executor založí úlohu s `prompt` a `agent_run_status=queued` (polia v PM existujú).
3. Worker na serveri projektu si úlohu vezme a spustí Claude Code na vetve.
4. Výsledok zapíše cez `pm_update_agent_run`: `preview_url` a stav `needs_review`.
5. Otázky serverového agenta idú do fronty otázok a asistent ich povie v hovore.
- Nikdy produkcia, merge robí človek.
- Kandidát: Zacharides/Imagewell e-shop (projektový MCP token existuje).
- Treba Marekovo rozhodnutie o serveri a o produkcii.

### Fáza 3 – Agent v PM (viditeľnosť a prvé entity)
- Stránka „Môj agent“ v PM:
  - hovory, vykonané a preskočené akcie s citátmi;
  - fronta otázok s odpoveďou klikom;
  - behy procesov.
- Prvé entity v PM: `Agent`, `AgentRun`, `Call` (rozšírením existujúceho `BrainCall`), `Approval`, `Question`. Runner zapisuje behy do PM.
- Drafty e-mailov v Marekovom štýle so schválením hlasom.

### Fáza 4 – Druhý používateľ
- Kolega (Leo alebo Andrii) má vlastný brief a vlastného agenta.
- Vlastné prihlásenie (Claude Team seat platený firmou), vlastný RESTRICTED token na jeho spaces.
- Agent volá len svojmu človeku.
- Predtým: DPIA a informovanie (hovory zamestnancov sú spracovanie osobných údajov).

### Fáza 5 – Interview kampane a mapa procesov
- Týždenné check-in hovory s tímom, šablóny otázok, odpovede do second brainu a mapy firmy, manažérsky súhrn v briefe.

### Fáza 6 – Platforma
- AI chat s projektmi v PM, naplánované úlohy z UI, custom konektory (aj cez chat), aplikácie od agenta, sieť agentov s povoleniami, chat ľudí a agentov, produkt pre iné firmy (predplatné a trial).
- Presný obsah sa určí podľa používania vo fázach 1–5.

## Hlavné riziká (z červeného tímu)
| # | Riziko | Mitigácia | Kedy |
|---|---|---|---|
| R1 | Podmienky Anthropic: predplatné sa nesmie zdieľať ani sprostredkovať za iných používateľov | každý človek vlastné prihlásenie (Team seat); pre produkt pre iné firmy overiť s Anthropic, inak API alebo Bedrock | pred fázou 4 |
| R2 | Prompt injection: obsah e-mailov alebo hovorov vedie agenta s právami zapisovať | oddelenie návrhu a vykonania, len vety používateľa sú pokyn, úzky zoznam nástrojov | fáza 1 |
| R3 | Nepresný prepis reči pri potvrdení | zopakovanie s ID a menom, záloha pred zmazaním, audit, spätný hovor | fáza 1 |
| R4 | Spoľahlivosť (SIP 408, prerušené hovory, jeden server, jedno prihlásenie) | opakovanie, catch-up, archív, neskôr heartbeat a oddelený login | fáza 0–1 |
| R5 | Serveroví agenti a produkcia | len vetva a preview, bez produkčných tajomstiev, merge človek | fáza 2 |
| R6 | GDPR hovorov zamestnancov (§ 13 ods. 4 ZP, DPIA) | DPIA a informovanie pred prvým hovorom inému človeku | pred fázou 4 |
| R7 | Náklady ElevenLabs (~0,08–0,16 USD/min + LLM) | denný strop minút, report | fáza 1+ |
| R8 | Rozsah (príliš veľa produktov naraz) | jedna fáza, jeden používateľ, meranie | stále |

## Nezhody swarmu, rozhodnutia pre Mareka
1. **Prichádzajúce hovory:**
   - Orchestrátor prepol Linphone číslo z testovacej Petry (PlusReality) na osobného asistenta, lebo inak „zavolať agentovi“ nefunguje.
   - P1 navrhoval samostatné druhé číslo.
   - Ak Petra na tomto čísle treba, kúpime druhé číslo. Návrat späť je opísaný v `.swarm/phase1/round1/I3.md`.
2. **Bezpečnosť verzus pohodlie:**
   - Červený tím chcel druhé potvrdenie mimo hlasu a 2 týždne testovacieho režimu.
   - Prijatý kompromis: zopakovanie s ID, záloha a audit, mazanie len pri vyslovenom kľúči úlohy, prístupy a financie len ako úloha na schválenie.
   - Ak chceš prísnejšie (alebo voľnejšie), povedz.
3. **Kedy prejsť do PM:**
   - Architekt chcel frontu jobov v PM hneď.
   - Roadmapa a inventúra ju odložili do fázy 3, kým sa slučka neosvedčí. Rozhodnuté: fáza 3.
4. **Model predplatného pre produkt pre iných:**
   - Architekt: vlastný seat na človeka, platí firma.
   - Červený tím: pre produkt pre iných pravdepodobne len API.
   - Treba overiť priamo s Anthropic, kým sa začne fáza 4.

## Metriky na 3 mesiace (návrh, čaká na potvrdenie)
- Brief príde 95 % pracovných dní. Marek ho dočúva a odpovedá na otázky.
- Aspoň 10 úloh týždenne zadaných hlasom a vykonaných bez opravy.
- Prvý serverový agent doručil 3 zmeny ako preview.
- Druhý človek používa svojho agenta 10 pracovných dní.
