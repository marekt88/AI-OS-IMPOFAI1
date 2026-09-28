# PRAVO - finalna verzia (kolo 3), stav prava k 25. 9. 2026

Pohlad: konzervativny pravnik. Hladam, co zakon vyslovne vyzaduje od konkretnej fyzickej osoby, a co naopak vyslovne pripusta strojovo.

## Zistenia

### Zhrnutie v siestich bodoch

1. **Zakon c. 343/2015 Z. z. (ZVO) k 25. 9. 2026 plati**, v znení ucinnom od 2. 8. 2026 do 31. 12. 2026. Existuje schvalena verzia od 1. 1. 2027 (cl. V zakona 385/2025 Z. z., vypusta § 154 ods. 5).
2. **"Zakazka s nizkou hodnotou" neexistuje** od 1. 8. 2024 (novela 179/2024 Z. z.). ZVO pozna len nadlimitnu a podlimitnu zakazku; pod 50 000 EUR bez DPH ide o **zakazku maleho rozsahu** mimo posobnosti ZVO.
3. **Kluceova oprava oproti kolu 1: platforma moze byt samostatnym kanalom v dvoch zonach, nie v jednej.** Povinne vylucne pouzitie elektronickej platformy plati len pri **podlimitnych** zakazkach (od 1. 2. 2023). Pri **nadlimitnych** zakazkach mozno pouzit ktorykolvek elektronicky prostriedok **zapisany v zozname UVO podla § 158a** - preto na SR nadlimit realne bezi v Josephine, ERANETe, eZakazky, Tendernete, eTENDERs, ELENA a EVOservis.
4. **Zapis do zoznamu elektronickych prostriedkov nie je volitelny bonus, je to plosna licencia.** § 20 ZVO: "Verejny obstaravatel a obstaravatel moze na elektronicku komunikaciu pouzit vylucne elektronicky prostriedok zapisany v zozname elektronickych prostriedkov podla § 158a." Zoznam vedie UVO (§ 158a), naleznosti ziadosti o zapis su v § 158b a vo vyhlaske 73/2022 Z. z., technicke poziadavky vo vyhlaske 41/2019 Z. z.
5. **Terminologia (zosuladena s agentom PROCESY):** *elektronicka platforma* je pravny pojem § 13 ZVO a ma dva moduly - **ET (elektronicke trhovisko)** na infrastrukture EKS a **IS EVO** (evo.isepvo.sk). **IS eForms** (eforms.uvo.gov.sk) je samostatny system **UVO** na podanie oznameni do Vestnika a odtial do TED. Spravcom platformy je Urad podpredsedu vlady SR pre plan obnovy.
6. **AI Act**: verejne obstaravanie nie je v Prilohe III nariadenia 2024/1689. Uz dnes plati cl. 5 (zakazane praktiky), cl. 4 (AI gramotnost), povinnosti GPAI a **cl. 50 (transparentnost, od 2. 8. 2026)**. Datumy odkladu po nariadeni (EU) 2026/1744 mam **len zo sekundarnych zdrojov** - EUR-Lex nevratil text ani po ~9 pokusoch (pozri Neistoty).

### Povinna tabulka predpisov

| Predpis | Co upravuje | Ktorych procesov (P-ID) sa tyka | Dopad na automatizaciu | Odkaz |
|---|---|---|---|---|
| Zakon c. 343/2015 Z. z. (ZVO), v zneni 395/2021, 32/2024, 179/2024, 100/2026, 130/2026 | Cely zivotny cyklus zakazky: limity, postupy, komunikacia, podmienky ucasti, kriteria, komisia, lehoty, revizne postupy, dokumentacia | P01-P20 | Ramcovy predpis. Automatizovat mozno vypocty, generovanie, lehoty a odosielanie; rozhodovacie a podpisove ukony zostavaju na menovanych osobach. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| § 13 ZVO - elektronicka platforma | Definuje elektronicku platformu; jej funkcionality zabezpecuju modul ET (na infrastrukture EKS) a IS EVO | P07-P15, P18 | Platforma nie je "IS EPVO"; je to pravny pojem s dvoma modulmi dvoch roznych prevadzok. Mapovanie rozhrani musi rozlisovat ET, IS EVO a IS eForms. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| § 20 ZVO + § 158a + § 158b ZVO, vyhlaska 41/2019 Z. z., vyhlaska 73/2022 Z. z. | Elektronicka komunikacia vo VO; **vylucne** elektronicky prostriedok zapisany v zozname podla § 158a; § 158b + 73/2022 urcuju naleznosti ziadosti o zapis; 41/2019 technicke a funkcne poziadavky | P07-P15 | **Najtvrdsi pravny limit projektu.** Bez zapisu do zoznamu UVO nesmie platforma sprostredkovat ziadnu komunikaciu vo VO. Zapis sa ziada cez slovensko.sk a podpisuje KEP. | https://www.uvo.gov.sk/otvorena-komunikacia/elektronicke-verejne-obstaravanie/zoznam-elektronickych-prostriedkov |
| Povinne pouzivanie elektronickej platformy od 1. 2. 2023 (§ 108-§ 111 ZVO + aktualita UVO 16. 1. 2023) | Vylucna komunikacia cez elektronicku platformu pri **podlimitnych** zakazkach a vtedajsich zakazkach s nizkou hodnotou | P07-P15 | Pri podlimite nepomoze ani zapis do zoznamu - tam moze byt platforma len nadstavbou nad ET/IS EVO. Pri nadlimite tento zakaz neplati. | https://www.uvo.gov.sk/aktualne-temy/aktualita/povinne-pouzivanie-elektronickej-platformy |
| Novela c. 395/2021 Z. z. (od 31. 3. 2022) | Zrusenie ziadosti o napravu (byvale § 163-165); zavedenie zoznamu elektronickych prostriedkov (§ 158a, § 158b) a § 13 elektronicka platforma; zavedenie institutu odborneho garanta | P16, P07-P15 | Revizne postupy su dnes len namietky a konanie UVO (§ 169-175). Vetva "ziadost o napravu" do produktu nepatri. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2021/395/ |
| Zakon c. 32/2024 Z. z., cl. V (od 31. 3. 2024) | Meni § 184b ods. 1: obstaravatel **moze** vykonavat cinnosti vo VO aj prostrednictvom odborneho garanta | P01-P20 | Odborny garant je od 31. 3. 2024 **fakultativny**, nie povinny. Nie je regulacnou barierou vstupu na trh ani pri zakazkach nad 50 000 EUR. | https://static.slov-lex.sk/static/SK/ZZ/2024/32/20240331.html |
| Novela c. 179/2024 Z. z. (od 1. 8. 2024) | Zrusenie zakazky s nizkou hodnotou; zakazka maleho rozsahu do 50 000 EUR mimo ZVO; jednotne podlimitne postupy; limit namietok pri stavebnych pracach 1 500 000 EUR; pokuty 0,1-5 % zmluvnej ceny | P03, P07, P09, P16 | Rozhodovaci strom stavaj na dvojici podlimit/nadlimit plus pasmo maleho rozsahu. Vetva "nizka hodnota" a § 117 su mrtve. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2024/179/ |
| Novela c. 100/2026 Z. z. (vyhlasena 21. 5. 2026, body 4, 5, 7, 8 a 13-15 od 1. 7. 2026) | § 23 ods. 3 negativne vymedzenie konfliktu zaujmov; § 40 ods. 4-6 lehoty 2-5 pracovnych dni na vysvetlenie dokladov; § 51 ods. 4 lehota 3 roky; § 167 priorizacna politika UVO; § 184q-184z kontrola a spristupnenie dokumentacie | P06, P08, P10, P12b, P19 | Lehoty 2-5 pracovnych dni a 7-dnova lehota podla § 184s ods. 2 su plne strojovo sledovatelne. **Nemeni § 13, § 20, § 24, § 158a ani § 158b** - poziadavky na elektronicky prostriedok zostali. | https://static.slov-lex.sk/static/SK/ZZ/2026/100/vyhlasene_znenie.html |
| Novela c. 130/2026 Z. z. (od 2. 8. 2026) | Nove § 1 ods. 13 pism. af): vynimka zo ZVO pre licencie k systemom umelej inteligencie, ak obstarava verejna vysoka skola, verejna vyskumna institucia alebo SAV | P03 | Ciastkova vynimka. Do rozhodovacieho stromu pridaj test typu obstaravatela a predmetu (AI licencia). Signal, ze smer regulacie je pro-AI. | https://static.slov-lex.sk/static/SK/ZZ/2026/130/vyhlasene_znenie.html |
| Zakon c. 385/2025 Z. z., cl. V (od 1. 1. 2027) | Vypusta § 154 ods. 5 ZVO vratane poznamky pod ciarou (napojenie na IS elektronickej fakturacie) | P18, P20 | Vecne bezvyznamne, procesne kluceove: ZVO menia aj novely danovych zakonov. Monitoring prava nesmie sledovat len "novely ZVO". | https://static.slov-lex.sk/static/SK/ZZ/2025/385/vyhlasene_znenie.html |
| Vyhlaska UVO c. 421/2025 Z. z. (od 1. 1. 2026) | Financne limity pre nadlimitnu zakazku, nadlimitnu koncesiu a sutaz navrhov | P03 | Limity su parametrizovatelne a menia sa v dvojrocnom cykle. Musia byt verzovane s datumom platnosti, nikdy nezadratovane v kode. | https://static.slov-lex.sk/static/SK/ZZ/2025/421/vyhlasene_znenie.html |
| § 51 ZVO - komisia na vyhodnotenie ponuk | Kolektivny organ, najmenej 3 clenovia; clenovia s pravom vyhodnocovat musia mat odborne vzdelanie alebo odbornu prax k predmetu; cestne vyhlasenie po oboznameni sa so zoznamom uchadzacov | P10, P11, P12a, P12b, P13, P15 | Nedelegovatelne na stroj. AI moze pripravit podklad a navrh; rozhodnutie a podpis robia menovane fyzicke osoby. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| § 23 ZVO - konflikt zaujmov | Povinnost identifikovat a riesit konflikt zaujmov; od 1. 7. 2026 ods. 3 vymedzuje, co konfliktom nie je (viac ako 3 roky, bezna interakcia na socialnych sietach, spolocenske vztahy bez financneho zaujmu) | P06, P10, P12b | Detekciu prepojeni (RPO, RPVS, OR) mozno automatizovat ako skoring a je to **povinny dokaz skumania**. UVO vyslovne uvadza, ze samotne cestne vyhlasenie nestaci. | https://www.uvo.gov.sk/metodika-vzdelavanie/tematicke-materialy/konflikt-zaujmov |
| § 54 ZVO + vyhlaska UVO 132/2016 Z. z. - elektronicka aukcia | Poradie ponuk sa zostavi **automatizovanym vyhodnotenim** po uvodnom uplnom vyhodnoteni; nepouzije sa pri intelektualnom plneni; certifikacia aukcneho systemu | P05a, P07, P14 | Jediny proces, kde zakon vyslovne priznava automatizovane vyhodnotenie. Rozhodnutie o pouziti aukcie musi byt schvalene **pred** vyhlasenim, lebo sa uvadza v oznameni a v sutaznych podkladoch. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| § 6 ods. 16 ZVO - umele delenie a volba metody PHZ | Zakaz rozdelit zakazku a zaroven zakaz zvolit sposob urcenia PHZ s cielom znizit ju pod limit | P02, P03 | PHZ engine nesmie optimalizovat. Metoda musi byt zafixovana pravidlom a system musi logovat, ktore metody neboli pouzite a preco. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| § 11 ZVO + zakon c. 315/2016 Z. z. o RPVS | Zakaz uzavriet zmluvu, koncesnu zmluvu alebo ramcovu dohodu s uchadzacom alebo subdodavatelom, ktory ma byt zapisany v RPVS a zapisany nie je; subdodavatel nad 30 % pri nadlimite s PHZ od 10 mil. EUR, inak nad 50 % | P12b, P17 | Overenie v RPVS je strojove a musi byt **blokujucou kontrolou** pred uvolnenim zmluvy na podpis. Idealny kandidat na hard gate. | https://static.slov-lex.sk/static/SK/ZZ/2016/315/20170201.html |
| Zakon c. 357/2015 Z. z., § 6 ods. 3 a § 7 (zakladna financna kontrola) | ZFK vykonava statutar alebo nim urceny veduci zamestnanec **a** zamestnanec zodpovedny za rozpocet, VO alebo spravu majetku; na doklade meno, priezvisko, podpis, datum a jedno z troch predpisanych vyjadreni; **peciatka a faksimile su neprijatelne** | P06, P17, P20 | Najtvrdsi ludsky uzol v celom procese, nedotknuty ani precedensom EKS. Platforma smie doklad predplnit, podpis musia vykonat dve konkretne osoby. | https://www.mfsr.sk/sk/financie/audit-kontrola/faq/zakladna-financna-kontrola/ |
| Zakon c. 305/2013 Z. z. o e-Governmente, § 23 ods. 1 | Organ verejnej moci autorizuje elektronicky uradny dokument KEP s **mandatnym certifikatom** alebo **kvalifikovanou elektronickou pecatou**, s kvalifikovanou casovou peciatkou | P06, P07, P15, P17, P18, P19 | Dvojkolajka, nie generalne povolenie: pecat organizacie staci tam, kde predpis ziada len autorizaciu; KEP s mandatnym certifikatom je nutny tam, kde predpis urcuje konkretnu osobu. Plati len na organ verejnej moci. | https://mirri.gov.sk/wp-content/uploads/2019/07/Usmernenie-k-%C2%A7-23-ods.-1-pi%CC%81sm.-b-za%CC%81kona-o-e-Governmente.pdf |
| Nariadenie (EU) 910/2014 (eIDAS) + zakon c. 272/2016 Z. z. | KEP (fyzicka osoba, cl. 25 - ucinok vlastnorucneho podpisu), kvalifikovana elektronicka pecat (pravnicka osoba, cl. 35 ods. 2 - domnienka integrity a povodu), casove peciatky, narodne rozsirenia certifikatov | P06, P09, P15, P17, P19 | Model opravneni musi rozlisovat KEP osoby a pecat organizacie ako rozne pravne ucinky. Dlhodoba archivacia potrebuje LTA a preznacovanie casovymi peciatkami. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2016/272/ |
| Zakon c. 211/2000 Z. z. § 5a a § 5a ods. 4 + Obciansky zakonnik § 47a | Povinne zverejnovana zmluva a anonymizacia; zmluva je ucinna dnom po zverejneni v CRZ; ak nie je zverejnena do **3 mesiacov** od uzavretia, plati, ze zmluva nebola uzavreta | P18, P20 | Odoslanie do CRZ automatizuj a strazenie 3-mesacnej lehoty je povinne z rizika. Anonymizacia je naopak nove nezvratne rozhodnutie - ludska brana. | https://www.crz.gov.sk/index.php?ID=114364 |
| § 24 ZVO - dokumentacia a jej uchovavanie | Zdokumentovanie celeho priebehu VO vratane podkladov k PHZ; uchovavanie dokumentacie 10 rokov; rovnopis zmluvy po celu dobu trvania; pri trvani nad 10 rokov 3 roky po skonceni | P02, P19 | Platforma musi byt dokazny archiv s nemennym auditnym zaznamom vytvaranym **v case ukonu**, nie rekonstruovanym. Zaciatok plynutia lehoty - pozri Neistoty. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| Zakon c. 395/2002 Z. z. o archivoch a registraturach | Registraturny poriadok a plan; vyradovacie konanie; uchovavanie elektronickych zaznamov sposobom zarucujucim autenticitu povodu, integritu obsahu a citatelnost | P19 | Archivacia nie je "ulozenie PDF". **Likvidacia nie je funkcia timera** - o vyradeni rozhoduje statny archiv. Platforma smie lehotu pocitat a navrh pripravit. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2002/395/20251015 |
| § 12 ZVO - evidencia referencii | Vyhotovenie referencie a jej zapis do evidencie referencii UVO | P20 | Automatizovatelne generovanie z dat o plneni. Lehotu a odsek pozri v tabulke lehot. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| Smernice 2014/24/EU, 2014/25/EU, 2014/23/EU, 2009/81/ES | Klasicke, sektorove, koncesne a obranne obstaravanie; transponovane do ZVO | P03, P05a, P05b, P07, P12a, P13 | Pre platformu relevantne hlavne cez ZVO. Sektorovi obstaravatelia a obranne zakazky maju vlastne limity a rezimy - samostatne vetvy pravidiel. | https://eur-lex.europa.eu/legal-content/SK/TXT/?uri=celex%3A32009L0081 |
| Delegovane nariadenie (EU) 2025/2152 (a sprievodne 2025/2150) | Prahove hodnoty smernic na roky 2026-2027, aplikovatelne od 1. 1. 2026 | P03 | Prahy su dvojrocny cyklus a v 2026 **klesli**. Platforma potrebuje datovany registr limitov a notifikaciu pri zmene. | https://eur-lex.europa.eu/eli/reg_del/2025/2152/oj/eng |
| Vykonavacie nariadenie (EU) 2019/1780 (eForms), v zneni 2022/2303 a 2023/2884 | Standardne formulare na zverejnovanie oznameni; konsolidovane znenie od 1. 11. 2024; stare standardne formulare uz nemozno pouzit | P07, P15, P18 | eForms su strukturovane XML - najlepsi kandidat na plnu automatizaciu **generovania a validacie**. Podanie ale ide do IS eForms UVO, nie priamo do TED. | https://eur-lex.europa.eu/eli/reg_impl/2019/1780 |
| Vykonavacie nariadenie (EU) 2016/7 (JED/ESPD) + vyhlaska UVO c. 155/2016 Z. z. | Jednotny europsky dokument ako predbezna nahrada dokladov o splneni podmienok ucasti a dovodov na vylucenie | P05a, P12a | JED je strukturovany a strojovo citatelny - formalna kontrola uplnosti (P12a) sa da automatizovat plne. Vyhlasenie robi uchadzac, nasledne overenie obstaravatel (P12b). | https://www.uvo.gov.sk/zaujemca-uchadzac/jednotny-europsky-dokument-jed |
| Nariadenie (EU) 2016/679 (GDPR), najma cl. 22 | Pravo nebyt predmetom rozhodnutia zalozeneho vylucne na automatizovanom spracuvani s pravnymi ucinkami pre fyzicku osobu | P10, P12b, P13 | Ak je uchadzac fyzicka osoba - podnikatel, plne automatizovane vylucenie je rizikove. Potrebny je zmysluplny ludsky zasah a moznost napadnut rozhodnutie. | https://gdpr-info.eu/art-22-gdpr/ |
| Nariadenie (EU) 2024/1689 (AI Act) v zneni nariadenia (EU) 2026/1744 | Zakazane praktiky (od 2. 2. 2025), AI gramotnost cl. 4, GPAI (od 2. 8. 2025), transparentnost cl. 50 (od 2. 8. 2026), vysokorizikove systemy Prilohy III odlozene (datum neovereny) | P04, P05a, P05b, P12b, P13 | VO nie je v Prilohe III, platforma nie je per se vysokoriziková. **Cl. 50 ods. 2 a 4 plati dnes**: strojovo citatelne oznacenie vystupov a oznacenie AI-generovaneho verejneho textu, ak nepresiel ludskou redakcnou kontrolou. | https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng |
| Vzorove zmluvne klauzuly EU pre obstaravanie AI (MCC-AI, akt. 5. 3. 2025) | Nezavazne vzorove klauzuly pre verejne obstaravanie AI systemov, plna a light verzia | P05b, P20 | Zakaznici budu platformu kupovat podla tychto klauzul a **zmluvne** prenesu povinnosti Kapitoly III AI Actu (riadenie rizik, sprava dat, ludsky dohlad, logovanie). Compliance pride cez obstaravanie, nie cez klasifikaciu. | https://public-buyers-community.ec.europa.eu/communities/procurement-ai |
| Zakon c. 523/2004 Z. z. § 19, zakon c. 138/1991 Zb. § 9 ods. 2 | Hospodarnost a efektivnost nakladania s verejnymi prostriedkami; zasady hospodarenia obci a VUC urcujuce hodnotu, nad ktorou schvaluje zastupitelstvo | P01, P06, P17 | Plan VO a rozpoctove krytie nie su povinnosti zo ZVO, ale z rozpoctoveho prava a internej smernice. Uznesenie zastupitelstva treba modelovat ako externu blokujucu zavislost s kalendarom zasadnuti. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2004/523/ |

### Financne limity platne od 1. 1. 2026 (vyhlaska UVO c. 421/2025 Z. z., § 1-§ 3)

| Kategoria | Suma (EUR bez DPH) |
|---|---|
| Verejny obstaravatel podla § 7 ods. 1 pism. a) - tovar, sluzba | 140 000 |
| Verejny obstaravatel podla § 7 ods. 1 pism. b) az e) - tovar, sluzba | 216 000 |
| Sluzba z prilohy c. 1 ZVO (socialne a ine osobitne sluzby) | 750 000 |
| Sektorovy obstaravatel - tovar, sluzba | 432 000 |
| Sektorovy obstaravatel - sluzba z prilohy c. 1 ZVO | 1 000 000 |
| Stavebne prace | 5 404 000 |
| Obrana a bezpecnost - tovar, sluzba / stavebne prace | 432 000 / 5 404 000 |
| Nadlimitna koncesia | 5 404 000 |
| Sutaz navrhov | 140 000 / 216 000 / 432 000 |
| Zakazka maleho rozsahu (mimo ZVO, od 1. 8. 2024) | pod 50 000 |

Limity do 31. 12. 2025 boli 143 000 / 221 000 / 443 000 / 5 538 000 EUR - v roku 2026 **klesli**. Zakazka naplanovana v 2025 moze v 2026 spadnut do prisnejsieho rezimu; registr limitov musi byt datovany.

### Ludske uzly podla prava

Ukony, ktore zakon viaze na konkretnu fyzicku osobu a nedaju sa delegovat na stroj.

| Ukon | Pravny zaklad | P-ID | Preco je to tvrdy uzol |
|---|---|---|---|
| Podpis zakladnej financnej kontroly | § 6 ods. 3 a § 7 zak. 357/2015 Z. z. | P06, P17, P20 | Zakon zada meno, priezvisko a podpis dvoch konkretnych osob (veduci zamestnanec + zamestnanec zodpovedny za oblast). Peciatka a faksimile su vyslovne neprijatelne. |
| Zaznam o urceni PHZ | § 6 ods. 16 a § 24 ZVO | P02 | PHZ je povinna cast dokumentacie a nespravne urcenie je standardne kontrolne zistenie. Vypocet automatizuj, zaznam podpisuje zodpovedna osoba. |
| Kvalifikacia predmetu ako "bezne dostupny" a vetva vynimiek zo ZVO | § 2 ods. 5, § 1 ods. 13, § 6 ods. 16, § 7 ods. 1 ZVO | P03 | Je to pravna kvalifikacia postupu, nie katalogovy atribut. Nespravne oznacenie znamena nezakonny postup pri celej triede nakupov. |
| Menovanie komisie a cestne vyhlasenie o nekonflikte zaujmov | § 23 a § 51 ZVO | P10 | Vyhlasenie je osobne a podava sa po oboznameni sa so zoznamom uchadzacov. UVO navyse poziada dokaz, ze konflikt bol skumany - samotne vyhlasenie nestaci. |
| Vyhodnotenie podmienok ucasti a ponuk, zapisnice komisie | § 51, § 53 ZVO | P12a, P12b, P13, P15 | Komisia je kolektivny organ min. 3 osob s odbornym vzdelanim alebo praxou. Zapisnica je ukon konkretnych fyzickych osob, nie organizacie. |
| Vylucenie uchadzaca a odovodnenie vysledku | § 40, § 53, § 55 ZVO + preskumatelnost v § 169-175 | P12b, P13, P15, P16 | Rozhodnutie musi byt odovodnene tak, aby ho UVO a sud preskumali. Ciernoskrinkovy AI vystup je tu pravne nepouzitelny bez ludskeho odovodnenia. |
| Posudenie mimoriadne nizkej ponuky | § 53 ZVO | P13 | Vyzaduje vyzvu na vysvetlenie a odborne zhodnotenie odpovede - hodnotiaci sud, nie vypocet. |
| Anonymizacia pred zverejnenim zmluvy | § 5a ods. 4 zak. 211/2000 Z. z. + GDPR | P18 | Nove rozhodnutie po P17 a nezvratne. Chyba znamena zverejnenie osobnych udajov alebo obchodneho tajomstva. |
| Uzavretie a podpis zmluvy a dodatku | § 56 ZVO, Obciansky a Obchodny zakonnik | P17, P20 | Podpisuje statutar alebo osoba s pisomnym opravnenim. Vynimka: EKS/ET, kde zmluva vznika automaticky zo zadania, viteznej ponuky a VZP schvalenych vopred. |
| Navrh na vyradenie registraturnych zaznamov | zakon c. 395/2002 Z. z. | P19 | O vyradeni rozhoduje statny archiv vo vyradovacom konani. Automaticke mazanie po uplynuti lehoty je nezakonne. |
| Ukony odborneho garanta, **ak ho obstaravatel pouzije** | § 184a a nasl. ZVO; § 184b ods. 1 v zneni zak. 32/2024 Z. z. | P01-P20 | Od 31. 3. 2024 je pouzitie garanta **fakultativne** ("mozu"). Ak sa pouzije, je to konkretna osoba zapisana v zozname UVO s vlastnou zodpovednostou, ktoru softver nenahradi. |

### Pecat organizacie vs KEP fyzickej osoby

Pravidlo: § 23 ods. 1 zak. 305/2013 Z. z. je **dvojkolajka, nie generalne povolenie**. Ak osobitny predpis urcuje konkretnu osobu alebo osobu v urcitom postaveni, je nutny KEP s mandatnym certifikatom. Ak predpis ziada len autorizaciu, resp. oznacuje podpisovatela vseobecne ako opravnenu osobu, postacuje kvalifikovana elektronicka pecat organizacie. Materialne to potvrdzuje eIDAS: KEP ma podla cl. 25 ucinok vlastnorucneho podpisu, pecat podla cl. 35 ods. 2 zaklada len vyvratitelnu domnienku integrity a povodu. **Dve obmedzenia**: § 23 sa vztahuje len na organ verejnej moci (sektorovy obstaravatel ako a. s. a dotovana osoba nim nie su), a lex specialis moze pecat vyslovne zakazat.

| Dokument / ukon | Pozadovana forma | Pravny zaklad |
|---|---|---|
| eForms oznamenia a redakcne opravy do Vestnika | Pecat organizacie staci | § 26, § 27 ZVO; § 23 ods. 1 zak. 305/2013 |
| Zverejnenia v profile obstaravatela | Pecat organizacie staci | § 64 ZVO |
| Odoslanie zmluvy do CRZ | Pecat organizacie staci | § 5a zak. 211/2000 |
| Vyzva na predkladanie ponuk, vysvetlenia sutaznych podkladov, JED-request | Pecat organizacie staci | § 48 ZVO, nariadenie 2016/7 |
| Spristupnenie dokumentacie kontrolorovi UVO | Pecat organizacie staci; ide o zriadenie pristupu, nie prenos suborov | § 184s ods. 4 ZVO |
| Vystupy, vypisy, exporty auditneho zaznamu, casove peciatkovanie | Pecat organizacie staci | § 24 ZVO; eIDAS cl. 35 |
| Sprava o zakazke, suhrnna sprava | Pecat organizacie staci | § 10 ods. 10, § 24 ZVO |
| **Doklad o zakladnej financnej kontrole** | **KEP fyzickej osoby (dvoch osob); pecat a faksimile vyslovne neprijatelne** | § 6 ods. 3 a § 7 zak. 357/2015 |
| **Cestne vyhlasenie clena komisie o nekonflikte zaujmov** | **KEP fyzickej osoby** | § 23, § 51 ZVO |
| **Zapisnica z otvarania ponuk a zapisnica z vyhodnotenia ponuk** | **KEP fyzickych osob - clenov komisie**; pecat organizacie moze pokryt len odoslanie, nie autorstvo | § 51, § 52, § 53 ZVO |
| **Oznamenie o vyluceni a odovodnenie vysledku** | **KEP fyzickej osoby / mandatny certifikat** | § 40, § 53, § 55 ZVO; preskumatelnost § 169-175 |
| **Menovaci dekret komisie** | **KEP statutara alebo mandatny certifikat** | § 51 ZVO |
| **Zmluva, ramcova dohoda, dodatok** | **KEP statutara alebo splnomocnenej osoby** | § 56 ZVO, Obchodny zakonnik |
| **Vyjadrenia v reviznych postupoch** | **KEP fyzickej osoby / mandatny certifikat** | § 169-175 ZVO |
| **Zaznam o urceni PHZ** | **KEP zodpovednej osoby** | § 6 ods. 16, § 24 ZVO |
| **Ziadost o zapis do zoznamu elektronickych prostriedkov** | **KEP**, podava sa cez slovensko.sk | § 158b ZVO, vyhlaska 73/2022 |

### Lehoty

| Lehota | Dlzka | Pravny zaklad | P-ID |
|---|---|---|---|
| Predkladanie ponuk, verejna sutaz - zakladna | najmenej 35 dni od odoslania oznamenia | § 66 ods. 2 pism. a) ZVO | P07, P09 |
| Verejna sutaz s predbeznym oznamenim (12-35 mesiacov vopred) | najmenej 15 dni | § 66 ods. 2 pism. b) ZVO | P07, P09 |
| Verejna sutaz, ponuky vylucne elektronicky | najmenej 30 dni | § 66 ods. 3 ZVO | P07, P09 |
| Naliehavy stav | najmenej 15 dni | § 66 ods. 4 ZVO | P07, P09 |
| Ak sutazne podklady nie su volne pristupne | 40 dni, resp. 20 dni s predbeznym oznamenim | § 66 ods. 5 ZVO | P07, P09 |
| Ziadost o ucast (uzsia sutaz, rokovacie konania, sutazny dialog) | najmenej 30 dni | § 67, § 70, § 74, § 78 ZVO | P07 |
| Podlimit § 110 - vyzva vo Vestniku | 9, resp. 14 pracovnych dni (podla predmetu) | § 110 ZVO | P07, P09 |
| Podlimit § 109 - bezne dostupne T/S cez ET | najmenej 72 hodin; neplynie pocas dni pracovneho pokoja a sviatkov | § 109 ZVO | P07, P09 |
| Podlimit § 108 - vyzva min. 3 subjektom | zakon ju neurcuje, musi byt "primerana" | § 108 ZVO | P07, P09 |
| DNS - zaradenie do systemu / konkretna zakazka | 30 dni / 10 dni | § 58-§ 61 ZVO | P07, P09 |
| Vysvetlenie a doplnenie dokladov uchadzacom | 2 az 5 pracovnych dni | § 40 ods. 4-6 ZVO (v zneni 100/2026, od 1. 7. 2026) | P12b |
| Zaciatok elektronickej aukcie po odoslani vyzvy na ucast | najskor 2 pracovne dni | § 54 ZVO | P14 |
| **Odkladna lehota na uzavretie zmluvy** | **16 dni od odoslania informacie o vysledku; pri elektronickej komunikacii podla § 20 najskor 11. den** | § 56 ods. 2 ZVO | P15, P17 |
| Lehota na poskytnutie sucinnosti uspesnym uchadzacom | nesmie byt kratsia ako 10 pracovnych dni (pri niektorych ukonoch 5 pracovnych dni) | § 56 ZVO | P17 |
| **Namietky** | **do 10 dni od rozhodnej udalosti** | § 170 ods. 4 ZVO | P16 |
| Kaucia pripisana na ucet UVO | najneskor 2. pracovny den po doruceni namietok | § 172 ods. 1 ZVO | P16 |
| Dorucenie dokumentacie kontrolovaneho UVO | 5 pracovnych dni | § 173 ods. 1 ZVO | P16 |
| Rozhodnutie UVO o namietkach | 30 dni | § 175 ods. 5 ZVO | P16 |
| Spristupnenie dokumentacie pri kontrole (nova uprava) | 7 dni | § 184s ods. 2 ZVO (100/2026) | P19 |
| **Oznamenie o vysledku VO do Vestnika** | **do 30 dni po uzavreti zmluvy**; pri ramcovej dohode a podlimitnom DNS hromadne do 30 dni po skonceni stvrtroka | § 26 ods. 3 ZVO | P15, P18 |
| Oznamenie o vysledku pri § 110 | do 14 dni po uzavreti zmluvy | § 110 ZVO | P18 |
| Oznamenie o zmene zmluvy | do 14 dni po zmene | § 26 ZVO | P20 |
| Zverejnenie zmluvy v profile | 7 pracovnych dni | § 64 ZVO | P18 |
| **Zverejnenie zmluvy v CRZ - fatalna lehota** | **3 mesiace od uzavretia; inak plati, ze zmluva nebola uzavreta** | § 47a ods. 4 Obcianskeho zakonnika, § 5a zak. 211/2000 | P18 |
| Suma skutocne uhradeneho plnenia | 90 dni | § 64 ZVO | P20 |
| Referencia do evidencie referencii UVO | do 30 dni od skoncenia plnenia | § 12 ZVO | P20 |
| **Uchovavanie dokumentacie** | **10 rokov**; rovnopis zmluvy po celu dobu trvania; pri trvani nad 10 rokov 3 roky po skonceni | § 24 ZVO | P19 |

### Verzie ZVO a novely k 25. 9. 2026 vratane buducich ucinnosti

| Predpis / verzia | Ucinnost | Co prinieslo |
|---|---|---|
| ZVO 343/2015 Z. z. | 18. 4. 2016 | Zakladne znenie, transpozicia smernic 2014/23, 2014/24, 2014/25 |
| Novela 395/2021 Z. z. | 31. 3. 2022 | Zrusenie ziadosti o napravu (§ 163-165); § 13 elektronicka platforma; § 20 - vylucne zapisany elektronicky prostriedok; § 158a zoznam, § 158b ziadost o zapis; institut odborneho garanta |
| Povinne pouzivanie elektronickej platformy | 1. 2. 2023 | Vylucna komunikacia cez elektronicku platformu pri podlimite a vtedajsich ZNH |
| Zakon 32/2024 Z. z., cl. V | 31. 3. 2024 | § 184b ods. 1: pouzitie odborneho garanta zmenene z povinnosti na moznost |
| Novela 179/2024 Z. z. | 1. 8. 2024 | Zrusenie zakazky s nizkou hodnotou a § 117; zakazka maleho rozsahu do 50 000 EUR mimo ZVO; jednotne podlimitne postupy; limit namietok pri stavebnych pracach 1 500 000 EUR; pokuty 0,1-5 % |
| Vyhlaska UVO 421/2025 Z. z. | 1. 1. 2026 | Nove (nizsie) financne limity |
| Novela 100/2026 Z. z. | 21. 5. 2026, body 4, 5, 7, 8, 13-15 od 1. 7. 2026 | § 23 ods. 3 konflikt zaujmov; § 40 ods. 4-6 lehoty; § 51 ods. 4; § 166, § 167, § 169, § 177, § 182, § 182a; § 184q-184z; prechodne § 187x-187y. Nemeni § 13, § 20, § 24, § 158a, § 158b |
| Novela 130/2026 Z. z. | 2. 8. 2026 | § 1 ods. 13 pism. af): vynimka pre licencie k AI systemom pre verejne VS, verejne vyskumne institucie a SAV |
| **Aktualna verzia k 25. 9. 2026** | **2. 8. 2026 - 31. 12. 2026** | posledna zmena zakonom 130/2026 Z. z. |
| **Buduca verzia** | **1. 1. 2027** | cl. V zakona 385/2025 Z. z. (novela zakona o DPH) vypusta § 154 ods. 5 vratane poznamky pod ciarou |

## Dôkazy

**Primarne a oficialne slovenske zdroje**

- § 20 ZVO, doslovne znenie doplnene novelou 395/2021 Z. z.: "Verejny obstaravatel a obstaravatel moze na elektronicku komunikaciu pouzit vylucne elektronicky prostriedok zapisany v zozname elektronickych prostriedkov podla § 158a." Zdroj: navrh zakona a dovodova sprava NR SR - https://www.nrsr.sk/web/Dynamic/DocumentPreview.aspx?DocID=501290 (nacitane 25. 9. 2026). Ta ista novela redesignovala § 13 z "elektronickeho trhoviska" na "elektronicku platformu" a rozsirila ju aj na stavebne prace.
- Zoznam elektronickych prostriedkov: naleznosti ziadosti podla **§ 158b** ZVO a vyhlasky c. 73/2022 Z. z., ziadost sa podava cez slovensko.sk, strojovo citatelna a podpisana KEP. Stranka **neuvadza** samotny zoznam zapisanych systemov ani vyslovne pravny ucinok zapisu - https://www.uvo.gov.sk/otvorena-komunikacia/elektronicke-verejne-obstaravanie/zoznam-elektronickych-prostriedkov (nacitane 25. 9. 2026). Kombinacia § 20 + § 158a + § 158b dava jednoznacny vysledok: zapis je podmienka pouzitia.
- Povinne pouzivanie elektronickej platformy od 1. 2. 2023 pre "podlimitne zakazky a vymedzene zakazky s nizkou hodnotou" - https://www.uvo.gov.sk/aktualne-temy/aktualita/povinne-pouzivanie-elektronickej-platformy . Rozsah povinnosti sa **nevztahuje na nadlimitne zakazky**.
- § 66 ods. 2 pism. a) 35 dni, pism. b) 15 dni; ods. 3 min. 30 dni pri vylucne elektronickom predkladani; ods. 4 min. 15 dni pri naliehavosti; ods. 5 40 dni resp. 20 dni - https://www.lewik.org/term/8825/lehoty-na-predkladanie-ponuk-vo-verejnej-sutazi-zakon-o-verejnom-obstaravani/ (**sekundarny**, cituje znenie § 66).
- § 56 ods. 2 ZVO: zmluvu mozno uzavriet najskor 16. den od odoslania informacie o vysledku, pri pouziti elektronickych prostriedkov podla § 20 najskor 11. den; lehota na sucinnost podla § 56 ods. 12-14 nesmie byt kratsia ako 10 pracovnych dni (podla ods. 8, 10, 11 min. 5 pracovnych dni). § 170 ods. 4: namietky treba dorucit najneskor do 10 dni od rozhodnej udalosti. Zdroj: navrh novely a dovodova sprava NR SR - https://www.nrsr.sk/web/Dynamic/DocumentPreview.aspx?DocID=497430 .
- § 26 ods. 3 ZVO: oznamenie o vysledku VO sa odosiela do 30 dni po uzavreti zmluvy, ramcovej dohody a koncesnej zmluvy; pri zakazkach z ramcovej dohody a podlimitneho DNS hromadne za kazdy stvrtrok do 30 dni po jeho skonceni. Pri § 110 je lehota 14 dni po uzavreti zmluvy a oznamenie o zmene zmluvy 14 dni po zmene. Zdroj: static.slov-lex.sk/static/SK/ZZ/2015/343/20250201.html (cez vyhladavanie).
- § 23 ods. 1 zak. 305/2013 Z. z. a jeho vyklad: ak osobitny predpis vyslovne vyzaduje autorizaciu konkretnej osoby (napr. starostu), je potrebny KEP s mandatnym certifikatom; ak vyzaduje len podpis opravnenej osoby, postacuje kvalifikovana elektronicka pecat. Mandatny certifikat a pecat su pri autorizacii elektronickych uradnych dokumentov rovnocenne v rozsahu, ktory urcuje osobitny predpis. Zdroj: **Usmernenie MIRRI k § 23 ods. 1 pism. b) zakona o e-Governmente** - https://mirri.gov.sk/wp-content/uploads/2019/07/Usmernenie-k-%C2%A7-23-ods.-1-pi%CC%81sm.-b-za%CC%81kona-o-e-Governmente.pdf a https://mirri.gov.sk/wp-content/uploads/2020/03/Usmernenie-k-autorizacii-elektronickych-uradnych-dokumentov.pdf .
- eIDAS 910/2014: cl. 25 - KEP ma pravny ucinok rovnocenny vlastnorucnemu podpisu; cl. 35 ods. 2 - kvalifikovana pecat zaklada domnienku integrity udajov a spravnosti povodu. Pecat teda preukazuje povod dokumentu, nie volu osoby.
- Zakon c. 357/2015 Z. z., § 6 ods. 3 a § 7: ZFK vykonava statutar alebo nim urceny veduci zamestnanec a zamestnanec zodpovedny za danu oblast; na doklade meno, priezvisko, podpis, datum a jedno z troch vyjadreni; podpisovanie peciatkou (faksimile) nie je pripustne - https://www.mfsr.sk/sk/financie/audit-kontrola/faq/zakladna-financna-kontrola/ .
- Zakon c. 32/2024 Z. z., cl. V, ucinny 31. 3. 2024: § 184b ods. 1 znie "...**mozu** vykonavat cinnosti vo verejnom obstaravani aj prostrednictvom odborneho garanta" - https://static.slov-lex.sk/static/SK/ZZ/2024/32/20240331.html . Odborny garant je teda fakultativny.
- Novela 100/2026 Z. z. - ucinnost dnom vyhlasenia 21. 5. 2026, body 4, 5, 7, 8 a 13-15 od 1. 7. 2026; zoznam menenych ustanoveni v tabulke vyssie; **nemeni § 13, § 20, § 24, § 158a ani § 158b** - https://static.slov-lex.sk/static/SK/ZZ/2026/100/vyhlasene_znenie.html .
- Novela 130/2026 Z. z., ucinna 2. 8. 2026 - https://static.slov-lex.sk/static/SK/ZZ/2026/130/vyhlasene_znenie.html .
- Zakon 385/2025 Z. z., cl. V, ucinnost 1. 1. 2027 - https://static.slov-lex.sk/static/SK/ZZ/2025/385/vyhlasene_znenie.html .
- Vyhlaska UVO 421/2025 Z. z., vydana 18. 12. 2025, ucinnost 1. 1. 2026 - https://static.slov-lex.sk/static/SK/ZZ/2025/421/vyhlasene_znenie.html . Prehlad vyhlasok UVO (421/2025, 481/2023, 73/2022, 41/2019, 155/2016, 157/2016, 132/2016) - https://www.uvo.gov.sk/o-urade/zakladne-informacie-a-dokumenty/legislativa .
- EKS a plna automatizacia: "Vyhodnotenie sutaze a nasledne generovanie obchodneho vztahu prostrednictvom zmluvy s vitazom sutaze je realizovane informacnym systemom, bez moznosti ludskeho zasahu"; zmluva sa zostavi zo zadania, viteznej ponuky a VZP - https://www.eks.sk/Stranka/Informacie_o_EKS .
- § 11 ZVO a RPVS, zakon c. 315/2016 Z. z. - https://static.slov-lex.sk/static/SK/ZZ/2016/315/20170201.html .
- § 5a zak. 211/2000 Z. z. a § 47a Obcianskeho zakonnika, CRZ vedie Urad vlady SR - https://www.crz.gov.sk/index.php?ID=114364 .
- Zakon c. 395/2002 Z. z. o archivoch a registraturach, znenie k 15. 10. 2025 - https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2002/395/20251015 .
- Konflikt zaujmov - UVO vyslovne uvadza, ze cestne vyhlasenia clenov komisie nestacia; treba preukazat skumanie - https://www.uvo.gov.sk/metodika-vzdelavanie/tematicke-materialy/konflikt-zaujmov .
- JED/ESPD - https://www.uvo.gov.sk/zaujemca-uchadzac/jednotny-europsky-dokument-jed ; Vestnik a IS eForms - https://www.uvo.gov.sk/vestnik-a-registre/vestnik .

**EU zdroje**

- Delegovane nariadenie (EU) 2025/2152 z 22. 10. 2025, prahy na 2026-2027, od 1. 1. 2026 - https://eur-lex.europa.eu/eli/reg_del/2025/2152/oj/eng ; sprievodne 2025/2150 - https://eur-lex.europa.eu/eli/reg_del/2025/2150/oj .
- Vykonavacie nariadenie (EU) 2019/1780 (eForms) v zneni 2022/2303 a 2023/2884, konsolidovane k 1. 11. 2024 - https://eur-lex.europa.eu/eli/reg_impl/2019/1780 ; TED eForms - https://ted.europa.eu/sk/simap/eforms .
- Vykonavacie nariadenie (EU) 2016/7 (JED/ESPD) - https://eur-lex.europa.eu/eli/reg_impl/2016/7/oj?locale=sk .
- GDPR cl. 22 - https://gdpr-info.eu/art-22-gdpr/ .
- AI Act, nariadenie (EU) 2024/1689 - https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng ; konsolidovane znenie k 27. 7. 2026 - https://eur-lex.europa.eu/eli/reg/2024/1689/2026-07-27/eng (existencia ELI URL s tymto datumom je jediny primarny indikator, ze nariadenie 2026/1744 nadobudlo ucinnost 27. 7. 2026).
- Nariadenie (EU) 2026/1744 (Digital Omnibus on AI) - https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng . **Text sa nepodarilo nacitat ani raz** (v kolach 1-3 spolu ~9 pokusov cez /oj/eng, CELEX, OJ TXT, ALL a PDF). Datumy odkladu su zo **sekundarnych zdrojov**: https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/ , https://cdp.cooley.com/digital-ai-omnibus-delays-key-deadlines-introduces-new-rules/ , https://artificialintelligenceact.eu/article/113/ .
- Priloha III AI Act (8 oblasti: biometria, kriticka infrastruktura, vzdelavanie, zamestnanost, pristup k zakladnym sluzbam, vymahanie prava, migracia, spravodlivost) - verejne obstaravanie sa v nej nenachadza (**sekundarne**: https://artificialintelligenceact.eu/annex/3/ ).

**Sekundarne zdroje (oznacene)**

- Lewik.org - znenia a komentare k § 54, § 66, § 24 ZVO a k § 23 zak. 305/2013.
- Najpravo.sk - "Elektronicka pecat vs. kvalifikovany elektronicky podpis".
- Podnikajte.sk, skolaobstaravania.sk - potvrdenie, ze IS EVO nie je povinny pri nadlimite.
- Prirucka k procesu a kontrole VO - https://eurofondy.gov.sk/wp-content/uploads/2024/09/Prirucka-k-procesu-a-kontrole-VO-PCS.pdf .

## Neistoty

1. **Plny text ZVO sa mi nepodarilo nacitat ani v jednom z troch kol.** static.slov-lex.sk a slov-lex ezbierky vracaju len obsah a navigaciu bez textu paragrafov (celkovo 8+ pokusov, vratane cielenych promptov na § 20, § 66, § 56, § 170). Znenia § 20, § 56 ods. 2, § 66 a § 170 ods. 4 mam z dovodovych sprav NR SR a z komentarovych zdrojov, nie z konsolidovaneho textu. **Pred produktom precitajte ZVO z PDF Zbierky zakonov.**
2. **AI Act - nariadenie (EU) 2026/1744 zostava neovereny v primarnom texte.** EUR-Lex nevratil obsah ani raz (~9 pokusov, 3 z toho v kole 3 - potom som podla pravidla zastavil). Datumy **2. 12. 2027 (Priloha III)** a **2. 8. 2028 (Priloha I)** a to, ze cl. 50 zostal na 2. 8. 2026, pochadzaju **vylucne zo sekundarnych zdrojov** (pravnicke firmy, artificialintelligenceact.eu). Rovnako je sekundarne aj tvrdenie, ze verejne obstaravanie nie je v Prilohe III. Do compliance modulu ich ber ako "na overenie pravnikom".
3. **Zaciatok plynutia 10-rocnej archivacnej lehoty podla § 24 ods. 1 je sporny.** Agent PROCESY tvrdi "od uzavretia zmluvy", ja som v kole 2 rekonstruoval "odo dna odoslania oznamenia o vysledku VO". Dlzku 10 rokov povazujem za istu, zaciatok nie - rozdiel je v praxi az niekolko mesiacov a ovplyvni retencny engine.
4. **Pravny ucinok zapisu do zoznamu elektronickych prostriedkov je odvodeny, nie citovany zo stranky UVO.** Stranka UVO ucinok neuvadza; zaver "bez zapisu nesmie platforma sprostredkovat komunikaciu" stoji na doslovnom zneni § 20 prevzatom z dovodovej spravy NR SR. Overte v konsolidovanom texte cislo odseku § 20.
5. **Konkretny zoznam zapisanych elektronickych prostriedkov sa mi nepodarilo ziskat** zo stranok UVO. Nazvy (Josephine, ERANET, eZakazky, Tendernet, eTENDERs, ELENA, EVOservis) su z praxe a z webov prevadzkovatelov, nie z oficialneho zoznamu. Neviem preto, ci su vsetky zapisane dnes a aky je realny cas a naklad zapisu.
6. **Cislovanie odsekov prebrate z komentarovych zdrojov** (§ 5 ods. 8, § 24 ods. 4-5, § 51 ods. 4, § 108 ods. 2, § 110 ods. 5-6, § 6 ods. 16) nie je overene v konsolidovanom texte. Rovnako lehoty pri § 108-§ 111 a DNS su prevzate od agenta PROCESY a overene len ciastocne.
7. **§ 23 ods. 1 zak. 305/2013 som necital doslovne** - delbu pecat/KEP opieram o usmernenia MIRRI (oficialny, ale vykladovy zdroj) a o eIDAS cl. 25 a 35. Hranicne pripady (zapisnica podpisana casti komisie, delegovanie autorizacie) treba posudit individualne.
8. **Vzorove klauzuly MCC-AI** som v kole 3 neoveril novym nacitanim; prebral som ich od agenta SKEPTIK ako plauzibilne a oznacujem ako neoverene v tomto kole.
9. **Metodicke usmernenia UVO a vzory dokumentov** som presiel len vyberovo (konflikt zaujmov, JED, Vestnik, zoznam elektronickych prostriedkov). Mozu obsahovat dalsie formalne naleznosti, ktore ovplyvnia generovanie dokumentov.

## Dopady na platformu

### A. Tri zony podla pravneho priestoru pre platformu

| Zona | Pravny rezim | Co smie platforma |
|---|---|---|
| **Zakazka maleho rozsahu pod 50 000 EUR** | Mimo posobnosti ZVO (od 1. 8. 2024) | **Plne samostatny kanal.** Ziadny zapis do zoznamu nie je potrebny, lebo nejde o komunikaciu vo VO podla ZVO. Stale plati 357/2015 (ZFK), 211/2000 + § 47a OZ, 523/2004 a GDPR - "mimo ZVO" nie je "bez prava". |
| **Nadlimitna zakazka** | ZVO plati; elektronicka platforma **nie je povinna** | **Samostatny kanal po zapise do zoznamu elektronickych prostriedkov** (§ 20 + § 158a/§ 158b, vyhlaska 41/2019 a 73/2022). Toto je najdrahsia a najviac dokumentovana cast procesu. Zverejnovanie ide vzdy cez IS eForms UVO. |
| **Podlimitna zakazka (§ 108-§ 111)** | Vylucne elektronicka platforma od 1. 2. 2023 | **Len nadstavba.** Ani zapis do zoznamu tu nepomoze. Platforma moze riadit workflow, generovat vstupy, schvalovat a odosielat do ET/IS EVO. |

**Zmena oproti kolu 1:** moj zaver "jedina plne samostatna zona je pasmo pod 50 000 EUR" bol nespravny. Sprava zona je vacsia a hodnotnejsia - nadlimit. Zapis do zoznamu prestava byt otvorenou otazkou a stava sa **prvou polozkou v roadmape produktu**, nie rizikom na konci.

### B. Co sa da plne automatizovat

- **P02, P03**: vypocet PHZ (s metodou zafixovanou pravidlom podla § 6 ods. 16, bez optimalizacie) a urcenie limitu a postupu. Podmienka: verzovany registr limitov s datumami platnosti (menili sa 1. 1. 2024, 1. 8. 2024, 1. 1. 2026 a klesli).
- **P07, P15, P18**: generovanie a validacia eForms. Struktura je XML. Podanie ide do IS eForms UVO, nie priamo do TED - status eSendera udeluje Publikacny urad EU a narodne podanie nenahradza.
- **P08**: sledovanie a vypocet vsetkych lehot z tabulky vyssie. Clovek je tu slabsi clanok.
- **P12a**: formalna kontrola uplnosti JED - strukturovany ESPD-EDM, prva uroven vyhodnotenia je deterministicka.
- **P12b**: overovanie v registroch - RPVS, RPO, obchodny register, zoznam hospodarskych subjektov, register trestov, danove a odvodove nedoplatky. RPVS ako blokujuca kontrola pred podpisom.
- **P14**: elektronicka aukcia - zakon sam hovori o automatizovanom vyhodnoteni (§ 54). Hranica: intelektualne plnenie a certifikacia aukcneho systemu (vyhlaska 132/2016).
- **P18**: odoslanie zmluvy do CRZ ako automaticky watchdog. Automatizacia je tu **bezpecnejsia nez clovek**, lebo § 47a ods. 4 OZ rusi nezverejnenu zmluvu.
- **P19**: zostavenie spravy o zakazke z eventlogu, WORM archivacia, spristupnenie dokumentacie kontrolorovi zriadenim pristupu (§ 184s ods. 4). **Nie likvidacia** - tu rozhoduje statny archiv.

### C. Styri navrhove rozhodnutia, ktore z prava vyplyvaju

1. **Zapis do zoznamu elektronickych prostriedkov je prvy milnik, nie posledny.** Bez neho je platforma pouzitelna len pod 50 000 EUR. S nim sa otvara cely nadlimit. Zapis ziada splnenie vyhlasky 41/2019, dotaznik podla vyhlasky 73/2022 a podanie cez slovensko.sk s KEP.
2. **Rozdel podpisovanie na dve vrstvy** podla tabulky "Pecat organizacie vs KEP fyzickej osoby". Bez tohto rozdelenia bude clovek klikat tisice podpisov. Zaroven neprekroc hranicu: zapisnice komisie, ZFK, vylucenia a odovodnenia patria osobe. Pozor aj na to, ze § 23 zak. 305/2013 plati len na organ verejnej moci - pre sektorovych obstaravatelov a dotovane osoby treba samostatny model.
3. **EKS/ET je pravny precedens, nie konkurencia.** Zmluva tam vznika bez ludskeho zasahu, lebo su splnene styri podmienky sucasne: predmet je bezne dostupny, kriteriom je vylucne cena, zmluvne podmienky su statom predpisane (VZP) a zadanie preslo ludskym schvalenim a ZFK. Vzor "clovek schvaluje pravidlo, stroj vykonava" pouzi vsade, kde sa pravidlo da napisat uplne vopred. Pri technickej specifikacii a kvalitativnych kriteriach to nejde.
4. **Vnutorna smernica o VO je konfiguracna vrstva produktu, nie dokument.** Zakon ju nezada, ale urcuje limity pre maly rozsah, pocet oslovenych subjektov, kto schvaluje ktoru sumu a ci sa zriaduje komisia aj tam, kde ju zakon nepyta. Bez nej nie je platforma pouzitelna ani pre jedneho zakaznika. Pri obciach a VUC k tomu pridaj kalendar zasadnuti zastupitelstva ako externu blokujucu zavislost, ktora sa bije s 11-dnovou odkladnou lehotou.

### D. AI-specificke povinnosti platformy k 25. 9. 2026

- **Platforma nie je vysokorizikovy AI system per se** - VO nie je v Prilohe III (sekundarne overene).
- **Co plati dnes**: cl. 5 (zakazane praktiky, od 2. 2. 2025), cl. 4 (AI gramotnost, od 2. 2. 2025), povinnosti GPAI (od 2. 8. 2025), **cl. 50 (od 2. 8. 2026)**.
- **Cl. 50 ods. 2** (poskytovatel): vystupy generujuceho systemu musia byt oznacene **strojovo citatelne** - metadata alebo vodoznak v kazdom generovanom dokumente.
- **Cl. 50 ods. 4** (nasadzovatel): AI-generovany text zverejneny s cielom informovat verejnost o veciach verejneho zaujmu treba oznacit ako umelo vygenerovany, **okrem pripadu, ked obsah presiel ludskou redakcnou kontrolou a osoba nesie redakcnu zodpovednost**. Sutazne podklady, oznamenia a vysvetlenia su presne tento typ textu. Ludska kontrola teda nie je len naklad - je to **zakonna vynimka**, ktora povinnost oznacovania rusi.
- **MCC-AI**: zakaznici prenesu povinnosti Kapitoly III (riadenie rizik, sprava dat, ludsky dohlad, kyberbezpecnost, logovanie) **zmluvne**, aj ked zakon platformu za vysokorizikovu neoznacuje. Compliance pride cez obstaravanie, nie cez klasifikaciu.
- **Kde riziko realne vznika**: ak by AI hodnotila fyzicke osoby (odbornu kvalifikaciu expertov, zivotopisy, personalne kapacity), moze to spadnut pod bod 4 Prilohy III (zamestnanost). Drz to oddelene a bez automatickeho rozhodovania.
- **GDPR cl. 22**: pri uchadzacoch - fyzickych osobach nesmie byt vylucenie zalozene vylucne na automatizovanom spracuvani.
- **Dlhodoba dokazna hodnota**: bez LTA a preznacovania casovymi peciatkami budu podpisy po rokoch neverifikovatelne a cela automatizovana dokumentacia strati dokaznu silu v 10-rocnej retencii.

## Zmenené

1. **Zaver o samostatnosti platformy - najvacsia oprava.** V kole 1 som napisal, ze jedina plne samostatna zona je pasmo pod 50 000 EUR. Prijimam kritiku agenta PROCESY: povinnost vylucneho pouzitia elektronickej platformy sa vztahuje len na podlimit, nie na nadlimit. Pridavam druhu zonu - nadlimit po zapise do zoznamu elektronickych prostriedkov.
2. **Doplnil som podmienku, ktoru nemal ani PROCESY, ani SKEPTIK.** § 20 ZVO nedovoluje pri nadlimite "ktorykolvek" elektronicky prostriedok - dovoluje vylucne prostriedok **zapisany v zozname podla § 158a**. Zapis nie je odporucanie, je to plosna podmienka elektronickej komunikacie vo VO.
3. **Zosuladil som terminologiu.** Elektronicka platforma (§ 13) = ET na infrastrukture EKS + IS EVO (evo.isepvo.sk); IS eForms (eforms.uvo.gov.sk) je samostatny system UVO na Vestnik. V kole 1 som pisal "elektronicke trhovisko EKS" ako jeden objekt - opravene. Prijate od agenta PROCESY.
4. **Doplnil som cely blok lehot** (21 riadkov s paragrafmi a P-ID), ktory v kole 1 chybal uplne. Prijate od agenta PROCESY. Overil som § 66, § 56 ods. 2, § 170 ods. 4 a § 26 ods. 3; ostatne su prevzate a oznacene v Neistotach.
5. **Zmenil som poziciu k pecateniu zapisnic komisie a priznavam vnutorny rozpor.** V kole 1 som v tabulke pisal, ze pecat organizacie umoznuje strojovu autorizaciu zapisnic, a sucasne som uvadzal komisiu ako tvrdy ludsky uzol. SKEPTIK ma pravdu: zapisnica je ukon konkretnych fyzickych osob (§ 51, § 53), takze pecat ju neautorizuje. Prepracoval som to do samostatnej tabulky s 20 polozkami.
6. **Doplnil som dva limity dosahu § 23 zak. 305/2013**, ktore som v kole 1 vynechal: plati len na organ verejnej moci (nie na sektorovych obstaravatelov ako a. s. ani na dotovane osoby) a lex specialis moze pecat zakazat (§ 7 zak. 357/2015).
7. **Opravil som zrusenie ziadosti o napravu**: patri k novele 395/2021 Z. z. (31. 3. 2022), nie k 179/2024. V kole 1 som to mal zle.
8. **Opravil som neexistujuci paragraf "§ 16x ZVO"** na revizne postupy § 169-175. Prijate od agenta PROCESY.
9. **Opravil som cislovanie zoznamu elektronickych prostriedkov**: § 158a je zoznam, § 158b su naleznosti ziadosti o zapis. V kole 1 som uvadzal "§ 20 a § 158a", v kole 2 som prehnal korekciu na samotny § 158b.
10. **Doplnil som odborneho garanta**, ktory mi v kole 1 uplne vypadol - existuje (§ 184a a nasl.), ale od 31. 3. 2024 je fakultativny (zakon 32/2024 Z. z., cl. V).
11. **Doplnil som zakon 385/2025 Z. z. a verziu ZVO od 1. 1. 2027**, § 6 ods. 16 (zakaz optimalizacie PHZ), § 12 (referencie), vyhlasku 132/2016 (certifikacia aukcii), zakon 523/2004 a 138/1991, vyradovacie konanie podla 395/2002, anonymizaciu podla § 5a ods. 4, MCC-AI a cl. 50 ods. 2 a 4 AI Actu.
12. **Zmiernil som tvrdenie o zakazke maleho rozsahu.** Nie je to "najmensia regulacia" - je to najmensia **procesna** regulacia. ZFK, zverejnenie v CRZ s 3-mesacnou fatalnou lehotou, hospodarnost a GDPR platia aj tam.
13. **Uzavrel som svoju "najdolezitejsiu otvorenu otazku" z kola 1.** Odpoved: pri podlimite je platforma vzdy len nadstavbou, pri nadlimite moze byt samostatnym prostriedkom po zapise, pod 50 000 EUR je uplne volna.
14. **Doplnil som 10-rocnu archivacnu lehotu** ako doverenu (v kole 1 bola v Neistotach s tromi konkurencnymi cislami). Sporny zostava len zaciatok plynutia.

## Odmietnuté

1. **SKEPTIK: "Odborny garant je povinny pri kazdej zakazke nad 50 000 EUR a nie je nahraditelny softverom."** Odmietam prvu polovicu. Zakon c. 32/2024 Z. z., cl. V, ucinny 31. 3. 2024, zmenil § 184b ods. 1 na "**mozu** vykonavat cinnosti vo verejnom obstaravani aj prostrednictvom odborneho garanta". Povinnost trvala od 31. 3. 2024 len na papieri - novelou bola v ten isty den zmenena na moznost. Zdroj je primarny: https://static.slov-lex.sk/static/SK/ZZ/2024/32/20240331.html . Druhu polovicu (softver nie je garant) prijimam - je ale bezpredmetna, lebo povinnost neexistuje. Cela SKEPTIKova teza "nad 50 000 EUR neexistuje cesta bez garanta" padá.
2. **SKEPTIK: "Pri nadlimite je zapis licencia, pri podlimite ani zapis nepomoze."** Prijimam vecne, odmietam ako **uplnu** odpoved. Zapis nie je licencia len pre nadlimit - § 20 ho ziada pre kazdu elektronicku komunikaciu vo VO. Dovod, preco pri podlimite nepomoze, nie je chybajuca licencia, ale samostatny zakaz pouzit iny kanal nez elektronicku platformu (od 1. 2. 2023).
3. **PROCESY: "Pri nadlimite je mozne pouzit ktorykolvek elektronicky prostriedok podla § 20."** Prijimam zaver, odmietam formulaciu. Nie ktorykolvek - vylucne **zapisany v zozname podla § 158a**. Rozdiel je pre produkt zasadny: je to jednorazova regulacna prekazka, nie volny trh.
4. **PROCESY (M8): "Archivacna lehota je 10 rokov od uzavretia zmluvy."** Prijimam dlzku, odmietam zaciatok ako potvrdeny. Druhy zdroj hovori "odo dna odoslania oznamenia o vysledku VO". Ani jedna verzia nie je precitana v konsolidovanom texte - nechavam ako neistotu, nie ako zatvorene zistenie.
5. **PROCESY: "Oznamenie o zmene zmluvy do 30 dni (§ 26 ods. 4)."** Nesedi. Zdroje k § 26 uvadzaju pri zmene zmluvy **14 dni**. Do produktu ber kratsiu lehotu, kym sa neoveri konsolidovany text.
6. **PROCESY: "sucinnost uspesneho uchadzaca do 10 pracovnych dni (§ 56 ods. 5)."** Nepresne dvojnasobne. § 56 nestanovuje lehotu "do", ale **minimalnu dlzku** lehoty, ktoru musi obstaravatel poskytnut: nie kratsiu ako 10 pracovnych dni (pri niektorych ukonoch 5 pracovnych dni). Platforma nesmie tuto lehotu modelovat ako deadline uchadzaca.
7. **SKEPTIK (kolo 1, cast stiahnuta uz v kole 2): "KEP je viazany na fyzicku osobu" ako generalne pravidlo** - odmietam aj po jeho vlastnom ustupe, pre poriadok: pecat organizacie je legalna paka v rozsahu, ktory urcuje § 23 ods. 1 zak. 305/2013 a osobitny predpis.
8. **Vsetky tvrdenia o § 117 a o zakazke s nizkou hodnotou** - institut neexistuje od 1. 8. 2024. Akakolvek vetva produktu postavena na nom je bezpredmetna.
9. **Odmietam tlak dokoncit overenie AI Actu sekundarnou cestou a vydavat ho za istotu.** Po ~9 neuspesnych pokusoch o EUR-Lex ponechavam datumy 2. 12. 2027 a 2. 8. 2028 vyslovne ako **neoverene zo sekundarnych zdrojov**. Pre produkt to nie je blokujuce, lebo vsetky dnes ucinne povinnosti (cl. 4, cl. 5, cl. 50, GPAI) platia bez ohladu na odklad Prilohy III.
