# MAXIMALISTA - krizova kontrola (round 2)

Stav k 25. 9. 2026. Overoval som cielene body, ktore spochybnili SKEPTIK a INTEGRACIE.

## Rozpory

### Specialna uloha: kde sa moja uroven A/B/C lisi od toho, co pripusta SKEPTIK

| P-ID | Moja uroven (R1) | Uroven / poziadavka SKEPTIKA | Preco mam pravdu / preco ustupujem |
|---|---|---|---|
| P02 PHZ | A | B: "odborný garant alebo zodpovedná osoba podpisuje záznam o určení PHZ s uvedením zdrojov" (§ 6 ZVO, § 184a-184n) | **Ustupujem ciastocne.** Ma pravdu pri nadlimitnej a podlimitnej zakazke: chybna PHZ = nespravny postup = spravny delikt. Ale pri zakazke maleho rozsahu do 50 000 EUR sa ZVO neuplatnuje vobec, tam **A obhajim**. |
| P03 Limit a vyber postupu | A | B: "Ľudské potvrdenie zvoleného postupu s odkazom na platnú vyhlášku a dátum" | **Obhajim A.** Je to deterministicky rules engine nad verzovanou tabulkou limitov, nie model. Skeptik sam pise (jeho bod 4 slabin): "Deterministická kontrola so 100 % pokrytím môže byť bezpečnejšia než preťažený referent" - to je presne tento krok. |
| P04 Opis predmetu | B | B, ale tvrdsi: "Vecný garant a odborný garant musia vetu po vete schváliť špecifikáciu; povinný test 'existujú aspoň traja dodávatelia'" | **Ustupujem k jeho verzii B.** Test na tri dodavatelia a lint na chybajuce "alebo ekvivalent" beriem ako povinny gate pred zobrazenim navrhu, nie ako volitelnu kontrolu. |
| P06 ZFK | B | C pre samotne vyjadrenie: "vyjadrenie ZFK nesmie byť predvyplnené automatom", dve odlisne fyzicke osoby (357/2015 § 6 ods. 3, § 7) | **Ustupujem.** Rozdelujem krok: zber podkladov a checklist = A, **vyjadrenie a podpis ZFK = C**. Moje povodne "clovek podpisuje pripraveny dokument" bolo pri vyjadreni ZFK nespravne. |
| P07 Vyhlasenie | B | B: "Ľudské potvrdenie pred odoslaním; povinný diff proti schváleným podkladom" | **Delim.** Do TED cez vlastny eSender (Publication + Validation API, overene INTEGRACIAMI) **obhajim A** - validacia je strojova a deterministicka. Do Vestnika cez IS eForms je to **C**, lebo strojove rozhranie neexistuje (overoval som znovu, nic). |
| P09 Predkladanie ponuk | A | A s tvrdou podmienkou: "žiadny AI prístup pred P11, log každého prístupu" (§ 20, § 158b ZVO) | **Obhajim A a preberam jeho podmienku.** Nie je to rozpor v urovni, je to architektonicke obmedzenie: ponuky nesmu ist do modelu, embeddingov ani promptov pred otvaranim. |
| P11 Otvaranie ponuk | A | B: "Komisia otvára; automat len zaznamenáva a pečatí" (§ 52 ZVO) | **Ustupujem na B.** Odomknutie k lehote a casove peciatkovanie zostava strojove, ale zapisnica z otvarania je ukon komisie. Moje "clovek len cita vysledok" bolo prehnane. |
| P12 Podmienky ucasti | B | Overovanie ano, ale "**Zákaz automatického vylúčenia**"; opiera to o GDPR cl. 22 a C-634/21 SCHUFA | **Delim a ciastocne mu oponujem.** Overovanie v registroch **obhajim ako A**. Rozhodnutie o vylucenie ustupujem na **C** - ale z dovodu ZVO (§ 40, rozhodnutie komisie), nie GDPR: GDPR sa podla recitalu 14 nevztahuje na udaje pravnickych osob, a SCHUFA riesila skore o fyzickej osobe (OQ), nie o uchadzacovi-spolocnosti. |
| P13 Vyhodnotenie ponuk | B | B/C: "Bodovanie kvality nesmie byť jediným výstupom modelu" (§ 53 ZVO) | **Ustupujem pri kvalitativnych kriteriach na C**, pri cenovych a merateelnych kriteriach **obhajim A** (vzorec je zverejneny vopred, vypocet je aritmetika). |
| P18 Zverejnenie | A | B: "Ľudská kontrola anonymizovanej verzie pred zverejnením" (211/2000 § 5a, GDPR) | **Ustupujem na B kvoli anonymizacii** - zverejnenie je nezvratne. Odoslanie oznamenia o vysledku do TED a zapis zmluvy cez EKS **zostavaju A** (EKS zmluvu posiela do CRZ sam). |
| P19 Sprava o zakazke, archivacia | A | B: "Schválenie správy odborným garantom" (§ 24, § 64 ZVO) | **Ustupujem na B pre spravu o zakazke.** Archivacia, hashovanie, casove peciatky a retencia **zostavaju A** - tam nie je ziadny usudok. |
| **EKS / elektronicke trhovisko** | A | B: "Ľudské potvrdenie 'bežná dostupnosť' + schválenie opisu pred vstupom do EKS; ZFK pred zadaním" | **Obhajim A a mam na to novy dokaz.** Prirucka EKS API v1.3 obsahuje `PridatObjednavku()` ("postupom podľa §110 Zákona o verejnom obstarávaní") a `VyhlasitZakazku()` - "Vyhlásenie zákazky je nezvratný proces zahajujúci záväzné obchodovanie". Jeho gate je jednorazovy atribut opisneho formulara (ktory ide cez 48h karantenu spravcu EKS), nie kontrola kazdej objednavky. |
| **Zakazka maleho rozsahu (do 50 000 EUR)** | A (v R1 nazvana "nizka hodnota") | B: ZFK + "ľudské potvrdenie kumulatívneho limitu za rok"; cituje § 117 ZVO | **Obhajim A, a jeho pravny zaklad je zastarany.** Zakazka s nizkou hodnotou bola od 1. 8. 2024 zo ZVO **uplne zrusena**; dnes je to zakazka maleho rozsahu do 50 000 EUR, na ktoru sa **ZVO nevztahuje**. Padaju tym obe jeho "vstupne bariery" naraz: § 158b aj § 184a-184n. |

### Dalsie vecne rozpory

**Proti SKEPTIKOVI - "zapis do zoznamu elektronickych prostriedkov je regulacna licencia, nie feature".**
On: *"Bez neho platforma nesmie prijímať ponuky... Toto je regulačná licencia, nie feature."* Overil som: podla UVO ide o **registracny proces**, ziadost sa posiela ako vseobecne podanie cez slovensko.sk podpisane KEP statutara; vyhlaska 73/2022 Z. z. (ucinna 31. 3. 2022) predpisuje obsah **dotaznika** v 11 oblastiach (dostupnost, odstavky, dokumentacia, autentifikacia, integracia, KEP, zaznam ukonov, zalohovanie, riadenie pristupu, dovernost). To je ohlasovacia povinnost s technickym dotaznikom, nie skuska ani certifikacia. Navyse na zakazku maleho rozsahu nedopada vobec. Jeho vlastny bod 8 slabin (platforma ako vrstva nad IS EPVO/EKS) je spravny a ruší tuto barieru uplne.

**Proti INTEGRACIAM - zaver "EKS je len pre-processing" stoji na neotvorenom PDF.**
Oni: *"Neotvoril som PDF, takže neviem ktoré operácie sú čítanie a ktoré zápis, či sa dá založiť zákazka programovo"* a potom: *"Realistické pozicovanie je pre-processing a post-processing vrstva."* Otvoril som prirucku EKS API v1.3 (26. 9. 2018, ANASOFT APR): SOAP nad HTTPS, `Authorization: Bearer TOKEN`, OAuth scope `OpisnyFormular` a `ZakazkaElektronickehoTrhoviska`, testovacie aj produkcne prostredie (`portal.ekstest.ana.sk` / `portal.eks.sk`). Zapisove sluzby: `PridatOpisnyFormular()`, `PodatNavrhOpisnehoFormulara()`, `PridatObjednavku()`, `ZmenitObjednavku()`, `VyhlasitZakazku()`. Procesny diagram pokryva Vyhlasenie zakazky -> Predkladanie kontraktacnych ponuk -> Elektronicka aukcia -> Uzatvorenie zmluvy -> Vyhodnotenie plnenia. **Zaver o pre-processingu neplati pre cestu EKS.**

**Proti INTEGRACIAM - CRZ zapis oznaceny ako "vysoka zavislost, pravdepodobne rucne nahratie".**
Prirucka EKS API pri procese "Uzatvorenie zmluvy" uvadza: *"vygenerovaná zmluva je odoslaná na zverejnenie do Centrálneho registra zmlúv."* Na ceste EKS je teda P18 vyriesene bez cloveka. Ich hodnotenie plati len pre zakazky mimo EKS.

**Proti SKEPTIKOVI - AI Act:** jeho verziu potvrdzujem, nemam rozpor. Nariadenie (EU) 2026/1744 posunulo povinnosti pre samostatne vysokorizikove systemy Prilohy III z 2. 8. 2026 na **2. 12. 2027** (a pre AI v produktoch Prilohy I na 2. 8. 2028); cl. 50, cl. 5 a povinnosti poskytovatelov GPAI posunute neboli. Moja neistota c. 9 z round 1 je tym uzavreta v jeho prospech.

## Medzery

1. **§ 23 ods. 3 zakona 305/2013 Z. z. je pravny zaklad strojoveho pecatenia - ani jeden agent ho nenasiel.** Usmernenie MIRRI k autorizacii elektronickych uradnych dokumentov: autorizacnym prostriedkom je bud KEP s mandatnym certifikatom, **alebo kvalifikovana elektronicka pecat**, a kriteriom je, *"či sa vyžaduje autorizácia konkrétnou osobou alebo osobou v konkrétnom postavení, alebo 'postačuje' autorizácia bez označenia konkrétnej osoby"*. Kde osobitny predpis nevyzaduje konkretnu osobu, **pecat staci** - a pecat moze vytvarat stroj. To je presne deliaca ciara, ktoru som v R1 postuloval bez dokazu.
2. **INTEGRACIE oznacili KEP za "kriticku a neoverenu" a zastavili sa - existuje otvorene riesenie.** EC DSS je *"an open-source software library for digital signature creation, validation, and extension"* pre XAdES, PAdES, CAdES a ASiC. K tomu eIDAS remote signing: QSCD nemusi byt fyzicky u podpisovatela, moze ho vzdialene spravovat QTSP (norma EN 419 241-2, Server Signing Application + Signature Activation Module). Model "clovek len podpise" teda **nepada** na davkove podpisovanie: jedna autorizacia podpisovatela, N dokumentov.
3. **Sluzba `Vyhodnotenie plnenia` v EKS = automatizovatelne P20.** Prirucka: *"Vyhodnotenie plnenia zmluvy je realizované zadaním hodnotenia vo forme referencie objednávateľom."* Referencie sa daju generovat z udajov plnenia a zapisovat cez to iste rozhranie. Ani jeden agent to nespomenul.
4. **TED Validation API sa da pouzit aj tam, kde nie je API na podanie.** Pre Vestnik neexistuje strojove rozhranie, ale eForms XML sa da vygenerovat a zvalidovat cez CVS **pred** tym, nez ho clovek prenesie do IS eForms. To znizuje najcastejsiu chybu (zle vyplnene povinne polia, zly CPV) bez akejkolvek integracie. Skeptik to oznacil ako riziko, ale neponukol tento lacny gate.
5. **UVO samo uvadza vyhodnocovanie ponuk ako pouzitie svojej AI.** Clanok UVO zo 6. 5. 2026: spustili AI server z Planu obnovy, moznosti vyuzitia su *"kontrola údajov, analýza postupu zadávania zákaziek, vyhodnocovanie ponúk"*, faza testovacia, vysledky koncom 2026. Regulator teda pouziva AI presne na ten krok, ktory skeptik oznacil za najcitlivejsi.
6. **Vyhlaska 73/2022 ma vlastny paragraf o integracii (§ 7, "dátumy nasadenia funkcionalít").** Statny dotaznik pre elektronicke prostriedky sam ocakava, ze system ma integracne funkcionality s harmonogramom. To je argument, ze zapis nie je bariera proti automatizacii, ale jej predpokladom.
7. **Terminologia ZNH je u oboch agentov zastarana.** Skeptik cituje § 117 ZVO pre "zakazky s nizkou hodnotou"; ja som ich tak nazval tiez. Novela ucinna 1. 8. 2024 *"úplne zrušila zákazku s nízkou hodnotou. Tento pojem tak viac v zákone o verejnom obstarávaní nenájdeme."* Pre produkt to nie je detail: cely najlacnejsi segment je dnes **mimo ZVO**, nie "volnejsi rezim vnutri ZVO".

## Opravy vlastnej práce

| P-ID | Zmena | Dovod |
|---|---|---|
| P02 | **A -> B** (pre nadlimit a podlimit; A zostava pre zakazku maleho rozsahu) | PHZ urcuje volbu postupu; chyba je spravny delikt. Skeptikov § 6 ZVO obstal. |
| P11 | **A -> B** | Odomknutie a casove peciatky su strojove, ale zapisnica z otvarania je ukon komisie (§ 52 ZVO). "Clovek len cita vysledok" bolo prehnane. |
| P18 | **A -> B** | Anonymizacia pred zverejnenim je nezvratna a je to rozhodnutie o rozsahu ochrany, nie lint. Odoslanie do TED a CRZ cez EKS zostava A. |
| P19 | **A -> B** | Sprava o zakazke sa schvaluje. Archivacia, hashe, peciatky a retencia zostavaju A. |
| P06 | Podkrok **B -> C** | Vyjadrenie a podpis ZFK nesmie byt predvyplnene automatom (357/2015 § 6 ods. 3, § 7). Zber podkladov zostava A. |
| P12 | Podkrok **B -> C** | Rozhodnutie o vylucenie uchadzaca je ukon komisie (§ 40 ZVO). Overovanie v registroch naopak dvihám na A. |
| P13 | Podkrok **B -> C** | Kvalitativne kriteria (kvalita navrhu, metodika, tim) su usudok komisie. Cenove a merateelne kriteria zostavaju A. |
| P07 | B -> **rozdelene A / C** | TED cez vlastny eSender = A. Vestnik cez IS eForms = C, bez strojoveho rozhrania. Moje povodne "B" zakryvalo, ze polovica kroku sa robi rucne v cudzom portali. |
| "Zakazka s nizkou hodnotou" | Premenovane na **zakazku maleho rozsahu do 50 000 EUR** | Kategoria ZNH bola zo ZVO zrusena od 1. 8. 2024. |

**Nove pocty: A = 5 (P03, P09, P14, EKS, ZMR), B = 16, C = 1.** Z povodnych deviatich A ich padli styri (P02, P11, P18, P19).

Dalsie opravy bez zmeny urovne:
- **P09: A je cudzia zasluha, nie moja.** Automaticke je to vdaka IS EPVO a EKS. Zaroven preberam skeptikovu podmienku: ponuky nesmu vstupovat do modelu, embeddingov ani logov promptov pred P11.
- **Moja integracna mapa v R1 bola neuplna.** Vynechal som RUZ (registeruz.sk, CC0, bez autentifikacie) a OpenData Financnej spravy (danovi dlznici, index danovej spolahlivosti; API kluc, limit 1000 req/h). Oboje patri do overovacej vrstvy P12.
- **Moja neistota c. 9 (AI Act) je uzavreta.** Nariadenie (EU) 2026/1744, odklad Prilohy III na 2. 12. 2027. Prestavam to uvadzat ako otvorene riziko.
- **Prehnane tvrdenie v R1: "EKS API - nemam overene, ci pokryva zadavanie zakaziek".** Uz mam. Pokryva.

## Istota

### Obhajim

1. **Zakazka maleho rozsahu do 50 000 EUR = uroven A.** ZVO sa na nu nevztahuje, takze odborny garant ani zapis do zoznamu elektronickych prostriedkov nedopadaju. Zostava ZFK podla 357/2015 - jeden podpis na konci.
2. **Cesta EKS = uroven A.** Dokazane zapisovymi sluzbami API: opisny formular, objednavka, `VyhlasitZakazku()`, aukcia, uzatvorenie zmluvy s automatickym odoslanim do CRZ. Toto nie je teza, je to dokumentovane rozhranie s testovacim prostredim.
3. **P03 vyber postupu = A.** Deterministicky rules engine nad verzovanou tabulkou limitov s citaciou pravidla pri kazdom rozhodnuti je presnejsi nez clovek. Clovek ho moze prebit, ale nema ho potvrdzovat rutinne.
4. **P12 overovanie v registroch = A.** RPO, RPVS, RUZ a Financna sprava su dokumentovane API. GDPR cl. 22 tu nie je prekazka: recital 14 GDPR vylucuje udaje pravnickych osob a C-634/21 SCHUFA riesila skore o fyzickej osobe.
5. **P14 elektronicka aukcia = A.** Je to zo zakona opakovany automaticky proces (§ 54 ZVO). Zasah cloveka pocas aukcie je nezakonny, nie ziaduci.
6. **Strojova kvalifikovana elektronicka pecat je pravne dostupna.** § 23 ods. 3 zakona 305/2013 + usmernenie MIRRI: kde osobitny predpis neviaze autorizaciu na konkretnu osobu, pecat staci.
7. **Architektura "eventlog + generatory" a kriteria ako datova struktura.** Toto sa v kole 2 nespochybnilo ani raz a je to predpoklad vsetkeho ostatneho.

### Stiahol by som

1. **Tvrdenie, ze "clovek len schvaluje a podpisuje" plati na cely proces.** Plati na EKS a na zakazku maleho rozsahu. Pri nadlimitnej zakazke je cestou k vyhlaseniu a komunikacii klikanie v IS EPVO a IS eForms - tam je platforma pripravovac balika, nie vykonavatel.
2. **Uroven A pri P02, P11, P18 a P19.** Vsetky styri obsahuju usudok alebo nezvratnost, ktoru som podcenil.
3. **"Clovek podpisuje pripraveny dokument" pri ZFK.** Vyjadrenie zakladnej financnej kontroly nesmie byt predvyplnene. Tu som sa mylil jednoznacne.
4. **Predpoklad, ze IS EPVO sa da otvorit rokovanim.** Overoval som znovu a nenasiel som ziadnu verejnu zmienku o integracnom rozhrani; metaIS zaznam sa nepodarilo nacitat (expirovany certifikat servera). Do biznis planu to nepatri ako predpoklad, len ako opcia.
5. **RPA / browser automation nad statnym portalom ako nahrada API.** Technicky mozne, ale pri podani s pravnymi ucinkami je to zodpovednostne riziko na strane obstaravatela. Ak to pouzijeme, tak vylucne s clovekom, ktory potvrdzuje kazde odoslanie - cize C, nie A.
6. **Automaticke vylucenie uchadzaca.** Aj ked GDPR argument skeptika nesedi, ZVO robi z vylucenia ukon komisie. Platforma nesmie mat "vylucit" ako predvolenu akciu.

### Co sa nepodarilo overit

- Obsah `eks-oauth-prirucka-v1.2.pdf` (podmienky registracie klientskej aplikacie - kto ju schvaluje a ci ju dostane kazdy obstaravatel). Prirucka EKS API je z 26. 9. 2018; **aktualnost rozhrania k 2026 nie je potvrdena**, aj ked EKS v roku 2026 bezne zadava zakazky maleho rozsahu.
- Doslovne znenie § 184a-184n ZVO (rozsah povinnosti odborneho garanta). Zdroj s vykladom je za platenou stenou; ze sa garant nevyzaduje pri zakazke maleho rozsahu vyplyva z toho, ze na nu ZVO nedopada, nie z priameho citatu.
- Doslovne znenie ZVO na slov-lex sa opat nepodarilo nacitat (SPA bez textu) - rovnaka prekazka ako v kole 1 a rovnaka ako u SKEPTIKA.
