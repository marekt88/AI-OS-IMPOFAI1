# SKEPTIK - krizova kontrola (round 2)

Stav k 25. 9. 2026.

## Rozpory

### 1. Kvalifikovana elektronicka pecat vs. KEP fyzickej osoby - rozhodnutie

**PRAVO:** "Kvalifikovana elektronicka pecat patri pravnickej osobe, takze **strojova autorizacia hromadnych dokumentov je pravne mozna**." (tabulka, 305/2013) a "Kvalifikovana elektronicka pecat organizacie ... umoznuje strojovu autorizaciu hromadnych dokumentov - oznameni, zverejneni, **zapisnic**." (C.1)

**JA v round1:** "KEP je viazany na fyzicku osobu ... Automat moze pecatit vystupy (integrita, povod), ale nemoze 'podpisat' ukon, ktory zakon pripisuje osobe."

**Rozhodnutie: PRAVO ma pravdu v principe, ja v rozsahu. Beriem pecat ako legalnu paku, ale s tromi filtrami.**

§ 23 zak. 305/2013 nie je generalne povolenie. Je to dvojkolajka: ak osobitny predpis pozaduje autorizaciu **konkretnou osobou alebo osobou v urcitom postaveni**, je nutny KEP s **mandatnym certifikatom**; ak predpis urcuje len povinnost autorizacie, resp. oznacuje podpisovatela vseobecne ako "opravnenu osobu", postacuje **kvalifikovana elektronicka pecat** organizacie (usmernenie MIRRI k § 23 ods. 1 pism. b), NASES/slovensko.sk). eIDAS to potvrdzuje materialne: KEP ma podla cl. 25 ucinok vlastnorucneho podpisu, pecat podla cl. 35 ods. 2 zaklada len **vyvratitelnu domnienku integrity udajov a spravnosti povodu** - je to dokaz o povode dokumentu, nie o vole osoby.

Tri filtre, ktore PRAVO vynechalo:

1. **Lex specialis pecat vyslovne zakazuje.** § 7 zak. 357/2015 + metodika MF SR: pri zakladnej financnej kontrole je peciatka a faksimile **nepripustna**. PRAVO to sam pise v tabulke, a potom v C.1 navrhuje pecat na "zapisnice". Zapisnicu komisie podpisuju jej clenovia (§ 51, § 53), takze pecat organizacie ju neautorizuje - to je vnutorny rozpor v praci PRAVA.
2. **§ 23 sa vztahuje na "elektronicky uradny dokument organu verejnej moci".** Sektorovy obstaravatel ako a. s., dotovana osoba a vacsina komercnych obstaravatelov nie su organ verejnej moci - pre nich § 23 nedava nic a plati vseobecny rezim. Pecat je teda paka pre stat a samospravu, nie pre cely trh platformy.
3. **Pecat neunesie ukon, ktory ma byt preskumatelne pripisany osobe.** Vylucenie uchadzaca, odovodnenie vysledku a cestne vyhlasenie su ukony, ktorych autorstvo je podstatou ich preskumatelnosti v reviznom postupe.

**Delba, ktoru obhajim:**

| Pecat organizacie STACI (strojova autorizacia) | KEP / mandatny certifikat fyzickej osoby je NUTNY |
|---|---|
| eForms oznamenia a redakcne opravy, zverejnenia v profile a Vestniku, odoslanie zmluvy do CRZ, vystupy a vypisy zo systemu, exporty auditneho zaznamu, casove peciatkovanie zaznamov, spristupnenie dokumentacie kontrolorovi (§ 184s ods. 4), JED-request, technicke validacie | Podpis ZFK (§ 7 zak. 357/2015 - peciatka vyslovne nepripustna), cestne vyhlasenie o konflikte zaujmov clena komisie (§ 23, § 51), zapisnice komisie (§ 51, § 53), vylucenie uchadzaca a odovodnenie vysledku (§ 40, § 53, § 55), menovanie komisie, zmluva a dodatok (statutar), vyjadrenia v reviznych postupoch, zaznam o urceni PHZ, ukony odborneho garanta (§ 184a a nasl.) |

### 2. Specialna uloha: tabulka rozdielov proti MAXIMALISTOVI (9 krokov s urovnou A)

| P-ID | Uroven maximalistu | Co pripustam ja | Pravny / prevadzkovy dovod | Co ak ma pravdu on a nie ja |
|---|---|---|---|---|
| P02 Prieskum trhu, PHZ | A (peciatka len nad tolerancie) | **B** - vypocet plne automaticky, zaznam o PHZ podpisuje zodpovedna osoba vzdy | § 6 ods. 16 ZVO zakazuje nielen rozdelit zakazku, ale aj **zvolit sposob urcenia PHZ tak, aby klesla pod limit**. PHZ je povinna cast dokumentacie (§ 24) a nestanovenie/nespravne stanovenie PHZ je standardne kontrolne zistenie a korekcia pri fondoch (C(2019) 3452). | Straca sa jeden podpis na zakazku. Nizka cena omylu - preto je toto moj **jediny plny nesuhlas** s jeho A. |
| P03 Limit a vyber postupu | A | **A pre vypocet, B pre vetvu vynimky a agregacie** | Deterministicky engine s verzovanymi limitmi je bezpecnejsi ako clovek - to priznavam. Nedeterministicke su tri vstupy: agregacia predmetu (§ 6 ods. 16), typ obstaravatela (§ 7 ods. 1 a) vs. b)-e)) a vynimka zo ZVO (§ 1 ods. 13, vratane novej pism. af) pre AI licencie). Priamemu rokovaciemu konaniu bez odovodnenia podmienok UVO ulozilo pokutu 764 496,83 EUR (rozhodnutie UVO 4654-P/2023). | Vetva vynimiek je 5 % pripadov. Ak sa myli on, ide o najdrahsi jeden omyl v celom procese. |
| P09 Predkladanie ponuk | A | **A** - ustupujem plne | Sifrovanie a uzamknutie riesi elektronicka platforma, nie nasa platforma. Moja poziadavka bola technicka, nie pravna. | - |
| P11 Otvaranie ponuk | A | **A** - ustupujem, s podmienkou kvalifikovanej casovej peciatky | Ukon je procesny, ale dokazuje sa casom. Bez kvalifikovanej casovej peciatky nepreukazete, ze sa neotvaralo skor. | - |
| P14 Elektronicka aukcia | A | **A** - ustupujem plne | § 54 ZVO sam hovori o automatizovanom vyhodnoteni. Hranica je v § 54 ods. 3 (intelektualne plnenie) a v certifikacii aukcneho systemu (vyhlaska UVO 132/2016). | - |
| P18 Zverejnenie zmluvy a vysledku | A ("peciatka je uz spotrebovana") | **A pre odoslanie, B pre anonymizaciu** | Odoslanie do CRZ a eForms: pecat staci a automatizacia je tu **povinna z rizika** - § 47a ods. 4 Obcianskeho zakonnika: nezverejnenie do 3 mesiacov = zmluva nebola uzavreta. Anonymizacia je ale **nove rozhodnutie po P17** podla § 5a ods. 4 zak. 211/2000 a GDPR, a je nezvratne. | Ak ma pravdu, usetri sa jedna obrazovka. Ak sa myli, ide o zverejnenie osobnych udajov alebo obchodneho tajomstva - nezvratne a medialne. |
| P19 Sprava, dokumentacia, archivacia | A ("retencna lehota sa pocita automaticky") | **A pre zostavenie a ulozenie, C pre likvidaciu** | § 24 ZVO: uchovavanie 10 rokov (zvysene z 5), pri zmluvach nad 10 rokov 3 roky po skonceni. **Zniceni zaznamov nie je funkcia timera**: podla 395/2002 rozhoduje o vyradeni statny archiv vo vyradovacom konani. Automaticke mazanie po lehote je nezakonne. | Ak ma pravdu, usetri sa rocne par hodin. Ak sa myli, znicila sa dokumentacia bez rozhodnutia archivu. |
| EKS cesta | A | **A pre vznik zmluvy, B pre "beznu dostupnost" a ZFK** | Ustupujem: EKS naozaj generuje zmluvu bez ludskeho zasahu. Clovek ale schvaluje zadanie vopred a pred vydajom je ZFK (§ 7 zak. 357/2015). Kvalifikacia "bezne dostupny tovar/sluzba" je pravna kvalifikacia postupu, nie katalogovy atribut. | Vysoka - nesprávne oznacenie za bezne dostupne znamena nezakonny postup pri celej triede nakupov. |
| Cesta "zakaziek s nizkou hodnotou" | A | **Rozpadava sa na dve cesty: A pod 50 000 EUR, C nad 50 000 EUR** | Institut zakazky s nizkou hodnotou bol **zruseny novelou 179/2024 Z. z. od 1. 8. 2024**. Pod 50 000 EUR je zakazka maleho rozsahu mimo ZVO - tam pripustam plne A a je to najsilnejsi vstupny trh. Nad 50 000 EUR ide o podlimit: povinny odborny garant a **vylucne pouzitie elektronickej platformy** (IS EVO / ET EKS) od 1. 2. 2023. | Ak ma pravdu on, cela cesta ide jednym tlacidlom. Ak nie, polovica cesty je nezakonna (garant + platforma). |

**Skore: z 9 krokov s urovnou A ustupujem pri 8 (4 plne: P09, P11, P14, maly rozsah; 4 s podmienkou: P03, P18, P19, EKS). Plne odmietam len P02. Jeden riadok (ZNH) je postaveny na zrusenom institute.**

### 3. EKS ako precedens "bez moznosti ludskeho zasahu"

**PRAVO:** "EKS uz dnes legalne generuje zmluvu bez ludskeho zasahu, pretoze clovek schvalil ramec (zadanie + vseobecne zmluvne podmienky) vopred. ... clovek schvaluje pravidlo, stroj vykonava."

**Overene:** eks.sk to potvrdzuje doslovne - "Vyhodnotenie sutaze a nasledne generovanie obchodneho vztahu prostrednictvom zmluvy s vitazom sutaze je realizovane informacnym systemom, bez moznosti ludskeho zasahu", zmluva sa zostavi zo zadania, viteznej ponuky a VZP. **Je to platny pravny argument a oslabuje moju poziciu. Prijimam ho ako vzor.**

Hranica, ktoru pripajam: EKS funguje preto, ze su splnene **styri** podmienky sucasne - predmet je bezne dostupny, kriterium je vylucne cena, zmluvne podmienky su statom predpisane (VZP), a zadanie preslo ludskym schvalenim a ZFK. Vzor "clovek schvaluje pravidlo" je teda pouzitelny len tam, kde sa da pravidlo napisat uplne vopred. Pri technickej specifikacii a kvalitativnych kriteriach to nejde - tam "ramec" znamena len sablonu a rozhodovanie zostava v jednotlivom pripade.

### 4. Elektronicka platforma vs. zapis do zoznamu elektronickych prostriedkov

**PRAVO (Neistoty c. 4):** "Toto je najdolezitejsia otvorena pravna otazka celeho projektu."

**Zatvaram ju - a ja som ju v round1 mal nespravne.** Od 1. 2. 2023 je pri **podlimitnych** zakazkach (a vtedajsich ZNH) povinne **vylucne** pouzivanie elektronickej platformy, ktorej funkcie zabezpecuje elektronicke trhovisko a IS EVO; spravcom je Urad vlady SR. Pri **nadlimitnych** zakazkach mozno pouzit aj iny informacny system **zapisany UVO** (§ 158b ZVO, vyhlaska 73/2022 Z. z., technicke poziadavky vyhlaska 41/2019 Z. z.).

Dopad: zapis do zoznamu je vstupna licencia len pre nadlimit. Pre podlimit **nepomoze ani zapis** - platforma tam nemoze byt kanalom vobec, moze byt len nadstavbou. PRAVO ma teda pravdu v zavere ("integracia, nie nahrada"), ja som v round1 bod c. 5 preexponoval a v bode "kde je moj postoj najslabsi c. 8" zase podexponoval.

### 5. AI Act - zhodneme sa v zaklade, ale obaja sme minuli dve cesty

Suhlas s PRAVOM: VO nie je v Prilohe III nariadenia 2024/1689 a nariadenie 2026/1744 odlozilo povinnosti Prilohy III na 2. 12. 2027. Nerozpitvavam.

**Ale existuju styri ine cesty, ktorymi AI Act dopadne na tento produkt - pozri Medzery.**

## Medzery

1. **AI Act cl. 50 ods. 4 - povinnost, ktoru plati prave "uroven A".** Nasadzovatel AI systemu, ktory generuje alebo upravuje **text zverejneny s cielom informovat verejnost o veciach verejneho zaujmu**, musi zverejnit, ze text bol umelo vygenerovany. Vynimka: ak obsah presiel **ludskou kontrolou alebo redakcnou kontrolou a osoba nesie redakcnu zodpovednost** za zverejnenie. Ucinne od 2. 8. 2026, teda **dnes plati**. Sutazne podklady, oznamenia, vysvetlenia a zapisnice zverejnovane vo Vestniku a v profile su presne tento typ textu. Dosledok: MAXIMALISTA pri urovni A zaplati oznacenim "AI-generovane" na verejnych dokumentoch obstaravatela, pri urovni B povinnost zanika. Ludska kontrola nie je len naklad - je to **zakonna vynimka**. Ani jeden agent tuto vazbu nevidel.
2. **AI Act cl. 50 ods. 2 - platforma ako poskytovatel.** Poskytovatel systemu generujuceho synteticky obsah musi vystupy oznacit **strojovo citatelne**. Pre platformu to znamena metadata alebo vodoznak v kazdom generovanom dokumente, a suvisiaci Code of Practice on Transparency of AI-generated Content. Pokuta za cl. 50 az 15 mil. EUR alebo 3 % obratu.
3. **VO je nastroj vymahania AI Actu proti nam - MCC-AI.** Komisia 5. 3. 2025 zverejnila aktualizovane **vzorove zmluvne klauzuly pre obstaravanie AI (MCC-AI)**, plna verzia pre vysokorizikove a light verzia pre nevysokorizikove AI. Nasi zakaznici (verejni obstaravatelia) budu platformu kupovat prave podla tychto klauzul - a tie prenesu povinnosti Kapitoly III (riadenie rizik, sprava dat, ludsky dohlad, kyberbezpecnost, logovanie) **zmluvne**, aj ked zakon platformu za vysokorizikovu neoznacuje. Compliance teda pride cez obstaravanie, nie cez klasifikaciu. Toto nevidel nikto - obaja sme sa pytali len "sme vysokorizikovi?".
4. **AI Act cl. 5 ods. 1 pism. c) - socialne skorovanie.** Zakazane od 2. 2. 2025, sankcia az 35 mil. EUR / 7 % obratu. P20 "hodnotenie dodavatela pocitane z merateelnych udajov" je bezpecne, kym zostane v ramci plnenia zmluvy. Ak by sa skore pocitalo z nesuvisiacich dat a pouzivalo v nesuvisiacom kontexte, pri dodavateloch, ktori su fyzicke osoby, sa priblizuje zakazanej praktike.
5. **§ 6 ods. 16 ZVO je designova podmienka, nie varovanie.** Zakon zakazuje nielen rozdelit zakazku, ale aj **zvolit sposob urcenia PHZ** s cielom znizit ju pod limit. Optimalizujuci AI model, ktory z viacerych metod vyberie tu s najnizsim vysledkom, pacha zakazany ukon **uz svojim navrhom**. PHZ engine musi mat metodu zafixovanu pravidlom a musi logovat, ktore metody neboli pouzite a preco.
6. **Odborny garant chyba v praci MAXIMALISTU uplne.** § 184a a nasl. ZVO: uprava ucinna od 31. 3. 2022, **povinnost od 31. 3. 2024**, garant vykonava vyse 17 vymenovanych cinnosti (od posudenia opravnenosti vynimky cez spolupracu na opise predmetu po komunikaciu s hospodarskymi subjektmi a dohlad nad lehotami). Vynimky: § 139, sutaze navrhov, nakup od centralnej obstaravacej organizacie a DNS - **zakazka s nizkou hodnotou uz medzi nimi nie je, pretoze institut bol zruseny**. Dosledok: nad 50 000 EUR neexistuje cesta bez garanta a "jedno tlacidlo" je predajny slub, ktory sa neda splnit.
7. **Likvidacia dokumentacie nie je automatizovatelna.** Podla 395/2002 Z. z. o vyradeni zaznamov rozhoduje statny archiv vo vyradovacom konani na zaklade navrhu. Platforma smie lehotu pocitat a navrh pripravit, nie mazat.
8. **Retencia je dlhsia, nez oba modely predpokladaju.** § 24 ZVO: 10 rokov (zvysene z 5), pri zmluvach s trvanim nad 10 rokov 3 roky po skonceni. Pri fondovych zakazkach sa na to navrsuju lehoty programoveho obdobia. To je poziadavka na dlhodobu overitelnost podpisov (LTA, prepecatovanie) - PRAVO to spravne pomenoval, MAXIMALISTA nie.

## Opravy vlastnej práce

1. **P-ID "Zakazky s nizkou hodnotou" a § 117 - mal som to zle.** Institut zakazky s nizkou hodnotou bol zruseny novelou **179/2024 Z. z. od 1. 8. 2024**; zakon pozna len nadlimitnu a podlimitnu zakazku (podlimit od § 108), pod 50 000 EUR ide o zakazku maleho rozsahu mimo ZVO. Moj cely riadok o "ZNH nizsieho rozsahu do 50 000 EUR od 1. 1. 2026" a citacia § 117 su nespravne. Zaver (vstupny trh je pod 50 000 EUR) obstal, odovodnenie nie.
2. **P02 - ustupujem v rozsahu.** Ziadal som podpis **odborneho garanta** na zaznam o PHZ. Pod 50 000 EUR garant nie je povinny vobec; zakon pozaduje zdokumentovanie PHZ, nie podpis garanta. Sprisnujem na "zodpovedna osoba" a ponechavam poziadavku podpisu.
3. **P03 - ustupujem.** Tvrdil som, ze vyber postupu potrebuje ludske potvrdenie. Deterministicky engine s verzovanymi limitmi a citaciou pravidla je preukazatelne bezpecnejsi ako referent s neaktualnou tabulkou. Ludsky uzol ponechavam len na tri vstupy: agregacia predmetu, typ obstaravatela, vynimka zo ZVO.
4. **P09, P11, P14 - ustupujem plne.** Moje "ludske kontrolne body" tam neboli pravne poziadavky, ale technicke (sifrovanie, casova peciatka, certifikacia aukcneho systemu). Preformulovane: nie su to schvalovacie kroky, su to technicke naleznosti systemu.
5. **P18 - ustupujem v polovici.** Odoslanie do CRZ a eForms ma byt plne automaticke a **automatizacia je tu bezpecnejsia nez clovek**, pretoze § 47a ods. 4 OZ rusi neuverejnenu zmluvu. Trvam len na ludskej brane pri anonymizacii.
6. **P19 - ustupujem v polovici.** Zostavenie spravy z eventlogu a WORM archivacia su A. Trvam na tom, ze likvidacia je C (vyradovacie konanie podla 395/2002).
7. **"KEP je viazany na fyzicku osobu" - stahujem ako generalne pravidlo.** Spravna formulacia: pecat organizacie nepostacuje tam, kde osobitny predpis urcuje konkretnu osobu alebo osobu v urcitom postaveni, alebo ju vyslovne zakazuje (§ 7 zak. 357/2015). Inde je strojova autorizacia legalna.
8. **§ 158b ako "vstupna bariera" - upravujem.** Nie je to jedna bariera, su to dva rezimy: pri nadlimite je zapis licencia, pri podlimite ani zapis nepomoze (vylucne elektronicka platforma od 1. 2. 2023).
9. **AI Act som v round1 pouzil ako strasiaka a sucasne minul to, co realne plati.** Priloha III stahujem. Doplnam cl. 50 ods. 2 a ods. 4 a MCC-AI - to je moja vecna chyba opacnym smerom.
10. **Odborny garant - "softver nemoze byt garantom" obhajim, ale "fyzicka osoba" spresnujem.** UVO pracuje s dvojicou "odborny garant a registrovana osoba" a jeden sekundarny zdroj uvadza fyzicku aj pravnicku osobu. Presne znenie § 184a-184b som doslovne neprecital (slov-lex vracia SPA), takze to oznacujem ako neoverene.

## Istota

**Obhajim (postoj je podlozeny a prezil krizovu kontrolu):**

1. Podpis zakladnej financnej kontroly - § 7 zak. 357/2015 a metodika MF SR: peciatka a faksimile **nepripustne**. Najtvrdsi uzol v celom procese a nedotknuty ani precedensom EKS.
2. Anonymizacia pred zverejnenim v CRZ - § 5a ods. 4 zak. 211/2000 a GDPR. Nove rozhodnutie po P17, nezvratne.
3. Likvidacia dokumentacie nie je automatizovatelna - 395/2002, vyradovacie konanie a rozhodnutie statneho archivu.
4. PHZ engine nesmie optimalizovat - § 6 ods. 16 ZVO zakazuje volbu sposobu urcenia PHZ s cielom znizit ju pod limit.
5. Odborny garant je povinny pri kazdej zakazke nad 50 000 EUR (§ 184a a nasl., povinnost od 31. 3. 2024) a nie je nahraditelny softverom.
6. Pri podlimite je pouzitie elektronickej platformy vylucne (od 1. 2. 2023); platforma tam moze byt len nadstavbou.
7. AI Act cl. 50 ods. 2 a ods. 4 uz plati (od 2. 8. 2026) a MCC-AI prenesu povinnosti Kapitoly III zmluvne. Compliance pride cez obstaravanie, nie cez klasifikaciu.
8. Auditny zaznam musi existovat v case ukonu, nie byt rekonstruovany - § 24 ZVO (dokumentacia, 10 rokov) a § 172 ZVO (dokazy po lehote UVO neberie na zreteľ).
9. Vylucenie uchadzaca a odovodnenie vysledku musia byt pripisatelne konkretnej osobe - § 40, § 53, § 55 a preskumatelnost v reviznych postupoch.

**Stiahol by som (moja round1 poziadavka bola prehnana):**

1. "KEP je viazany na fyzicku osobu" ako generalne pravidlo. Pecat organizacie je legalna paka v rozsahu podla § 23 zak. 305/2013.
2. Ludske schvalovanie pri P03, P09, P11, P14, pri odosielani v P18 a pri zostavovani spravy v P19.
3. AI Act Priloha III ako hrozba pre VO. Nahradzujem ju cl. 50 a MCC-AI.
4. Institut a cislovanie zakazky s nizkou hodnotou (§ 117) - neexistuje od 1. 8. 2024.
5. Poziadavka podpisu odborneho garanta pri PHZ pod 50 000 EUR.
6. Teza "regulator to nebude tolerovat". UVO samo pouziva AI pri kontrole a zakonodarca novelou 130/2026 ulahcil nakup AI licencii. Smer regulacie je pro-AI.
7. Ramovanie "human-in-the-loop vsade". Spravne ramovanie je **human-in-the-loop tam, kde je vynimka alebo zodpovednost**, a plna automatizacia tam, kde je clovek slabsi clanok (lehoty, CRZ watchdog, limity, registre).

**Co sa mi nepodarilo overit v tomto kole:**

- Doslovne znenie § 23 ods. 1 pism. a) a b) zak. 305/2013 (slov-lex vracia SPA, PDF usmernenia MIRRI je binarne necitatelne). Delbu pecat/KEP opieram o usmernenie MIRRI cez sekundarne prevzatie a o eIDAS cl. 25 a 35.
- Doslovny vypocet vynimiek z povinnosti odborneho garanta po novele 179/2024 (§ 184b ods. 2). Zdroje uvadzaju zoznam z obdobia pred zrusenim ZNH.
- Lehotu 10 rokov podla § 24 ZVO mam zo sekundarneho prevzatia znenia a z dovodovej spravy, nie z precitaneho konsolidovaneho textu.
- Ci je odborny garant vylucne fyzicka osoba, alebo aj pravnicka osoba (sekundarne zdroje si protirecia; UVO odlisuje "odborny garant" a "registrovana osoba").
