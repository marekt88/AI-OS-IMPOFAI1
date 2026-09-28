# Automatizácia verejného obstarávania na Slovensku — podklad pre návrh platformy

Stav práva a systémov k **25. 9. 2026**. Vypracované piatimi agentmi v troch kolách (nezávislá analýza, krížová kontrola, revízia). Rozpory medzi agentmi sú vypísané, nie spriemerované. Chýbajúce dáta sú označené ako medzera.

---

## 1. Zhrnutie

Automatizovať sa dá väčšina výpočtovej a dokumentačnej práce: určenie limitu a postupu, lehoty, generovanie súťažných podkladov a eForms, formálna kontrola JED, overovanie uchádzačov v registroch, zápis zmluvy do CRZ, archivácia a dôkazný balík pre námietky. Človeku musia zostať štyri až päť úkonov: vyjadrenie základnej finančnej kontroly, vylúčenie uchádzača, anonymizácia pred zverejnením, podpis zmluvy a dodatkov, plus vecné schválenie technickej špecifikácie. Najväčšia prekážka nie je právo ani AI Act, ale **chýbajúce strojové rozhrania na slovenskej strane**: IS EVO ani IS eForms ÚVO nemajú API, takže pri podlimite a nadlimite platforma pripravuje balík, ktorý človek prenesie ručne do cudzieho portálu. Plné „človek len dá pečiatku" je dnes dosiahnuteľné iba na dvoch cestách — zákazka malého rozsahu pod 50 000 EUR a EKS podľa § 109. Druhá tvrdá prekážka je § 20 ods. 1 ZVO: obstarávateľ smie na elektronickú komunikáciu použiť výlučne elektronický prostriedok zapísaný v zozname ÚVO, čo z registrácie robí nultý míľnik roadmapy.

---

## 2. Právny rámec

| Predpis | Čo upravuje | Dopad na automatizáciu | Odkaz |
|---|---|---|---|
| Zákon č. 343/2015 Z. z. o verejnom obstarávaní (ZVO), verzia účinná **2. 8. 2026 – 31. 12. 2026** | Celý životný cyklus zákazky: limity, postupy, komunikácia, podmienky účasti, kritériá, komisia, lehoty, revízne postupy, dokumentácia | Rámcový predpis. Automatizovať možno výpočty, generovanie, lehoty a odosielanie; rozhodovacie a podpisové úkony zostávajú menovaným osobám. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| **§ 20 ods. 1 + § 158a + § 158b ZVO**, vyhláška 41/2019 Z. z., vyhláška 73/2022 Z. z. | Elektronická komunikácia vo VO; použiť možno **výlučne** prostriedok zapísaný v zozname podľa § 158a; § 158b a 73/2022 určujú náležitosti žiadosti o zápis; 41/2019 technické požiadavky | **Najtvrdší právny limit projektu.** Bez zápisu nesmie platforma sprostredkovať komunikáciu vo VO. Žiadosť ide cez slovensko.sk s KEP. Právny účinok zápisu je otvorený rozpor — pozri sekciu 9. | https://www.uvo.gov.sk/otvorena-komunikacia/elektronicke-verejne-obstaravanie/zoznam-elektronickych-prostriedkov |
| § 13 ZVO — elektronická platforma | Definuje elektronickú platformu; funkcionality zabezpečuje modul elektronického trhoviska (na infraštruktúre EKS) a IS EVO | Platforma nie je jeden systém. Mapovanie rozhraní musí rozlišovať ET, IS EVO a IS eForms ÚVO. Správcom je od 1. 1. 2025 Úrad podpredsedu vlády pre plán obnovy (zák. 201/2024 Z. z.). | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| Povinné používanie elektronickej platformy **od 1. 2. 2023** (§ 108 – § 111 ZVO) | Výlučná komunikácia cez elektronickú platformu pri podlimitných zákazkách | Pri podlimite nepomôže ani zápis do zoznamu — platforma tam môže byť len nadstavbou nad ET/IS EVO. | https://www.uvo.gov.sk/aktualne-temy/aktualita/povinne-pouzivanie-elektronickej-platformy |
| Novela č. 395/2021 Z. z. (od 31. 3. 2022) | Zrušenie žiadosti o nápravu (§ 163 – 165); zavedenie § 13, § 20 vety o zapísanom prostriedku, § 158a, § 158b; inštitút odborného garanta | Revízne postupy sú dnes len námietky a konanie ÚVO (§ 169 – 175). Vetva „žiadosť o nápravu" do produktu nepatrí. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2021/395/ |
| **Zákon č. 32/2024 Z. z., čl. V (od 31. 3. 2024)** | Mení § 184b ods. 1: obstarávateľ **môže** vykonávať činnosti vo VO **aj** prostredníctvom odborného garanta | Odborný garant je **fakultatívny**, nie povinný. Nie je bariérou vstupu na trh ani nad 50 000 EUR. Sekundárne zdroje stále píšu „od 31. 3. 2024 budú povinní" — je to pasca. | https://static.slov-lex.sk/static/SK/ZZ/2024/32/20240331.html |
| **Novela č. 179/2024 Z. z. (od 1. 8. 2024)** | Zrušenie zákazky s nízkou hodnotou a § 117; zákazka malého rozsahu do 50 000 EUR mimo ZVO; jednotné podlimitné postupy; limit námietok pri stavebných prácach 1 500 000 EUR; pokuty 0,1 – 5 % | Rozhodovací strom stavaj na dvojici podlimit/nadlimit plus pásmo malého rozsahu. Vetva „nízka hodnota" a § 117 sú mŕtve. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2024/179/ |
| Novela č. 100/2026 Z. z. (body 4, 5, 7, 8, 13 – 15 od 1. 7. 2026) | § 23 ods. 3 negatívne vymedzenie konfliktu záujmov; § 40 ods. 4 – 6 doplnenie dokladov aj po lehote (2 – 5 pracovných dní); § 51 ods. 4 lehota 3 roky; § 184q – 184z kontrola | Lehoty sú strojovo sledovateľné. **Nemení § 13, § 20, § 24, § 158a ani § 158b.** Konflikt záujmov má prah bagateľnosti — pravidlo „akákoľvek historická väzba" by generovalo falošné pozitíva. | https://static.slov-lex.sk/static/SK/ZZ/2026/100/vyhlasene_znenie.html |
| Novela č. 130/2026 Z. z. (od 2. 8. 2026) | Nové § 1 ods. 13 písm. af): výnimka zo ZVO pre licencie k systémom AI, ak obstaráva verejná VŠ, verejná výskumná inštitúcia alebo SAV | Do rozhodovacieho stromu pridaj test typu obstarávateľa a predmetu. Signál, že smer regulácie je pro-AI. | https://static.slov-lex.sk/static/SK/ZZ/2026/130/vyhlasene_znenie.html |
| Zákon č. 385/2025 Z. z., čl. V (od 1. 1. 2027) | Vypúšťa § 154 ods. 5 ZVO | Vecne bezvýznamné, procesne kľúčové: **ZVO menia aj novely daňových zákonov.** Monitoring práva nesmie sledovať len novely ZVO. | https://static.slov-lex.sk/static/SK/ZZ/2025/385/vyhlasene_znenie.html |
| Vyhláška ÚVO č. 421/2025 Z. z. (od 1. 1. 2026) | Finančné limity pre nadlimitnú zákazku, koncesiu a súťaž návrhov | Limity sú parametrizovateľné a menia sa v dvojročnom cykle. Musia byť verzované s dátumom platnosti, nikdy nezadrôtované v kóde ani v promptoch. | https://static.slov-lex.sk/static/SK/ZZ/2025/421/vyhlasene_znenie.html |
| § 51 ZVO — komisia na vyhodnotenie ponúk | Kolektívny orgán, najmenej 3 členovia; členovia s právom vyhodnocovať musia mať odborné vzdelanie alebo prax k predmetu; čestné vyhlásenie **po** oboznámení sa so zoznamom uchádzačov | Nedelegovateľné na stroj. AI môže pripraviť podklad; rozhodnutie a podpis robia menované fyzické osoby. Vyhlásenia sa nesmú zbierať dopredu „na zásobu". | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| **§ 6 ods. 16 ZVO** — umelé delenie a voľba metódy PHZ | Zákaz rozdeliť zákazku **a zároveň** zákaz zvoliť spôsob určenia PHZ, ak by **výsledkom** bolo zníženie pod limit, obídenie zverejnenia alebo obídenie námietok | PHZ engine nesmie optimalizovať. Metóda musí byť zafixovaná pravidlom pred načítaním dát; systém loguje nepoužité metódy. Test je na výsledku, nie na úmysle. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| § 54 ZVO + vyhláška ÚVO 132/2016 Z. z. — elektronická aukcia | Poradie ponúk sa zostaví **automatizovaným vyhodnotením**; nepoužije sa pri intelektuálnom plnení; certifikácia aukčného systému | Jediný proces, kde zákon výslovne priznáva automatizované vyhodnotenie. Rozhodnutie o použití aukcie musí byť schválené **pred** vyhlásením. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| § 11 ZVO + zákon č. 315/2016 Z. z. o RPVS | Zákaz uzavrieť zmluvu s uchádzačom alebo subdodávateľom, ktorý má byť zapísaný v RPVS a nie je; prah subdodávateľa 30 % pri nadlimite s PHZ od 10 mil. EUR, inak 50 % | Overenie v RPVS je strojové a musí byť **blokujúcou kontrolou** pred uvoľnením zmluvy na podpis. Ideálny hard gate. | https://static.slov-lex.sk/static/SK/ZZ/2016/315/20170201.html |
| **Zákon č. 357/2015 Z. z., § 6 ods. 3 a § 7 — základná finančná kontrola** | ZFK vykonáva štatutár alebo ním určený vedúci zamestnanec **a** zamestnanec zodpovedný za rozpočet, VO alebo správu majetku; na doklade meno, priezvisko, podpis, dátum a jedno z troch predpísaných vyjadrení; **pečiatka a faksimile sú neprijateľné** | Najtvrdší ľudský uzol v celom procese, nedotknutý ani precedensom EKS. Platforma smie doklad predplniť, podpis musia vykonať dve konkrétne osoby. Platí na všetkých troch cestách. | https://www.mfsr.sk/sk/financie/audit-kontrola/faq/zakladna-financna-kontrola/ |
| **Zákon č. 305/2013 Z. z. o e-Governmente, § 23 ods. 3** | Ak predpis vyžaduje autorizáciu konkrétnou osobou alebo osobou v konkrétnom postavení → KEP s **mandátnym certifikátom** a kvalifikovanou časovou pečiatkou. Ak bez povinnosti označiť konkrétnu osobu → postačuje KEP alebo **kvalifikovaná elektronická pečať** | Dvojkoľajka, nie generálne povolenie. Určuje, koľko človeka sa dá odstrániť. **Dva limity:** vzťahuje sa len na orgán verejnej moci (sektorový obstarávateľ ako a. s. a dotovaná osoba ním nie sú) a lex specialis môže pečať zakázať. | https://mirri.gov.sk/wp-content/uploads/2019/07/Usmernenie-k-%C2%A7-23-ods.-1-pi%CC%81sm.-b-za%CC%81kona-o-e-Governmente.pdf |
| Nariadenie (EÚ) 910/2014 (eIDAS) + zákon č. 272/2016 Z. z. | KEP (fyzická osoba, čl. 25 — účinok vlastnoručného podpisu), kvalifikovaná elektronická pečať (právnická osoba, čl. 35 ods. 2 — len vyvrátiteľná domnienka integrity a pôvodu), časové pečiatky | Model oprávnení musí rozlišovať KEP osoby a pečať organizácie ako rôzne právne účinky. Dlhodobá archivácia potrebuje LTA a prepečaťovanie. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2016/272/ |
| **Zákon č. 211/2000 Z. z. § 5a + Občiansky zákonník § 47a** | Povinne zverejňovaná zmluva a anonymizácia; zmluva je účinná dňom po zverejnení; **ak nie je zverejnená do 3 mesiacov od uzavretia, platí, že zmluva nebola uzavretá** | Najvyššie právne riziko celého procesu. Odoslanie do CRZ automatizuj a 3-mesačný watchdog je povinný. Anonymizácia je naopak nezvratné rozhodnutie — ľudská brána. | https://www.crz.gov.sk/index.php?ID=114364 |
| § 24 ZVO — dokumentácia a uchovávanie | Zdokumentovanie celého priebehu vrátane podkladov k PHZ; uchovávanie **10 rokov**; rovnopis zmluvy po celú dobu trvania; pri trvaní nad 10 rokov 3 roky po skončení | Platforma musí byť dôkazný archív s nemenným auditným záznamom vytváraným **v čase úkonu**, nie rekonštruovaným. Začiatok plynutia lehoty je sporný — pozri sekciu 9. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| Zákon č. 395/2002 Z. z. o archívoch a registratúrach | Registratúrny poriadok a plán; vyraďovacie konanie; uchovávanie elektronických záznamov so zaručením autenticity, integrity a čitateľnosti | Archivácia nie je „uloženie PDF". **Likvidácia nie je funkcia timera** — o vyradení rozhoduje štátny archív. Platforma smie lehotu počítať a návrh pripraviť. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2002/395/20251015 |
| § 12 ZVO — evidencia referencií | Vyhotovenie referencie a zápis do evidencie referencií ÚVO do 30 dní od ukončenia plnenia | Automatizovateľné generovanie z dát o plnení; dodávateľ však musí mať možnosť vyjadriť sa pred vydaním. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| Smernice 2014/24/EÚ, 2014/25/EÚ, 2014/23/EÚ, 2009/81/ES | Klasické, sektorové, koncesné a obranné obstarávanie; transponované do ZVO | Relevantné hlavne cez ZVO. Sektoroví obstarávatelia a obranné zákazky majú vlastné limity a režimy — samostatné vetvy pravidiel. | https://eur-lex.europa.eu/legal-content/SK/TXT/?uri=celex%3A32009L0081 |
| Delegované nariadenia (EÚ) 2025/2150, 2025/2151, 2025/2152, 2025/2487 | Prahové hodnoty smerníc na roky **2026 – 2027**, aplikovateľné od 1. 1. 2026 | Prahy sú dvojročný cyklus a v roku 2026 **klesli**. Zákazka naplánovaná v 2025 môže v 2026 spadnúť do prísnejšieho režimu. Najbližšia zmena 1. 1. 2028. | https://eur-lex.europa.eu/eli/reg_del/2025/2152/oj/eng |
| Vykonávacie nariadenie (EÚ) 2019/1780 (eForms), v znení 2022/2303 a 2023/2884 | Štandardné formuláre na zverejňovanie oznámení; staré formuláre už nemožno použiť | eForms sú štruktúrované XML — najlepší kandidát na plnú automatizáciu **generovania a validácie**. Podanie ale ide do IS eForms ÚVO, nie priamo do TED. | https://eur-lex.europa.eu/eli/reg_impl/2019/1780 |
| Vykonávacie nariadenie (EÚ) 2016/7 (JED/ESPD) + vyhláška ÚVO 155/2016 Z. z. | Jednotný európsky dokument ako predbežná náhrada dokladov o splnení podmienok účasti | JED je strojovo čitateľný — formálna kontrola úplnosti sa dá automatizovať plne. Netreba cudziu službu, stačí zverejnená XSD. | https://www.uvo.gov.sk/zaujemca-uchadzac/jednotny-europsky-dokument-jed |
| Nariadenie (EÚ) 2016/679 (GDPR), čl. 22 a čl. 10 | Právo nebyť predmetom rozhodnutia založeného výlučne na automatizovanom spracúvaní; osobitná kategória údajov o odsúdeniach | Chráni fyzické osoby, takže pri uchádzačoch-spoločnostiach sa čl. 22 takmer neuplatní. Trafí živnostníkov, štatutárov a expertov. Potrebná DPIA a právny základ pre údaje o odsúdeniach. | https://gdpr-info.eu/art-22-gdpr/ |
| Nariadenie (EÚ) 2024/1689 (AI Act), v znení nariadenia (EÚ) 2026/1744 | Zakázané praktiky (čl. 5), AI gramotnosť (čl. 4), GPAI, **transparentnosť čl. 50 od 2. 8. 2026**; vysokorizikové systémy Prílohy III odložené | **VO nie je v Prílohe III** — platforma nie je per se vysokoriziková. Čl. 50 ods. 2: strojovo čitateľné označenie výstupov. Čl. 50 ods. 4: ľudská redakčná kontrola je **zákonná výnimka** z označovania. Dátumy odkladu neoverené v primárnom texte — pozri sekciu 10. | https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng |
| Vzorové zmluvné klauzuly EÚ pre obstarávanie AI (MCC-AI, akt. 5. 3. 2025) | Nezáväzné klauzuly pre VO systémov AI, plná a light verzia | Zákazníci prenesú povinnosti Kapitoly III (riadenie rizík, správa dát, ľudský dohľad, logovanie) **zmluvne**, aj keď zákon platformu za vysokorizikovú neoznačuje. Compliance príde cez obstarávanie, nie cez klasifikáciu. | https://public-buyers-community.ec.europa.eu/communities/procurement-ai |
| Zákon č. 69/2018 Z. z. v znení 366/2024 Z. z. (NIS2, od 1. 1. 2025) | Kybernetická bezpečnosť | Platforma obsluhujúca obstarávateľov sa s vysokou pravdepodobnosťou dostane do režimu buď ako služba, alebo ako dodávateľ prevádzkovateľa. Neoverené — pozri sekciu 10. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2018/69/ |
| Zákon č. 523/2004 Z. z. § 19, zákon č. 138/1991 Zb. § 9 ods. 2 | Hospodárnosť pri nakladaní s verejnými prostriedkami; zásady hospodárenia obcí a VÚC | Plán VO a rozpočtové krytie nie sú povinnosti zo ZVO, ale z rozpočtového práva. Uznesenie zastupiteľstva treba modelovať ako externú blokujúcu závislosť s kalendárom zasadnutí. | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2004/523/ |
| Rozhodnutie Komisie C(2019) 3452 | Korekcie pri fondoch EÚ: 5 / 10 / 25 / 100 % | Chyba AI v podmienkach účasti alebo v špecifikácii sa premení na stratu dotácie u zákazníka, nie na reklamáciu voči dodávateľovi softvéru. | https://ec.europa.eu/regional_policy/ |

---

## 3. Typy postupov a finančné limity

Prameň: **vyhláška ÚVO č. 421/2025 Z. z. z 30. 12. 2025, účinná od 1. 1. 2026**, vychádza z delegovaných nariadení Komisie platných na roky 2026 – 2027. Spodnú hranicu podlimitu určuje § 5 a § 1 ods. 14 ZVO. Všetky sumy sú **bez DPH**. **Najbližšia zmena limitov: 1. 1. 2028.** Limity do 31. 12. 2025 boli 143 000 / 221 000 / 443 000 / 5 538 000 EUR — v roku 2026 **klesli**.

| Kategória | Subjekt | Tovar / služba | Služby prílohy č. 1 | Stavebné práce | Postup / paragraf |
|---|---|---|---|---|---|
| **Zákazka malého rozsahu** | Verejný obstarávateľ § 7, obstarávateľ § 9 | < 50 000 | < 50 000 | < 50 000 | **Mimo ZVO**, § 1 ods. 14; stačí osloviť 1 subjekt, treba preukázať hospodárnosť |
| Podlimitná civilná | Verejný obstarávateľ § 7 ods. 1 písm. a) (štát) | 50 000 – 139 999,99 | 50 000 – 749 999,99 | 50 000 – 5 403 999,99 | § 108 (min. 3 subjekty), § 109 (EKS, bežne dostupné T/S), § 110 (výzva vo Vestníku); stavebné práce od 800 000 povinne § 110 |
| Podlimitná civilná | Verejný obstarávateľ § 7 ods. 1 písm. b) – e) (obec, VÚC, PO, združenie) | 50 000 – 215 999,99 | 50 000 – 749 999,99 | 50 000 – 5 403 999,99 | to isté |
| Nadlimitná civilná | Verejný obstarávateľ § 7 ods. 1 písm. a) | ≥ 140 000 | ≥ 750 000 | ≥ 5 404 000 | 2. časť ZVO: verejná súťaž § 66, užšia súťaž § 67 – 69, RKZ § 70 – 73, súťažný dialóg § 74 – 77, inovatívne partnerstvo § 78 – 80, PRK § 81 – 82, DNS § 58 – 61 |
| Nadlimitná civilná | Verejný obstarávateľ § 7 ods. 1 písm. b) – e) | ≥ 216 000 | ≥ 750 000 | ≥ 5 404 000 | to isté |
| Nadlimitná civilná | Sektorový obstarávateľ § 9 | ≥ 432 000 | ≥ 1 000 000 | ≥ 5 404 000 | § 89 kvalifikačný systém, § 91, § 92, § 94, § 96 – 98 |
| Nadlimitná, dotovaná osoba § 8 | Osoba s dotáciou > 50 % | 216 000 (služby spojené s dotovanými SP) | — | ≥ 5 404 000 | Postup podľa verejného obstarávateľa poskytujúceho dotáciu |
| Nadlimitná koncesia | Verejný obstarávateľ aj obstarávateľ | — | — | ≥ 5 404 000 (aj služby) | 2. časť, 1., 2. a 4. hlava; § 101 a nasl. |
| Podlimitná koncesia | Verejný obstarávateľ | — | — | < 5 404 000 | § 112 — voľný postup, len princípy + informácia ÚVO |
| Súťaž návrhov | § 7 ods. 1 a) / b) – e) / § 9 | ≥ 140 000 / ≥ 216 000 / ≥ 432 000 | — | — | Štvrtá časť |
| Nadlimitná obrana a bezpečnosť | Verejný obstarávateľ aj obstarávateľ | ≥ 432 000 | — | ≥ 5 404 000 | Piata časť |
| Podlimitná obrana a bezpečnosť | Verejný obstarávateľ | 300 000 – 431 999,99 | — | 800 000 – 5 403 999,99 | Piata časť (§ 5 ods. 4) |
| Zákazka podľa § 139 (obrana) | Verejný obstarávateľ | < 300 000 | — | < 800 000 | § 139 |

**Minimálne lehoty na predkladanie ponúk alebo žiadostí o účasť**

| Postup | Žiadosť o účasť | Ponuky |
|---|---|---|
| Verejná súťaž § 66 | — | 35 dní; 30 dní ak sa vyžaduje elektronické predkladanie; 15 dní pri platnom predbežnom oznámení alebo naliehavej situácii; 40 / 20 dní bez voľného prístupu k SP |
| Užšia súťaž § 67, § 69 | 30 dní; naliehavá situácia 15 dní | 30 dní; 25 dní elektronicky; 10 dní pri predbežnom oznámení alebo dohodou u § 7 ods. 1 b) – e); 35 / 15 dní bez voľného prístupu k SP |
| Rokovacie konanie so zverejnením § 70 – 73 | 30 dní; naliehavá situácia 15 dní | Určuje obstarávateľ vo výzve na konečné ponuky |
| Súťažný dialóg § 74 – 77 | 30 dní | Určuje obstarávateľ po ukončení dialógu; len kritérium najlepší pomer ceny a kvality |
| Inovatívne partnerstvo § 78 – 80 | 30 dní | Určuje obstarávateľ; len kritérium najlepší pomer ceny a kvality |
| Priame rokovacie konanie § 81 – 82 | — | Dohodou, bez vyhlásenia; možné oznámenie o zámere uzavrieť zmluvu (§ 26 ods. 6) a potom 11 dní do podpisu |
| Dynamický nákupný systém § 58 – 61 | 30 dní na zaradenie | 10 dní na konkrétnu zákazku; rámcová dohoda cez DNS max. 12 mesiacov |
| Rámcová dohoda § 83 | Podľa použitého postupu | Max. 4 roky pre verejného obstarávateľa; pri § 109 max. 12 mesiacov |
| Podlimit § 108 | — | **Zákon lehotu neurčuje — „primeraná".** Pri fondoch EÚ min. 4 pracovné dni (T/S) a 6 pracovných dní (SP) podľa Príručky k procesu a kontrole VO (neoverené v primárnom dokumente) |
| Podlimit § 109 (EKS) | — | Min. **72 hodín** od predbežnej akceptácie; lehota neplynie počas sviatkov a dní pracovného pokoja |
| Podlimit § 110 | — | **9 pracovných dní** (tovar, služby), **14 pracovných dní** (stavebné práce) |

**Ďalšie kľúčové lehoty**

| Lehota | Dĺžka | Právny základ | P-ID |
|---|---|---|---|
| Vysvetľovanie súťažných podkladov | najneskôr 6 dní pred uplynutím lehoty (zrýchlený postup 4 dni); podlimit § 108: 3 pracovné dni | § 48, § 108 ods. 8 ZVO | P08 |
| Začiatok elektronickej aukcie po odoslaní výzvy na účasť | najskôr **2 pracovné dni** | § 54 ZVO (sekundárne zdroje) | P14 |
| Zápisnica z otvárania ponúk uchádzačom | do 5 pracovných dní | § 52 ods. 3 ZVO | P11 |
| Predloženie dokladov úspešným uchádzačom | min. 5 pracovných dní | § 55 ods. 1 ZVO | P12b |
| Doplnenie chýbajúcich dokladov (**aj po lehote na ponuky**) | 2 pracovné dni elektronicky, 5 pracovných dní inak | § 40 ods. 4 ZVO (od 1. 7. 2026) | P12b |
| Vysvetlenie ponuky / mimoriadne nízkej ponuky | 2 pracovné dni elektronicky, 5 pracovných dní inak | § 53 ods. 4 ZVO | P13 |
| **Odkladná lehota na uzavretie zmluvy** | **16 dní od odoslania informácie o výsledku; pri elektronickej komunikácii najskôr 11. deň** | § 56 ods. 2 ZVO | P15, P17 |
| Súčinnosť úspešného uchádzača | **minimálna** dĺžka lehoty, nie deadline: nie kratšia ako 10 pracovných dní | § 56 ZVO | P17 |
| **Námietky** | **do 10 dní od rozhodnej udalosti** | § 170 ods. 4 ZVO | P16 |
| Kaucia pripísaná na účet ÚVO | najneskôr 2. pracovný deň po doručení námietok | § 172 ods. 1 ZVO | P16 |
| Doručenie dokumentácie kontrolovaného ÚVO | 5 pracovných dní | § 173 ods. 1 a 2 ZVO | P16 |
| Rozhodnutie ÚVO o námietkach | 30 dní | § 175 ods. 5 ZVO | P16 |
| Sprístupnenie dokumentácie pri kontrole | 7 dní | § 184s ods. 2 ZVO (100/2026) | P19 |
| Oznámenie ÚVO z ex ante posúdenia | 30 dní od doručenia dokumentov | § 168 ZVO | P06 |
| Zverejnenie zmluvy v profile | 7 pracovných dní od uzavretia | § 64 ods. 1 písm. c) ZVO | P18 |
| **Zverejnenie zmluvy v CRZ — fatálna lehota** | **3 mesiace od uzavretia; inak platí, že zmluva nebola uzavretá** | § 47a ods. 4 Občianskeho zákonníka, § 5a zák. 211/2000 | P18 |
| Oznámenie o výsledku VO do Vestníka | do 30 dní po uzavretí; pri § 110 do 14 dní | § 26 ods. 3, § 110 ZVO | P18 |
| Správa o zákazke do profilu (§ 108, § 110) | do 10 pracovných dní od zverejnenia zmluvy v CRZ alebo vystavenia objednávky | § 108 ods. 6, § 112 ods. 4 ZVO | P19 |
| Referencia do evidencie ÚVO | do 30 dní od ukončenia plnenia | § 12 ZVO | P20 |
| Suma skutočne uhradeného plnenia | 90 dní po skončení zmluvy | § 64 ods. 1 písm. d) ZVO | P20 |
| **Uchovávanie dokumentácie** | **10 rokov**; rovnopis zmluvy po celú dobu trvania; pri trvaní nad 10 rokov 3 roky po skončení | § 24 ods. 1 ZVO | P19 |

Kroky **bez zákonnej lehoty** (platforma tam nesmie generovať fiktívny termín, len konfigurovateľný interný): P01, P03, P04, P05a, P05b, P12a, vyhotovenie zápisnice v P13, lehota na ponuky pri § 108.

**Zrušené inštitúty, na ktorých nesmie stáť žiadna vetva produktu:** zákazka s nízkou hodnotou a § 117 (od 1. 8. 2024), žiadosť o nápravu a § 163 – 165 (od 31. 3. 2022), certifikovaná odborná spôsobilosť vo VO (od 18. 4. 2016).

---

## 4. API a integrácie

Kritérium: **OVERENÉ** = dokumentácia načítaná, s URL. **ZMIENKA** = existencia doložená, obsah rozhrania nie. **LEN WEB / SCRAPING** = údaj je verejný len cez HTML. **NENÁJDENÉ** = nič doložiteľné.

| Systém | Čo poskytuje | Typ prístupu | Stav overenia | Zdroj |
|---|---|---|---|---|
| TED Search API | Vyhľadávanie a hromadné stahovanie zverejnených oznámení | REST `POST /v3/notices/search` na `api.ted.europa.eu`, bez autentifikácie | **OVERENÉ** | docs.ted.europa.eu/api/latest/search.html |
| TED Validation API (CVS) | Validácia eForms XML pred podaním | REST, API kľúč | **OVERENÉ** | docs.ted.europa.eu/api/latest/ |
| TED Publication API | Odoslanie eForms oznámenia do OJ/TED | REST, API kľúč + status eSendera od Publikačného úradu | **OVERENÉ technicky, ale pre SK obstarávateľa nepoužiteľné ako náhrada Vestníka** | docs.ted.europa.eu/api/latest/ |
| TED Visualisation + Conversion API | Vykreslenie a konverzia oznámení | REST, API kľúč | **OVERENÉ** | docs.ted.europa.eu/api/latest/ |
| eForms SDK 1.15 | Schémy, kódovníky, Schematron pravidlá, `fields.json`, EFX | Špecifikácia a artefakty, nie API | **OVERENÉ** | docs.ted.europa.eu/eforms/latest/ |
| TED Open Data (ODS 1.0) | Bulk XML, CSV, Linked Open Data + SPARQL | Bulk + SPARQL, bez autentifikácie | **OVERENÉ** | docs.ted.europa.eu/ODS/latest/ |
| ESPD-EDM 4.1.0 (JED) | Dátový model a XSD pre JED — **nie je to služba** | Špecifikácia | **OVERENÉ ako model** | docs.ted.europa.eu/ESPD-EDM/latest/ |
| e-Certis | Mapovanie podmienok účasti na národné doklady | REST GET `ec.europa.eu/growth/tools-databases/ecertisrest/` | **OVERENÉ** | dokument „ECERTIS Multi-Domain Web Services REST API" v0.6, 4. 7. 2023 |
| **EKS — integračné rozhranie (modul ET)** | Opisný formulár a objednávka: `PridatOpisnyFormular`, `PodatNavrhOpisnehoFormulara`, `PridatObjednavku`, `ZmenitObjednavku`, `VyhlasitZakazku`, `VratitDetailObjednavky` | SOAP 1.2, WSDL `portal.eks.sk/API/Soap/OpisnyFormular.asmx?wsdl` a `.../Objednavka.asmx?wsdl`, test `portal.ekstest.ana.sk`; OAuth2 authorization_code (`oauth.eks.sk`), Bearer token | **OVERENÉ** (príručky EKS API v1.3 a EKS OAuth v1.2). Aktuálnosť k 2026 neoverená — dokumenty z 2018, release 3.4.3 | eks.sk/Stranka/OtazkyAOdpovede/IntegracneRozhranie |
| **IS CPDI (býv. IS CSRÚ)** | Konsolidované údaje: nedoplatky Sociálnej poisťovne, VšZP, Dôvera, Union, evidencia nelegálneho zamestnávania ÚPSVaR, daňové nedoplatky a DPH FS SR, RPO | SOAP 1.2 (`CSRU_GetConsolidatedDataService`), portál `cip.gov.sk` **len cez Govnet**; technické účty po schválení, integračná dohoda + DIZ | **OVERENÉ** (integračný manuál v1.7.2), ale **len pre orgán verejnej moci alebo iný oprávnený subjekt** | mirri.gov.sk — Centrálna dátová kancelária |
| RPO — Register právnických osôb | Identifikácia subjektu, právna forma, štatutári, spoločníci | REST JSON `api.statistics.sk/rpo/v1/` + dávkové exporty; bez autentifikácie | **OVERENÉ** (verzia v1 vs v2 nedoriešená) | rpo.minv.sk/rpo-api-doc.html |
| RPVS — Register partnerov verejného sektora | Partneri VS, koneční užívatelia výhod, verifikačné dokumenty | **OData 4.0**, Swagger `rpvs.gov.sk/opendatav2/swagger` | **OVERENÉ** (existencia a typ); konkrétne endpointy neodskúšané (`?$top=1` → HTTP 400) | justice.gov.sk — RPVS open data |
| RÚZ — Register účtovných závierok | Účtovné jednotky, závierky, výročné správy | REST JSON `registeruz.sk/api/`, bez autentifikácie, CC0 | **OVERENÉ** | registeruz.sk/cruz-public/home/api |
| Finančná správa OpenData | Daňoví dlžníci, platitelia DPH, index daňovej spoľahlivosti | REST, **API kľúč, limit 1000 req/h** | **OVERENÉ** | opendata.financnasprava.sk/page/openapi |
| CRZ — čítanie | Zverejnené zmluvy: RSS, XSD schéma, hromadné stahovanie | RSS `crz.gov.sk/data/static/rss.xml`, XSD `/schema/crz.xsd` | **OVERENÉ** | crz.gov.sk/technicka-zona/ |
| **CRZ — zápis zmluvy** | Dávkový import XML zmlúv; alternatívne pull zo servera organizácie | **Nie REST API, ale dokumentovaný dávkový kanál**; registrovaný účet, písomná žiadosť na OIES ÚV SR, plná moc | **OVERENÉ (dávkový import)** | Metodický pokyn CRZ, kap. 4 |
| Justice OpenAPI `ress-isu-service` | ~80 endpointov: znalci, súdy, rozhodnutia, exekútori, mediátori | REST, `obcan.justice.sk/pilot/api/ress-isu-service/v3/api-docs` | **OVERENÉ**, ale **register úpadcov tam nie je** | justice.gov.sk — otvorené dáta |
| Serverové podpisové komponenty ÚPVS | D.Signer-SVR/XAdES v4.0, D.Verifier-SVR/XAdES v5.0, CAdES varianty, ASiC Factory, DataValidator | Knižnice a integračné príručky na stiahnutie | **OVERENÉ**, ale určené **orgánom verejnej moci** | slovensko.sk/sk/na-stiahnutie/informacie-pre-integratorov-ap |
| SNCA — kvalifikovaná elektronická pečať | Kvalifikovaný certifikát pre pečať vydávaný **právnickej osobe alebo OVM**; kľúč na čipovej karte alebo **vo vzdialenej správe v HSM na ÚPVS** | Vydanie certifikátu + HSM | **OVERENÉ** (HSM na ÚPVS reálne pre OVM) | snca.gov.sk/kvalifikovane-sluzby/elektronicka-pecat |
| SNCA — kvalifikovaná validačná služba | Validácia podpisov a pečatí, technická špecifikácia + XSD reportu; zdarma pre OVM | Rozhranie po dohode (IP + kľúč) | **OVERENÉ** | snca.gov.sk/kvalifikovane-sluzby/validacia-podpisov-pecati |
| TSL NBÚ (dôveryhodný zoznam SR) | eIDAS trusted list: CA/QC (SNCA, SNCA2), **4× TSA/QTST** časové pečiatky | XML na URL, bez autentifikácie | **OVERENÉ** | tl.nbu.gov.sk/kca/tsl/tsl.xml |
| Komerční QTSP (Disig, NFQES, I.CA) | Kvalifikovaná pečať pre právnickú osobu; NFQES: API Signer, API DigitalSignature, Enterprise Multithread Signer — vzdialené certifikáty bez karty | Komerčné API na zmluvnom základe | **OVERENÉ, že služby existujú**; QSCD podľa EN 419 241-2 neoverené | disig.sk, nfqes.com/sk/api-riesenia |
| EC DSS | Open-source knižnica na tvorbu a validáciu XAdES/PAdES/CAdES/ASiC — nie prevádzkovaná služba | Knižnica | **OVERENÉ** | ec.europa.eu — eSignature building block |
| NKOD — data.slovensko.sk | Katalóg otvorených dát SR, metadáta DCAT-AP-SK 3.0 | SPARQL `data.slovensko.sk/api/sparql` | **OVERENÉ** (endpoint existuje; dotazy vrátili HTTP 400) | slovak-egov.atlassian.net — opendata |
| ÚPVS / slovensko.sk (G2G, eDesk, IAM, CÚD) | Elektronické doručovanie, identita, centrálne úradné doručovanie | SOAP/SkTalk; integračné manuály nie sú verejné | **ZMIENKA** | beta.slovensko.sk — integračný proces |
| ITMS2014+ | Projekty a moduly VO, prepojenie na Vestník a EKS | „Integračný manuál Open Data API ITMS2014+ v1" existuje, neotvorený | **ZMIENKA** | partnerskadohoda.gov.sk |
| Vestník VO ako otvorené dáta | Čísla Vestníka ako datasety s XML distribúciami | Dataset v NKOD | **ZMIENKA** — distribučné URL a formát sa nepodarilo načítať v troch kolách | data.slovensko.sk |
| PPDS — Public Procurement Data Space | Budúci EU dátový priestor VO, SR v prvej vlne | Technické štandardy nezverejnené | **ZMIENKA** (budúci kanál) | uvo.gov.sk aktualita 2025 |
| ÚVOstat.sk | CSV dávky: vyhlásené zákazky od 2014, výsledky Vestníka a EKS od 2016, CRZ | Bulk CSV, konto, platené tarify | **OVERENÉ, ale sekundárny komerčný agregátor** | uvostat.sk/download |

### Systémy BEZ API

| Systém | Čo sa tam nedostane strojovo | Závislosť |
|---|---|---|
| **IS EVO (evo.isepvo.sk)** | Vyhlásenie, súťažné podklady, komunikácia, príjem a otváranie ponúk, e-aukcia, zápisnice. Publikované sú len užívateľské príručky a videá. | **Najtvrdšia závislosť platformy** (P07 – P09, P11, P13, P15). Pri námietkach sa vyžiadajú auditné záznamy z elektronického prostriedku — tie vznikajú v IS EVO a platforma ich nevie vytiahnuť. |
| **IS eForms ÚVO (eforms.uvo.gov.sk)** | Podanie oznámenia do Vestníka. Len prihlasovací portál. | Kritická pre P07 a P18. Tu padol plán „vlastný eSender": eForms XML sa dá vygenerovať a zvalidovať cez TED CVS, ale prenesie ho človek. |
| **Registre ÚVO** — zoznam hospodárskych subjektov, register osôb so zákazom, evidencia referencií | Overenie zápisu v ZHS a zákazu účasti. SOAP WSDL `uvo.gov.sk/soap/webServiceBusinessman/wsdl` vracia **404** (test 25. 9. 2026). | Kritická pre P12a a P12b. Bez toho nie je automatické vyhodnotenie osobného postavenia úplné — a register osôb so zákazom vedie ÚVO a nikto iný. |
| **Register úpadcov (REPLIK)** | Konkurzy, reštrukturalizácie. Starý WSDL mŕtvy. | Stredná (P12b, P13). |
| **Zapísané elektronické prostriedky** (JOSEPHINE, ERANET, eZakazky, TENDERnet, tenderia, .NUNTIO, PLUTO, ActiveProcurement, E-BEX, eBIT, EVOSERVIS, Elenaportal, E-lena) | Celý priebeh nadlimitnej súťaže u zákazníkov, ktorí ich používajú. Žiadna verejná API dokumentácia v troch kolách. | **NENÁJDENÉ.** Vysoká pre nadlimitný segment. |
| **ORSR** | Výpisy, spoločníci, štatutári. Oficiálna cesta je RPO. | Nízka — nahraditeľné RPO. |
| **Register trestov (pre neOVM)** | Bezúhonnosť štatutárov. Pre OVM cesta cez OverSi alebo IS CPDI. | Stredná. |
| **Sociálna a zdravotné poisťovne, NIP (pre neOVM)** | Nedoplatky a nelegálne zamestnávanie — štyri samostatné scrapery. Pre OVM to celé nahrádza IS CPDI jedným rozhraním. | Stredná, ale krehká a štvornásobne udržiavaná. |

### Prístupové obmedzenia — dva integračné profily

Toto nie je technická poznámka, je to rozhodnutie o segmente.

| Kanál | Kto sa môže pripojiť |
|---|---|
| **EKS API** | Ktorýkoľvek **registrovaný používateľ EKS**, teda aj obstarávateľ. Žiadosť mailom na podporu EKS, klienta si registruje sám, aplikácia koná **v mene používateľa EKS** a ten nesie zodpovednosť za úkony. (Sporné — pozri sekciu 9.) |
| **IS CPDI, OverSi, serverové komponenty ÚPVS, HSM na ÚPVS, validačná služba SNCA zdarma** | **Len orgán verejnej moci alebo „iný oprávnený subjekt"**, cez Govnet. Komerčná SaaS platforma sa sama nepripojí. |
| **TED Publication API** | Len autorizovaný a certifikovaný eSender — typicky národné vestníky a prevádzkovatelia platforiem. |
| **Komerční QTSP** | Ktorákoľvek právnická osoba na zmluvnom základe. **Jediný plne dostupný kanál pečatenia pre neverejný subjekt.** |
| **RPO, RÚZ, CRZ čítanie, TED Search, TED ODS, e-Certis, NKOD SPARQL** | Ktokoľvek, bez autentifikácie. |
| **Finančná správa OpenData** | Ktokoľvek po získaní API kľúča, limit 1000 req/h. |

Zákazník-OVM otvára IS CPDI, OverSi, serverové komponenty ÚPVS a HSM. Zákazník mimo verejnej moci má z toho zoznamu **len komerčného QTSP** a zvyšok musí riešiť scrapingom alebo dokladmi od uchádzača. Overovacia vrstva preto potrebuje **dva zameniteľné backendy za tým istým rozhraním**.

### Podpisová a pečatiaca vrstva

Model „človek len podpíše" je technicky realizovateľný. Pre OVM cez SNCA + HSM na ÚPVS + serverové komponenty; pre súkromný subjekt cez komerčného QTSP s API. Dávkový KEP je realizovateľný cez eIDAS remote signing (jedna autorizácia podpisovateľa, N dokumentov). **Otvorené zostáva QSCD podľa EN 419 241-2** u slovenského QTSP — pred návrhom „stroj pečatí" to treba vyriešiť certifikátom zhody, nie marketingovou stránkou.

**Tri triedy autorizácie, oddelené v dátovom modeli od prvého dňa:** kvalifikovaná elektronická pečať organizácie (môže ju vytvárať stroj) → KEP konkrétnej osoby s mandátnym certifikátom (nie) → podpis základnej finančnej kontroly podľa § 7 zák. 357/2015 (nikdy).

---

## 5. Proces krok po kroku

Schéma P-ID: P05 rozdelené na **P05a** (podmienky účasti a kritériá) a **P05b** (návrh zmluvy); P12 rozdelené na **P12a** (JED, formálna kontrola úplnosti) a **P12b** (overenie v registroch). Ostatné P01 – P04, P06 – P11, P13 – P20 bez zmeny. Všetkých 20 pôvodných ID je pokrytých, žiadne nie je zlúčené ani vypustené.

### P01 — Identifikácia potreby, plán VO a rozpočtové krytie
- **Kto:** vecný gestor, správca rozpočtu alebo vedúci ekonomického útvaru, štatutárny orgán.
- **Čo robí človek:** Vecný útvar pomenuje potrebu a doloží ju rozpočtovým krytím. Ekonóm potvrdí zdroj krytia krycím listom alebo žiadankou — bez toho neprejde základná finančná kontrola. Štatutár schváli zaradenie do plánu VO.
- **Ako to zvládne AI/kód:** Kód zhlukne požiadavky podľa CPV a kalendára, navrhne agregáciu a vygeneruje verzovaný plán VO s odôvodnením ku každej položke. Automatický flag na umelé delenie zákazky (rovnaký CPV + rovnaký dodávateľ + tesne za sebou). Výstup je návrh, nie rozhodnutie o agregácii.
- **Úroveň:** **B**
- **Pečiatka:** schválenie plánu štatutárom; potvrdenie, že predmet nebol umelo delený.

### P02 — Prieskum trhu, prípravné trhové konzultácie, určenie PHZ
- **Kto:** špecialista VO, technický špecialista.
- **Čo robí človek:** Špecialista VO urobí prieskum trhu alebo PTK a zdokumentuje zdroje cien. Technik overí, či trh plnenie vie dodať. PHZ sa určí bez DPH vrátane opcií, obnovení a opakovaných plnení, so zákazom umelého delenia.
- **Ako to zvládne AI/kód:** Metóda určenia PHZ je **zafixovaná pravidlom pre triedu predmetu pred načítaním dát** — engine nesmie vyberať metódu podľa výsledku. Výpočet je reprodukovateľný, loguje použitú metódu aj nepoužité metódy s odôvodnením a upozorní, keď výsledok padne do pásma ±10 % od limitu. Zber cien z TED a CRZ je plne automatický.
- **Úroveň:** **B** (spor o zákazku malého rozsahu — pozri sekciu 9)
- **Pečiatka:** záznam o určení PHZ so zdrojmi, podpísaný zodpovednou osobou.

### P03 — Určenie finančného limitu a výber postupu
- **Kto:** špecialista VO, právnik.
- **Čo robí človek:** Špecialista VO zaradí PHZ do limitu a vyberie postup. Právnik posúdi, či sa neuplatní výnimka podľa § 1. Zvolený postup je záväzný aj keby bol možný miernejší (princíp viazanosti).
- **Ako to zvládne AI/kód:** Deterministický rules engine nad verzovanou tabuľkou limitov: PHZ + typ predmetu + typ obstarávateľa + zdroj financovania → postup, lehoty, povinnosť TED. Každé rozhodnutie nesie citáciu pravidla, verziu limitu a dátum účinnosti. Nie je to model, je to kód — preto je presnejší než referent s neaktuálnou tabuľkou.
- **Úroveň:** **A** (B pre tri vstupy: agregácia predmetu, typ obstarávateľa, výnimka zo ZVO)
- **Pečiatka:** žiadna pri rutinnom výpočte; ľudská brána len pri vetve výnimky a agregácie, s písomným odôvodnením.

### P04 — Opis predmetu zákazky, technická špecifikácia
- **Kto:** technický špecialista (projektant, IT architekt, lekár, stavbár).
- **Čo robí človek:** Technik napíše opis predmetu jednoznačne, úplne a nestranne. Odkaz na konkrétneho výrobcu je zakázaný; ak sa nedá inak, doplní sa „alebo ekvivalentný" (§ 42 ods. 3). Výnimka pre § 108 v zákone **nie je** — do platformy nepatrí ako default.
- **Ako to zvládne AI/kód:** AI generuje draft z knižnice vzorov, predchádzajúcich špecifikácií a výstupu P02; lint hľadá značky bez „alebo ekvivalent", vylučujúce parametre a neodôvodnené certifikáty. Povinný gate pred zobrazením návrhu: test „existujú aspoň traja dodávatelia schopní plniť". Ak lint neprejde, návrh sa nezobrazí ako hotový text.
- **Úroveň:** **B** — a nie z opatrnosti: špecifikácia sa zverejňuje, takže ľudská redakčná kontrola je zákonná výnimka podľa AI Act čl. 50 ods. 4.
- **Pečiatka:** vecný garant schvaľuje vetu po vete a nesie redakčnú zodpovednosť. Toto je právne najrizikovejší výstup LLM v celom procese.

### P05a — Podmienky účasti, kritériá na vyhodnotenie, rozhodnutie o použití aukcie
- **Kto:** špecialista VO.
- **Čo robí človek:** Nastaví osobné (§ 32), finančné (§ 33) a technické (§ 34) podmienky a kritériá podľa § 44. Pri § 108 a § 110 sú povinné len § 32 ods. 1 písm. e) a f). Tu sa **musí** rozhodnúť aj o použití elektronickej aukcie — uvádza sa v oznámení a nedá sa doplniť neskôr.
- **Ako to zvládne AI/kód:** Podmienky sa skladajú z parametrov P03/P04 a mapujú sa na konkrétne doklady cez e-Certis. Kritériá sa ukladajú ako **vypočítateľný vzorec s váhami, nie ako text** — bez toho neexistuje P13 ani strojová kontrola konzistencie. Generovanie `espd-request.xml` je vlastná práca nad zverejnenou XSD.
- **Úroveň:** **B** (vnútorná reprezentácia kritérií ako vzorec = A)
- **Pečiatka:** schválenie podmienok osobou s právnou kvalifikáciou; redakčná zodpovednosť za zverejnené podklady.

### P05b — Návrh zmluvy a zmluvné podmienky
- **Kto:** právnik, technický špecialista.
- **Čo robí človek:** Právnik pripraví návrh zmluvy vrátane sankcií, zmenových doložiek podľa § 18 a pravidiel subdodávok. Technik doplní harmonogram a akceptačné kritériá. Uvedú sa požiadavky na zápis subdodávateľov v RPVS.
- **Ako to zvládne AI/kód:** Zmluva sa skladá z knižnice schválených klauzúl podľa typu predmetu, zdroja financovania a postupu; AI dopisuje len variabilné časti a označuje každú neschválenú formuláciu. Všetky ceny, lehoty a množstvá sa dedia z dátového modelu, nie prepisom. Pri fondových zákazkách sa povinné klauzuly vkladajú ako nemenný blok.
- **Úroveň:** **B**
- **Pečiatka:** právne schválenie návrhu. Pri použití štátnej šablóny (VZP, vzory ÚVO) postačuje potvrdenie, že šablóna nebola zmenená.

### P06 — Základná finančná kontrola, ex ante kontrola, schválenie
- **Kto:** zamestnanec zodpovedný za rozpočet, VO alebo správu majetku **a** štatutár alebo ním určený vedúci zamestnanec; pri eurofondoch riadiaci orgán; voliteľne ÚVO.
- **Čo robí človek:** ZFK vykonávajú **dve osoby**. Na doklade musí byť meno, priezvisko, vlastnoručný podpis alebo KEP, dátum a jedno z troch predpísaných vyjadrení — **pečiatka a faksimile sú neprijateľné**. Štatutár potom schváli vyhlásenie.
- **Ako to zvládne AI/kód:** Zber podkladov, checklist úplnosti, kontrola lehôt a konzistencie PHZ vs. limit je plne automatická — stopercentné pokrytie kontrolných bodov je bezpečnejšie než preťažený referent. Samotné **vyjadrenie ZFK nesmie byť predvyplnené automatom**. Platforma smie ukázať zistenia, nie napísať vyjadrenie.
- **Úroveň:** **C** (zber podkladov a checklist = A)
- **Pečiatka:** podpis dvoch odlišných fyzických osôb s rolou, menom, dátumom a vyjadrením. **Najtvrdší uzol v celom procese a jediný, ktorý platí na všetkých troch cestách.**

### P07 — Vyhlásenie (Vestník ÚVO / TED, eForms) alebo výzva na predkladanie ponúk
- **Kto:** špecialista VO.
- **Čo robí človek:** Podá oznámenie o vyhlásení VO **do IS eForms ÚVO**; postup do Vestníka a do TED zabezpečuje ÚVO, nie obstarávateľ. Pri § 108 posiela výzvu min. 3 hospodárskym subjektom cez funkcionalitu elektronickej platformy. Pri § 110 sa výzva zverejňuje vo Vestníku.
- **Ako to zvládne AI/kód:** Kód naplní eForms XML z dátového modelu a zvaliduje ho cez TED CVS — to eliminuje najčastejšiu chybu (povinné polia, zlý CPV kód) **pred** prenosom. Do TED sa dá odosielať cez Publication API len so statusom eSendera, čo národné podanie nenahradzuje. Do IS eForms ÚVO neexistuje žiadne strojové rozhranie.
- **Úroveň:** **A pre generovanie a validáciu / C pre národné podanie**
- **Pečiatka:** explicitné schválenie odoslania + diff proti schváleným podkladom. Autorizáciu samotného oznámenia unesie pečať organizácie.

### P08 — Komunikácia, vysvetľovanie, úpravy podkladov
- **Kto:** špecialista VO, technický špecialista.
- **Čo robí človek:** Prijíma žiadosti o vysvetlenie cez zapísaný elektronický prostriedok a technik pripraví odpoveď. Vysvetlenie sa poskytuje všetkým rovnako. Ak lehotu nestihne, musí primerane predĺžiť lehotu na ponuky.
- **Ako to zvládne AI/kód:** AI triedi otázky, navrhne odpoveď s citáciou priamo do podkladov a rozhodne, či ide o vysvetlenie alebo o zmenu podkladov; pri zmene sám prepočíta lehoty a pripraví oznámenie. Zákaz auto-odpovedí v mene obstarávateľa; jedna schválená odpoveď ide všetkým naraz. Doručenie cez komunikačný modul IS EVO zostáva ručné.
- **Úroveň:** **B** (C pri prenose do IS EVO)
- **Pečiatka:** schválenie odpovede pred zverejnením, s menom zodpovednej osoby.

### P09 — Predkladanie ponúk v zapísanom elektronickom prostriedku
- **Kto:** uchádzač; na strane obstarávateľa špecialista VO.
- **Čo robí človek:** Uchádzač vloží ponuku do ET/EKS, IS EVO alebo iného **zapísaného** prostriedku. Obstarávateľ smie použiť výlučne prostriedok zapísaný v zozname ÚVO. Špecialista VO iba sleduje behy lehôt; ponuka podaná po lehote sa neotvára.
- **Ako to zvládne AI/kód:** Šifrovanie, uzamknutie k lehote a integrita ponúk sú funkciou elektronickej platformy — žiadny človek do behu nezasahuje. Pre EKS vieme metadáta objednávky prečítať, pre IS EVO neexistuje rozhranie. **Tvrdá architektonická podmienka: ponuky nesmú vstupovať do modelu, embeddingov ani logov promptov pred P11.**
- **Úroveň:** **A (proces, cudzia zásluha) / C (integrácia IS EVO)** — pozri rozpor v sekcii 9
- **Pečiatka:** žiadna. Namiesto schválenia technický zámok a log každého prístupu.

### P10 — Menovanie komisie, čestné vyhlásenia o nezaujatosti
- **Kto:** štatutárny orgán menuje; členovia komisie s odborným vzdelaním alebo praxou v predmete zákazky.
- **Čo robí človek:** Štatutár vymenuje najmenej trojčlennú komisiu. Každý člen **až po** oboznámení sa so zoznamom uchádzačov podpíše čestné vyhlásenie o nezaujatosti a bezúhonnosti. Ak počet členov klesne pod minimum, komisia sa musí doplniť.
- **Ako to zvládne AI/kód:** Kód navrhne členov z registra rolí, vygeneruje menovací dekrét a predvyplnené vyhlásenia a **automaticky otestuje len korporátnu väzbu** (štatutár, spoločník, KÚV) cez RPO, RPVS a RÚZ. Zamestnanecký vzťah člena komisie u uchádzača za posledné 3 roky **nevedie žiadny register** — táto časť zostane vyhlásením človeka. Ruleset musí zohľadniť prah bagateľnosti podľa § 23 ods. 3, inak generuje falošné pozitíva.
- **Úroveň:** **B**
- **Pečiatka:** menovanie podpisuje štatutár; každý člen osobne podpisuje vyhlásenie KEP. Vyhlásenia sa nesmú zbierať dopredu.

### P11 — Otváranie ponúk
- **Kto:** komisia, špecialista VO.
- **Čo robí človek:** Komisia otvorí ponuky v čase uvedenom v oznámení. Zverejní počet ponúk a návrhy na plnenie kritérií vyjadriteľné číslom; ostatné údaje nie. Pri použití aukcie a pri DNS je otváranie neverejné a zápisnica sa neposiela.
- **Ako to zvládne AI/kód:** Odomknutie presne k lehote a kvalifikovaná časová pečiatka pri každom zápise — bez nej sa nedá preukázať, že sa neotváralo skôr. Zápisnica z otvárania je ale úkon komisie (§ 52), nie výstup systému, a musí sa odoslať uchádzačom do 5 pracovných dní.
- **Úroveň:** **B** (C pri vyčítaní z IS EVO)
- **Pečiatka:** zápisnicu autorizuje komisia.

### P12a — Predbežné nahradenie dokladov (JED alebo čestné vyhlásenie)
- **Kto:** špecialista VO.
- **Čo robí človek:** Prijme JED podľa § 39 alebo čestné vyhlásenie a skontroluje úplnosť. Doklady sa nevyžadujú od všetkých, len od uchádzača na prvom mieste. Pri § 110 je JED alebo čestné vyhlásenie výslovne prípustné.
- **Ako to zvládne AI/kód:** JED sa číta a generuje ako XML podľa zverejnenej ESPD-EDM XSD, takže odpovede uchádzača sa mapujú priamo na podmienky účasti — **bez OCR a bez cudzej integrácie**. Formálna kontrola úplnosti je čisto deterministická. To, že JED nie je služba, úroveň tohto kroku **zvyšuje**: stačí schéma, netreba API.
- **Úroveň:** **A**
- **Pečiatka:** žiadna. Len pravidlo, že výsledok kontroly je „na overenie", nikdy nie „vylúčiť".

### P12b — Overenie podmienok účasti v registroch, doplňovanie dokladov
- **Kto:** špecialista VO, právnik; rozhodnutie o vylúčení komisia.
- **Čo robí človek:** Vyzve úspešného uchádzača na predloženie dokladov a overí ich v registroch. Ak doklady chýbajú alebo sú neúplné, môže písomne požiadať o doplnenie **aj po lehote na ponuky** (§ 40 ods. 4 od 1. 7. 2026). Pri dôvode na vylúčenie vydá rozhodnutie s odôvodnením.
- **Ako to zvládne AI/kód:** Pre obstarávateľa, ktorý je OVM, sa § 32 overí bez jediného scrapera cez IS CPDI: sociálne a zdravotné nedoplatky, daňové nedoplatky, nelegálna práca, RPO; register trestov cez OverSi. **Registre ÚVO sú však len web** — SOAP URL vracia 404. Rozhodnutie o vylúčení nesmie byť predvolená akcia systému.
- **Úroveň:** **B** (A pre overovanie u OVM, C pre registre ÚVO a pre rozhodnutie o vylúčení)
- **Pečiatka:** rozhodnutie komisie o vylúčení s písomným odôvodnením, po výzve na vysvetlenie. Falošná pozitívna zhoda na mene by vylúčila nevinného uchádzača; údaje o odsúdeniach sú pod GDPR čl. 10 a vyžadujú DPIA.

### P13 — Vyhodnotenie ponúk, mimoriadne nízka ponuka, vysvetlenia
- **Kto:** komisia (člen s odbornosťou v predmete), technický špecialista, ekonóm.
- **Čo robí človek:** Komisia neverejne posúdi splnenie požiadaviek na predmet a zloženie zábezpeky. Pri nejasnostiach písomne žiada vysvetlenie; vysvetlením sa ponuka nesmie zmeniť. Pri mimoriadne nízkej ponuke žiada odôvodnenie nákladov, technického riešenia, dodržania pracovného práva a povinností voči subdodávateľom.
- **Ako to zvládne AI/kód:** Cenové a merateľné kritériá počíta kód deterministicky zo vzorca zverejneného vopred — to je aritmetika, nie úsudok. Štatistika nad ponukami a historickými cenami označí mimoriadne nízku ponuku a vygeneruje žiadosť o vysvetlenie s konkrétnymi položkami. Kvalitatívne kritériá sú úsudok komisie a bodovanie nesmie byť jediným výstupom modelu.
- **Úroveň:** **A pre cenové a merateľné kritériá / C pre kvalitatívne**
- **Pečiatka:** komisia hlasuje a odôvodňuje kvalitatívne kritériá vlastným textom. Zistenie mimoriadne nízkej ponuky samo nie je dôvodom na vylúčenie — povinný záznam o vyžiadaní a vyhodnotení vysvetlenia.

### P14 — Elektronická aukcia
- **Kto:** špecialista VO, technický špecialista.
- **Čo robí človek:** Nastaví aukčnú sieň v zapísanom prostriedku a odošle výzvu na účasť všetkým nevylúčeným uchádzačom. Aukcia sa použije len ak sa dajú presne určiť technické požiadavky; nepoužije sa pri intelektuálnych plneniach. Rozhodnutie o použití aukcie muselo byť schválené už v P05a.
- **Ako to zvládne AI/kód:** Aukcia je **zo zákona** opakovaný automatický proces prijímania nových cien a prepočtu poradia (§ 54) — zásah človeka počas jej behu je nezákonný, nie nežiaduci. Platforma k nej ale nemá rozhranie: v BPMN príručky EKS je e-aukcia proces bez pripojenej API služby a pre IS EVO ani certifikované systémy neexistuje verejná dokumentácia. Nastavenie pravidiel a prevzatie protokolu je preto dnes ručné.
- **Úroveň:** **A (beh, cudzia zásluha) / C (integrácia)**
- **Pečiatka:** vzorec zafixovaný a autorizovaný pred aukciou; **zámok 2 pracovné dni** medzi výzvou a startom; žiadna intervencia v priebehu.

### P15 — Zápisnice, informovanie uchádzačov o výsledku
- **Kto:** špecialista VO; zápisnice autorizuje komisia.
- **Čo robí človek:** Odošle všetkým dotknutým uchádzačom informáciu o výsledku vrátane poradia a lehoty na námietky. Neúspešnému uvedie dôvody neprijatia ponuky. Súčasne zverejní informáciu v profile.
- **Ako to zvládne AI/kód:** Zápisnice sa **generujú z eventlogu**, nie voľne písané modelom — žiadne prepisovanie tých istých čísel druhý raz. Oznámenia sa generujú per uchádzač s personalizovaným odôvodnením a lehoty na ďalšie úkony sa nastavia samy. Rozosielanie cez IS EVO zostáva ručné.
- **Úroveň:** **B** (C pri rozosielaní cez IS EVO)
- **Pečiatka:** zápisnicu autorizujú členovia komisie KEP; odôvodnenie výsledku nesmie nesť len pečať organizácie. AI-generovaná zápisnica, ktorá opíše priebeh inak, než sa stal, je pred ÚVO fatálna.

### P16 — Revízne postupy: námietky a preskúmanie úkonov
- **Kto:** uchádzač alebo záujemca; na strane obstarávateľa právnik a špecialista VO.
- **Čo robí človek:** Uchádzač podáva námietky priamo ÚVO a kontrolovanému — **žiadosť o nápravu už neexistuje**. Kontrolovaný musí poslať vyjadrenie a kompletnú dokumentáciu vrátane auditných záznamov o všetkých úkonoch v elektronickom prostriedku. Nesplnenie lehoty znamená, že úrad na vyjadrenie neprihliada.
- **Ako to zvládne AI/kód:** Platforma zostaví časovú os úkonov, vyexportuje nemenný auditný záznam a pripraví dôkazový balík — to je najcennejšia časť, lebo § 173 ods. 2 vyžaduje auditné záznamy do 5 pracovných dní. Právna argumentácia a strategia sú ľudské. Automatizuje sa pripravenosť, nie rozhodovanie.
- **Úroveň:** **C** (dôkazový balík z eventlogu = A)
- **Pečiatka:** celé vyjadrenie a strategia: právnik a štatutár. Dôkazy predložené po lehote na námietky ÚVO **neberie na zreteľ** (§ 172) — auditný záznam musí vznikať v čase úkonu, nie byť rekonštruovaný.
- **Neuplatní sa** pri § 108 a § 109; pri § 110 len pri stavebných prácach nad 1 500 000 EUR.

### P17 — Súčinnosť, overenie RPVS, uzavretie zmluvy
- **Kto:** špecialista VO, právnik, štatutárny orgán.
- **Čo robí človek:** Overí zápis uchádzača a jeho subdodávateľov v RPVS a či konečným užívateľom výhod nie je štátny funkcionár. Právnik finalizuje zmluvu, štatutár ju autorizuje KEP s mandátnym certifikátom. Ak uchádzač neposkytne súčinnosť, postúpi sa na ďalšieho v poradí.
- **Ako to zvládne AI/kód:** Kód overí zápis víťaza v RPVS v deň podpisu a **zablokuje podpisové kolečko pri nezápise** — to je hard gate, nie notifikácia. Zmluva sa vygeneruje zo schváleného návrhu P05b a výsledku P13, bez ručného prepisovania cien a lehôt. Overenie musí mať časový odtlačok a uloženú snímku registra.
- **Úroveň:** **B**
- **Pečiatka:** KEP štatutára — pečať organizácie tu nepostačuje. **Dva tvrdé zámky:** nedovoliť podpis pred uplynutím 11./16. dňa a pred overením RPVS.

### P18 — Zverejnenie zmluvy a oznámenia o výsledku
- **Kto:** špecialista VO, administratívny pracovník.
- **Čo robí človek:** Zverejní zmluvu v CRZ alebo na webe a v profile a podá oznámenie o výsledku do IS eForms. Anonymizuje zmluvu pred zverejnením. Súhrnná správa sa podáva len pri zákazkách zadaných s výnimkou podľa § 1 ods. 2 až 13, **nie pri zákazke malého rozsahu**.
- **Ako to zvládne AI/kód:** Zápis do CRZ je plne automatický a automatizácia je tu **bezpečnejšia než človek**: nezverejnená zmluva do 3 mesiacov od uzavretia sa považuje za neuzavretú. Kanál je dávkový XML import, nie REST API. Anonymizácia je nové nezvratné rozhodnutie o rozsahu ochrany, nie lint; národný Vestník strojový kanál nemá.
- **Úroveň:** **A pre odoslanie do CRZ a TED / B pre anonymizáciu / C pre národný Vestník**
- **Pečiatka:** ľudská brána pri anonymizácii — dvojkrokový náhľad s možnosťou zablokovať zverejnenie. Odoslanie samo unesie pečať organizácie. **3-mesačný watchdog je najlacnejšia funkcia s najvyššou hodnotou.**

### P19 — Správa o zákazke, dokumentácia, archivácia
- **Kto:** špecialista VO, archivár; pri vyradení štátny archív.
- **Čo robí človek:** Vypracuje písomnú správu o zákazke vrátane zisteného konfliktu záujmov a prijatých opatrení. Kompletná dokumentácia sa eviduje tak, aby bol celý priebeh preskúmateľný bez ohľadu na použitý prostriedok komunikácie. Podá návrh na vyradenie registratúrnych záznamov.
- **Ako to zvládne AI/kód:** Archivácia, hashovanie, kvalifikované časové pečiatky, LTA prepečaťovanie a výpočet retencie sú plne automatické — nie je tam žiadny úsudok. Správa o zákazke sa zostaví z eventlogu. **Likvidácia nie je funkcia timera**: o vyradení rozhoduje štátny archív, platforma smie lehotu počítať a návrh pripraviť.
- **Úroveň:** **B** (archivácia = A, likvidácia = C)
- **Pečiatka:** schválenie správy o zákazke; rozhodnutie štátneho archívu pri vyradení. Platforma **nemá mať tlačidlo „zmazať"**.

### P20 — Plnenie zmluvy, zmeny zmluvy, hodnotenie dodávateľa
- **Kto:** vecný gestor (manažér zmluvy), právnik, špecialista VO.
- **Čo robí človek:** Kontroluje plnenie a preberacie protokoly. Právnik posúdi, či zmena zmluvy je prípustná podľa § 18 alebo vyžaduje nové VO. Špecialista VO vyhotoví referenciu do evidencie referencií ÚVO.
- **Ako to zvládne AI/kód:** Faktúry a dodávky sa párujú na zmluvné položky automaticky a systém hlási prekročenie objemu, lehôt a cien. Pri návrhu zmeny AI otestuje, či zmena nevyžaduje nové VO, a pripraví modifikačné oznámenie v eForms — test je návrh, rozhodnutie o prípustnosti nie. Referencia sa generuje z dát o plnení.
- **Úroveň:** **B**
- **Pečiatka:** právne posúdenie každého dodatku a podpis. Dodávateľ musí mať možnosť vyjadriť sa pred vydaním referencie — automatické negatívne hodnotenie bez kontradiktórnosti je zásah do práv.

### Cesta cez EKS / elektronické trhovisko (§ 109)

Používa sa **len pre bežne dostupné tovary a služby v podlimite** (§ 2 ods. 5). Koncesiu zadať nemožno, rámcová dohoda max. 12 mesiacov.

| Krok | Čo sa deje | Kto | P-ID |
|---|---|---|---|
| 1. Registrácia | Obstarávateľ sa registruje na platforme. Zápis dodávateľa do ZHS je dobrovoľný spôsob nahradenia dokladov, nie podmienka účasti. | Administrátor subjektu | P01 |
| 2. Test bežnej dostupnosti | Špecialista VO zdokumentuje, že predmet je bežne dostupný. **Toto je právna kvalifikácia postupu, nie katalógový atribút.** | Špecialista VO | P02, P03 |
| 3a. Vstup z katalógu | Predbežná akceptácia najnižšej zverejnenej ponuky; podmienkou sú min. 3 zverejnené ponuky na rovnaký alebo ekvivalentný predmet. | Špecialista VO | P07, P09 |
| 3b. Vstup z knižnice | Zverejnenie opisného formulára s dopytom; formulár ide do karantény na 48 hodín, počas ktorej možno podať rozpor. | Špecialista VO, technik | P04, P07, P08 |
| 4. Notifikácie a súťaž | Registrovaní dodávatelia predkladajú ponuky v lehote min. 72 hodín; prebieha automatická aukcia s bezvýznamovým identifikátorom uchádzača. | Systém | P09, P14 |
| 5. Akceptácia | Po uplynutí lehoty systém akceptuje ponuku s najnižšou cenou; akceptácia je prejav vôle uzavrieť zmluvu. | Systém | P13, P15, P17 |
| 6. Zmluva a zverejnenie | Zmluva vzniká akceptáciou, systém ju generuje **„bez možnosti ľudského zásahu"** zo zadania, víťaznej ponuky a VZP; posiela sa do CRZ. **3-mesačná lehota § 47a ods. 4 OZ platí aj tu.** | Systém, správca platformy | P18 |
| 7. Referencia a archív | Referencia do 30 dní od ukončenia plnenia; dokumentácia 10 rokov. | Špecialista VO | P19, P20 |

**Úroveň: A.** Toto je jediné miesto, kde je plná automatizácia podložená zápisovými API službami (`PridatOpisnyFormular`, `PridatObjednavku`, `VyhlasitZakazku`). Predkladanie kontraktačných ponúk a aukcia bežia vnútri EKS bez pripojenej API služby — platforma ich neriadi, len prečíta výsledok.

**Pečiatka:** ľudské potvrdenie bežnej dostupnosti + schválenie objednávkového formulára + ZFK **pred** zadaním. Vôľa je vyjadrená vopred — zmluvu v momente vzniku nepodpisuje nikto. Vzor „človek schvaľuje pravidlo, stroj vykonáva" tu funguje, pretože sú splnené **štyri podmienky naraz**: predmet je bežne dostupný, kritériom je výlučne cena, zmluvné podmienky sú štátom predpísané (VZP) a zadanie prešlo ľudským schválením a ZFK. Vytiahnite ktorúkoľvek z nich a vzor sa neprenesie.

**Odpadajú:** P10 (komisia sa nezriaďuje), P11 (otváranie ponúk nie je), P12a a P12b (osobné postavenie je pokryté registráciou), P16 (námietky nemožno podať).

### Cesta zákazky malého rozsahu (§ 1 ods. 14, pod 50 000 EUR)

„Mimo ZVO" neznamená „bez práva": platí zákon 357/2015 (ZFK s podpisom dvoch osôb), 211/2000 + § 47a OZ (zverejnenie, 3-mesačná fatálna lehota), 523/2004 (hospodárnosť) a GDPR. Je to najnižšie **procesné** riziko, nie najnižšie právne riziko.

| Krok | Čo sa deje | Kto | Právny základ / lehota | P-ID |
|---|---|---|---|---|
| 1 | Určenie hodnoty vrátane opakovaných nákupov rovnakého predmetu — zákaz umelého delenia | Špecialista VO | § 1 ods. 14, § 6 ods. 16 ZVO; bez lehoty | P02, P03 |
| 2 | Preukázanie hospodárnosti: prieskum trhu, benchmark, cenník | Špecialista VO, vecný gestor | § 19 zák. 523/2004; bez lehoty | P02 |
| 3 | Oslovenie 1 alebo viac subjektov podľa internej smernice; ZVO postup nepredpisuje | Vecný gestor | Interná smernica | P07, P09 |
| 4 | Základná finančná kontrola a schválenie objednávky alebo zmluvy | Zamestnanec pre rozpočet/VO + štatutár | § 6 ods. 3 a § 7 zák. 357/2015; pred vznikom záväzku | P06 |
| 5 | Zverejnenie objednávky alebo zmluvy. **Súhrnná správa podľa § 10 ods. 10 sa na ZMR nevzťahuje.** | Administratívny pracovník | § 5a zák. 211/2000; **3 mesiace** podľa § 47a ods. 4 OZ | P18 |
| 6 | Dokumentácia a archivácia podľa internej smernice | Špecialista VO | Interná smernica + zák. 395/2002 | P19 |

**Úroveň: A.** ZVO sa nevzťahuje, takže nedopadá § 20 ani zápis do zoznamu elektronických prostriedkov, ani odborný garant. Celá cesta ide jedným tlačidlom: PHZ z historických dát, štruktúrovaná výzva vybraným dodávateľom, strojové porovnanie ponúk, vygenerovaná objednávka a zverejnenie v CRZ. Spis vzniká sám ako vedľajší produkt, vrátane watchdogu na kumulatívny limit.

**Pečiatka:** ZFK pred každým výdajom (podpis dvoch osôb) — jeden uzol na konci. Plus automatický test umelého delenia nad históriou nákupov rovnakého druhu; § 6 ods. 16 je práve to, čo rozhoduje, či nákup zostane mimo ZVO.

### Kde obstarávateľ reálne klikne

| Typ zákazky | Systém, v ktorom sa vedie postup | Systém na zverejnenie | Poznámka pre platformu |
|---|---|---|---|
| Zákazka malého rozsahu (< 50 000) | Voliteľne čokoľvek, aj e-mail | CRZ alebo web, žiadne oznámenie | **Jediná zóna, kde platforma môže byť samostatným kanálom bez zápisu** |
| Podlimit § 108 (3 subjekty) | **IS EVO** — povinne | Výzva sa nezverejňuje; správa o zákazke do profilu | Platforma môže byť len nadstavba |
| Podlimit § 109 (bežne dostupné T/S) | **ET / EKS** — povinne | CRZ zabezpečí správca platformy | EKS má SOAP API; aukcia a ponuky API nemajú |
| Podlimit § 110 (výzva vo Vestníku) | **IS EVO** — povinne | IS eForms ÚVO → Vestník VO | IS eForms nemá API — podanie je ručné |
| **Nadlimit** | **IS EVO alebo iný zapísaný elektronický prostriedok** — konkrétne IS EVO povinné **nie je** | IS eForms ÚVO → Vestník VO → TED | Najväčší trh; podmienkou vstupu je zápis do zoznamu. Integračne najhorší segment. |

---

## 6. Kde musí zostať človek

Minimum „pečiatok" platformy, zoradené podľa **tvrdosti dôkazu**.

**Trieda 1 — doslovne alebo takmer doslovne overené, neprelomiteľné**

1. **Vyjadrenie a podpis základnej finančnej kontroly** — § 6 ods. 3 a § 7 zák. 357/2015. Dve odlišné osoby, meno, podpis, dátum, jedno z troch predpísaných vyjadrení; **pečiatka a faksimile výslovne neprípustné**. Nedotknuté ani precedensom EKS. **Jediný úkon, ktorý platí na všetkých troch cestách.**
2. **Autorizácia úkonu, ktorý osobitný predpis pripisuje konkrétnej osobe alebo osobe v konkrétnom postavení** — KEP s mandátnym certifikátom a kvalifikovanou časovou pečiatkou, § 23 ods. 3 zák. 305/2013. Kde predpis konkrétnu osobu nevyžaduje, pečať organizácie postačuje a stroj ju môže vytvárať.
3. **Zafixovanie metódy určenia PHZ pred výpočtom** — § 6 ods. 16 ZVO. Test je na výsledku, nie na úmysle.

**Trieda 2 — overené v substancii, číslo odseku nie vždy doslovne**

4. **Čestné vyhlásenie člena komisie o konflikte záujmov** po oboznámení sa so zoznamom uchádzačov (§ 51 ZVO). Osobný úkon, pečať ho neunesie.
5. **Rozhodnutie o vylúčení uchádzača** a odôvodnenie výsledku (§ 40, § 53, § 55 ZVO). Pripísateľnosť konkrétnej osobe je podstatou preskúmateľnosti.
6. **Anonymizácia pred zverejnením zmluvy** (§ 5a ods. 4 zák. 211/2000 + GDPR). Nezvratné.
7. **Likvidácia dokumentácie** — rozhoduje štátny archív vo vyraďovacom konaní (395/2002), nie timer.
8. **Právne posúdenie dodatku k zmluve** (§ 18 ZVO).
9. **Kvalifikácia „bežne dostupný tovar alebo služba"** pred vstupom do EKS (§ 2 ods. 5 ZVO).
10. **Uzavretie a podpis zmluvy** — KEP štatutára alebo splnomocnenca (§ 56 ZVO). Výnimka: EKS, kde zmluva vzniká automaticky zo zadania schváleného vopred.
11. **Vyhodnotenie ponúk a zápisnice komisie** — komisia je kolektívny orgán min. 3 osôb (§ 51, § 53).
12. **Posúdenie mimoriadne nízkej ponuky** (§ 53) — hodnotiaci súd, nie výpočet.

**Trieda 3 — riadenie rizika, nie zákonný príkaz**

13. Schválenie technickej špecifikácie vecným garantom — § 42 zakazuje výsledok, nepredpisuje proces schvaľovania. Ale je to právne najrizikovejší výstup LLM a po AI Act čl. 50 ods. 4 nesie redakčnú zodpovednosť schvaľovateľ.
14. Schválenie vysvetlenia súťažných podkladov pred odoslaním (§ 48).
15. Ľudská brána pri vetve výnimky zo ZVO a agregácie predmetu (§ 1 ods. 13, § 6 ods. 16).
16. Úkony odborného garanta, **ak ho obstarávateľ použije** — od 31. 3. 2024 fakultatívne. Platforma ho nemôže nahradiť, ale ani nie je povinná; interné smernice a riadiace orgány pri fondoch ho však často vyžadujú.

**Čo z minima pečiatok vypadlo** oproti prvému kolu: úkony odborného garanta ako povinnosť, rutinné potvrdzovanie zvoleného postupu (P03), schvaľovanie pri predkladaní ponúk (P09), otváraní (P11), aukcii (P14), odosielaní zverejnení (P18) a zostavovaní správy (P19). **Predajný slub teda nie je „nepotrebujete VO špecialistu", ale „váš človek podpisuje štyri veci namiesto štyridsiatich."**

---

## 7. Návrh modulov platformy

| Modul | Čo robí | P-ID | Integrácie |
|---|---|---|---|
| **1. Ruleset postupov a limitov** | Verzovaná tabuľka limitov s dátumom platnosti; rozhodovací strom PHZ × typ predmetu × typ obstarávateľa × zdroj financovania → postup, lehoty, povinnosť TED. Každé rozhodnutie nesie citáciu pravidla a verziu. Zákazka sa „zamrazí" na znenie platné v čase začatia postupu. | P03, P02 | Žiadna cudzia — vlastný dátový registr. Monitoring musí sledovať aj novely mimo VO (zák. 385/2025). |
| **2. Lehotový a termínový engine** | Všetky zákonné lehoty z tabuľky v sekcii 3 vrátane kalendára štátnych sviatkov (§ 109 — lehota počas nich neplynie) a rozlišovania dní vs. pracovných dní. Tvrdé zámky: 11/16 dní pred podpisom, 2 pracovné dni pred aukciou, 3-mesačný CRZ watchdog. | P07 – P20 | Žiadna. Najlacnejší modul s najvyššou hodnotou. |
| **3. Generátor súťažných podkladov a zmlúv** | Knižnica schválených vzorov a klauzúl; AI dopisuje variabilné časti a označuje neschválené formulácie. Lint na diskriminačnú špecifikáciu (chýbajúce „alebo ekvivalentný", značky, neoveriteľné normy, test 3 dodávateľov). Kritériá ako vypočítateľný vzorec, nie text. | P04, P05a, P05b | e-Certis (OVERENÉ), eForms SDK `fields.json`, ESPD-EDM XSD. Vlastná verzovaná knižnica. |
| **4. Overovač uchádzačov** | Dva zameniteľné backendy za jedným rozhraním: **profil OVM** (IS CPDI + OverSi) a **profil neOVM** (RPO, RPVS, RÚZ, FS OpenData + scraping registrov ÚVO a poisťovní). Každé overenie nesie dátum platnosti údaja. RPVS ako blokujúca kontrola pred podpisom. Vylúčenie nikdy nie je predvolená akcia. | P12a, P12b, P17 | IS CPDI (OVERENÉ, len OVM), RPO, RPVS OData, RÚZ, FS OpenData (OVERENÉ); registre ÚVO, REPLIK, poisťovne (scraping). |
| **5. eForms generátor a validátor** | Naplnenie eForms XML z dátového modelu, validácia cez TED CVS pred prenosom, diff proti schváleným podkladom, „balík na prenesenie" pre IS eForms. TED API zostáva v produkte ako **lint, nie ako kanál**. | P07, P15, P18 | TED Validation, Visualisation a Search API (OVERENÉ), eForms SDK. IS eForms ÚVO **bez API** — prenos ručný. |
| **6. EKS konektor** | Jediná end-to-end automatizovaná cesta: opisný formulár, objednávka, `VyhlasitZakazku()`, čítanie výsledku. Nezvratné úkony vždy s vlastnou potvrdzovacou obrazovkou. | P02, P07, P09, P17, P18, P20 | EKS SOAP 1.2 + OAuth2 (OVERENÉ, dokumentácia z 2018 — aktuálnosť potvrdiť). |
| **7. Zverejňovací modul a CRZ watchdog** | Dávkový XML import do CRZ, zverejnenie v profile, sledovanie 3-mesačnej fatálnej lehoty. Dvojkrokový anonymizačný náhľad s možnosťou zablokovať zverejnenie. | P18 | CRZ dávkový import (OVERENÉ), profil obstarávateľa. |
| **8. Podpisová a pečatiaca vrstva** | Tri oddelené triedy autorizácie: strojová pečať organizácie / KEP osoby s mandátnym certifikátom / podpis ZFK (nikdy strojový). Dávkový KEP cez remote signing. LTA prepečaťovanie pre 10-ročnú retenciu. | P06, P07, P15, P17, P18, P19 | SNCA pečať + HSM na ÚPVS (OVM), komerčný QTSP s API (neOVM), TSL NBÚ časové pečiatky, EC DSS, D.Signer-SVR (OVM). |
| **9. Auditná a dôkazná vrstva** | Pre každý AI-asistovaný úkon: verzia modelu, systémový prompt, vstupy, výstup, identita schvaľovateľa, čas s kvalifikovanou časovou pečiatkou a **diff medzi návrhom AI a finálnym textom**. Export dôkazového balíka do 5 pracovných dní. WORM úložisko. Metrika rizika je podiel prípadov, kde človek nič nezmenil. | P16, P19, všetky | Vlastné. Toto je produkt, nie logovanie. Keď väčšina úkonov vzniká v cudzom systéme bez API, platforma musí každý prenos zaznamenať sama: snapshot zdroja, časová značka, kto potvrdil. |
| **10. Konfigurácia organizácie a model rolí** | Interná smernica o VO ako konfiguračná vrstva: limity pre malý rozsah, počet oslovených subjektov, kto schvaľuje ktorú sumu, či sa zriaďuje komisia aj tam, kde ju zákon nepýta. Model rolí oddelený od modelu osôb, s delegovaním od-do na konkrétnu zákazku. Kalendár zasadnutí zastupiteľstva ako externá blokujúca závislosť. | P01, P06, P10, P17 | Ekonomický a rozpočtový systém obstarávateľa (**neoverený terén** — bez neho P01, P02 a P20 stoja na manuálnom vstupe). |

---

## 8. Riziká

**Právne**
- **Zápis do zoznamu elektronických prostriedkov** (§ 20 + § 158a/§ 158b) je podmienka elektronickej komunikácie vo VO. Bez neho je platforma použiteľná len pod 50 000 EUR — je to prvý míľnik roadmapy, nie riziko na konci.
- **3-mesačná fatálna lehota na zverejnenie zmluvy** (§ 47a ods. 4 OZ). Bez watchdogu môže platforma vyrobiť zmluvu, ktorá sa zo zákona považuje za neuzavretú.
- **Diskriminačná technická špecifikácia** je najčastejší dôvod námietok a korekcií. AI generovaná z jedného produktového datasheetu vytvorí skrytý odkaz na výrobok; halucinované normy a certifikáty.
- **Optimalizujúci PHZ engine je nezákonný už svojím návrhom** (§ 6 ods. 16). Nikdy nezobrazovať „metóda A dá 48 000, metóda B dá 52 000" — to je dôkaz proti zákazníkovi.
- **Dôkazné bremeno je časovo uzavreté** (§ 172): dôkazy predložené po lehote na námietky ÚVO neberie na zreteľ. Auditný záznam musí existovať v čase úkonu.
- **Verzovanie práva.** ZVO sa v roku 2026 menil trikrat a ďalšia verzia je od 1. 1. 2027 — zavedená novelou zákona o DPH. Limity a lehoty nesmú byť hardcoded v kóde ani v promptoch.

**AI Act**
- **VO nie je v Prílohe III**, platforma nie je per se vysokoriziková; povinnosti Prílohy III sú odložené (dátum neoverený v primárnom texte).
- **Čl. 50 ods. 2 platí od 2. 8. 2026:** výstupy generujúce syntetický obsah musia byť označené **strojovo čitateľne**. Pokuta až 15 mil. EUR alebo 3 % obratu.
- **Čl. 50 ods. 4 obracia ekonomiku návrhu:** ľudská redakčná kontrola je **zákonná výnimka** z označovania AI-generovaného verejného textu. Pri každom zverejňovanom dokumente VO je preto úroveň B právne výhodnejšia než A.
- **MCC-AI: compliance príde cez obstarávanie, nie cez klasifikáciu.** Zákazníci prenesú povinnosti Kapitoly III zmluvne. Čím viac krokov má platforma na úrovni A, tým drahšia je jej vlastná zmluvná pozícia.
- **Riziko preklopenia do Prílohy III** vzniká, ak by AI hodnotila fyzické osoby (odbornú kvalifikáciu expertov, životopisy) — to môže spadnúť pod bod 4 Prílohy III (zamestnanosť). Držať oddelene a bez automatického rozhodovania.

**GDPR**
- Chráni fyzické osoby, takže pri uchádzačoch-spoločnostiach sa čl. 22 takmer neuplatní. Trafí živnostníkov, štatutárov a kľúčových expertov.
- **Údaje o odsúdeniach sú pod čl. 10** — potrebná DPIA a právny základ, nie teoretická debata o SCHUFA.
- Falošná pozitívna zhoda na mene (homonymá) by vylúčila nevinného uchádzača.

**Zodpovednosť**
- AI nemá právnu subjektivitu. Zodpovednosť nesie obstarávateľ (§ 182 ZVO), štatutár (357/2015) a pri fondoch pribúda korekcia 5/10/25/100 % podľa C(2019) 3452.
- **Aplikácia volajúca EKS API koná v mene registrovaného používateľa** a zodpovednosť nesie ten používateľ. Preto žiadny nezvratný úkon nesmie byť predvolená akcia. RPA nad štátnym portálom bez API je to isté riziko o triedu vyššie.
- Chyba AI sa premení na stratu dotácie u zákazníka, nie na reklamáciu voči dodávateľovi softvéru.

**Bezpečnosť**
- **Predčasný prístup k ponukám** (indexovanie, embeddingy, logy promptov pred otvorením) je porušenie dôvernosti a možný dôvod na zrušenie VO.
- Bez kvalifikovanej časovej pečiatky sa nedá preukázať, že sa neotváralo skôr.
- Platforma sa pravdepodobne dostane do režimu zák. 69/2018 v znení 366/2024 (NIS2) buď ako služba, alebo ako dodávateľ prevádzkovateľa.
- **Bez LTA a prepečaťovania budú podpisy po rokoch neverifikovateľné** a celá automatizovaná dokumentácia stratí dôkaznú silu v 10-ročnej retencii.

**Prevádzkové**
- **Schvaľovacia únava:** človek, ktorý klikne 20 obrazoviek, nečíta ani tú jednu, na ktorej záleží. Úroveň B všade je vlastné riziko.
- Nízka AI zrelosť obstarávacích organizácií — limitom nie je právo ani technológia, ale používateľ, ktorý sa vráti k Wordu.

---

## 9. Otvorené nezhody

Rozpory, ktoré tri kolá nezatvorili. Obe pozície sú uvedené, kompromis nie je vymyslený.

**9.1 Právny účinok zápisu podľa § 20 / § 158b — licencia alebo registrácia?**
- **Čítanie A (podmienka použitia):** PRAVO, PROCESY. § 20 ods. 1 obsahuje vetu „môžu na elektronickú komunikáciu použiť **výlučne** elektronický prostriedok zapísaný v zozname podľa § 158a", doplnenú zákonom 395/2021 Z. z. od 31. 3. 2022. Nezapísaný prostriedok je nepoužiteľný ako kanál. Opora: novelizačný bod 52 v parlamentnej tlači (nrsr.sk).
- **Čítanie B (registrácia s domnienkou):** MAXIMALISTA. § 158b a vyhláška 73/2022 sú **ohlasovací proces s dotazníkom v 11 oblastiach**, teda len domnienka, že prostriedok požiadavky § 20 splňuje; ÚVO na svojej stránke právny účinok zápisu **neuvádza vôbec** a vyhláška má vlastný paragraf o „dátumoch nasadenia funkcionalít", čo je jazyk harmonogramu, nie licencie.
- **SKEPTIK necháva obe čítania otvorené** a odporúča čítanie A ako konzervatívnejšiu pracovnú hypotézu.
- **Čo chýba na rozhodnutie:** doslovné znenie § 20 v konsolidovanom znení účinnom k 25. 9. 2026 s číslom odseku. Slov-lex vracia len obsah, oficiálny PDF vrátil HTTP 404.
- Všetci sa zhodujú na jednom: pri **podlimite** je otázka bezpredmetná, lebo elektronická platforma je od 1. 2. 2023 výhradná a zápis nepomôže; pri **zákazke malého rozsahu** nedopadá vôbec.

**9.2 Existencia a obsah zoznamu zapísaných elektronických prostriedkov**
- **PROCESY** ho našlo a načítalo 25. 9. 2026: **14 položiek** — Elenaportal 1.0, E-lena 1.1, tenderia 1.0, .NUNTIO 5.3.4.64, E-BEX 1.0, **Elektronická platforma 1.0 (ÚPPV, IČO 56565321)**, PLUTO 8.0.02, TENDERnet 2.3, ActiveProcurement 4.0, eZakazky 10.0.0, JOSEPHINE 2.3, EVOSERVIS 1.0, eBIT 4.0.0.0, ERANET 2.3. eTENDERs v ňom **nie je**.
- **PRAVO a INTEGRACIE** zoznam nenašli; PRAVO uvádza názvy z praxe a webov prevádzkovateľov, INTEGRACIE ho vedie ako NENÁJDENÉ.
- Nezhoda je o dostupnosti zdroja, nie o vecnom obsahu. Zoznam treba pred rozhodnutím načítať znovu.

**9.3 Dostupnosť EKS API obstarávateľovi**
- **INTEGRACIE a MAXIMALISTA:** prístupné ktorémukoľvek **registrovanému používateľovi EKS**. Príručka EKS OAuth v1.2, kap. 2.1: oprávnenie sa žiada mailom, klienta si registruje sám a „po zaregistrovaní klientskej aplikácie je možné okamžite využívať EKS API služby". Veta na eks.sk o „správcoch a prevádzkovateľoch informačných systémov" popisuje cieľovú skupinu dokumentu, nie prístupovú bariéru.
- **PROCESY:** integračné rozhranie je podľa eks.sk určené **len správcom IS, nie obstarávateľom**.
- Obe strany pripúšťajú, že dokumentácia je z roku 2018 (release 3.4.3, cituje § 110, kým dnešný postup je § 109) a aktuálnosť nikto nepotvrdil.

**9.4 Rozsah EKS API a úroveň cesty EKS**
- **MAXIMALISTA:** cesta EKS je úroveň **A** — zápisové služby pokrývajú presne tie kroky, kde je človek drahý, zvyšok si EKS odbehne sám a zmluvu pošle do CRZ. Z pohľadu obstarávateľa je to jedno tlačidlo.
- **INTEGRACIE:** API pokrýva opisný formulár a objednávku po `VyhlasitZakazku()`; **predkladanie kontraktačných ponúk a aukcia nemajú pripojenú žiadnu službu** a uzatvorenie zmluvy je len na čítanie. Že proces beží automaticky **vnútri EKS** neznamená, že ho riadi platforma.

**9.5 EKS ako vstupný trh**
- **INTEGRACIE:** technicky prvá cesta — funkčný end-to-end tok s malým rizikom.
- **PROCESY:** obchodne najmenej zaujímavý trh. § 109 už dnes systém sám vyhodnocuje, sám robí aukciu, sám zverejňuje v CRZ; pridaná hodnota platformy sú dva dokumenty, nie produkt. Reálny trh je nadlimit cez zapísaný prostriedok.
- **INTEGRACIE** to pripúšťa a dodáva, že nadlimit je zároveň **integračne najhorší segment** — právna otvorenosť nie je integračná dostupnosť.

**9.6 P02 — podpis na zázname o PHZ**
- **MAXIMALISTA:** optimalizujúci PHZ engine z produktu vyradil úplne, ale výpočet PHZ obhajuje ako strojový; pri zákazke malého rozsahu je celý krok **A**. Podpis na zázname nepovažuje za zákonnú povinnosť.
- **SKEPTIK:** trvá na podpise a tvrdí, že pri malom rozsahu je riziko **väčšie**, nie menšie — § 6 ods. 16 je práve ten paragraf, ktorý rozhoduje, či nákup zostane mimo ZVO, alebo je to umelo rozdelená podlimitná zákazka. Sám však priznáva, že podpis žiada skôr ako dôkazný artefakt než ako citovanú zákonnú povinnosť.

**9.7 Úrovne A pri P09, P11, P14 (predkladanie, otváranie, aukcia)**
- **MAXIMALISTA:** rozdelené — **A z pohľadu procesu** (žiadny človek do behu nezasahuje), **C z pohľadu integrácie**.
- **INTEGRACIE:** úroveň A nepodporuje vôbec. IS EVO nemá strojové rozhranie a automatizácia vnútri cudzieho systému nie je aktívum platformy.
- **SKEPTIK** tu maximalistovi ustúpil, ale s podmienkou kvalifikovanej časovej pečiatky a technického zámku namiesto schvaľovania.

**9.8 P12b — úroveň overovania v registroch**
- **MAXIMALISTA:** A pre časť u OVM cez IS CPDI.
- **INTEGRACIE:** A bez výhrady odmieta — **ZHS ÚVO a register osôb so zákazom nemajú strojový kanál** a bez nich je vyhodnotenie osobného postavenia neúplné; pre neOVM zákazníka padne aj polovica zvyšku na scraping.

**9.9 Začiatok plynutia 10-ročnej archivačnej lehoty (§ 24 ods. 1)**
- **PROCESY:** odo dňa **odoslania oznámenia o výsledku VO**.
- **PRAVO:** dĺžku 10 rokov považuje za istú, začiatok nie — druhý zdroj hovorí „od uzavretia zmluvy". Ani jedna verzia nie je prečítaná v konsolidovanom texte. Rozdiel je v praxi až niekoľko mesiacov a ovplyvní retenčný engine.

**9.10 Dve konkrétne lehoty**
- **Oznámenie o zmene zmluvy:** PROCESY 30 dní (§ 26 ods. 4), PRAVO 14 dní. Do produktu brať kratšiu, kým sa neoverí konsolidovaný text.
- **Súčinnosť podľa § 56 ods. 5:** PROCESY „do 10 pracovných dní" ako deadline uchádzača, PRAVO „§ 56 nestanovuje lehotu *do*, ale **minimálnu dĺžku** lehoty, ktorú musí obstarávateľ poskytnúť". Platforma to nesmie modelovať ako deadline uchádzača.

**9.11 Koľko krokov v procese nemá zákonnú oporu**
- **PRAVO:** 22 krokov bez právnej opory alebo bez lehoty.
- **PROCESY:** framing odmieta, obsah zapracovalo. Pri P01, P03, P04, P05a, P05b a pri zápisnici v P13 **zákon lehotu ani hmotnú povinnosť neurčuje** — a to je samo zistenie, nie medzera. Správna diagnóza je „zákon lehotu neurčuje, určuje ju interná smernica".

**9.12 Povinnosť komisie pri § 110**
- **PRAVO:** treba podložiť odsekom § 110, inak je to prevádzkové odporúčanie.
- **PROCESY:** označilo ako neoverené, ale z tabuľky nevypustilo — metodika ÚVO komisiu predpokladá a pre platformu je bezpečnejší default „komisia zriadená". Konfigurovateľné, nie odstránené.

---

## 10. Medzery

Čo sa nepodarilo zistiť ani overiť. Toto nie sú domnienky — sú to miesta, kde produkt potrebuje ľudské doverenie pred stavbou.

1. **Doslovné znenie ZVO sa nepodarilo prečítať v žiadnom z troch kôl.** slov-lex.sk a static.slov-lex.sk vracajú len obsah a navigáciu (SPA), oficiálny PDF Zbierky zákonov vrátil HTTP 404 pri všetkých skúšaných URL. Celkovo 8+ pokusov troma agentmi. **Neprečítané zostali: § 13, § 20 (celý), § 6 ods. 16, § 24 ods. 1, § 51 ods. 1 a 4, § 56 ods. 2 a 5, § 66, § 108 ods. 2, § 110 ods. 5 – 6, § 170 ods. 4, § 184b ods. 2.** Všetky citácie paragrafov stoja na dôvodových správach NR SR, metodikách ÚVO alebo komentárových zdrojoch. **Pred produktom treba ZVO prečítať z autorizovanej PDF verzie alebo papierovej Zbierky zákonov.**
2. **Nariadenie (EÚ) 2026/1744 (Digital Omnibus) nie je overené v primárnom texte.** EUR-Lex nevrátil obsah ani raz (~9 pokusov). Dátumy **2. 12. 2027** (Príloha III) a **2. 8. 2028** (Príloha I) aj tvrdenie, že **VO nie je v Prílohe III**, pochádzajú výlučne zo sekundárnych zdrojov (advokátske kancelárie, artificialintelligenceact.eu). Rovnako je parafrázou doslovné znenie čl. 50 ods. 4 vrátane presného rozsahu výnimky pre „ľudskú alebo redakčnú kontrolu".
3. **Vestník VO ako otvorené dáta — neoverené po troch kolách.** Stránka Vestníka ponúka len RSS; distribučné URL, formát, licencia ani frekvencia sa nepodarilo načítať (data.slovensko.sk je JS aplikácia, SPARQL dotazy vrátili HTTP 400). **Dôsledok:** cenová databáza pre PHZ v podlimite a malom rozsahu nemá overený oficiálny zdroj a stojí na komerčných agregátoroch alebo ručnom vklade — presne v tom segmente, ktorý je najskorším trhom.
4. **Zapísané elektronické prostriedky nemajú žiadnu verejnú API dokumentáciu.** JOSEPHINE, ERANET, eZakazky, TENDERnet, tenderia, .NUNTIO, PLUTO, ActiveProcurement, E-BEX, eBIT, EVOSERVIS, Elenaportal, E-lena — nič v troch kolách. Je to zároveň segment, ktorý PROCESY označilo za najhodnotnejší trh.
5. **IS EVO a IS eForms ÚVO — žiadne strojové rozhranie a žiadna zverejnená cesta k nemu.** Overené v dvoch kolách dvoma agentmi. Rokovanie o API je opcia, nie predpoklad. MetaIS záznam sa nepodarilo načítať (expirovaný certifikát).
6. **Registre ÚVO bez strojového kanála.** Zoznam hospodárskych subjektov, register osôb so zákazom a evidencia referencií — SOAP WSDL, ktorý citujú sekundárne zdroje, vracia 404 (test 25. 9. 2026). Register osôb so zákazom vedie ÚVO a nikto iný, takže tu nie je náhrada.
7. **Remote QSCD podľa EN 419 241-2 u slovenského QTSP — neoverené.** Všetky stavebné prvky dávkového podpisu existujú (D.Signer-SVR, SNCA, EC DSS), ale že konkrétny modul je certifikovaný ako QSCD pre pečatenie bez človeka, nie je doložené technickou dokumentáciou, len marketingovými stránkami. **Model „stroj pečatí" na tom stojí.**
8. **Prístup súkromného subjektu k HSM na ÚPVS** — SNCA aj Disig ho viažu prakticky na orgány verejnej moci; pre súkromnú právnickú osobu nedoložené. Serverové komponenty slovensko.sk sú deklarované len pre OVM.
9. **IS CPDI: aktuálnosť a definícia „iného oprávneného subjektu".** Integračný manuál je z roku 2017, systém sa medzitým premenoval a prešiel pod MIRRI. Formulácia „orgán verejnej moci alebo iný oprávnený subjekt" pripúšťa viac ako OVM, ale definíciu sa nepodarilo nájsť. **Ak by tam patril prevádzkovateľ IS pre OVM, mení to biznis model.**
10. **Aktuálnosť EKS API k roku 2026.** Obe príručky sú z 26. 9. 2018, popisujú release 3.4.3 a `PridatObjednavku()` cituje § 110, kým dnešný postup je § 109. Potrebné písomné potvrdenie od prevádzkovateľa, čo dnes `VyhlasitZakazku()` robí.
11. **RPVS OData endpointy a verzia RPO API.** RPVS: `?$top=1` vrátilo HTTP 400, endpointy neodskúšané. RPO: dokumentácia označuje v2 za aktuálnu, produkčná URL v tej istej dokumentácii je `/rpo/v1/`.
12. **Prístup do ekonomických a rozpočtových systémov obstarávateľov je úplne neoverený terén.** Bez neho P01, P02 a P20 stoja na manuálnom vstupe.
13. **Doslovné znenie § 23 zákona 305/2013** je overené takmer doslovne pre ods. 3, nie pre celý paragraf a nie z primárneho textu. Hraničné prípady (zápisnica podpísaná časťou komisie, delegovanie autorizácie) treba posúdiť individuálne. Otvorené zostáva aj to, že § 23 sa vzťahuje len na **elektronický úradný dokument orgánu verejnej moci** — pečať je teda páka pre štát a samosprávu, nie pre celý trh platformy.
14. **Sektorové obstarávanie (§ 89 – § 98) nie je pokryté krok po kroku**, len na úrovni paragrafov a limitov. Kvalifikačný systém podľa § 89 má vlastnú logiku priebežného zaraďovania. Rovnako osobitný režim služieb prílohy č. 1 (§ 84 a nasl.) — len limity, nie postupové odlišnosti. Dĺžka rámcovej dohody pre sektorových obstarávateľov (8 rokov) neoverená.
15. **Eurofondové lehoty a limity pri § 108** (4 / 6 pracovných dní; T/S < 140 000, SP < 360 000 EUR) sú z infografiky ÚVO; Príručku k procesu a kontrole VO pre Program Slovensko nikto neotvoril. Nie je jasné, či sa to vzťahuje aj na Plán obnovy.
16. **Zverejnenie zmluvy v CRZ správcom platformy pri § 109** — z infografiky ÚVO, nie z § 109 ani z metodiky CRZ.
17. **Súhrnná správa pri zákazke malého rozsahu** — záver, že § 10 ods. 10 sa na ňu nevzťahuje, stojí na infografike ÚVO a metodickom usmernení, nie na doslovnom znení.
18. **Či platforma spadá pod zák. 69/2018 v znení 366/2024** (NIS2) — závisí od kategorizácie služby podľa prílohy zákona. Neoverené.
19. **Rozhodnutia ÚVO a judikatúra:** PDF rozhodnutí sa neotvorili v žiadnom kole; spisové čísla sú ukazovateľ, nie citovaný dôkaz. **Neexistuje rozhodnutie ÚVO ani SD EÚ priamo o použití AI vo verejnom obstarávaní** — to je neistota v oboch smeroch, nie bezpečie.
20. **Vzorové klauzuly MCC-AI** neboli overené novým načítaním v treťom kole.
21. **Integrita behu:** v treťom kole dvaja agenti (PRAVO, SKEPTIK) spadli na watchdogu pred dokončením a boli obnovení s **obmedzeným výskumným rozpočtom (max. 5 dotazov)**. Ich finálne súbory sú preto viac revíziou textu než novým overovaním. To je dôvod, prečo body 1 a 2 tejto sekcie zostali otvorené.

---

## 11. Na rozhodnutie pre teba

1. **Ktorý segment ide prvý?** Zákazka malého rozsahu (právne voľná, ale malé rozpočty a najslabšie overený cenový zdroj), EKS/§ 109 (jediné funkčné API, ale systém už väčšinu práce robí sám), alebo nadlimit (najväčší trh, ale žiadne API a povinný zápis do zoznamu)?
2. **Ide platforma do zápisu podľa § 158b, alebo zostane nadstavbou nad IS EVO a EKS?** Zápis otvára nadlimit ako samostatný kanál, ale je to formálna procedúra s technickým dotazníkom podľa vyhlášky 73/2022 a splnením vyhlášky 41/2019 — a jeho právny účinok je otvorený rozpor (9.1).
3. **Kto je cieľový zákazník — orgán verejnej moci, alebo aj sektoroví obstarávatelia a dotované osoby?** Odpoveď rozhoduje o dvoch veciach naraz: či je dostupné IS CPDI a OverSi (overovanie uchádzačov bez scraperov), a či je dostupná pečať cez HSM na ÚPVS. Pri neOVM zákazníkovi padne polovica overovacej vrstvy na scraping a pečatenie na komerčného QTSP.
4. **Akceptuješ ručný prenos do IS eForms ÚVO ako trvalú súčasť produktu**, alebo je podmienkou vstupu rokovanie s ÚVO o API? Bez API je platforma pri nadlimite pripravovač balíka, nie vykonávateľ.
5. **Má sa do modelu púšťať RPA nad IS EVO?** Odomkne to úrovne A pri P07 – P09, P11 a P15, ale koná to v mene používateľa bez API a bez dohody s prevádzkovateľom.
6. **Je cesta EKS produkt, alebo demo?** PROCESY tvrdí, že tam pridaná hodnota sú dva dokumenty; INTEGRACIE tvrdí, že je to jediný funkčný end-to-end tok. Rozhodnutie určuje, či sa investuje do EKS konektora ako do prvého modulu.
7. **Ako sa má merať a komunikovať úroveň automatizácie?** Číslo A = 6 (kroky bez človeka) alebo A = 4 (kroky, ktoré riadi a za ktoré zodpovedá platforma)? Prvé je pravdivejšie o procese, druhé o produkte — a pri due diligence sa prvé zlomí.
8. **Kto v tvojej firme prečíta ZVO z autorizovanej PDF Zbierky zákonov a potvrdí § 20, § 6 ods. 16, § 24 ods. 1 a § 184b?** Bez toho stojí celý ruleset na dôvodových správach a metodikách.
9. **Berie sa čítanie A alebo čítanie B pri § 20 / § 158b ako pracovná hypotéza pre architektúru?** Čítanie A je konzervatívnejšie a drahšie, čítanie B rýchlejšie a rizikovejšie.
10. **Chce sa pri určovaní PHZ podpis na každom zázname** (dôkazný artefakt, jeden podpis na zákazku), alebo len log použitej metódy? Rozpor 9.6 nie je uzavretý a rozhoduje o počte „pečiatok" v najfrekventovanejšom kroku.
11. **Aká je politika pri označovaní AI výstupov?** Čl. 50 ods. 2 vyžaduje strojovo čitateľné označenie od platformy ako poskytovateľa už dnes. Ide sa na úroveň B pri zverejňovaných dokumentoch (výnimka z označovania podľa čl. 50 ods. 4), alebo na A s viditeľným označením „umelo vygenerované" na dokumentoch obstarávateľa?
12. **Ako sa nastaví retencia, kým nie je jasný začiatok plynutia 10-ročnej lehoty?** Konzervatívne od odoslania oznámenia o výsledku, alebo konfigurovateľne na úrovni zákazky s rizikom nekonzistentného archívu?

---

## Zdrojové podklady

Tento dokument je syntézou piatich finálnych výstupov v `.swarm/vo-automatizacia/round3/`: `pravo-final.md`, `procesy-final.md`, `integracie-final.md`, `maximalista-final.md`, `skeptik-final.md`. Každý obsahuje vlastnú sekciu `## Dôkazy` s URL a dátumami načítania, `## Neistoty`, `## Zmenené` a `## Odmietnuté`. Krížové recenzie sú v `round2/`, prvé kolo v `round1/`.
