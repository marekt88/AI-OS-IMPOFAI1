# R3 review (kolo 2): produkt po faktoch z R1, R2 a R4

Stance: produktový dizajnér. Zdroje: `round1/R1-predplatne-kylon.md`, `R2-audit.md`, `R4-rizika.md`, môj `R3-produkt.md`. Odhady sú označené.

## 1. Čo z môjho návrhu už neplatí
- **Rovnocenné dlaždice Claude, ChatGPT a Gemini (1A/3) a matica v 2B.** Voice s nástrojmi je zdokumentovaný len v Claude, aj to bez výslovnej zmienky o custom MCP (R4). ChatGPT má MCP len v „developer mode“ na webe a s potvrdením každého zápisu. Gemini v spotrebiteľskej appke custom MCP prakticky nemá. Moje odznaky „✓/?“ sľubujú viac, než platí.
- **Voice šablóny 3, 4 a 6 s označením „C?, G?“.** ChatGPT voice MCP nevolá (OpenAI community), preto sú tieto šablóny len pre Claude. Aj tam ostáva otvorené, či funguje náš konektor a slovenčina (beta).
- **Pozvaný si pripojí AI sám (1B/4).** V Claude Team/Enterprise pridáva custom konektor iba Owner Claude organizácie (R4). Ak ho nepridal, člen v kroku 4 zamrzne.
- **Read vs. read+write (1B/1, prompt 2D).** Model to nevie: nemá úroveň READ, zápis do WIKI má každý, kto poznámku vidí (R2, `canWriteBrainNote`).
- **E-maily D1 až D25, e-mailová pozvánka, trial countdown.** Mailer neexistuje a `Organization` nemá polia pre trial ani plán (R2). Pozvánka je dnes skopírovaný link.
- **„Úlohy: PM alebo ClickUp“ s ikonou synchronizácie (1A/4, landing).** Synchronizácia s ClickUp sa za 6 € neoplatí. Reálna cesta je oficiálny ClickUp MCP vedľa nášho (R4).
- **Gemini logo a „Funguje s Gemini“ na landingu.** Bez overenej cesty je to klamlivé.
- **Zámok po triale.** Úplný zámok je v rozpore s GDPR čl. 20 a Data Act. Platí read-only + export (R4).
- **Živá detekcia pripojenia (1A/5)** je **(odhad)** realizovateľná, R2 však neuvádza, či sa ukladá `lastUsedAt` tokenu alebo OAuth spojenia. Najprv overiť.

## 2. Upravený návrh
**Zmeniť**
- Krok „Tvoje AI“: **Claude (odporúčané, plná funkčnosť vrátane hlasu)**, ChatGPT (chat a naplánované úlohy, bez hlasu, developer mode), „Iný MCP klient (experimentálne)“. Gemini len v tejto skupine.
- Do Easy setup promptu pridať vetvu **Claude Team**: „Si Owner? Pridaj konektor pre celú organizáciu. Si člen? Skopíruj túto správu Ownerovi; potom už len klikni Connect.“ Pre ChatGPT pridať vetvu „zapni developer mode, zápisy budeš potvrdzovať“.
- Pozvaný člen: obrazovka „Čo vidíš“ ukáže strom grantov a namapovaných klientov. Text: „Vidíš a môžeš dopĺňať poznámky k týmto klientom. O viac požiadaj ownera.“ Bez prepínača read/read+write.
- ClickUp: odpoveď „Používam ClickUp“ vygeneruje prompt, ktorý pripojí oficiálny ClickUp MCP (`mcp.clickup.com/mcp`) a náš brain MCP. K tomu upozornenie na limit volaní (~50/24 h na Free, sekundárny zdroj), preto žiadne časté naplánované úlohy nad ClickUp.
- Aktivácia (zjednotiť s R4): do 7 dní **≥1 MCP volanie + ≥5 zápisov do brainu v ≥2 dňoch + 1 naplánovaná úloha** (proxy: zápisy bez interakcie v rovnakom čase dňa, **odhad**).
- Landing: headline variant „Firemný mozog pre tvoj Claude“ / „A shared company brain for your Claude team“. Hlas iba ako sekcia „v Claude“ s poznámkou „slovenčina v beta“. Pozicionovať **zdieľaný firemný mozog s prístupmi, EÚ, nezávislý od AI**, nie „AI si pamätá“ (to sa presúva do AI klientov).
- Pricing FAQ: „Čo po triale“ = read-only + export 60 dní.

**Vypustiť z V1**
- read/read+write a e-mailové sekvencie po onboardingu (nechať len transakčné: reset, pozvánka, overenie);
- Gemini ako voľbu;
- voice šablóny pre ChatGPT;
- ClickUp sync.

**Pridať**
- Krok 0 v onboardingu: „Máš platené Claude alebo ChatGPT?“ Pri „nie“ ponúknuť návod, ktorý plán stačí, a čakaciu listinu „IMPOFAI s vlastným AI“ (dopyt pre 45 € plán), nie slepú uličku.
- Šablónu „Správa pre Owner Claude Team“ a troubleshooting prompt „vidím konektor, ale nemám nástroje pm_*“.
- Pred spustením kampane **test nášho MCP vo voice móde Claude (sk aj en)**. Bez neho sa hlas nedostane do headline.
- Odkaz na ClickUp MCP šablónu „úlohy v ClickUp, kontext v brainu“.

## 3. Námietky k R4 a R2
| Kde | Čo | Prečo | Istota |
|---|---|---|---|
| R4 §1 „Prečo zaplatiť“, míľnik | „20 poznámok do 7 dní“ | Je to príliš vysoké a meria objem, nie návyk. Agent vie jedným promptom zapísať 20 nekvalitných poznámok, kým naplánovaná úloha v 2 dňoch ukáže, že sa brain plní sám. Návrh: 5 zápisov v ≥2 dňoch + 1 naplánovaná úloha. | stredná |
| R4 §1 Claude.ai, riziko #1 | Owner-only konektor v Claude Team je podaný ako bariéra aktivácie | Ide o **jednorazový** krok na Claude organizáciu. Potom sa členovia len prihlásia cez OAuth. Pre ICP R4 („majiteľ power user nastaví za ostatných“) je to skôr výhoda: owner pripojí celý tím naraz. Riešenie je text v onboardingu, nie zmena ICP. | stredná (overiť, či člen po pridaní konektora Ownerom potrebuje vlastné OAuth) |
| R2 „Hlavné medzery“ #3 | brain read/read+write ako tretia závislosť pred onboardingom | Je to schéma + permission + UI pozvánky, no hodnotu pre prvých 3 až 5 firiem nedáva. Mapovanie a granty už obmedzujú, čo kto vidí. Posunúť za landing, onboarding a billing, alebo vypustiť z V1. | stredná |
| R4 §2 E-mail | „Oddeliť marketingovú doménu“ ako súčasť V1 | V1 nemá marketingové e-maily (R2: žiadny mailer). Stačí jeden transakčný provider a SPF, DKIM, DMARC. Oddelenie domén je V1.1. | vysoká |
| R4 §6 „prvých 10 až 50 cez Marekovu sieť“ | implicitne spochybňuje landing pre reklamy | Súhlas v tom, že reklamy nie sú prvý kanál. Landing však treba aj pre sieť (link, ktorý Marek pošle). Priorita: landing ako predajná stránka, kampane až po meranej aktivácii u prvých 5 firiem. | stredná |

## 4. Zásadné nezhody
- **Čo je hodnota V1.** R4 hovorí, že hodnota je strednodobá a rastie týždne. Ja trvám na tom, že onboarding musí ukázať hodnotu **v prvej session**: Easy setup prompt zapíše firmu, ľudí a klienta z toho, čo AI už vie. Bez toho trial nekonvertuje ani v ICP. Toto R4 ani R2 neadresujú.
- **Hlas ako hlavný sľub.** Marekovo zadanie stavia na voice móde. Po R4 ho nedávam do hlavnej value prop, iba ako Claude bonus, kým neprejde test. Je to nezhoda so zadaním, nie s agentmi, a treba ju vyriešiť s Marekom.
- **Easy setup prompt na FULL tokene.** R2 aj R4 odporúčajú RESTRICTED ako default (R4 #12). Súhlasím pre členov. Owner však FULL potrebuje na setup aj na admin úlohy (Fireflies, mapping). Navrhujem FULL cez OAuth so zrozumiteľným varovaním, nie restricted default pre ownera.
