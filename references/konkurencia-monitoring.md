# Monitoring konkurencie — ako to funguje

Postavené 2026-09-14. Týždenné sledovanie zmien na weboch konkurencie IMPOFAI s automatickým reportom do second brainu. Trhový profil je v [[konkurencia]].

## Princíp

Porovnávanie robia **dva deterministické skripty**, nie jazykový model. Claude číta až hotový rozdiel.

### Vrstva A — objavovanie URL (`scripts/konkurencia-urls.mjs`)

Zistí, aké stránky na webe vôbec existujú — **nezávisle od toho, či na ne niekde vedie odkaz.** Reťaz zdrojov, prvý ktorý zaberie vyhrá:

1. `robots.txt` → direktíva `Sitemap:` (zachytí aj netypické cesty, napr. `mrdigital.sk/sitemap` bez prípony)
2. bežné cesty: `/sitemap.xml`, `/sitemap_index.xml`, `/sitemap`, `/sitemap-index.xml`, `/sitemap.txt`
3. sitemap index → vnorené sitemapy
4. RSS / Atom / WordPress `wp-json`

Každý krok najprv priamo, pri zlyhaní cez Jina reader. Porovnáva sa množina URL: **nová URL = nová stránka**, aj keď na ňu nikde nevedie odkaz. Zmenený `lastmod` = prepísaná stránka.

### Vrstva B — porovnanie textu (`scripts/konkurencia-scan.mjs`)

Stiahne sledované stránky cez Jinu, znormalizuje ich a spraví riadkový diff oproti minulému týždňu. Zachytáva zmenu ceny a claimu.

### Vrstva C — interpretácia (scheduled task, pondelok 07:17)

Claude spustí oba skripty, prečíta oba diffy (spravidla pár desiatok riadkov), pri zaujímavej novej URL stiahne **tú jednu stránku**, klasifikuje zmeny, zapíše report a prestaví brain.

Dôvod tohto delenia: LLM, ktorý týždenne číta 16 webov, je drahý, nereprodukovateľný a občas si vymyslí zmenu, ktorá sa nestala. Diff je exaktný a lacný. Model sa používa len tam, kde má prevahu.

## Kde čo leží

| Cesta | Čo to je | V gite | V 3D brainne |
|---|---|---|---|
| `data/konkurencia/watchlist.json` | konfigurácia: firmy a ich stránky | **áno** | nie |
| `data/konkurencia/snapshots/` | surový normalizovaný text sledovaných stránok | nie | **nie** |
| `data/konkurencia/urls/` | zoznam všetkých URL na webe + `lastmod` | nie | **nie** |
| `data/konkurencia/diffs/` | strojové rozdiely, vstup pre Claude | nie | **nie** |
| `context/konkurencia.md` | živý profil trhu, kanonický zdroj | **áno** | **áno** |
| `context/konkurencia/<dátum>.md` | týždenný report, to čo čítaš | nie | **áno** |

Surový scrape do second brainu **nejde zámerne**. Baseline má 408 kB textu zo 16 stránok. Keby sa to ingestovalo, 31 kurátorovaných poznámok by zaniklo pod hromadou cudzieho marketingového textu a globus by prestal byť čitateľný. Preto surové dáta žijú mimo `context/` a do brainu vstupuje len destilát: jeden profil trhu a krátke týždenné reporty.

## Watchlist

Osem firiem: 16 sledovaných stránok na text a 1 394 objavených URL na zoznam.

| Firma | Zdroj URL | URL |
|---|---|---|
| WEBIZE | `/sitemap.xml` cez Jinu (priamy fetch web blokuje) | 23 |
| MR Digital | `/sitemap` — netypická cesta z `robots.txt` | 123 |
| AIAI.SK | `/sitemap.xml` | 72 |
| Apertia.ai | `/sitemap.xml` | 472 |
| chatbotnamieru.sk | sitemap index | 83 |
| iWorker | `/sitemap.xml` | 38 |
| Artemina | `/sitemap.xml` | 32 |
| Slovensko.ai | sitemap index | 574 |

Pridanie firmy = pridať záznam do `watchlist.json` (vrátane poľa `site` s doménou), skripty sa prispôsobia samy a prvý beh ju založia ako baseline.

## Ako to spustiť ručne

```bash
node scripts/konkurencia-urls.mjs                 # objav URL a porovnaj zoznam
node scripts/konkurencia-scan.mjs                 # porovnaj text stránok
# --baseline  = nová základňa, neporovnáva
# --only webize = jedna firma
```

## Normalizácia — čo sa zahadzuje

Aby sa týždeň po týždni nehlásil šum: hlavičky Jina readera, cookie lišty, copyright, osamotené dátumy a časy, query parametre a fragmenty v URL (často obsahujú tokeny), viacnásobné medzery, bezprostredné duplicity riadkov. Preusporiadanie sekcií sa **zámerne nehlási** — nie je to zmena obsahu.

## Známe obmedzenia

- **Scheduled task beží len keď je appka otvorená.** Ak je v pondelok ráno zavretá, beh sa spustí pri najbližšom štarte.
- **Diff je multimnožinový, nie kontextový.** Zmenená veta sa objaví raz v `pridane` a raz v `odstranene`. Pre interpretáciu to stačí, na presné „pred → po" na úrovni slov nie.
- **Závisí to na Jina readeri.** Ak vypadne alebo zmení formát, zlyhá celý zber. Skript to nahlási v `failures`, nevymyslí si obsah.
- **Nezalinkovaný článok sa nájde len vtedy, ak je v sitemape alebo vo feede.** To je pri všetkých ôsmich splnené. Ak by niekto sitemapu zrušil, zostane len textový diff sledovaných stránok a nezalinkovaný obsah by nám unikol.
- **Sitemapa sa aktualizuje s oneskorením.** Väčšina CMS ju generuje pri publikovaní, niektoré až v nočnej dávke. Článok vydaný v nedeľu večer sa v pondelkovom skene objaviť nemusí.
- **`lastmod` je nepovinný a niekedy klame.** iWorker ho nemá vôbec, takže tam sa zachytí len nová a zmiznutá URL, nie prepísaná. Niektoré CMS ho naopak prepisujú pri každom deploy, čo vyrába falošné poplachy.
- **Jina reader odmieta browserový User-Agent** — vracia 403. Skripty preto posielajú `impofai-competitor-monitor` na Jinu a browserový UA pri priamom fetchi. Nemeň to bez otestovania.
- **Stránky s prihlásením alebo za paywallom sa nedajú sledovať vôbec.**

## Prvý beh — 2026-09-14

Vrstva A: **1 394 URL** z 8 domén, nula firiem bez zdroja.
Vrstva B: 16 stránok, nula zlyhaní, 408 kB textu.

Obe vrstvy overené simuláciou: podstrčený minulotýždňový snapshot so zmenenou cenou, odobranými článkami a starším `lastmod` — systém zachytil zmenu ceny, dva nové články aj prepísanú stránku. Prvý reálny rozdiel vznikne v pondelok **2026-09-21**.

---

## Otvorené otázky

1. **Pridať české firmy?** Apertia ukazuje, že českí hráči cielia na SK trh.
2. **Sledovať LinkedIn a nábor?** Nábor je najskorší signál rastu konkurenta, ale LinkedIn sa cez Jina reader spoľahlivo čítať nedá.
3. **Sledovať Google hodnotenia a počty recenzií?** MR Digital nimi argumentuje (4,9★), zmena by bola merateľná.
4. **Má sa report posielať aj e-mailom?** Teraz príde len ako notifikácia v appke.
