# R3 Produkt V1: onboarding, easy setup, šablóny, landing

Agent R3, stance: produktový dizajnér (konverzia, jednoduchosť). Stav 2026-10-18. Zdroje: `context.md`, `ai-platforma-ciel.md`, kód `/home/marek/impofai-pm` (cesty nižšie). Tvrdenia o funkciách Claude/ChatGPT/Gemini sú **odhady, treba overiť** (rovnako ich značí `UNVERIFIED_LABEL` v `templates.ts`).

## 0. Čo už existuje (východisko)
- `/brain/start` = 3 záložky: **Set up** (skill ZIP pre Claude/OpenAI/generic, sk/en + návod na konektor), **Autofill** (Fireflies → denná úloha), **Templates** (10 naplánovaných úloh v `lib/brain-hub/templates.ts`, každá s promptom pre Claude aj OpenAI).
- Skill `impofai-second-brain` už rieši Krok 0 (identita, `admin_actions_available`, full vs restricted) aj režim bez dozoru. Easy setup prompt na to má **odkazovať, nie to duplikovať**.
- `/onboarding` dnes len založí organizáciu a workspace. Landing (`app/(public)/page.tsx`) predáva „PM pre AI-first dev tímy“ a **pricing hovorí 4 €/seat**. Oboje treba prepísať (nový cieľ: second brain + vlastné AI, 6 €).

## 1. Onboarding V1

### 1A. Owner (po signupe s 30-dňovým trialom)
Princíp: **do 10 minút prvý zápis do second brainu z vlastného AI**. Vysvetľovanie až vtedy, keď ho používateľ potrebuje. Progress bar 1/6 až 6/6, každý krok sa dá preskočiť a vrátiť sa k nemu cez „?“.

| # | Obrazovka | Cieľ | Obsah a otázky | CTA | Grafika |
|---|---|---|---|---|---|
| 1 | **Prečo** | pochopiť hodnotu za 20 s | 3 vety: „Tvoje AI nepozná tvoju firmu. Second brain jej dá pamäť. Plní sa sám z tvojej práce.“ | „Poďme na to (5 min)“ | Slučka: človek → jeho AI (logá Claude/ChatGPT/Gemini) → MCP „zástrčka“ → second brain + úlohy → späť do AI. Šípka „každý deň“ sa točí. |
| 2 | **O tebe** | personalizácia promptov | meno (predvyplnené zo signupu), **rola** (majiteľ / manažér / freelancer / iné), veľkosť tímu (1, 2 až 10, 11 až 50, 50+), **jazyk AI** (sk/en). Bez veku. | „Pokračovať“ | Karta „vizitky“, ktorá sa vypĺňa naživo. |
| 3 | **Tvoje AI** | vybrať variant promptu a skillu | dlaždice Claude / ChatGPT / Gemini / iné (MCP klient). Pod každou malý odznak: „konektory ✓, naplánované úlohy ✓/?, hlas ✓/?“. Info, že platforma AI nemá a nič neúčtuje za tokeny. | „Mám Claude“ atď. | Tri dlaždice s logami, odznaky ako matica schopností. |
| 4 | **Úlohy: naše PM alebo ClickUp** | rozhodnúť backend úloh | „Kde chceš mať úlohy?“ IMPOFAI PM (odporúčané, v cene) / ClickUp (prepojenie) / zatiaľ nič, len second brain. Pri PM: založ prvý space (názov firmy, 1 klik). | „Vybrať“ | Dva stĺpce: náš strom space → folder → list vs. logo ClickUp so šípkou synchronizácie. |
| 5 | **Pripoj AI (MCP)** | prvý úspešný `pm_get_current_identity` | 1 veta „MCP je USB kábel medzi tvojím AI a platformou“. Krok A: vytvor **Full-access** (len na setup, vysvetlené prečo). Krok B: skopíruj **Easy setup prompt** (už s URL a zvoleným AI). Stránka čaká a **živo detekuje** prvé volanie MCP („Pripojené ✓ ako Marek, full“). | „Kopírovať prompt“, potom „Setup úspešný“ / „Niečo sa pokazilo“ / „Preskočiť“ | Animácia zástrčky, ktorá sa po detekcii rozsvieti na zeleno. |
| 6 | **Prvé výsledky** | ukázať hodnotu, nie vysvetľovať | počítadlo: X poznámok v brainu, Y úloh, Z naplánovaných úloh. 3 odporúčané šablóny podľa rolí a AI (napr. ranný brief, Fireflies, e-mail skill). Až potom karta „Mapa brainu a PM za 2 min“ (guide: ľudia, spaces, foldre, listy, timetracking, timesheety, prístupy). | „Otvoriť šablónu“, „Pozvať tím“ | Mini mapa brainu (graf uzlov), ktorá rastie podľa skutočných poznámok. |

Potom **checklist v sidebare** (AI pripojené, 1. poznámka, 1. naplánovaná úloha, hlas vyskúšaný, kolega pozvaný) a e-maily D1, D3, D7, D25.

### 1B. Pozvaný člen
| # | Obrazovka | Obsah | CTA |
|---|---|---|---|
| 1 | **Pozvánka (e-mail + landing)** | „Marek ťa pozval do <Org>. Máš prístup k: <space X, folder Y>, second brain: **čítanie** / **čítanie+zápis**.“ | „Prijať a vytvoriť heslo“ |
| 2 | **Čo vidíš** | zoznam prístupných kontajnerov ako strom, sivé zámky pri ostatných. „O viac požiadaj ownera“ (tlačidlo vytvorí žiadosť/úlohu ownerovi). | „Rozumiem“ |
| 3 | **Tvoje AI** | rovnaké ako 1A/3 | výber |
| 4 | **Pripoj AI** | **Restricted token** predvolene (nie full), invite prompt (pozri 2E). | „Kopírovať prompt“ |
| 5 | **Hotovo** | 2 šablóny pre člena: ranný brief z mojich úloh, draft e-mailu hlasom. | „Otvoriť“ |

### 1C. Zlepšenia Marekovho zadania
1. **Vysvetlenie skrátiť.** Dlhý úvod pred akciou zníži konverziu: 1 obrazovka, zvyšok do kroku 6 a „?“ guide.
2. **AI pred PM/ClickUp:** výber AI určuje všetky prompty, ClickUp je okrajový prípad.
3. **Vek: nie.** Nič s ním nerobíme, je to proti GDPR minimalizácii a v B2B pôsobí zvláštne. Namiesto neho **rola a veľkosť tímu**. Stačí checkbox 18+ v podmienkach.
4. **FULL token len dočasne:** po setupe banner „nahraď full token obmedzeným“ s 1-klik restricted tokenom. FULL je však nutný pre admin kroky (Fireflies, mapping, `pristup`), takže netvrdiť „vždy restricted“.
5. **Prístupy až vo flow „Pozvať tím“**, nie v prvom onboardingu.
6. **Merateľná aktivácia (návrh):** *Aktivovaný* = do 7 dní (a) ≥1 úspešné MCP volanie, (b) ≥3 zápisy do brainu (`pm_create_brain_note` / `pm_upload_brain_document` / `pm_save_brain_call_summary`), (c) zápisy aspoň v 2 rôznych dňoch, čo je proxy pre naplánovanú úlohu. Pomocné metriky: čas po prvé MCP volanie (cieľ < 10 min), % „Niečo sa pokazilo“ podľa AI, % ownerov s ≥1 pozvaným do D14. Všetko sa dá merať na serveri z MCP logu a brain logu (`pm_list_brain_log`) bez AI v platforme.
7. **Živá detekcia pripojenia** (krok 5) nahradí tlačidlo „Setup úspešný“ skutočným signálom; „Niečo sa pokazilo“ sa ukáže pri timeoute.
8. **`/brain/start`** na jednu obrazovku: prompt + skill pre zvolené AI, ostatné AI zbalené, Autofill zlúčiť so Šablónami.

## 2. Easy setup prompt (onboarding agent)

### 2A. Kostra (spoločná)
```
Si môj onboarding agent pre IMPOFAI (task management + second brain cez MCP).
MCP server: https://project-managment.impofai.com/api/mcp   AI: {claude|chatgpt|gemini}  Jazyk: {sk}
Meno: {meno}, rola: {rola}, tím: {velkost}, úlohy v: {pm|clickup|none}

PRAVIDLÁ
- Hovor stručne, jedna otázka naraz, max 15 minút celkom. Po každom kroku zhrň, čo je hotové.
- Nikdy nežiadaj token do chatu a nikdy ho nezapisuj do poznámky.
- Pred každým zápisom do brainu ukáž návrh a počkaj na „áno“. Nič nemaž.
- Ak nemáš nástroje pm_*, zastav sa a doveď ma k pripojeniu konektora (krok 1). Nehraj, že funguje.
- Neoverené funkcie môjho AI (naplánované úlohy, hlas s nástrojmi) označ „over si“ a nesľubuj ich.

CIEĽ = MINIMÁLNY ÚSPEŠNÝ SETUP (hotovo, keď platia všetky 4)
1. pm_get_current_identity funguje (vypíš rolu a scope).
2. Second brain má aspoň: context/firma.md (čo robíme, pre koho), context/ludia.md (ja + 1 až 5 kľúčových ľudí), 1 stránku klienta/projektu.
3. Existuje aspoň 1 naplánovaná úloha, ktorá plní brain (alebo jasný dôvod, prečo to moje AI nevie).
4. Viem, ako ti zavolám hlasom a čo ti môžem povedať.

KROKY
0. Vysvetli v 3 vetách, čo cez MCP vieš (čítať/písať úlohy, čas, second brain) a čo nevieš (platforma nemá vlastné AI).
1. Konektor: daj mi link https://project-managment.impofai.com/mcp (Full-access len na setup) + presný postup pre moje AI. Over pm_get_current_identity.
2. Načítaj pm_get_brain_schema a pm_get_workspace_tree. Interview (max 8 otázok): firma, služby, top 3 klienti, ľudia a role, ako dnes evidujem úlohy, kde žijú dokumenty, aké meetingy mám.
3. Navrhni štruktúru: spaces/foldre/listy v PM a stránky v brainu. Po schválení vytvor.
4. „Čo o mne už vieš“: zhrň, čo vieš z pamäte, histórie a projektov, a ponúkni nahrať to do brainu (po bodoch, so schválením).
5. Inventúra: vypíš konektory, ktoré mám (Gmail, Drive, Kalendár, Fireflies, Slack…), skill impofai-second-brain (nainštalovaný?), naplánované úlohy. Navrhni max 3 šablóny z https://project-managment.impofai.com/brain/start?tab=templates a pomôž mi ich nastaviť.
6. Hlas: vysvetli, ako ťa spustím hlasom na mobile, a daj mi „voice prompt“ (krátke inštrukcie: zbieraj, potvrď nahlas, zapíš po potvrdení). Navrhni 5-minútový interview hlasom na doplnenie medzier.
7. Záver: checklist 4 bodov cieľa (✓/✗), ďalší krok, odporúčanie nahradiť Full token obmedzeným, ak ho nepotrebujeme na admin úlohy.
```

### 2B. Varianty podľa AI (odhad, overiť pred launchom)
| | Claude | ChatGPT | Gemini |
|---|---|---|---|
| Konektor | claude.ai → Settings → Connectors → custom (OAuth, už funguje), Claude Code `.mcp.json` | custom MCP konektor (developer mode / apps), dostupnosť podľa plánu | Gemini CLI vie MCP; v aplikácii Gemini pre bežných používateľov custom MCP **pravdepodobne nie**, takže fallback je Gemini CLI alebo „len chat bez zápisu“ |
| Skill | ZIP `claude/*` (existuje) | ZIP `openai/*` s `agents/openai.yaml` (existuje) | generic `.md` ako inštrukcie Gemu |
| Naplánované úlohy | Cowork Scheduled (šablóny už počítajú) | Scheduled tasks; či volajú MCP: **neoverené** (už značené v `templates.ts`) | scheduled actions v aplikácii; MCP v nich **neoverené** |
| Voice | voice mód v mobilnej appke; dostupnosť konektorov počas hlasu **overiť** | Advanced Voice; nástroje/konektory počas hlasu **overiť** | Gemini Live; MCP **neoverené** |
| Prompt sa líši | krok 5 ponúkne skill ZIP + Cowork | krok 5 dá zápis cez chat, ak scheduled MCP nejde | krok 1 ponúkne Gemini CLI alebo režim „read via export“ |

Ak voice mód nevolá MCP, voice prompt prepne na vzor „**hovor zbiera, vykonáva sa po hovore**“ (zásada z `ai-platforma-ciel.md`): hlas zapíše poznámku a po hovore v texte povie „vykonaj“.

### 2C. Troubleshooting prompty (tlačidlo „Niečo sa pokazilo“)
Podľa príznaku (tabuľka v `connector-setup.sk.md`): žiadne `pm_*`, neplatný token, mimo scope, „Only organization admins“. Každý príznak = 1 krátky prompt + link na konkrétnu obrazovku v PM.

### 2D. Prompt pre pozvaného (read vs. read+write)
```
Si môj asistent pre IMPOFAI v organizácii {org}. Som pozvaný člen, nie owner.
Môj prístup k second brainu: {READ | READ+WRITE}. Používam restricted token.
- Najprv pm_get_current_identity, vypíš, čo vidím (scopes). Zvyšok mi je skrytý, nehádaj ho.
- READ: nič nezapisuj do brainu. Odpovedaj z brainu, úlohy môžem meniť len tam, kde mám EDIT v PM.
- READ+WRITE: zapisuj len ku klientom a projektom v mojom scope; admin kroky (Fireflies, prístupy, mapping) nerob.
- Ak chcem viac: priprav krátku žiadosť pre ownera {owner} (čo, prečo), vytvor ju ako úlohu jemu.
Setup = identita ✓, ranný brief z mojich úloh ✓, voice prompt ✓.
```

## 3. Šablóny (V1 katalóg, 18 položiek)
Legenda AI: C = Claude, G = ChatGPT, Ge = Gemini. „?“ = závisí od neoverenej funkcie. ★ = Marekova.

| # | Názov | Kategória | Pre koho | Hodnota jednou vetou | AI |
|---|---|---|---|---|---|
| 1 ★ | Interviewer: doplň medzery | Chat + voice prompt | owner, manažér | AI prejde brain, nájde chýbajúce (klient bez kontaktu, proces bez vlastníka) a vypýta sa ťa max 10 otázok. | C, G, Ge? |
| 2 ★ | Ranný brief do Google Drive | Naplánovaná úloha | všetci | Každý pracovný deň o 7:30 uloží do Drive 1-stranový brief: dnešné úlohy, meetingy, čo sa zmenilo v brainu. | C, G?, Ge? |
| 3 ★ | Prečítaj mi ranný brief | Voice prompt | všetci | V aute povieš „brief“ a AI ti ho prečíta a spýta sa na priority. | C?, G?, Ge? |
| 4 ★ | Draft e-mailu hlasom | Voice prompt | owner, sales | Nadiktuješ „odpíš Jane, že termín posúvame“ a v Gmaile máš draft v tvojom tóne. | C?, G? |
| 5 ★ | Skill: píš e-maily ako ja | Skill | všetci | Skill sa naučí tón z posledných 50 odoslaných e-mailov a z poznámky klienta v brainu. | C, G |
| 6 | Hlasom zmeň úlohy | Voice prompt | všetci | „Presuň úlohu X na piatok a zapíš 2 h na klienta Y“, AI zopakuje a po potvrdení zapíše. | C?, G? |
| 7 | Fireflies → brain | Naplánovaná úloha (existuje `fireflies-daily-calls`) | owner (full) | Každý meeting sa sám zhrnie na stránku klienta. | C, G? |
| 8 | Nové e-maily → brain | Naplánovaná úloha (existuje) | owner, sales | Dohody z e-mailov končia v brainu, nie v inboxe. | C, G? |
| 9 | Týždenný report klientovi | Naplánovaná úloha | agentúry | V piatok draft reportu z úloh a vykázaného času pre každého klienta. | C, G? |
| 10 | Timesheet pripomienka a doplnenie | Naplánovaná úloha + voice | tím | O 17:00 AI porovná kalendár s vykázaným časom a navrhne chýbajúce záznamy. | C, G? |
| 11 | Príprava na meeting | Chat prompt | sales, PM | 5 minút pred hovorom: história klienta, otvorené úlohy, posledné dohody. | C, G, Ge |
| 12 | Onboarding nového kolegu | Chat prompt | manažér | Z brainu vygeneruje 1-stranový „ako to u nás chodí“ pre nováčika s jeho prístupmi. | C, G, Ge |
| 13 | Z poznámky úlohy | Chat prompt | všetci | Vložíš chaotickú poznámku a AI z nej spraví úlohy v správnom liste s termínmi. | C, G, Ge? |
| 14 | Týždenná kontrola zdravia brainu | Naplánovaná úloha (existuje `brain-health-lint`) | owner | Opraví zlomené odkazy a nahlási duplicity. | C, G? |
| 15 | Skill: indexuj do brainu | Skill (existuje `impofai-second-brain`) | všetci so zápisom | Hocijaký súbor zaradí na správne miesto bez duplicít. | C, G, Ge (generic) |
| 16 | Skill: mapa procesov | Skill | owner | Pri popise „ako robíme X“ zapíše proces (kroky, kto, nástroje) do `context/procesy/`. | C, G |
| 17 | Tip: 1 projekt = 1 Claude Project / GPT | Tip | všetci | Inštrukcie a MCP v projekte, aby AI vždy vedelo, ku ktorému klientovi patrí. | C, G |
| 18 | Tip: Full vs. restricted token | Tip | owner | Kedy full (setup, admin úlohy) a kedy restricted (každodenná práca, kolegovia). | všetky |

Ostatných 7 existujúcich šablón ostáva pod filtrom „Plnenie brainu“. Filtre: kategória, AI, rola. Na vrchu 3 odporúčané podľa onboardingu.

## 4. Landing page pre reklamy

**Hlavný value prop:** *Tvoje AI konečne pozná tvoju firmu. Second brain a úlohy, ktoré sa plnia z tvojej každodennej práce s Claude, ChatGPT alebo Gemini. Bez ďalšieho AI predplatného.*

**Headline varianty (A/B):**
- SK: „Daj svojmu AI pamäť o tvojej firme.“ / „Povedz to AI. Zapíše sa to samo.“ / „Prestaň vysvetľovať AI kontext. Každý deň odznova.“
- EN: „Give your AI a memory of your company.“ / „Say it to your AI. It lands in your projects.“ / „Stop re-explaining your business to ChatGPT.“

**Sekcie:**
1. **Hero:** headline, subline, CTA „Vyskúšaj 30 dní zadarmo“ (bez karty, ak to Stripe flow dovolí), sekundárne „Pozri 90 s video“. Grafika: telefón s voice módom („presuň úlohu na piatok“) → šípka → strom úloh a poznámka v brainu sa rozsvieti.
2. **Problém (3 ikony):** AI zabúda; kontext je v hlavách a e-mailoch; ďalší nástroj s ďalším AI.
3. **Ako to funguje (3 kroky):** Pripoj svoje AI (MCP) → Pracuj ako zvyčajne, naplánované úlohy plnia brain → Hovor s AI hlasom, ono mení úlohy a píše drafty. Grafika: slučka z onboardingu 1A/1.
4. **Use-case karty s mockupom:** ranný brief, e-mail hlasom, meeting → brain, timesheet.
5. **Pracuje s tvojím AI:** logá Claude, ChatGPT, Gemini, ClickUp, Fireflies, Gmail, Drive s poznámkou „cez MCP“ (pri Gemini „čoskoro / cez CLI“, kým to nie je overené).
6. **Bezpečnosť:** platforma nemá vlastné AI, prístupy na space/folder, restricted tokeny, EU hosting (overiť).
7. **Sociálny dôkaz:** V1 nemá zákazníkov, takže: (a) „Používame to v IMPOFAI každý deň“ s reálnymi číslami (počet poznámok, hovorov), (b) 3 až 5 citátov beta používateľov (zozbierať pred kampaňou), (c) počítadlo „X firiem v triale“ až pri > 50. Nevymýšľať logá ani recenzie.
8. **Cenník (3 stĺpce):**
   - **Team: 6 €/seat/mesiac**, všetko z V1 (PM, timetracking, second brain, MCP, šablóny), 30 dní zadarmo. Zvýraznený.
   - **Always-on: 45 €/seat/mesiac**, proaktívni agenti, AI hovory, custom konektory, dashboardy. Odznak „Vypredané, zapíš sa na čakaciu listinu“ (zbiera e-maily a meria dopyt).
   - **Enterprise:** custom aplikácie a automatizácie, „Dohodnime hovor“.
   - Pozn.: `app/(public)/pricing/page.tsx` dnes uvádza 4 €, treba zjednotiť.
9. **FAQ:** Potrebujem platené AI? Funguje to s ChatGPT/Gemini? Čo je MCP? Kto vidí moje dáta? Čo po triale (zámok, export)? Môžem ostať na ClickUp? Je AI agent seat? Funguje hlas po slovensky?
10. **Záverečné CTA:** „Za 10 minút má tvoje AI pamäť. 30 dní zadarmo.“ + tlačidlo.

Pravidlá: jedno farebné CTA, signup len e-mail + heslo (alebo Google), UTM uložiť k účtu a merať aktiváciu podľa kampane.

## 5. Kde ma zaujatosť zavádza
- **Zjednodušujem realitu AI klientov.** Flow „vlož prompt, hotovo“ predpokladá, že konektory, naplánované úlohy a hlas s MCP fungujú všade rovnako. Pravdepodobne nie. Riziko: v reklame sľúbime hlasového asistenta, ktorý v ChatGPT/Gemini nepôjde.
- **Optimalizujem signup a aktiváciu, nie retenciu a plnenie brainu po 30 dňoch.** Skutočná hodnota je dlhodobé plnenie, ktoré onboarding nezmeria. Moja metrika „3 zápisy v 2 dňoch“ je len proxy.
- **Bezpečnosť ustupuje konverzii.** FULL token „len na setup“ je pohodlný, ale reálne ostane navždy. Živá detekcia a 1-klik akcie skracujú premýšľanie o prístupoch, čo je pri firemných dátach nebezpečné.
- **Vek a ďalšie „trenie“ škrtám reflexívne.** Marek môže mať dôvod (segmentácia, vekové obmedzenia Anthropic/OpenAI pre neplnoletých), ktorý nevidím.
- **Landing v B2C štýle.** Majiteľ firmy chce dôveru (referencie, demo hovor), nie chytľavý headline; „vypredané“ môže pôsobiť ako trik.
- **18 šablón je veľa**, no katalóg je aj predajný argument. Konflikt nechávam otvorený.
