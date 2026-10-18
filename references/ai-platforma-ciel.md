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
