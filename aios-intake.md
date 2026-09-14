# AIS-OS Intake

This is the source-of-truth file for your AIOS. Fill it in by typing, voice-pasting (Wispr Flow / OS dictation), or running `/onboard` for a guided conversation. Whichever mode, this file is what `/onboard` reads to scaffold your Day-1 setup.

**Hard cap: 7 questions.** Each answerable in under 60 seconds. Don't overthink — you can edit and re-run `/onboard` any time.

---

## Resume point — aktualizované 2026-09-13

- **Hotové:** Q1 (identita/ponuka/ICP), Q2 (2 voice vzorky, verbatim), Q3 (priority — 3 deadliny chýbajú)
- **Zostáva:** Q4 (príjmy + kde sa sledujú), Q5 (komunikačné kanály), Q6 (meetingy/dokumenty), Q7 (najväčší časožrút + kde sa trackujú tasky)
- **Otvorené z Q3:** doplniť deadliny pre StartFin, Zacharides-eshop, Gartner. Overiť, či Bridgit free-tier naozaj nepatrí do tohto kvartálu.
- **Ako pokračovať:** spusti `/onboard` — preskočí Q1-Q3 a nadviaže na Q4. Scaffold (context/, references/voice.md, connections.md, CLAUDE.md) sa spustí až po doplnení zvyšku.

---

## Q1 — Who are you, what do you sell, who do you sell it to?

Identity, offer, ICP. One paragraph each is fine.

```
Identita: Vediem IMPOFAI, s.r.o. — softvérovo-AI konzultačnú firmu na Slovensku. Popri tom študujem informatiku (Ing.) na TUKE.

Ponuka: IMPOFAI funguje ako externý AI-špecializovaný tím. Pomáhame firmám implementovať AI do ich procesov; v praxi robíme custom zákazky pre firmy, zväčša zamerané na AI softvér. Konkrétne: AI agenti a chatboty, Power BI / DAX analytika, zákazkový softvér. Vlastný produkt: Bridgit — slovenská B2B analytická platforma (hlavný build).

ICP: Slovenské firmy, ktoré chcú nasadiť AI do svojich procesov a nemajú na to interný tím.
```

---

## Q2 — Paste 1-2 things you've written recently. Don't edit them.

An email, a LinkedIn post, a DM, a doc — anything that sounds like you when you're not trying. **Paste verbatim.** Do not type these mid-conversation with Claude — chat-shaped samples are worse than no samples (voice contamination).

```
Moja predstava je ze chcem mat jedneho AI agenta na mobile ktory bude moct volat Claude agenta na jednotlivych sertveroch.

Pretoze mam viacero serverov na ktorych mam claude agentov ako vscode extencion, viem ich ale normalne nainstalovat na kazdy server.

Kedze mam tolko projektov, chcel by som cez jedneho agenta - idealne cez claude aplikaciu na mobile ovladat vsetkych AI agentov na vsetkych serveroch.

To znamena ze by som vybral projekt a napisal by som mu co chcem zmenit.


Vsetky projekty su webove aplikacie takze ich potrebujem aj testovat. Kedze su na serveri tak vie agent na serveri vytvorit
```

```
AK ma jedno z erp ktore potporujeme tak navrhujem mu dat na vyber plany a dat mu tam aj moznost Zadarmo na 10 dni.

V tom plane zadarmo na 10 dni bude mat aj 20 tokenov a vyskusanie AI funkcii a autmaticky bude mat aj vytvorene reporty. Pocas tych 10dni moze aj dokupovat tokeny, ale akonahle skonci tych prvych 10 dni tak mu vypise na obrazovku ze mu skoncil free tier a ak chce pokracovat tak si musi vybrat plan.

 Ak nema ani jedno ERP tak by som mu chcel dat moznost vlozit vlastne vyexportovane data ktore by sa nahrali do bigquery a agenti by vedeli fungovat nad big query. Takze by dokazal vytvorit aj vlastne reporty v builderi. Taktiez by to mal na 10 dni zadarmo pocas ktorych by mohol kupovat kredity.

Ak nema ani erp ani vyexportovane data po ruke tak by trebalo mu but dat pristup ku demo organizacii aby si na vymislenych datach poskusal nieco a potom by ho to stoplo a pytalo nech nahra vlastne data alebo nech pripoji erp alebo nech kontaktuje nas a my mu to nastavime.

popripade Demo video alebo demo call by tam mal mat ako dalsie moznosti.

Tym padom hociakeho klienta ktory by prisiel na stranku by vedel nejakym sposobom vyskusat bridgit a pochopit ci to pre neho ma vyznam.

Na to ale musim este dokoncit to vytvaranie organizacie cez ERP, a vytvorit moznost nahrania vlastnych dat, vytvorenia databazy v big query a vytvorenia MCP nad bigquery(nebude to zlozite), pridanie MCP kontektora bigquery pre agentov.

Dobre by bolo aj pridat sprievodcu pre noveho pouzivatela ktory mu vysvetli vsetky features.
Zaroven by som este chcel pridat tu analyzu dat na uvod a personalizovane navrhy pre vsetky funkcie (rovno ukazovane v sprievodcovi).

Tym padom budu mat pouzivatelia nulovu brieru na zacatie pouzivania Bridgit a hned uvidia moznosti s ich datami.
mozme si urcit kolko tokenov by sme im dali zadarmo ale 20 bridgit tokenov stoji €8.70.

Co si o tom myslis?
```

---

## Q3 — What are your 2-3 biggest priorities for the next 90 days?

Quarterly priorities. Not yearly aspirations. Things that, if not done by July, would make you say "I wasted Q2."

```
1. AI workshop pre klienta Jakuba Kralovanského — 19. septembra 2026. Pripraviť sa a odviesť ho.
2. Dokončiť projekt StartFin. (deadline: TBD)
3. Dokončiť Zacharides — eshop. (deadline: TBD)
4. Dokončiť projekt pre Gartner. (deadline: TBD)

Poznámka: Bridgit free-tier / onboarding flow (popísaný vo vzorke Q2) NIE je medzi Q4 2026 prioritami — je to backlog, nie tento kvartál.
```

---

## Q4 — Where does revenue actually land, and where is it tracked?

Multiple answers OK. Stripe? Skool? GoHighLevel? QuickBooks? A spreadsheet?

```
[Your answer here]
```

---

## Q5 — Where do you talk to customers, your team, and the outside world day-to-day?

Email (which one — Gmail / Outlook)? Slack? Teams? DMs (Skool / Discord / iMessage)? Phone?

```
[Your answer here]
```

---

## Q6 — Where do meeting recordings, notes, and important docs live?

Granola? Otter? Fireflies? Google Drive? Notion? Dropbox? A folder on your desktop you keep meaning to organize?

```
[Your answer here]
```

---

## Q7 — What's the one task that eats your week, and where do you currently track work?

The single biggest time-suck or recurring drudgery. Plus where tasks/projects live (ClickUp / Asana / Linear / Notion / a notebook).

```
[Your answer here]
```

---

When this file is filled, run `/onboard` (or re-run it) and the wizard will scaffold your Day-1 file set: `context/`, `references/voice.md`, populated `connections.md`, and a filled `CLAUDE.md`.
