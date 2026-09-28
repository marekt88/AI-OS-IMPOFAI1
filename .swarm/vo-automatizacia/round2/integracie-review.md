# INTEGRACIE - kolo 2, krizova kontrola

Agent: INTEGRACIE | Round 2 | Datum overovania: 25. 9. 2026
Novo otvorene a precitane zdroje v tomto kole: EKS API prirucka v1.3 (PDF, cely dokument), Metodicky pokyn CRZ (PDF), Integracny manual sluzieb IS CSRU v1.7.2 (DOCX), ECERTIS Multi-Domain Web Services REST API v0.6 (PDF), OpenAPI `ress-isu-service`, TSL NBU, slovensko.sk stranka pre integratorov KEP, SNCA validacna sluzba.

## Rozpory

### A. Specialna uloha: tvrdenia MAXIMALISTU o datach vs. realny stav pristupu

| P-ID | Co maximalista tvrdi | Ake data k tomu treba | Realny stav pristupu (moje overenie) | Co to znamena pre jeho uroven |
|---|---|---|---|---|
| **P02 (A)** | "Kod stiahne historicke ceny z Vestnika UVO, TED a CRZ" a "otvorene data Vestnika UVO (denny XML na narodnom katalogu otvorenych dat)" | Strojovy export Vestnika VO so stabilnym download URL a formatom | **Nepotvrdene.** Dataset stranky na `data.slovensko.sk` su JS aplikacia, distribucny URL ani format som nenacital ani v kole 1, ani teraz. SPARQL endpoint mi na dotaz vratil HTTP 400. | Zdroj, na ktorom stoji cela cenova databaza, nie je overeny. TED a CRZ ano, Vestnik nie. Uroven A plati len pre EU cast; pre narodne data je to zatial **B s neovereneho zdroja**. |
| **P03 (A)** | Limity a pravidla zo slov-lex a vyhlasky UVO ako parametrizovany ruleset | Strojovo citatelne konsolidovane znenie predpisu | Nie je to integracia na cudzi system, je to vlastna tabulka. Sam maximalista priznava, ze slov-lex sa mu nepodarilo strojovo precitat (jeho neistota c. 1). | **A obhajim** - ale je to A vdaka vlastnym datam, nie vdaka API. Neplati z toho nic o integraciach. |
| **P09 (A)** | "Toto je dnes uz strojovy krok... Platforma sa naviaze na tento system a preberie metadata ponuk." | Strojovy odber metadat ponuk z IS EPVO | **IS EPVO nema ziadne verejne API.** `isepvo.sk/dokumentacia/` publikuje vylucne uzivatelske prirucky a videa. Preberanie metadat by bol scraping s prihlasenim. | "Naviazanie sa" nie je podlozene. Pre EKS ano (`VratitDetailObjednavky()`), pre IS EPVO **nie**. Rozdelil by som P09 na EKS = A, IS EPVO = C. |
| **P11 (A)** | "System odomkne ponuky... Clovek len cita vysledok." | Notifikacia a vycitanie zapisnice z otvarania z IS EPVO | To iste ako P09. Navyse PROCESY spravne uvadza § 52 ods. 3 - zapisnicu treba **odoslat** uchadzacom do 5 prac. dni, co je dalsi zapis do cudzieho systemu. | Uroven A opisuje spravanie IS EPVO, nie platformy. Pre platformu je to **C** (rucny prenos). |
| **P14 (A)** | "Platforma len nastavi pravidla, pozve uchadzacov a prevezme protokol." | Zapis nastaveni aukcie a odber protokolu | V EKS API je e-aukcia v BPMN diagrame ako **proces bez pripojenej API sluzby** - API konci pri `VyhlasitZakazku()`. Pre IS EPVO a certifikovane systemy (Josephine, eranet) ziadna dokumentacia. | "Nastavi pravidla a prevezme protokol" nema oporu v ziadnej dokumentacii, ktoru som videl. **C**, nie A. |
| **P18 (A)** | "CRZ prijima automatizovany XML import v nastavenych intervaloch" a "peciatka je uz spotrebovana" | Strojovy zapis zmluvy do CRZ | **Tu ma maximalista pravdu a ja som sa v kole 1 mylil.** Metodicky pokyn CRZ, kap. 4, doslovne: "Nahravanie XML suborov manualne na server UV SR cez webove rozhranie... Pozn.: Import XML suborov prebieha automatizovane v prednastavenych intervaloch." a 3. metoda: "Stiahnutie XML suborov z definovanej adresy s umiestnenim XML suborov na serveri (dostupnom cez internet) organizacie." | Zapis do CRZ je **realny a dokumentovany**, ale ako davkovy file-pull, nie API. Vyzaduje registrovany ucet, pisomnu ziadost na OIES UV SR a plnu moc. Uroven A pre CRZ **obhajim**, pre druhu polovicu P18 (oznamenie o vysledku do Vestnika UVO) nie - tam API nie je. |
| **P18 (A)** | "oznamenie o vysledku sa vygeneruje ako eForms a odosle do Vestnika/TED" | Strojove podanie do IS eForms UVO | `eforms.uvo.gov.sk` je len prihlasovaci portal s uzivatelskymi manualmi. Ziadne API. TED Publication API existuje, narodny kanal nie. | Pre nadlimit (TED) A, pre podlimit a narodny Vestnik **C**. Maximalista to spoji do jedneho A, co je nepodlozene. |
| **P19 (A)** | "WORM ulozisko, kvalifikovane casove peciatky" | Kvalifikovana sluzba casovej peciatky | **Podlozene.** TSL NBU (`tl.nbu.gov.sk/kca/tsl/tsl.xml`) obsahuje styri sluzby typu `TSA/QTST`. | A obhajim. Jedine A z jeho zoznamu, ktore je cele o vlastnej infrastrukture a ma pod sebou overeny prvok. |
| **EKS cesta (A)** | "existuje EKS integracne rozhranie (prirucky EKS API 1.3 + OAuth 1.2)", "Platforma sa integruje cez zdokumentovane rozhranie a EKS spravuje vlastny beh sutaze" | SOAP sluzby na zalozenie opisneho formulara, objednavky a vyhlasenie zakazky | **Potvrdene a spresnene.** Prirucka v1.3 (26. 9. 2018, ANASOFT APR): SOAP 1.2 nad HTTPS, `Authorization: Bearer TOKEN` z EKS OAuth. Dva WSDL: `https://portal.eks.sk/API/Soap/OpisnyFormular.asmx?wsdl` a `https://portal.eks.sk/API/Soap/Objednavka.asmx?wsdl`, test na `portal.ekstest.ana.sk`. Sluzby: `PridatOpisnyFormular/Zmenit/Zmazat/PodatNavrh/StiahnutOpisnyFormular/PridatPrilohu/ZmazatPrilohu`, `PridatObjednavku/Zmenit/Zmazat/VratMojeObjednavky/VyhlasitZakazku/VratDetailObjednavky`. Scope OAuth: `OpisnyFormular`, `ZakazkaElektronickehoTrhoviska`. | **Toto je jedine miesto, kde je jeho uroven A plne podlozena** a kde bol ambicioznejsi ako ja opravnene. Doslovne varovanie v prirucke: "Vyhlasenie zakazky je nezvratny proces zahajujuci zavazne obchodovanie na Elektronickom trhovisku!" |
| **EKS cesta (A)** | EKS pokryva aj predkladanie ponuk, aukciu, uzatvorenie zmluvy a zverejnenie v CRZ | API sluzby pre tieto kroky | **Nepodlozene ako API.** V BPMN prirucky maju pripojene API sluzby len kroky "Odoslanie navrhu opisneho formulara", "Vyhlasenie zakazky" a "Uzatvorenie zmluvy" (len citanie cez `VratitDetailObjednavky()`). Predkladanie kontraktacnych ponuk a elektronicka aukcia **ziadnu API sluzbu nemaju**. | Tieto kroky bezia vnutri EKS. Platforma ich nevie riadit, len precitat vysledok. Uroven A pre ne plati z pohladu obstaravatela, nie z pohladu integracie. |
| **P10 (B)** | "automaticky preveri konflikt zaujmov krizovym dopytom na RPO, RPVS a zoznam uchadzacov" | Historia zamestnania a funkcii clena komisie u uchadzaca za 3 roky | RPO a RPVS daju statutarov, spolocnikov a KUV. **Ziadny register nevedie, kde bol zamestnany zamestnanec obstaravatela.** PROCESY spravne cituje § 51 ods. 4 - zakaz clenstva sa predlzil na 3 roky. | Dopyt vrati len zlomok testu. Automatizovat sa da len vazba cez statutara/spolocnika/KUV, nie zamestnanecky vztah. Zvysok je cestne vyhlasenie cloveka. |
| **P12 (B)** | "UVO vedie Zoznam hospodarskych subjektov a Register osob so zakazom **verejne dostupne bez prihlasenia**" | Strojovy pristup k ZHS a k registru osob so zakazom | Verejne su, ale **len ako webove vyhladavanie**. Stranka UVO neuvadza API, export ani open data. SOAP URL `uvo.gov.sk/soap/webServiceBusinessman/wsdl` je 404 (testovane 25. 9. 2026). | "Verejne dostupne" != "strojovo dostupne". Toto je najcastejsia zamena v jeho texte. Bez toho nie je automaticke vyhodnotenie § 32 mozne - P12 realne klesa pod B. |
| **P05 (B)** | "sluzba JED (UVO ESPD, resp. JED v EKS)" ako integracia | API narodnej JED sluzby | Nenajdene. ESPD-EDM je **datovy model a XSD**, nie sluzba - `docs.ted.europa.eu/ESPD-EDM/` aj `github.com/OP-TED/ESPD-EDM`. Generovanie `espd-request.xml` je vlastna praca platformy. | Ako generovanie XML je to A, ako "sluzba" B nepodlozene. Netreba integraciu, staci schema. |
| **P17 (B)** | "Kod overi zapis vitaza v RPVS cez REST API v den podpisu" | Zivy RPVS endpoint | RPVS OpenData **v2** potvrdzuje oficialna stranka MS SR. Je to **OData 4.0**, nie klasicke REST, a konkretne endpointy som nevidel ani v kole 1 (prazdny Swagger shell), ani teraz (priamy dotaz `rpvs.gov.sk/opendatav2/Partneri?$top=1` vratil HTTP 400). | Existenciu obhajim, presnost jeho formulacie nie. Pred navrhom architektury treba endpointy realne odskusat. |
| **P03/P20 (A/B)** | "RPO ma verejne REST API v2" | Aktualna verzia RPO API | Zdroje si protirecia: `rpo.statistics.sk/docs/oznam.html` hovori o V2 ako aktualnej a V1 deprecated, ale produkcna URL v dokumentacii je `https://api.statistics.sk/rpo/v1/`. Zivost endpointu som nepotvrdil (timeout v kole 1). | Nie je to nepravda, je to nepresnost. Pred stavbou overovacej vrstvy treba zistit, ktora verzia realne bezi. |

**Suhrn: z tvrdeni maximalistu som oznacil 9 ako nepodlozene alebo prehnane** (P02 Vestnik, P09, P11, P14, P18-Vestnik, EKS mimo API rozsah, P12 ZHS, P05 JED sluzba, P10 konflikt zaujmov) a **3 ako nepresne** (RPVS "REST", RPO "v2", P17). **3 tvrdenia mu obhajim proti mojmu kolu 1**: EKS integracne rozhranie (dokonca silnejsie, nez tvrdil), CRZ automatizovany XML import a kvalifikovane casove peciatky.

### B. "Automatizuje to uz IS EVO/EKS" - rozhodnutie

MAXIMALISTA: *"Cast procesu je uz dnes de facto strojova... Platforma teda nemusi tieto kroky automatizovat, musi sa na ne integrovat."*
JA (kolo 1): *"IS EPVO... Len webovy portal; verejna dokumentacia su PDF prirucky pre ludi... Citanie len scrapingom."*

**Rozhodnutie: nie je to rozpor v skutkovych zisteniach, ale maximalista z toho robi nespravny zaver.** Obe tvrdenia su pravdive naraz: aukcia aj otvaranie ponuk vnutri IS EPVO bezia bez cloveka, a zaroven sa k nim platforma nevie dostat. Automatizacia vnutri cudzieho systemu **nie je aktivum platformy** - je to cudzia funkcionalita, za ktoru platforma nezodpoveda, ktoru nevie verzovat, testovat ani logovat do vlastneho audit trailu. A PROCESY ukazuje, preco to nie je akademicke: § 173 ods. 2 vyziada pri namietkach **auditne zaznamy o vsetkych ukonoch v elektronickom prostriedku** do 5 pracovnych dni. Ak tie zaznamy vznikaju v IS EPVO a platforma ich nevie strojovo vytiahnut, plati sice "bezalo to automaticky", ale spis zostavia ludia rucne.

Sam maximalista to priznava v bode 1 svojich slabin ("to nadhodnocuje moj skore automatizacie"). Napriek tomu tie kroky nechal na A a zapocital ich do "A = 9". **Skore A = 9 je preto zavadzajuce - realne A platformy je 4 az 5** (P03, P19, EKS cesta, CRZ cast P18, ciastocne P02).

### C. PROCESY - nazvy a prevadzkovatelia systemov

| Tvrdenie PROCESY | Moj stav | Zaver |
|---|---|---|
| "Spravcom platformy je Urad podpredsedu vlady SR pre Plan obnovy a znalostnu ekonomiku (§ 13 ods. 1)" | Ja v kole 1: "IS EPVO / IS EVO - **Urad vlady SR** (od 31.3.2022, nie UVO)" | **PROCESY ma pravdu, ja som mal zastarany udaj.** Sprava presla na Urad podpredsedu vlady SR pre plan obnovy a znalostnu ekonomiku k 1. 1. 2025. Moj zdroj (stranka UVO) opisuje stav z r. 2022. Domena `eplatforma.vlada.gov.sk` a kontakt `eplatforma@vlada.gov.sk` zostali, co ten omyl udrziava. |
| "Elektronicka platforma (IS EPVO + EKS)" ako jeden system s dvomi modulmi | Sedi s tym, co uvadza eks.sk (moduly Elektronicke trhovisko, Elektronicka platforma, IS EPVO) | Potvrdene. Dolezite pre architekturu: **jeden pravny system, dve uplne odlisne integracne reality** - EKS ma SOAP API, IS EPVO nema nic. |
| "iny certifikovany system (Josephine, eranet a pod.)", "§ 151" | Ja: Josephine bez verejnej developer dokumentacie, ERANET/Tendernet NENAJDENE | Existuju, ale PROCESY ich uvadza bez overenia strojoveho rozhrania. Ani v kole 2 som ziadnu verejnu API dokumentaciu tychto systemov nenasiel. |
| "evo.isepvo.sk" | Ja: `isepvo.sk` | Nie je rozpor, je to subdomena portalu. |
| **System, ktory PROCESY nespomina vobec** | - | PROCESY v P12b pise "overi ich v registroch (zoznam hospodarskych subjektov UVO, RPO, register trestov, RPVS)", ale **neuvadza, ze register trestov sa pre OVM ziada cez OverSi / IS CSRU**, nie priamo. To je pre platformu podstatne - pozri Medzery. |

### D. Formalna kritika prirucky EKS API (vecna kritika, ktora sa tyka aj mna aj maximalistu)

Prirucka EKS API ma **verziu 1.3 zo dna 26. 9. 2018** a popisuje release EKS 3.4.3. Sluzba `PridatObjednavku()` je v nej opisana ako "pridanie objednavky postupom podla **§110** Zakona o verejnom obstaravani". Podla PROCESY je dnes EKS postup **§ 109** a § 110 je iny postup (vyzva vo Vestniku). Bud je prirucka osem rokov neaktualizovana, alebo sa cislovanie posunulo novelami a nikto to v dokumentacii neopravil. **Ani ja, ani maximalista sme tuto nekonzistenciu v kole 1 nezachytili** - obaja sme prirucku citovali bez toho, aby sme ju otvorili. Pred akoukolvek architekturou treba od prevadzkovatela EKS potvrdit, ci je API este platne a co presne dnes `VyhlasitZakazku()` robi.

## Medzery

### 1. KEP a kvalifikovana elektronicka pecat - najvacsia medzera kola 1 je ciastocne zaplnena

V kole 1 som to oznacil ako "kriticku a neoverenu". Po 8 dalsich vyhladavaniach a nacitaniach je stav takyto:

| Co | Stav | Zdroj |
|---|---|---|
| **Serverove podpisovanie a overovanie (SR)** | **OVERENE, ze dokumentacia je verejna.** slovensko.sk zverejnuje pre integratorov serverove komponenty **D.Signer-SVR/XAdES v4.0, D.Verifier-SVR/XAdES v5.0, D.Signer-SVR/CAdES v2.0, D.Verifier-SVR/CAdES v2.0, ASiC Factory (.NET v1.3, Java v1.1)** vratane integracnych prirucok a dokumentacie pre integratorov pre .NET a Javu. | `https://www.slovensko.sk/sk/na-stiahnutie/informacie-pre-integratorov-ap` |
| **Kvalifikovana validacna sluzba SNCA** | **OVERENE, ze ma technicke rozhranie a je zadarmo pre OVM.** SNCA zverejnuje technicku specifikaciu (PDF, 12. 1. 2023), vseobecne podmienky a dokumentaciu validacneho reportu (ZIP s XSD a XML). Pristup: IP adresa + kluc k certifikatu, testovacie prostredie na ziadost cez `snca@nases.gov.sk`. Typ protokolu je az v stiahnutelnej specifikacii, ktoru som neotvoril. | `https://snca.gov.sk/kvalifikovane-sluzby/validacia-podpisov-pecati` |
| **Rozdiel informativne vs. kvalifikovane overenie** | Sluzba informativneho overenia na slovensko.sk **nie je** kvalifikovanou validacnou sluzbou v zmysle cl. 33 a 40 nariadenia 910/2014. Pre pravne ucinky treba SNCA alebo komercneho QTSP. | Prehladove zdroje k `beta.slovensko.sk` (stranku sa mi nepodarilo nacitat - ECONNREFUSED) |
| **Doveryhodny zoznam SR** | **OVERENE a strojovo citatelne.** `https://tl.nbu.gov.sk/kca/tsl/tsl.xml` - platny eIDAS TSL, verzia schemy 6, poradove cislo 146. Obsahuje sluzby typu `CA/QC` (SNCA, SNCA2), `TSA/QTST` (4 sluzby casovych peciatok), `NationalRootCA-QC`, `OCSP/QC`. | `tl.nbu.gov.sk/kca/tsl/tsl.xml` |
| **EU referencna implementacia** | DSS (Digital Signature Service, DG DIGIT) je **open source Java kniznica** na vytvaranie, augmentaciu a validaciu pokrocilych podpisov podla eIDAS, s verejnou dokumentaciou a JavaDoc. Nie je to prevadzkovana sluzba - `webapp-demo` je demo. | `https://ec.europa.eu/digital-building-blocks/DSS/webapp-demo/doc/dss-documentation.html` |

**Zaver pre platformu:** model "clovek len podpise" je technicky **realizovatelny** a nie je to biele miesto, ako som tvrdil v kole 1. Existuju tri stavebne prvky: serverove komponenty s verejnou integracnou dokumentaciou (SR), kvalifikovana validacna sluzba SNCA zdarma pre OVM a open source DSS na strane EU. **Co stale nemam overene:** ci sa da kvalifikovanou elektronickou pecatou podpisovat **plne bez cloveka na diaľku** (remote sealing) u niektoreho QTSP na SR, a co presne stoji za frazou maximalistu, ze "pecat sa pouziva na automatizovanu autorizaciu" - on to ma zo **sekundarneho** zdroja (blog QTSP) a z metodickeho usmernenia beta.slovensko.sk, nie z technickej dokumentacie.

### 2. IS CSRU - system, ktory nespomina ani PROCESY, ani MAXIMALISTA, a ktory rusi polovicu mojho zoznamu scraperov

Toto je najvacsie zistenie kola 2. **Integracny manual sluzieb IS CSRU v1.7.2** (MF SR, DXC, 4. 7. 2017) je verejne stiahnutelny `.docx` na mirri.gov.sk. Popisuje SOAP 1.2 webove sluzby `CSRU_GetConsolidatedDataService` (async), `CSRU_GetConsolidatedDataService_Sync`, `CSRU_WriteDataTo`, `CSRU_GetDQReport`, `CSRU_GetConsolidatedReferenceData`, s endpointmi na `*.csru.gov.sk` (siet Govnet) a `*.csru.sk.cloud` (siet KTI).

Poskytovane mnoziny dat, relevantne pre P12:

| Vlastnik dat | Dataset | Co nahradza z mojho zoznamu scraperov |
|---|---|---|
| Socialna poistovna | Nedoplatky na socialnom poisteni (§ 171 zak. 461/2003) | Stahovanie suboru zo `socpoist.sk` |
| VsZP, Union, Dovera | Nedoplatky na zdravotnom poisteni (§ 25 ods. 1 pism. e) zak. 580/2004) | **Tri samostatne scrapery** |
| UPSVaR | Kontroly - evidencia nelegalnej prace a nelegalneho zamestnavania + pokuty | Scraping `ip.gov.sk/app/registerNZ/` |
| FS SR | Danove nedoplatky, danove priznania FO/PO, zoznam danovych subjektov, register DPH | Cast Financna sprava OpenData API (limit 1000 req/h odpada) |
| SU SR | RPO (vratane zapisovych metod voci RR RPO) | - |
| UDZS | Zoznam poistencov, register umrti | - |

**Dolezite obmedzenia, ktore to nerobia zazrakom:** endpointy nie su na verejnom internete (Govnet / KTI), konzumentom moze byt len OVM, a pre kazdu integraciu sa vypracuva samostatny dokument "Integracno-technicky navrh prepojenia". Verzia manualu je z r. 2017 - treba overit aktualnost. **Ale je to dokumentovana cesta, ako platforma nasadena u obstaravatela (ktory OVM je) dokaze § 32 overit bez jedineho scrapera.** To meni architekturu: nie "scraping s pravnym rizikom", ale "integracia cez statnu datovu vrstvu".

### 3. OverSi - chybajuca cesta k registru trestov

PROCESY v P12b pise "overi ich v registroch (... register trestov ...)" bez toho, aby uviedol ako. Ja som v kole 1 napisal, ze to platforma nikdy neoveri sama. **Oboje treba spresnit:** OVM ziada vypis z registra trestov elektronicky cez portal `oversi.gov.sk`, **alebo integraciou do vlastneho IS cez IS CSRU**. Suboj eID prihlasenim fyzickej osoby, ktory som popisal ja, je cesta pre obcana, nie pre urad. **Moje tvrdenie "platforma to nikdy neoveri sama" je preto prehnane** - neoveri to bez toho, aby jej zakaznik bol OVM a mal integraciu, co je ina veta.

### 4. e-Certis ma verejne zdokumentovane REST API

V kole 1 som to oznacil ako ZMIENKA. **Opraveny stav: OVERENE.** Dokument "ECERTIS Multi-Domain Web Services REST API", v0.6, 4. 7. 2023, DG GROW. Doslovne: *"The base URL is `https://ec.europa.eu/growth/tools-databases/ecertisrest/`"*, akceptacne prostredie `https://webgate.acceptance.ec.europa.eu/growth/tools-databases/ecertisrest3`. Metoda GET, vystup JSON alebo XML podla poziadavky klienta, bez zmienky o API kluci. Sluzby: `list/languages`, `list/criteriatypes`, `list/nationalentities`, `list/domains`, plus skupiny Criteria, Criteria used by ESPD (backwards-compatible) a Evidence. To je presne to, co treba na mapovanie podmienok ucasti na doklady v P05 a P12.

### 5. Co maximalista podcenil v opacnom smere

Jeho bod 5 v dopadoch ("podpisova vrstva je samostatny produkt", oddelit pecat organu / KEP osoby / podpis ZFK) je **spravny a ja som ho v kole 1 nemal**. Rozdelenie na tri triedy je jedine rozumne, lebo prave to urcuje, kolko z "cloveka v slucke" sa da odstranit. Pridavam k tomu, ze to rozdelenie je teraz podlozitelne: pecat a validacia maju technicke rozhrania (D.Signer-SVR, SNCA), podpis ZFK podla § 7 zak. 357/2015 nema a mat nebude.

## Opravy vlastnej práce

| Riadok v round1/integracie.md | Co som mal zle | Spravny stav |
|---|---|---|
| **CRZ - "zapis nie je zdokumentovany", dopad "Vysoka pre P18"** | **Najvacsia chyba kola 1.** Tvrdil som, ze "zapisove API nie je zdokumentovane. Realne pravdepodobne rucne nahratie cez UI". | Metodicky pokyn CRZ (kap. 4) popisuje tri metody vratane davkoveho XML importu, ktory "prebieha automatizovane v prednastavenych intervaloch", a pull metody, kde UV SR stahuje XML zo servera organizacie. Nie je to REST API, ale je to **dokumentovany strojovy kanal**. Riadok meni stav zo ZMIENKA na **OVERENE (davkovy import, nie API)**. |
| **EKS - "OVERENE (existencia a URL prirucky; obsah PDF som neotvoril)"** | Oznacil som ako OVERENE nieco, co som len videl odkazovane. To bolo v rozpore s mojim vlastnym kriteriom z uvodu dokumentu. | Teraz je to skutocne overene, aj s rozsahom: SOAP 1.2, OAuth Bearer, dva WSDL, 13 sluzieb, dva OAuth scopes. Pridat obmedzenie: dokument je z r. 2018 a pokryva **len elektronicke trhovisko** (opisne formulare + objednavky), nie cely EKS a nie IS EPVO. |
| **Register upadcov - "MS SR uvadza OpenAPI/Swagger na `obcan.justice.sk/pilot/api/ress-isu-service/swagger-ui/`"** | Spojil som dve veci, ktore spolu nesuvisia. Predpokladal som, ze ten Swagger pokryva register upadcov. | Nacital som `.../v3/api-docs`: je to "OpenAPI definition v0" s ~80 endpointmi pre **znalcov, sudy, sudcov, rozhodnutia, zmluvy, rozhodcov, exekutorov a mediatorov**. Register upadcov tam **nie je**. Bez definovanej `securitySchemes`. Register upadcov zostava bez strojoveho rozhrania (stary WSDL 302 na REPLIK). Zaroven je to **nova prilezitost**: `/v1/rozhodnutie` a `/v1/exekutor` su pouzitelne v P12 a P13. |
| **e-Certis - ZMIENKA** | Neuveril som sekundarnemu zdroju a dalej som nehladal. | Oficialna PDF dokumentacia REST API existuje (v0.6, 2023). Meni sa na **OVERENE**. |
| **KEP - "Verejne API nenajdene"** | Prilis rychly zaver. Hladal som "API" a nie "komponenty pre integratorov". | Serverove podpisove a overovacie komponenty maju verejnu integracnu dokumentaciu na slovensko.sk; SNCA ma verejnu technicku specifikaciu validacnej sluzby; TSL je strojovy. Meni sa na **CIASTOCNE OVERENE**. |
| **Socialna poistovna, zdravotne poistovne, NIP - "LEN WEB / SCRAPING"** | Platí len pre pristup z verejneho internetu. Pre OVM je tu IS CSRU. | Prepisat na **"LEN WEB pre komercny subjekt; SOAP cez IS CSRU pre OVM (Govnet/KTI)"**. Tym padne z mojho zoznamu "systemy bez API" **styri riadky zo siedmich**. |
| **Register trestov - "platforma to nikdy neoveri sama"** | Prehnany zaver. | Cez OverSi alebo integraciu na IS CSRU to OVM ziska elektronicky. Pre platformu ako SaaS pre neOVM zakaznikov moje tvrdenie plati, pre OVM nie. |
| **IS EPVO - "Urad vlady SR (od 31.3.2022, nie UVO)"** | Zastarany udaj a este som ho zvyraznil tucne ako opravu voci inym. | Spravcom je od 1. 1. 2025 **Urad podpredsedu vlady SR pre plan obnovy a znalostnu ekonomiku**. PROCESY to ma spravne cez § 13 ods. 1. Rokovanie o API ide este inam, nez som napisal. |
| **Pocty na konci tabulky** | S novymi zisteniami uz nesedia. | OVERENE 15 -> 18 (pridat e-Certis, CRZ zapis, IS CSRU), ZMIENKA 8 -> 6, LEN WEB/SCRAPING 8 -> 5. |

## Istota

**Obhajim (aj proti maximalistovi):**
1. **IS EPVO nema strojove rozhranie.** Overil som to v dvoch kolach, z dvoch stran (`isepvo.sk/dokumentacia/`, stranky UVO). Ziadny agent nepredlozil protidokaz. Vsetky urovne A, ktore stoja na IS EPVO (P09, P11, P14, cast P07, P08, P15), su nepodlozene.
2. **Registre UVO (ZHS, register osob so zakazom, evidencia referencii) nemaju strojovy pristup.** SOAP URL je 404, stranka UVO ziadny export neuvadza. "Verejne bez prihlasenia" znamena web, nie API.
3. **Narodny kanal na podanie oznamenia (IS eForms UVO) neexistuje strojovo, EU kanal (TED) ano.** Toto je najvacsia asymetria celeho projektu a nikto ju nevyvratil.
4. **Kazdy scrapovany udaj je pravna zavislost, nie technicka drobnost.** Po zisteni o IS CSRU je to este silnejsie: ked existuje oficialna cesta, pouzitie scrapera na to iste je rozhodnutie, ktore treba obhajit pred kontrolou.
5. **EKS je najrychlejsia cesta k funkcnemu produktu.** Po precitani prirucky to obhajim silnejsie, nez v kole 1 - existuje `VyhlasitZakazku()`.

**Stiahol by som:**
1. **"Zapis do CRZ nie je zdokumentovany."** Stahujem uplne. Bol som lenivy a neotvoril som metodiku, na ktoru som mal odkaz.
2. **"KEP je kriticka a neoverena; podpisovanie sa mozno neda zabalit do platformy."** Stahujem silu formulacie. Stavebne prvky existuju a maju verejnu dokumentaciu. Zostava overit remote sealing u QTSP a otvorit specifikaciu SNCA.
3. **"Platforma register trestov nikdy neoveri sama."** Stahujem - plati len pre neOVM prevadzkovatela.
4. **"Prevadzkovatelom IS EPVO je Urad vlady SR."** Stahujem, je to stav z r. 2022.
5. **Oznacenie EKS ako OVERENE v kole 1.** Stahujem metodicky - vtedy som porusil vlastne kriterium ("za OVERENE povazujem len to, kde som nacital dokumentacnu stranku"). Prirucku som nacital az teraz. Zaver sa nemeni, ale cesta k nemu bola nespravna, a to iste kriterium som v tom istom dokumente uplatnoval prisne voci inym riadkom.
