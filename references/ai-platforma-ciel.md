# AI platforma IMPOFAI – dlhodobý cieľ

Stav: pracovná verzia 2026-10-18. Zdroje: Marekove hlasové nahrávky z 15. a 16. 10. 2026, YouTube transkript o multiplayer agentoch (Kylon), hovory s asistentom 16. a 17. 10. Surové zadanie je v `brainstorms/2026-10-16-ai-platforma-ciel-zdroje.md`. Plán, ako sa k cieľu dostať: [[ai-platforma-plan]].

Toto nie je zadanie na implementáciu. Je to severka, podľa ktorej sa navrhujú ďalšie kroky.

## Jednou vetou
AI operačná vrstva nad firmou. Každý človek má proaktívneho osobného agenta, ktorý pozná kontext firmy, pracuje sám, pýta sa len na informácie a schválenia, ideálne telefonicky, a postupne preberá väčšinu práce na počítači.

## Prečo
- Firmy, ktoré začnú automatizovať skôr, budú mať nižšie náklady a vytlačia konkurenciu. Bez kontextu firmy sa automatizovať nedá a ten kontext dnes žije v softvéroch a v hlavách ľudí.
- Ambícia: do 2 rokov automatizovať 50–80 % práce na počítači. Ľudia dávajú informácie a povolenia, agenti robia.
- Keď príde model, ktorý zvládne čokoľvek na počítači, firma s nazbieraným kontextom je pripravená okamžite.

## Dva hlavné ciele
1. **Kontext firmy a jej zlepšovanie.**
   - Mapa ľudí (role, kontakty, kto s kým komunikuje) a mapa procesov (čo kto robí, ako, kedy, podľa čoho sa rozhoduje) v second braine.
   - Zber z dvoch strán: fakty zo softvérov cez konektory (e-mail, Drive, kalendár, ERP, účtovníctvo, reklamy, web) a znalosti z hláv ľudí cez hlasové interview.
   - Manažérske analýzy nad kontextom (chybovosť, neefektívne procesy, riziká). Keď kontext chýba, systém sám pošle agentov zavolať správnym ľuďom s pripravenými otázkami a odpovede zaindexuje.
2. **Najlepší osobný agent pre každého.**
   - Má kontext, nástroje a štýl človeka, napríklad píše drafty e-mailov v jeho tóne podľa histórie a CRM a zavolá na schválenie.
   - Je proaktívny: sám si pýta prácu, navrhuje zlepšenia, automatizácie, konektory, skilly a naplánované úlohy a po schválení ich vytvára aj používa.
   - Je „always on“: beží na serveri, aj keď je počítač vypnutý.

## Stavebné bloky
| Blok | Čo má vedieť | Dnes |
|---|---|---|
| Task management | spaces, foldre, task listy, úlohy, timesheety, role | hotové v PM, pripravené do produkcie |
| Second brain | Karpathy LLM wiki, MCP, prístupy podľa človeka, odvetvia, zákazky | hotové v PM (+ Fireflies sync) |
| Mapa firmy | ľudia, role, kontakty | hotové v PM, mapa procesov chýba |
| MCP vrstva | všetko z PM cez MCP v rámci práv používateľa | hotové (~140 nástrojov) |
| AI rozhranie | chat ako Claude alebo ChatGPT, projekty s inštrukciami a podkladmi, naplánované úlohy | chýba (naplánované úlohy dnes len cez AIOS runner) |
| Konektory | custom konektory (manažér priradí, človek sa len prihlási), vytvorenie konektora cez AI chat | chýba |
| Aplikácie | agent vytvorí stránku, dashboard alebo malú aplikáciu pre človeka | chýba |
| Hlasová vrstva | ranný brief, zavolať agentovi s úlohou, spätný hovor s výsledkom, interview kampane, agent volá kolegom | brief hotový, ostatné vo fáze 1 a neskôr |
| Sieť agentov | agenti si posielajú úlohy a knowledge s povoleniami, chat ľudí a agentov (Slack štýl, @agent) | chýba |
| Serveroví agenti | 1 server = 1 projekt s Claude Code agentom: zadanie z hovoru, otázky späť cez hlas, výsledok ako preview URL v tasku | dátové polia v PM existujú, agent chýba |
| Predplatné | bez API tokenov, cez predplatné (Claude Code, Codex, OpenAI login) | funguje pre jedného používateľa |

## Zásady
- **Najprv pre IMPOFAI, súbežne produkt.** Stabilné časti (task management) idú do produkcie pre iných. Hlasový agent je zatiaľ test.
- **Predplatné platí organizácia.** Bez neho nie je prístup, prípadne 10-dňový trial (návrh). Pozor na podmienky Anthropic: každý človek musí mať vlastné prihlásenie, zdieľané predplatné pre viacerých nie je povolené. Pozri riziká v [[ai-platforma-plan]].
- **Hovor zbiera, vykonáva sa po hovore.** Hlasový agent počas hovoru nevolá systémy. Po hovore agent urobí to, čo človek potvrdil, a zavolá späť s výsledkom.
- **Agent smie to, čo jeho človek.** U Mareka všetko, čo potvrdí, aj mazanie a financie, so zálohou a auditom. U nových ľudí sa práva rozširujú postupne.
- **Osobné dáta sa nezdieľajú bez súhlasu.** Agent kolegu sa pri osobných dátach pýta vlastníka.
- **Proaktivita so schválením.** Agent navrhuje a človek schvaľuje (hlasom, v rozhraní alebo cez úlohu).

## Ako by to mohlo vyzerať o 2 roky
Ráno o 9:00 zavolá každému jeho agent. Povie, čo sa riešilo v tíme, čo má človek dnes urobiť, kde má úlohu zapísanú a akú má prioritu. Zároveň povie, že sa už opýtal kolegu na chýbajúce podklady, pripravil draft odpovede klientovi a čaká na schválenie.

Počas dňa:
- človek zavolá agentovi „klient chce zmenu X“;
- agent založí úlohu a pošle ju serverovému agentovi projektu;
- otázky serverového agenta preposiela hlasom;
- večer zavolá s preview linkom.

Manažér sa v chate spýta na chybovosť vo výrobe. Systém zistí, že kontext chýba, spustí interview hovory s ľuďmi z výroby a o deň má analýzu. Všetko, čo zaznie, končí v second braine a z opakovaných činností vznikajú automatizácie.

## Otvorené otázky (čakajú na Marekove odpovede)
1. Kde majú agenti bežať: centrálne na našom serveri, alebo inštancia na zákazníka?
2. Komu smie agent sám volať (len svojmu človeku, kolegom, klientom) a kto to povoľuje?
3. Čo je medzi agentmi predvolene zdieľané a kto schvaľuje prístup?
4. Prvý server a projekt pre serverových agentov. Smú nasadzovať do produkcie, alebo len preview?
5. Chat: Slack, WhatsApp, alebo chat priamo v PM?
6. Kde žijú aplikácie a konektory vytvorené agentom a kto ich schvaľuje?
7. Ako vyzerá úspech o 3 mesiace?
8. Produkt pre iné firmy: vlastné prihlásenie každého zamestnanca (Claude Team seat) verzus API. Treba overiť s Anthropic.

Otázky sú vo fronte `context/otvorene-otazky.md` v second braine a asistent ich kladie postupne v ranných hovoroch.

## Doplnenie 2026-10-18 (Marek)

### Produktové línie
1. **V1 SaaS – second brain + task management (bez AI v platforme).**
   - Obsah: dnešné PM (úlohy, timetracking, timesheety, prístupy) + second brain (Karpathy wiki) + mapa firmy, všetko plne cez MCP.
   - Používateľ si AI prináša sám (Claude, ChatGPT, Gemini…): chat, voice mód, naplánované úlohy a konektory sú v jeho AI.
   - **Hodnota:** second brain sa plní z každodennej práce s vlastným AI a z naplánovaných úloh (Fireflies prepisy, Gmail, zmeny v PM). Voice agent s MCP je asistent, ktorý vie o všetkom, čo človek robí: zmeny v PM, drafty e-mailov, interview na doplnenie medzier v kontexte.
   - **Predaj:** samostatný SaaS, 30-dňový trial, potom 6 €/seat/mesiac. Vyšší tier za 45 € (proaktívni agenti, AI hovory, custom konektory, dashboardy) je zatiaľ „vypredaný“. Enterprise = custom aplikácie a automatizácie.
   - Alternatíva k nášmu PM: priame prepojenie s ClickUp. Odporúčanie Fireflies na prepisy meetingov.
   - Detailná definícia: dokument „V1 – definícia“ v PM (Startups / Projekt Manazment) a `references/v1-saas.md`.
2. **Platforma s AI (ďalšie verzie):** proaktívni always-on agenti, hlasové hovory, sieť agentov, serveroví coding agenti. Toto je zvyšok tohto dokumentu a [[ai-platforma-plan]].

### Hlasový kanál
- Hlasový agent ostáva na Linphone. Každý agent bude mať vlastný Linphone účet, alebo neskôr vlastnú mobilnú appku (iOS a Android).

### Coding agenti na serveroch (fáza 2)
1. Marek povie hlasovému agentovi, čo chce zmeniť v projekte (prvý projekt je otvorená otázka, pozri plán).
2. PM agent (zatiaľ AIOS runner, neskôr agent v PM) požiadavku spracuje, vytvorí z nej úlohu s promptom a pošle ju Claude Code agentovi na serveri projektu. Ten má rovnaký CLAUDE.md a nástroje ako hlavný orchestrátor a všetky práva.
3. Coding agent urobí zmenu, nasadí ju na live/preview URL, vytvorí v PM úlohu pre Mareka „skontroluj zmenu na …“ a pošle PM agentovi prehľad (čo, ako, kde otestovať).
4. PM agent zavolá Marekovi cez hlasového agenta a povie, čo sa urobilo a kde to otestovať.
5. Otázky alebo žiadosti o povolenie coding agenta idú cez PM agenta do hovoru s Marekom a odpovede späť agentovi.

### Prihlásenie predplatným
Analýza 2026-10-18 (`.swarm/v1-saas/round1/R1-predplatne-kylon.md`, zdroj: https://code.claude.com/docs/en/legal-and-compliance):

| Variant | Povolené? |
|---|---|
| (a) Claude Code beží na **počítači používateľa** (prihlásený vlastným účtom), platforma ho len orchestruje cez lokálny „gateway“ program | áno |
| (b) platforma hostuje **neupravený** Claude Code a používateľ sa doň prihlási cez flow Anthropicu | len na Commercial Terms a bez zbierania tokenov; treba písomne overiť s Anthropic |
| (c) držíme používateľov OAuth token (`setup-token`) na našom serveri a spúšťame `claude -p` za neho | **výslovne zakázané** |

Doplnenia:
- **OpenAI:** „Sign in with ChatGPT“ s využitím plánu existuje, pre hostované aplikácie je však v limitovanom triale cez waitlist. Tokeny z Codex CLI v našej appke nie sú podporená cesta.
- **Kylon** (kylon.io):
  - Claude Code púšťa iba lokálne na počítači používateľa cez `kylon gateway run` a token nikdy nevidí;
  - Codex vie hostovať v cloude s prihlásením cez device code na plán používateľa;
  - hostovaný Claude s predplatným neponúka;
  - cena od 50 USD/mes. za workspace s kreditmi.
- **Dôsledok:**
  - **V1 (iba MCP, AI si prináša používateľ) je čistá.**
  - Pre always-on agentov sú dve čisté cesty: lokálny runner u používateľa (vzor Kylon) alebo API (náš kľúč alebo kľúč zákazníka).
  - Marekov vlastný runner na vlastnom serveri s vlastným Max je jeho osobné použitie, to je v poriadku.
