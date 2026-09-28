# PROCESY - krizova kontrola kola 1 (stav overenia 25. 9. 2026)

## Rozpory

### R1. IS EVO vs IS EPVO vs IS eForms - su to tri rozne veci a ani jeden agent ich neoddelil spravne

- **PRAVO:** "Vylucna komunikacia cez elektronicku platformu (IS EVO, elektronicke trhovisko EKS) pri podlimitnych a vtedajsich nizkohodnotovych zakazkach."
- **INTEGRACIE:** "IS EPVO / IS EVO (isepvo.sk) | **Urad vlady SR** (od 31.3.2022, nie UVO)" a v neistotach "IS EPVO (byvale IS EVO)".
- **Moja pozicia (prevadzkova realita):**
  1. **Elektronicka platforma** je pravny pojem (§ 13 ZVO). Jej funkcionality dnes zabezpecuju **dva moduly**: **elektronicke trhovisko (ET)**, ktore bezi na infrastrukture EKS (prihlasenie `https://iam.eks.sk/Account/Login`), a **IS EVO** (prihlasenie `https://evo.isepvo.sk/evoportal/private/home/index`). Zdroj: https://www.isepvo.sk/ a https://www.uvo.gov.sk/kontakty/elektronicka-platforma-vo-epvo (oba nacitane 25. 9. 2026).
  2. **"IS EPVO" nie je oficialny nazov systemu.** Je to domena (isepvo.sk) a skratka platformy (EPVO = Elektronicka platforma verejneho obstaravania). Oficialny nazov modulu je **IS EVO - Informacny system Elektronickeho verejneho obstaravania**. INTEGRACIE to maju obratene ("IS EPVO, byvale IS EVO"); ja som v round1 pouzival "IS EPVO" ako nazov systemu - obe je treba opravit.
  3. **Spravca k 25. 9. 2026 nie je Urad vlady SR.** To bol stav po 31. 3. 2022. Dnes je to **Urad podpredsedu vlady SR pre Plan obnovy a znalostnu ekonomiku (UPPV)**: kontakt na platformu je `eplatforma@vicepremier.gov.sk`, +421 2 200 95 100 (https://www.uvo.gov.sk/kontakty/elektronicka-platforma-vo-epvo) a UPPV vystupuje ako verejny obstaravatel modernizacie EPVO v tlacovej sprave z 20. 5. 2026 (https://www.vicepremier.gov.sk/slovensko-ma-zabezpecenu-kontinuitu-verejneho-obstaravania-elektronicka-platforma-verejneho-obstaravania-epvo-ide-do-novej-ery/). **Pravdu ma tu moj round1, INTEGRACIE maju spravcu zastaraneho o jeden prevod.**
  4. **IS eForms (eforms.uvo.gov.sk) NIE je sucastou elektronickej platformy.** Prevadzkuje ho **UVO** a sluzi na podanie oznameni do Vestnika VO (https://www.uvo.gov.sk/vestnik-a-registre/vestnik). To znamena, ze pri nadlimitnej zakazke obstaravatel realne klika v **dvoch systemoch dvoch roznych spravcov**: priebeh sutaze v IS EVO (UPPV) alebo v zapisanom prostriedku, zverejnovanie v IS eForms (UVO). INTEGRACIE to maju ako dva nesuvisiace riadky tabulky a nevyvodili z toho dvojite rozhranie; PRAVO to nema vobec.

**Kde obstaravatel realne klika k 25. 9. 2026:**

| Typ zakazky | System, v ktorom sa vedie postup | System na zverejnenie |
|---|---|---|
| Zakazka maleho rozsahu (< 50 000) | Volitelne cokolvek, aj e-mail; ak bezne dostupne T/S, dobrovolne ET (EKS) | CRZ / web, ziadne oznamenie |
| Podlimit § 108 (3 subjekty) | **IS EVO** - povinne (prirucka "Zadavanie podlimitnej zakazky bez zverejnenia vo vestniku podla § 108", v1.0 z 12. 8. 2026 na isepvo.sk) | Vyzva sa nezverejnuje; sprava o zakazke do profilu |
| Podlimit § 109 (bezne dostupne T/S) | **ET / EKS** - povinne | CRZ zabezpeci spravca |
| Podlimit § 110 (vyzva vo Vestniku) | **IS EVO** - povinne | IS eForms (UVO) -> Vestnik |
| Nadlimit | **IS EVO alebo zapisany elektronicky prostriedok** (Josephine, ERANET, eZakazky, Tendernet, eTENDERs, ELENA, EVOservis) - platforma povinna NIE JE | IS eForms (UVO) -> Vestnik -> TED |

### R2. PRAVO spravne uvadza povinnost platformy od 1. 2. 2023, ale vyvodil z nej zaver aj pre nadlimit - a ten je zly

- **PRAVO:** "Od 1. 2. 2023 je pri podlimitnych zakazkach povinne pouzivanie elektronickej platformy (IS EVO / elektronicke trhovisko EKS). Platforma preto realisticky nemoze byt samostatnym kanalom pre podlimit a nadlimit... Jedina zona, kde moze byt platforma uplne samostatna, je zakazka maleho rozsahu pod 50 000 EUR."
- **Moja pozicia:** povinnost sa vztahuje **len na podlimitne a (vtedajsie) nizkohodnotove zakazky**, nie na nadlimitne. Pri nadlimite je mozne pouzit ktorykolvek elektronicky prostriedok podla § 20 zapisany v zozname elektronickych prostriedkov UVO (§ 158a, vyhlaska 73/2022). Presne preto na SR dnes bezi vacsina nadlimitnych sutazi v Josephine a ERANETe, nie v IS EVO.
  - UVO, aktualita zo 16. 1. 2023: povinnost od 1. 2. 2023 pre "podlimitne zakazky a vymedzene zakazky s nizkou hodnotou" (https://www.uvo.gov.sk/aktualne-temy/aktualita/povinne-pouzivanie-elektronickej-platformy).
  - Sekundarne, ale explicitne: "Hoci funkcionality IS EVO umoznuju aj zadanie nadlimitnych zakaziek... to neznamena, ze tieto zakazky musia byt zadavane vylucne prostrednictvom IS EVO" (podnikajte.sk) a "Od 1.2.2023 plati zakaz pouzivania sukromnych elektronickych prostriedkov pri zakazkach s nizkou hodnotou a podlimitnych zakazkach" (skolaobstaravania.sk). **Doslovne znenie § 20 som neotvoril - pozri Istota.**
- **Kto ma pravo:** PRAVO v rozsahu povinnosti ano, v zavere nie. **Dopad na produkt je opacny, nez navrhuju PRAVO aj INTEGRACIE:** druha samostatna zona nie je len zakazka maleho rozsahu pod 50 000, ale **cely nadlimit** - za predpokladu zapisu do zoznamu elektronickych prostriedkov. Nadlimit je pritom najdrahsia a najviac dokumentovana cast procesu, teda aj najlepsia platena.

### R3. "EKS je jediny slovensky VO system s dokumentovanym rozhranim, takze EKS a zakazky s nizkou hodnotou su najrychlejsia cesta k funkcnemu produktu"

- **INTEGRACIE**, cast C. Technicky tvrdenie o rozhrani plati, procesny zaver je zly zo styroch dovodov:
  1. **"Zakazky s nizkou hodnotou" neexistuju od 1. 8. 2024.** Cesta, ktoru INTEGRACIE navrhuju, nema pravny predmet. (Ze isepvo.sk stale zverejnuje pricucku "Zakazky s nizkou hodnotou so zverejnenim vo vestniku" v1.2 z 8. 11. 2021 je chyba prevadzkovatela, nie dovod pouzivat zruseny pojem.)
  2. **EKS/ET sa pouziva pre § 109 - § 111, teda bezne dostupne tovary a sluzby v podlimite**, a dobrovolne pre zakazky maleho rozsahu bezne dostupneho charakteru. **Pre § 108, § 110 a nadlimit sa EKS nepouziva** - tam sa klika v IS EVO.
  3. **§ 109 je najmenej zaujimavy trh pre automatizaciu**, nie najlepsi. Systém uz dnes sam vyhodnocuje najnizsiu cenu, sam robi aukciu, sam generuje zmluvu a sam ju zverejnuje v CRZ. Pridana hodnota platformy je tam len test beznej dostupnosti a kontrola umeleho delenia - dva dokumenty, nie produkt.
  4. **Integracne rozhranie EKS nie je dostupne obstaravatelom.** Podla samotneho eks.sk je urcene "spravcom a prevadzkovatelom informacnych systemov" (https://www.eks.sk/Stranka/OtazkyAOdpovede/IntegracneRozhranie). Cize ani ta dokumentovanost neznamena, ze sa da integrovat bez dohody s MV SR.
- **Kto ma pravo:** INTEGRACIE v tom, ze EKS ma jedine slovenske dokumentovane rozhranie. Ja v tom, ze z toho nevyplyva poradie vstupu na trh.

### R4. Zastarane nazvy a nepresne odkazy

| Kde | Co je zle | Spravne |
|---|---|---|
| INTEGRACIE, tabulka | "IS EPVO (byvale IS EVO)", spravca "Urad vlady SR" | IS EVO je aktualny nazov modulu; EPVO je nazov platformy; spravca je UPPV |
| INTEGRACIE, cast C | "zakazky s nizkou hodnotou" | zakazka maleho rozsahu (§ 1 ods. 14) alebo podlimit (§ 108 - 111) |
| INTEGRACIE, tabulka | "EKS - Prevadzkovatel MV SR" bez rozlisenia ET ako modulu platformy | EKS hosti ET, ktore je modulom elektronickej platformy; spravcom platformy je UPPV, EKS ako IS vedie MV SR |
| PRAVO, tabulka | "elektronicke trhovisko EKS" ako jeden objekt | ET je modul, EKS je system, ktory ho hosti - v spec-e to sposobi zmätok pri mapovani rozhrani |
| PRAVO, cast A | odkaz na "§ 16x ZVO" | taky paragraf neexistuje; revizne postupy su § 169 - 175 |
| PRAVO, novela 179/2024 | "zrusenie zakaziek s nizkou hodnotou" spravne, ale v tabulke povinnosti platformy dalej pouziva "nizkohodnotove zakazky" bez oznacenia, ze je to historicky stav | oznacit ako stav k 1. 2. 2023 |

---

## Medzery

### M1. PRAVO neuvadza ani jednu lehotu na predkladanie ponuk

Maju P08 ako "sledovanie a vypocet lehot", ale bez cisiel niet co sledovat. Kriticke a chybajuce: **35 / 30 / 15 dni** verejna sutaz (§ 66), **30 dni** na ziadost o ucast pri § 67, § 70, § 74, § 78, **9 / 14 pracovnych dni** pri § 110, **min. 72 hodin** pri § 109 (a lehota neplynie pocas sviatkov a dni pracovneho pokoja), **30 dni** na zaradenie do DNS + **10 dni** na konkretnu zakazku v DNS. Pri § 108 zakon lehotu neurcuje - "primerana", co je pre platformu horsie ako pevne cislo, lebo to vyzaduje konfiguraciu a odovodnenie.

### M2. Chyba lehota na namietky a cely blokovaci efekt reviznych postupov

PRAVO ma revizne postupy len ako poziadavku na preskumatelnost. Prevadzkovo je to stavovy automat, ktory **zamyka podpis zmluvy**: namietky do **10 dni** od rozhodnej udalosti (§ 170 ods. 4), kaucia pripisana najneskor **2. pracovny den** po doruceni (§ 172 ods. 1), kontrolovany doruci dokumentaciu UVO do **5 pracovnych dni** (§ 173 ods. 1), UVO rozhodne do **30 dni** (§ 175 ods. 5). Bez toho platforma neodhadne realny termin uzavretia zmluvy.

### M3. Chyba odkladna lehota a sucinnost - hoci PRAVO ma "podpis zmluvy" ako tvrdy uzol

**11 dni** (elektronicka komunikacia) alebo **16 dni** od odoslania informacie o vysledku (§ 56 ods. 2), sucinnost uspesneho uchadzaca do **10 pracovnych dni** (§ 56 ods. 5). PRAVO spravne identifikuje, ze podpis je ludsky uzol, ale nepovie, ze platforma musi podpis **technicky zamknut do dna X** - to je dolezitejsia poziadavka ako sama identifikacia uzla.

### M4. Chyba lehota na oznamenie o vysledku do Vestnika/TED

PRAVO ma CRZ a trojmesacnu fatalnu lehotu podla § 47a ods. 4 OZ (spravne a dobre videne), ale **nema oznamenie o vysledku VO: do 30 dni po uzavreti zmluvy (§ 26 ods. 3), pri § 110 do 14 dni**, a oznamenie o zmene zmluvy do 30 dni (§ 26 ods. 4). To je ina, kratsia a sankcionovana povinnost ako CRZ.

### M5. Chybajuce prevadzkove uzly, ktore nema ani jeden agent

1. **Rozpoctove krytie a podpis spravcu rozpoctu / veduceho ekonomickeho utvaru** pred vyhlasenim. ZFK podla § 7 zak. 357/2015 overuje sulad, ale krytie potvrdzuje ekonom a bez toho ZFK neprejde. V praxi je to samostatny doklad (krycí list, ziadanka na obstaranie). PRAVO ma len ZFK ako jediny financny uzol.
2. **Vnutorna smernica o VO.** Zakon ju vyslovne nezada, ale urcuje limity pre zakazku maleho rozsahu, pocet oslovenych subjektov, kto schvaluje ktoru sumu a ci sa zriaduje komisia aj tam, kde ju zakon nepyta (§ 108, § 109). **Bez konfigurovatelnej smernice na urovni organizacie nie je platforma pouzitelna ani pre jedneho zakaznika.** Ani PRAVO, ani INTEGRACIE ju nemaju ako vstup - ja som ju mal len ako polozku v P01 a nevyvodil som z nej architektonicku poziadavku.
3. **Uznesenie zastupitelstva pri obciach a VUC.** Podla § 9 ods. 2 zak. 138/1991 Zb. o majetku obci zasady hospodarenia urcuju hodnotu, nad ktorou nakladanie s majetkovymi pravami schvaluje zastupitelstvo. Prevadzkovo to znamena, ze podpis caka na najblizsie zasadnutie - tyzdne. Bije sa to s 11-dnovou odkladnou lehotou a 10-pracovnou lehotou na sucinnost. Pravne je pozicia sporna (JUDr. Jakub Ulaher, vssr.sk, 22. 7. 2019 - zasady hospodarenia nemozu podmienit podpis zmluvy z VO schvalenim zastupitelstvom; **sekundarny zdroj**), ale platforma to musi vediet modelovat ako externu blokujucu zavislost s vlastnym kalendarom zasadnuti.
4. **Poverenie osoby na realizaciu VO, resp. mandatna zmluva s externym poskytovatelom podpornej cinnosti (§ 15 ods. 2).** Kto smie v systeme konat za obstaravatela je zmluvna otazka. Platforma potrebuje delegovanie prav s platnostou od-do a s viazanim na konkretnu zakazku.
5. **Rozhodnutie o pouziti elektronickej aukcie musi byt schvalene pred vyhlasenim**, lebo sa uvadza v oznameni/vyzve a v sutaznych podkladoch - neda sa doplnit neskor. PRAVO aj ja sme aukciu viedli az ako P14. Schvalovaci uzol patri pred P07.

### M6. INTEGRACIE: slovensky obstaravatel nemoze podat oznamenie priamo do TED

Ich bod B.2 znie: "TED Publication + Validation API umoznuju postavit vlastny **eSender**. Platforma moze generovat eForms, validovat a odoslat bez cloveka. Toto je jedina cast VO, kde je plna automatizacia zverejnenia realne dosiahnutelna dnes."

Prevadzkovo to tak nie je. Oznamenia sa podavaju **do IS eForms UVO** a zverejnuju sa vo Vestniku VO; postup do TED riesi UVO (https://www.uvo.gov.sk/zaujemca-uchadzac/vestnik). Obist Vestnik a poslat oznamenie priamo publikacnemu uradu nie je cesta, ktoru by § 26 pripustal. Takze **najlepsie dokumentovane API v celom zozname sa da pouzit len na validaciu, nahlad a citanie, nie na realne podanie** - a jediny system, kam treba realne zapisat oznamenie (IS eForms UVO), API nema. To je vazna diera v ich plane produktu a treba ju opravit skor, nez sa navrhne architektura.

### M7. Certifikovane elektronicke prostriedky - doplnenie k "NENAJDENE"

INTEGRACIE maju ERANET a Tendernet ako **NENAJDENE**. Na SR sa realne pouzivaju:

| Prostriedok | Prevadzkovatel / URL | Poznamka |
|---|---|---|
| JOSEPHINE | PROEBIZ, josephine.proebiz.com | najrozsirenejsi pri nadlimite, aukcia TENDERBOX |
| ERANET | eranet.sk + instancie zakaznikov (zsdis.eranet.sk, seas.eranet.sk, obstaravanie.eranet.sk) | registracia dodavatela zdarma |
| eZakazky | eBIZ / ezakazky.sk, samostatne instancie (MO SR, FR SR, SIEA, eAukcie.sk) | prevadzkovatel sam uvadza, ze je elektronickym prostriedkom podla § 20 |
| Tendernet | tendernet.sk | siroko pouzivany v samosprave |
| eTENDERs | etenders.sk | |
| ELENA | ELENA a.s. | ziadost o zapis do zoznamu elektronickych prostriedkov (27. 4. 2022) je zverejnena na uvo.gov.sk |
| EVOservis | | uvadzany v prehladoch prostriedkov pouzivanych pred 1. 2. 2023 |

Zoznam elektronickych prostriedkov UVO existuje (§ 158a + vyhlaska 73/2022), ale **konkretny zoznam zapisanych systemov sa mi z uvo.gov.sk vytiahnut nepodarilo** - stranka obsahuje len legislativu, pokyny a formulare. Oznacujem ako neoverene v detaile; nazvy systemov su overene z ich vlastnych webov a z vyhladavania, teda ciastocne sekundarne.

### M8. PRAVO: archivacna lehota podla § 24 je 10 rokov, nie neurcita

V neistotach pisu, ze nevedia, ci je 10, 4 alebo len specialne pravidlo pre zmluvy nad 10 rokov. Je to **10 rokov od uzavretia zmluvy** (§ 24 ods. 1), potvrdene osobitne pre podlimit (§ 108 ods. 6) a podlimitnu koncesiu (§ 112 ods. 4); pri zmluvach s trvanim nad 10 rokov 3 roky po skonceni. Overene v round1 proti zneniu ZVO a infografikam UVO z augusta 2026. Tuto neistotu mozu zatvorit.

---

## Opravy vlastnej práce

1. **"IS EPVO" som pouzival ako nazov systemu** (top zistenie 9, krok P09, tabulka EKS, Dopady bod 3, Dokazy). Nespravne. Spravne: elektronicka platforma = **ET + IS EVO**. Vsade prepisat.
2. **"vyzva min. 3 hospodarskym subjektom registrovanym v IS EPVO"** (P07 a § 108 krok 4) - nepresne dvojnasobne: zly nazov systemu a **zakon nevyzaduje predchadzajucu registraciu osloveneho subjektu**. Vyzaduje, aby vyzva sla cez na to urcenu funkcionalitu platformy. Registracia dodavatela je prevadzkovy predpoklad dorucenia, nie podmienka ucasti. Slovo "registrovanym" stahujem.
3. **EKS tabulka, krok 1:** napisal som, ze "dodavatel sa navyse musi zapisat do zoznamu hospodarskych subjektov UVO". **Prehnane.** Zapis do ZHS je dobrovolny - je to sposob nahradenia dokladov o osobnom postaveni, nie podmienka ucasti v EKS. Pri § 109 staci registracia v EKS. Opravujem.
4. **"Spravcom platformy je UPPV podla § 13 ods. 1 ZVO"** - spravcu som potvrdil z prevadzkovych zdrojov, ale **doslovne znenie § 13 som nikdy neotvoril** (slov-lex vratil len obsah bez textu, 3 pokusy). Konkretny odkaz na odsek stahujem, tvrdenie o spravcovi obhajim.
5. **P14 elektronicka aukcia** - mal som ju ako samostatny krok bez schvalovacieho uzla vopred. Rozhodnutie o pouziti aukcie patri do P05a/P07. Doplnam.
6. **"Pri § 109 zabezpecuje zverejnenie v CRZ priamo spravca platformy"** - mam to z infografiky UVO, nie z § 109 ani z CRZ. Nechavam, ale s nizsou istotou.
7. **Vnutornu smernicu o VO** som mal v P01 len ako polozku vstupov a nevyvodil som z nej architektonicku poziadavku. Mala byt v Dopadoch ako konfiguracna vrstva platformy.
8. **Eurofondove lehoty pri § 108 (4 / 6 pracovnych dni) a eurofondove limity (140 000 / 360 000 EUR)** som prebral z infografiky UVO bez otvorenia Prirucky k procesu a kontrole VO. Stale neoverene - v ruleset-e sa na ne nespoliehat.
9. **V tabulke krokov som pre P07 nadlimit napisal, ze "specialista VO odosle oznamenie publikacnemu uradu (TED) a UVO".** Presnejsie: podava ho **do IS eForms UVO**, postup do TED zabezpecuje UVO. Opravujem v zmysle M6.

---

## Istota

### Obhajim

- Elektronicka platforma = dva moduly, **ET (bezi na EKS, iam.eks.sk) + IS EVO (evo.isepvo.sk)**; "IS EPVO" nie je oficialny nazov systemu, je to domena a skratka platformy.
- **IS eForms (eforms.uvo.gov.sk) prevadzkuje UVO a nie je sucastou elektronickej platformy.** Pri nadlimite obstaravatel pracuje v dvoch systemoch dvoch roznych spravcov.
- **Spravcom elektronickej platformy je k 25. 9. 2026 Urad podpredsedu vlady SR pre Plan obnovy a znalostnu ekonomiku**, nie Urad vlady SR (to bol stav 31. 3. 2022) a nie UVO.
- **Elektronicka platforma je povinna pri podlimitnych zakazkach, nie pri nadlimitnych.**
- **EKS/ET = § 109 - § 111 (bezne dostupne tovary a sluzby)** a dobrovolne zakazka maleho rozsahu bezne dostupneho charakteru; **nie § 108, nie § 110, nie nadlimit.**
- **Integracne rozhranie EKS je podla eks.sk urcene spravcom a prevadzkovatelom informacnych systemov**, nie kazdemu obstaravatelovi.
- Lehoty z round1: 35 / 30 / 15 dni, 30 dni na ZoU, 9 / 14 pracovnych dni, 72 hodin, 11 / 16 dni, 10 pracovnych dni sucinnost, 10 dni namietky, 5 pracovnych dni dokumentacia UVO, 30 dni rozhodnutie UVO, 2 / 5 pracovnych dni doplnenie dokladov, 5 pracovnych dni zapisnica z otvarania, 7 pracovnych dni zmluva do profilu, 30 dni oznamenie o vysledku (§ 110: 14 dni), 90 dni suma uhradeneho plnenia, 10 rokov archiv.
- Kategoria "zakazka s nizkou hodnotou" neexistuje od 1. 8. 2024; archivacna lehota podla § 24 je 10 rokov.
- Uznesenie zastupitelstva je pri obciach a VUC realna blokujuca zavislost, aj ked je pravne sporna.
- Slovensky obstaravatel nema kam poslat oznamenie do Vestnika strojovo - IS eForms API nema.

### Stiahol by som

- **Odkaz "§ 13 ods. 1" ako pravny zaklad spravcovstva UPPV.** Doslovne znenie § 13 som nevidel ani raz.
- **"Hospodarske subjekty registrovane v IS EPVO"** pri § 108 a **povinny zapis dodavatela do ZHS UVO** pri § 109.
- **Eurofondove lehoty 4 / 6 pracovnych dni a eurofondove limity 140 000 / 360 000 EUR** - z infografiky, prirucku som neotvoril.
- **Tvrdenie, ze § 20 dovoluje pri nadlimite iny zapisany elektronicky prostriedok, mam len zo dvoch sekundarnych zdrojov** (podnikajte.sk, skolaobstaravania.sk) plus z existencie zoznamu elektronickych prostriedkov a z realnej praxe Josephine/ERANET. Vecne som si tym isty, formalne je to sekundarne - **doslovne znenie § 20 ods. 1 - 3 treba v kole 3 precitat z PDF slov-lex, nie z HTML.**
- **Dokument eks.sk `vyuzitie_modulov_eks.pdf`** - nacital som ho, ale je z **15. 5. 2020** a sumarizacia modulov bola vagna. Nepouzivat ako specifikaciu.
- **Zoznam zapisanych elektronickych prostriedkov UVO** - nazvy systemov mam z ich webov a z vyhladavania, nie z oficialneho zoznamu.

### Neuspesne nacitania (nahlasene, nie hadane)

- `static.slov-lex.sk/.../343/20260802.html` a `slov-lex.sk/ezbierky/.../343/20260802#paragraf-13` - **3 pokusy**, vratene len obsah/navigacia bez textu paragrafov. Znenie § 13 a § 20 ostava neprecitane.
- `eplatforma.vlada.gov.sk` - ECONNRESET (1 pokus).
- `vlada.gov.sk/ppv/epvo/` - HTTP 404.
- `metais.vicepremier.gov.sk/detail/ISVS/...` - expirovany certifikat; oficialny zapis ISVS pre EPVO som neoveril.
- `uvo.gov.sk/.../zoznam-elektronickych-prostriedkov` - stranka nacitana, ale **neobsahuje samotny zoznam zapisanych systemov**, len legislativu a formulare.
