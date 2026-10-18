# P4 Červený tím: review P1 a P3 (kolo 2)

## Pre P1

**1. Spoločné predplatné pre celú organizáciu**
- **Kde:** §4 „1 org = 1 až N ComputeAccountov, osobní agenti ich zdieľajú cez frontu“. K tomu tlačidlo „Pripojiť predplatné“, ktoré v PM spúšťa `claude setup-token` a zobrazuje device kód.
- **Čo je zle:** nejde o šedú zónu, podmienky to výslovne zakazujú. Podľa [Legal & compliance](https://code.claude.com/docs/en/legal-and-compliance) nesmie tretia strana smerovať požiadavky cez Free/Pro/Max „on behalf of their users“. Takisto nesmie „collect, store, or intermediate Claude.ai credentials or session tokens“ a každý koncový používateľ sa musí prihlásiť sám. PM, ktoré drží tokeny a delí jeden Max medzi ľudí, porušuje oboje.
- **Čo zmeniť:**
  - `ComputeAccount` patrí jednému človeku (`ownerUserId` je povinný) a nezdieľa sa;
  - pre produkt sa pripraví druhá cesta cez API kľúč alebo Bedrock;
  - prihlásenie robí používateľ sám v neupravenom Claude Code, PM tokeny nezbiera.
- **Istota:** vysoká (primárny zdroj).

**2. Kto určuje riziko akcie**
- **Kde:** §3a, krok 6, „LOW sa vykoná hneď, HIGH len s doslovným potvrdením“ a §5 „Approval… kontrolu robí MCP vrstva“.
- **Čo chýba:** nie je jasné, kto riziko klasifikuje. Ak ho určí model vo followupe, kontrola v MCP nič nerieši.
- **Čo zmeniť:** riziko sa určí podľa mena nástroja v kóde, napr. tabuľka `pm_delete_*` → DELETE.
- **Istota:** vysoká.

**3. Prompt injection chýba úplne**
- **Kde:** §3a. Brief číta Gmail, followup dostane FULL token majiteľa.
- **Čo chýba:** cudzí text z e-mailu ide cez `call_content` do agenta s právami na mazanie. Návrh to nikde nespomína.
- **Čo zmeniť:**
  - za potvrdenie sa berú iba turny `user` z prepisu;
  - obsah z konektorov sa do followupu posiela označený ako dáta;
  - followup nemá Gmail nástroje.
- **Istota:** vysoká.

**4. MCP brána ku Gmailu**
- **Kde:** §4 a F4.
- **Čo je zle:** `gmail.readonly` je restricted scope, takže pre externých používateľov treba Google verifikáciu vrátane bezpečnostného auditu. Táto cena v návrhu chýba.
- **Čo zmeniť:** pre interné použitie stačí Workspace aplikácia s typom „Internal“. Pre produkt to treba započítať.
- **Istota:** stredná (z pamäti, neoverené webom).

**5. Nasadenie do produkcie cez `Approval(risk=HIGH)`**
- **Kde:** §3c, krok 5.
- **Čo je zle:** keď sa produkcia schvaľuje hlasovým „áno“, prod deploy stojí na STT.
- **Čo zmeniť:** do produkcie ide len merge PR človekom. Agent nemá prod tajomstvá.
- **Istota:** vysoká.

## Pre P3

**1. Prichádzajúci hovor bez overenia volajúceho**
- **Kde:** balík A.
- **Čo je zle:** kto sa dovolá na číslo, môže zadávať príkazy s Marekovými plnými právami, vrátane mazania. Caller ID sa dá podvrhnúť a ElevenLabs agent volajúceho neoveruje.
- **Čo zmeniť:**
  - prijímať len zo známej SIP identity `mtoth` alebo zo zoznamu čísel;
  - inak hovor prebehne iba v režime „poznámka“ bez akcií;
  - prípadne PIN na začiatku hovoru.
- **Istota:** vysoká (že ide o riziko), stredná (ako ľahko sa dá zneužiť cez trunk).

**2. Spätná slučka znásobuje chyby**
- **Kde:** balík B. Prepis callbacku ide znova do followupu.
- **Čo je zle:** jedno nedorozumenie v STT sa môže preniesť do ďalšej akcie. Chýba ochrana proti zacykleniu (callback → followup → callback).
- **Čo zmeniť:**
  - followup typu `callback` smie spustiť najviac 1 ďalší callback;
  - limit 3 hovory denne platí globálne, nie na proces.
- **Istota:** stredná.

**3. Mazanie je nevratné a dôkaz sa stráca**
- **Kde:** fáza 1 nerieši audit, ten je až vo fáze 3.
- **Čo je zle:**
  - `deleteTask` (`/home/marek/impofai-pm/lib/services/tasks.ts:777`) robí tvrdé `db.task.delete` vrátane podúloh a príloh zo storage;
  - jediný dôkaz potvrdenia je `output.json`, ktorý `pruneRuns` po 30 behoch zmaže (P2 §3.6).
- **Čo zmeniť:** do balíka D pridať pred každým mazaním export úlohy (JSON + komentáre) do poznámky hovoru a trvalý append-only log akcií.
- **Istota:** vysoká.

**4. Druhý používateľ na Marekovom prihlásení**
- **Kde:** fáza 4, „beží na Marekovom (otvorená otázka)“.
- **Čo je zle:** otázka nie je otvorená. Podmienky to zakazujú, pozri P1 bod 1.
- **Čo zmeniť:** kolega bude mať vlastný Claude login, inak fáza 4 nezačne.
- **Istota:** vysoká.

**5. Retry nerieši príčinu výpadku z 18. 10.**
- **Kde:** balík E.
- **Čo je zle:** súbeh refreshu OAuth s inými reláciami (napríklad s týmto swarmom) na jednom účte zostáva.
- **Čo zmeniť:** runner by mal bežať pod samostatným unix používateľom s vlastným `~/.claude`, alebo aspoň mať zámok na refresh. Retry nech ostane ako záloha.
- **Istota:** stredná (príčina je hypotéza P2).

## Minimálne guardrails pre fázu 1

Marek chce, aby agent smel aj mazať, ak to v hovore potvrdil. Preto ostáva len to, čo v bežnej prevádzke nezdržiava:

1. **Za potvrdenie platí iba Marekov hlas** (turny `user`). E-maily, `call_content` a Fireflies sú len dáta. Marek si to nevšimne.
2. **Read-back s kľúčom pred deštruktívnou akciou:** „Zmažem IMP-1489 Test proces, áno?“ Pri mazaní a financiách platí len potvrdenie, v ktorom zaznel kľúč alebo presná suma. Hromadné mazanie („zmaž všetky…“) sa nevykoná, ide do otázok.
3. **Záloha pred mazaním:** export JSON do poznámky hovoru. Obnova je potom možná ručne.
4. **Trvalý log akcií** s citátom a `conversation_id`, mimo `pruneRuns`.
5. **Prerušený hovor** (odpojenie pred záverečným zhrnutím) = vytvárať úlohy sa smie, mazať a meniť financie nie.
6. **Prichádzajúci hovor iba z overenej identity.**
7. **Strop:** najviac 3 spätné hovory denne a mesačný strop minút ElevenLabs.

Vypúšťam z kola 1: druhé potvrdenie mimo hlasu, limit 10 zápisov a 2-týždňový dry-run. Ich prácu robí spätný hovor, ktorý Marekovi povie, čo sa vykonalo, takže chybu zachytí v ten istý deň.

## Zásadné nezhody

- **S P1:** predplatné zdieľané organizáciou nie je „slabé miesto návrhu“, ale stopka. Model platby treba rozhodnúť pred F4, nie po nej.
- **S P1:** 14 entít a PM ako control plane hneď je predčasné. V tom súhlasím s P3. Najprv sa musí ukázať, že hlasová slučka šetrí čas.
- **S P3:** fáza 1 otvára prichádzajúce príkazy a slučku bez overenia volajúceho a bez trvalého auditu. Rýchlosť je v poriadku, tieto dve veci však musia byť v tom istom balíku, nie vo fáze 3.
- **So sebou (kolo 1):** ustupujem od druhého potvrdenia mimo hlasu. Pri jednom používateľovi stačia záloha, read-back s kľúčom a spätný hovor.
