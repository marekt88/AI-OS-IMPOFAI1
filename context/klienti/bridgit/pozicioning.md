---
title: Bridgit pozicioning
type: strategia
private: true
updated: 2026-10-14
created: 2026-10-14
tags: strategia, bridgit, pozicioning, produkt
---

# Bridgit, pozicioning

Brainstorm z 14.10.2026. Projekt [[bridgit-platforma]], klient [[bridgit]].

**Toto je analýza s odporúčaniami, nie rozhodnutie.** Kým sa Marek nerozhodne, nič z toho nepatrí do `decisions/log.md`.

## Rámec, ktorý treba opraviť ako prvý

Ani jeden z ôsmich konkurentov na watchliste v [[konkurencia]] nepredáva produkt. Všetci predávajú služby: agentov, chatbotov, hlasových agentov, automatizácie, audity.

**Bridgit s nimi nesúťaží vôbec.** Súťaží s Power BI, s ľudským CFO, s Excelom a čoraz viac s Claude Desktop. Celý watchlist je pre Bridgit irelevantný, hoci pre zvyšok IMPOFAI relevantný je.

---

## 1. Diagnóza pozicioningu

### Tri príbehy, ani jeden dobrý

| Príbeh | Kde | Prečo nefunguje |
|---|---|---|
| „AI finančný riaditeľ" | web | Sľubuje úsudok a zodpovednosť, ktoré produkt nemá. CFO rokuje s bankou, rieši ľudí, rozhoduje o cashi. Bridgit robí asi 10 % jeho práce a pýta porovnanie s jeho platom 60 až 100 tis. € ročne. Vyrába sklamanie pri prvom použití. |
| „B2B analytická platforma" | intake Q1 | Komoditná kategória, v ktorej je Power BI. Na funkcie sa prehráva. |
| „Analýza verzus controlling" | Slebodník, hovor 30.12.2025 | **Jediná dobrá definícia, ktorá existuje, a nie je použitá nikde.** Viď [[2025-12-30-analyza-vs-controlling]]. |

### Kde je skutočná výhoda

Zo zoznamu „čo robíme, čo Claude nedokáže" je sedem z ôsmich bodov o dátach, nie o AI:

> čistíme dáta z ERP, vytvárame sémantické modely, ťaháme dáta do vlastného skladu, vieme sa napojiť na Pohodu, ktorá nemá API

**To je produkt. AI funkcie sú dôkaz, nie produkt.**

Ktokoľvek pripojí Claude na databázu. Skoro nikto nespraví tú nevďačnú robotu, ktorá spraví z dát slovenskej malej firmy niečo, na čo sa dá pýtať.

### Navrhovaná pozícia

> **Bridgit robí z vášho ERP dáta, na ktoré sa dá pýtať.**

Tri vrstvy, každá pre iného človeka:

| Vrstva | Čo to je | Pre koho | Stav |
|---|---|---|---|
| 1. Dátový základ | ERP do skladu, vyčistenie, sémantický model. Jedným klikom pre Odoo, Pohodu, Abru. | nikto to nevidí, všetko na tom stojí | **hotové, toto je výhoda** |
| 2. Hotové odpovede | reporty, KPI, alerty, plánované analýzy. Nič sa nepýta, samo hovorí. | netechnický manažér | čiastočne, chýbajú šablóny |
| 3. Otvorený prístup | MCP do Claude alebo čohokoľvek. Tvoje dáta, tvoj nástroj. | technický používateľ | **hotové, viď nižšie** |

Vrstva 3 je odpoveď na otázku „prečo nepoužijem len Claude". Lebo najprv potrebuješ vrstvu 1 a tú ti Claude nespraví.

### Vrstva 3 už beží

K 14.10.2026 je **Bridgit MCP server pripojený a funkčný** (organizácia „Nový s.r.o. (Master)"). Sprístupňuje tri oddelené enginy:

- **Power BI** cez `execute_dax`, so schémou cez `list_datasets` a `get_dataset_schema`
- **BigQuery** cez `execute_sql`, so schémou cez `list_table_ids` a `get_table_info`
- **Znalostná báza** cez `search_wiki` a `read_wiki_page`

Server sám upozorňuje, že join naprieč Power BI a BigQuery nie je možný a že každý dotaz stojí tokeny.

**Dôsledok pre pozicioning:** vrstva 3 nie je plán, je dodaná. V intake aj na webe je zatiaľ vedená ako nápad. To treba zosúladiť.

### Pomenovanie, ktoré chýba

To, čo Bridgit robí medzi surovými dátami a tým, kto sa pýta, sa volá **semantic layer**. Je to uznaná produktová kategória s hráčmi ako Cube, dbt Semantic Layer a AtScale. Drží definície metrík na jednom mieste, aby sa „obrat" neznamenal v každom reporte niečo iné.

Dáva to slovník, ktorému rozumie investor aj technický kupujúci.

*Kedy ten argument nepoužiť:* ak má zákazník jeden čistý zdroj dát, sémantická vrstva je réžia navyše.

---

## 2. Cieľ na slovenskom trhu

### Nie „AI analytická platforma pre Slovensko"

> **Byť firmou, ktorá vlastní prístup k dátam z Pohody.**

Prečo Pohoda:

- Obrovská inštalovaná báza v SK aj ČR
- **Nemá API.** Bridgit to vyriešil.
- Odoo a Abra API majú, tie spraví ktokoľvek
- Žiadny globálny hráč sa s Pohodou nikdy trápiť nebude

Cieľ na 12 mesiacov merať **počtom živých Pohoda napojení, nie tržbou.** Tržba príde z vrstvy nad tým.

### Jedna vertikála, nie celý trh

Sémantický model je to drahé. Jeho opakované použitie je čistá marža. Z case studies v [[zakaznik]] je najlepší kandidát **veľkoobchod a distribúcia** (Horti, KlimaPreTeba, Quadroflex): sklad, marže, sezónnosť, a otázky sú firma od firmy takmer identické.

Postav model raz, predaj ho päťdesiatkrát.

### Odhad trhu

Na Slovensku je rádovo 5 000 až 8 000 firiem s 15 až 250 zamestnancami, ktoré majú ERP a dosť zložitosti. Reálne oslovitelných možno 500 až 1 200. Sto zákazníkov po 300 až 500 € mesačne je 30 až 50 tisíc mesačne.

**Toto je odhad, nie dáta.** Pred použitím v pláne overiť.

---

## 3. Funkcie pre manažérov

### Chyba vo všetkých ôsmich súčasných funkciách

Všetky začínajú tým, že **používateľ musí niečo urobiť.** Napísať otázku, nastaviť KPI, vybrať tému.

Manažér nevie, na čo sa má pýtať. Preto chýbajú šablóny a preto to Marek sám cíti ako najväčšiu dieru.

Manažér celý deň robí štyri veci: rozhoduje o peniazoch, rozhoduje o ľuďoch, vysvetľuje výsledky niekomu nad sebou, hasí problémy. Funkcie majú sedieť na toto.

### Sedem návrhov, zoradené podľa hodnoty

**A. Ranný brífing.** Päť viet o 7:00 na mobil alebo do mailu: čo sa zmenilo a čo si zaslúži pozornosť. Jediná funkcia, ktorá vytvára denný návyk bez toho, aby si používateľ na Bridgit spomenul. Diely už existujú.

**B. Tlačidlo „Prečo?" na každom čísle.** Agent rozloží zmenu: ktorí zákazníci, ktoré produkty, ktoré regióny. Najčastejšia manažérska otázka, dnes ju treba napísať do chatu.

**C. „Kedy mi dôjdu peniaze."** Cash flow prognóza z faktúr, platobnej histórie a opakovaných nákladov. Jediná „AI CFO" funkcia, ktorá je reálne dodateľná, lebo je to výpočet, nie úsudok.

**D. Odchýlka od plánu.** Slebodníkova definícia hovorí, že controlling riadi budúcnosť cez ciele. Na to treba plán. Nahraj rozpočet, sleduj odchýlku, upozorni na drift. **Bez tohto je to analytika, nie controlling.**

**E. Riziko zákazníka a dodávateľa.** Koncentrácia (top klient = X % obratu), zhoršujúca sa platobná disciplína, závislosť na dodávateľovi.

**F. Príprava na stretnutie.** Napojené na kalendár. „Zajtra máš stretnutie s Horti, tu je ich stav." Funkcia, kvôli ktorej otvorí Bridgit obchodný riaditeľ každý deň.

**G. Benchmarking.** Anonymizované porovnanie naprieč zákazníkmi: „tvoja marža na tomto type produktu je o 4 % nižšia než u porovnateľných firiem."

**G je dlhodobo najdôležitejšie.** Je to jediná funkcia na zozname, ktorú používateľ Claude Desktop nikdy mať nemôže, lebo vyžaduje dáta mnohých firiem. Sieťový efekt a skutočná obrana.

### Čo spochybniť

- **Znalostná báza (funkcia 6).** Nepatrí do finančnej platformy, LLM wiki je komodita. Bez dát o používaní je to otázka, nie verdikt.
- **Videoprezentácia.** Výborná na deme. Používa ju niekto po treťom mesiaci? Ak nie, je to údržba bez návratnosti.

---

## 4. Blbuvzdornosť

Základný problém: **každá funkcia je prázdna stránka.** Manažér ju otvorí, nevie čo napísať, zavrie ju.

1. **Nikdy prázdna stránka.** Každá obrazovka sa otvorí s troma až piatimi otázkami vygenerovanými **z jeho reálnych dát**. Nie „Analyzuj predaje", ale „Prečo klesla marža na produkte Bojler 80l v auguste".
2. **Najprv odpoveď, až potom otázka.** Namiesto „opýtaj sa ma" ukáž odpoveď na to, čo by sa dnes najskôr pýtal.
3. **Tri slovesá, vždy tie isté.** Každé číslo kdekoľvek má: **prečo / detail / sleduj**.
4. **Multiple choice namiesto písania.** Agent sa pýta doplňujúce otázky tlačidlami, nikdy voľným textom. Odpozerané z Claude, lacné na implementáciu.
5. **Nula konfigurácie pri KPI.** Nepýtaj sa na hranicu. Sleduj metriku, nauč sa normálne pásmo, upozorni na anomáliu.
6. **Šablóny ako „spustiť", nie „vyplniť".** Šablóna, ktorá otvorí formulár, je prázdna stránka s nadpisom.

Meta-pravidlo: **ak funkcia potrebuje vysvetlenie, nie je hotová.**

A: **nech je vidno, čo vzniklo.** Trello dashboard je dobrý inštinkt, rozšíriť tak, že každá AI akcia po sebe nechá kartu.

---

## 5. Alternatívne cesty

| Cesta | Podstata | Pre | Proti |
|---|---|---|---|
| **1. Dátová vrstva** | Zahodiť ambíciu na UI. Predávať „tvoje ERP dáta pripravené pre AI, cez MCP". Cena za zdroj mesačne. | Ide presne po výhode. Zlepšenia Claude pomáhajú namiesto ohrozovania. | Riziko komodity, žiadny vzťah s koncovým používateľom. |
| **2. Pohoda špecialista** | Predávať účtovným firmám, nie koncovým firmám. | Jedna účtovníčka má stovky klientov. Nikto globálny sa Pohody nedotkne. | Nízky strop, závislosť na jednom dodávateľovi. |
| **3. Controlling, nie analytika** | Ísť za Slebodníkovou definíciou naplno. Plán, odchýlka, prognóza, opatrenie. | Reálna kategória s rozpočtom. „AI CFO" sa stane pravdivým. | Vyžaduje, aby zákazník mal plán. Veľa malých firiem ho nemá. |
| **4. White-label pre účtovné firmy** | Účtovná firma predáva pod svojou značkou, Bridgit je motor. | Najrýchlejšia distribúcia na SK. Účtovníci majú dáta aj dôveru. | Strata značky aj koncového zákazníka. |
| **5. Vertikálny produkt** | „Bridgit pre veľkoobchod." Model raz, predaj päťdesiatkrát. | Najvyššia marža na jednotku vývoja. | Zastropuje trh, ťažší pivot. |

### Odporúčanie

**Cesta 5, potom cesta 1, v tomto poradí.** Vertikála najprv kvôli opakovateľnosti. MCP vrstva ako druhé dvere pre technických používateľov, nie ako akvizičný trik.

**„AI CFO" zahodiť.** Najslabšia časť celého pozicioningu.

*Čo by presvedčilo o opaku:* ak sa ukáže, že Slebodníkova CFO sieť predáva sama a je to hlavný zdroj dopytu, tak je správna cesta 3 a všetko ostatné je odbočka.

---

## Ku Claude Desktop

Pre technického používateľa **Claude Desktop s Bridgit MCP porazí Bridgit UI.** Prijať to a nebojovať. UI má slúžiť ľuďom, ktorí si Claude Desktop nikdy nenainštalujú, nenastavia MCP a nebudú riešiť API kľúče. To je väčšina slovenských majiteľov firiem.

| Čo Claude vie lepšie | Verdikt |
|---|---|
| Viac konektorov | Nesúťažiť. Netreba 500 konektorov, treba tri ERP poriadne. |
| Najnovšie funkcie | Nesúťažiť. Zmieriť sa so sklzom. |
| UX detaily, multiple choice | **Skopírovať.** Lacné a je to presne odpoveď na blbuvzdornosť. |
| Artefakty a kódovanie | Nesúťažiť. |

---

## Otvorené

1. **Rozhodnutie o pozícii nepadlo.** Kým padne, `decisions/log.md` zostáva bez záznamu.
2. **Odhad trhu (500 až 1 200 firiem) nie je overený.** Pred použitím v pláne doložiť.
3. **Vrstva 3 beží, ale web ani intake to nevedia.** Zosúladiť.
4. **Chýbajú dáta o používaní.** Odporúčania pri znalostnej báze a videoprezentácii stoja na úvahe, nie na číslach. Bez usage dát sú to hypotézy.
5. Nadväzuje na otvorené otázky 6 a 7 v [[firma]], ktoré sú nerozhodnuté od 13.9.2026.
