# P3 Roadmapa (pohľad: produktový ship-now)

Východisko: ranný brief beží, ale je krehký. **Dnešný brief 18. 10. nezavolal**: `claude -p` padol po 9 s na „Failed to refresh OAuth token: another Claude Code process is refreshing it“ (`~/.aios-runner/runs/morning-brief/2026-10-18T06-30-02-069Z/run.json`) a runner to neskúsil znova. Z prepisov (16. a 17. 10.) vyplýva: Marek sa pýta na detaily, ktoré brief nemá („aké presne úlohy dokončil Andrii“, „aký účet to je“), agent nepozná projekty mimo zmien („projekt IME“), followup nevie dokončiť akciu, keď chýba prístup (Leo nie je priraditeľný v PlusReality / AI Bugs), a 8 z 10 otázok o platforme ostáva bez odpovede. Followup dnes nikdy nezavolá späť, výsledok sa Marek dozvie až v ďalšom briefe.

Všetky odhady sú odhady (dni práce agentov, nie kalendárne dni).

## 1. Fázy 0–6

### Fáza 0: Spoľahlivosť toho, čo už beží
- **Cieľ:** brief príde každý pracovný deň, a keď nepríde, Marek to vie do 9:15.
- **Obsah:** retry pri prechodnej chybe OAuth refreshu (2× po 60 s); alert pri vynechanom hovore (SMS/hovor/úloha urgent); denný „dead-man“ záznam, že cron tikol; dať Leovi prístup do PlusReality / AI Bugs (otázka do briefu, nie svojvoľne).
- **Hotovo =** simulovaná chyba refreshu → beh uspeje na 2. pokus; vypnutý telefón → v AI Bugs vznikne úloha do 15 min; 5 pracovných dní po sebe brief zavolal.
- **Závislosti:** žiadne. **Odhad:** 0,5–1 deň. **Kde:** AIOS runner. (Robí sa ako balík E vo fáze 1.)

### Fáza 1: Hlasová slučka „zavolaj – urobí – zavolá späť“ + lepší brief
- **Cieľ:** Marek z telefónu zadá úlohu a do 30 min dostane hovor s výsledkom; brief pokryje všetky aktívne projekty; otvorené otázky sa systematicky pýtajú.
- **Obsah:** prichádzajúci hovor k osobnému asistentovi; spätný hovor po followupe; brief so zoznamom všetkých aktívnych projektov a detailmi úloh; fronta otvorených otázok; spoľahlivosť z fázy 0.
- **Hotovo =** viď sekcia 2. **Závislosti:** fáza 0 (súbežne). **Odhad:** 2–3 dni. **Kde:** AIOS runner + ElevenLabs.

### Fáza 2: Prvý serverový agent (1 projekt)
- **Cieľ:** „Klient chce zmenu X na projekte Y“ v hovore → task s `prompt` → Claude Code na serveri projektu → `preview_url` v aktivite tasku → spätný hovor.
- **Obsah:** výber projektu (návrh: Zacharides/Imagewell e-shop, kde už pracuje Marek s AI agentom); worker, ktorý berie tasky s `agent_run_status=queued`; otázky serverového agenta idú do fronty otázok z fázy 1; žiadne nasadenie do produkcie, len preview.
- **Hotovo =** 3 reálne zmeny od hovoru po preview URL bez Mareka pri PC; každá má v PM stav `needs_review` a preview odkaz.
- **Závislosti:** fáza 1 (slučka a fronta otázok), rozhodnutie o prvom serveri. **Odhad:** 4–6 dní. **Kde:** runner na serveri projektu + polia v PM (už existujú).

### Fáza 3: Viditeľnosť v PM
- **Cieľ:** to, čo agent robí, je vidieť a dá sa opraviť v PM, nie v `~/.aios-runner`.
- **Obsah:** stránka „Môj agent“ v PM: hovory, vykonané/preskočené akcie, fronta otázok (odpovedať klikom), behy procesov; zápis behov cez `pm_update_agent_run`; drafty e-mailov v Marekovom štýle so schválením hovorom.
- **Hotovo =** Marek nájde výsledok včerajšieho hovoru v PM do 2 klikov; odpoveď na otázku v PM sa prejaví v ďalšom briefe.
- **Závislosti:** fázy 1–2 (dáta, ktoré sa zobrazia). **Odhad:** 5–8 dní. **Kde:** PM aplikácia.

### Fáza 4: Druhý používateľ
- **Cieľ:** jeden kolega (návrh: Leo alebo Andrii) má vlastný brief a vie zavolať agentovi.
- **Obsah:** konfigurácia per používateľ (číslo, zdroje, token RESTRICTED na jeho spaces); rozhodnutie „kde agenti bežia“ prakticky: centrálne na tomto serveri, oddelené adresáre a tokeny; pravidlo „komu smie agent volať“ = len vlastníkovi.
- **Hotovo =** 10 pracovných dní briefov u druhého človeka, žiadny únik dát mimo jeho rozsahu (test cez token scope).
- **Závislosti:** fáza 3 (aby kolega nemusel do servera). Predplatné: kolega potrebuje vlastný Claude login, alebo beží na Marekovom (otvorená otázka). **Odhad:** 5–10 dní. **Kde:** runner + PM (konfigurácia).

### Fáza 5: Interview kampane a mapa procesov
- **Cieľ:** týždenný check-in hovor s tímom, odpovede v second braine a v mape firmy.
- **Obsah:** `voice-interview` rozšíriť na viac ľudí a opakovanie; šablóny otázok; manažérsky súhrn.
- **Hotovo =** 2 týždne check-inov s ≥ 3 ľuďmi, súhrn v briefe.
- **Závislosti:** fáza 4. **Odhad:** 5–8 dní. **Kde:** runner + PM.

### Fáza 6: Sieť agentov a produkt
- **Cieľ:** agenti si posielajú úlohy a knowledge s povoleniami; chat ľudia+agenti; konektory a aplikácie; predplatné a trial pre iné organizácie.
- **Hotovo =** definuje sa po fáze 4 podľa skutočného používania.
- **Odhad:** 15+ dní. **Kde:** PM aplikácia.

## 2. Fáza 1 podrobne

Rozsah: len AIOS runner a ElevenLabs. Žiadny zásah do PM kódu. Rozhranie medzi balíkmi je dohodnuté vopred (kontrakty nižšie), aby mohli bežať paralelne.

**Kontrakt K1 – výstup `call-followup` (nové pole):** `callback: { needed: bool, summary: string, done[]: string, questions[]: {id, question, why} }`. `needed=true`, keď hovor bol prichádzajúci (`kind: "inbound"`) alebo spätný a vznikli nové výsledky či otázky.
**Kontrakt K2 – fronta otázok:** poznámka v second braine `context/otvorene-otazky.md` (tabuľka: id, otázka, prečo, téma, stav open/answered, odpoveď, zdroj). Brief ju číta, followup ju aktualizuje.

### Balík A – Prichádzajúci hovor
- **Vlastní:** `processes/inbound-call/` (`process.json`, `after.mjs`), `runner/eleven-conversations.mjs` (nový), ElevenLabs agent „IMPOFAI - Osobný asistent (prichádzajúci)“ (nový, klon).
- **Vstupy:** ElevenLabs API (zoznam konverzácií podľa agenta), `startFollowup` z `runner/voice-call.mjs` (len volá, nemení).
- **Výstupy:** proces `claude: false`, `schedule: "*/5 * * * *"`, ktorý nájde dokončené prichádzajúce konverzácie od `lastSuccessAt` a spustí `call-followup` s `kind: "inbound"`. Agent má statický prompt: vypočuj, zopakuj, potvrď každú úlohu, nič nevykonávaj počas hovoru.
- **Prepnutie čísla:** Linphone číslo je pre prichádzajúce priradené testovacej Petre (PlusReality). Prepnutie sa nespraví bez súhlasu, otázka ide cez balík D do najbližšieho briefu („Môžem prepnúť prichádzajúce hovory z Petry na tvojho asistenta?“). Do súhlasu sa testuje odchádzajúcim hovorom na nového agenta.
- **Test:** Marek zavolá na Linphone, povie „vytvor úlohu X v StartFin“, do 10 min je v `~/.aios-runner/runs/call-followup/` beh s `kind: inbound` a úloha v PM.

### Balík B – Spätný hovor
- **Vlastní:** `processes/callback/` (`process.json`, `after.mjs`), `processes/call-followup/after.mjs` (nový).
- **Vstupy:** K1 z `output.json` followupu; `placeCallAndWait` z `voice-call.mjs`.
- **Výstupy:** po followupe s `callback.needed` sa spustí `callback`: zavolá, povie výsledok (`done`), preskočené akcie s dôvodom, položí `questions`. Jeho prepis ide znova do followupu (`kind: "callback"`). Poistky: max 3 spätné hovory na deň, ticho 21:00–7:30 (presun do briefu), nezdvihnutý hovor = položky sa presunú do briefu.
- **Test:** po teste balíka A zazvoní telefón do 30 min od konca hovoru; agent povie kľúč vytvorenej úlohy a aspoň 1 otázku; odpoveď sa zapíše.

### Balík C – Lepší brief
- **Vlastní:** `processes/morning-brief/prompt.md`, `schema.json`, `after.mjs`, `process.json`.
- **Vstupy:** dnešný prompt; prepisy 16.–17. 10. (zoznam otázok, na ktoré brief nevedel odpovedať).
- **Výstupy:** nová sekcia `projects[]` = **všetky aktívne projekty** (aj bez zmeny: „bez zmeny od X, otvorené: N, najbližší termín, kto“); pri každej spomenutej úlohe kľúč, názov, popis v 1–2 vetách, riešiteľ, stav, termín; pri e-mailoch odosielateľ, účet, konkrétne čísla; aliasy projektov (Imagewell = Zacharides). Hlasový agent: najprv krátko, detaily na požiadanie. Čítanie `context/otvorene-otazky.md` (K2), 2–3 najstaršie otvorené otázky do `questions`.
- **Test:** ručný beh `node runner/run.mjs run morning-brief` (posunie obdobie, preto ideálne raz, mimo 9:00); Marek v hovore položí 3 otázky typu „čo presne dokončil Andrii“ a agent odpovie bez „to nemám“. Kontrola: `output.json` má každý aktívny space z `pm_get_workspace_tree`.

### Balík D – Fronta otvorených otázok
- **Vlastní:** `processes/call-followup/prompt.md`, `processes/call-followup/schema.json`, poznámka `context/otvorene-otazky.md` (prvé naplnenie).
- **Vstupy:** nezodpovedané otázky z followupov 16.–17. 10. (8 platformových + Leo, free trial, „IME“); K1, K2.
- **Výstupy:** followup po každom hovore označí zodpovedané otázky (s citátom), pridá nové a vyplní `callback` podľa K1. Pri preskočenej akcii (napr. chýba prístup) vytvorí otázku namiesto ticha.
- **Test:** po teste balíka C je v poznámke aspoň 1 otázka `answered` s citátom z hovoru a ďalší brief sa na ňu už nepýta.

### Balík E – Spoľahlivosť (fáza 0)
- **Vlastní:** `runner/core.mjs`, `runner/run.mjs`, `runner/cron.mjs`.
- **Výstupy:** retry `claude -p` pri prechodnej chybe refreshu a pri sieťových chybách MCP (max 2×); stav `missed` pri hovore, ktorý sa neuskutočnil, s úlohou urgent v AI Bugs; denný záznam „tick žije“.
- **Test:** unit test na rozpoznanie chyby z `run.json` 18. 10.; ručný beh s vypnutým Linphone → úloha v AI Bugs.

**Poradie testu Marekom (telefón, ~15 min):** brief ráno (C, D) → Marek zavolá s úlohou (A) → spätný hovor (B) → ďalší brief nehovorí o vybavených veciach.

## 3. Čo zámerne odkladáme a prečo
- **Akcie počas hovoru** (server tools): rozhodnutie vlastníka, hovor len zbiera; post-call stačí.
- **AI chat v PM, Slack/WhatsApp:** nový kanál bez dôkazu, že hlas nestačí; rozhodnutie o chate je otvorené.
- **Multi-tenant, predplatné, trial:** hlas je test mimo produkcie; najprv jeden používateľ, potom druhý.
- **Custom konektory, aplikácie, dashboardy:** nemajú používateľa, kým slučka nebeží spoľahlivo.
- **Sieť agentov a volanie kolegom:** vyžaduje povolenia a druhého používateľa (fáza 4).
- **Post-call webhook do PM:** polling cez cron stačí a nepotrebuje verejný endpoint.
- **Nasadenie do produkcie serverovým agentom:** len preview, kým nie je rozhodnuté.

## 4. Metriky úspechu na 3 mesiace (návrh, nepotvrdené)
1. Brief zavolal v ≥ 95 % pracovných dní; každé vynechanie nahlásené do 15 min.
2. Marek zadá agentovi hovorom ≥ 5 úloh týždenne.
3. ≥ 80 % potvrdených akcií vykonaných bez ručnej opravy (podiel `actions_skipped`).
4. Medián od konca hovoru po spätný hovor ≤ 30 min.
5. Platformové otázky: 0 otvorených starších ako 7 dní.
6. ≥ 10 zmien kódu dodaných serverovým agentom ako preview URL.
7. ≥ 1 ďalší človek používa brief 4 týždne.
8. Marek sám odhaduje úsporu ≥ 45 min denne (otázka v piatkovom briefe).

## 5. Kde ma moja zaujatosť zavádza
- **Lokálne optimum na Marekovom serveri.** Všetko staviam v AIOS runneri a cez cron. To je rýchle, ale je to jednopoužívateľský nástroj; presun do PM (fáza 3–4) bude refaktor, nie rozšírenie. Architekt by mal skôr určiť, čo z runnera je dočasné.
- **Odkladám otázky, ktoré sú drahé neskôr:** kde agenti bežia, povolenia medzi agentmi, model predplatného. Zlé predpoklady sa vo fáze 4 môžu ukázať ako nemožné (napr. jeden Claude login pre viac ľudí).
- **Polling a cron ako „dosť dobré“:** zdržanie 5 min a závislosť od jedného servera; ak padne server alebo login, padne všetko naraz.
- **Hlas ako hlavné rozhranie** vychádza z troch hovorov a Marekovho nadšenia; prepisy ukazujú prerušenia a nedorozumenia (STT). Môže sa ukázať, že na úlohy je lepší text.
- **Bezpečnosť:** agent smie aj mazať a financie; rýchla slučka bez prehľadu v PM (fáza 3 až neskôr) znamená, že chybu z prepisu nikto nezachytí včas. Opatrnejší by fázu 3 dal pred 2.
- **Odhady dní** sú optimistické, hovory a ElevenLabs sa testujú len s Marekom pri telefóne.
