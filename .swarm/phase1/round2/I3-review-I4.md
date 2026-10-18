# I3 review kódu I4 (`processes/morning-brief/*`)

Rozsah: `after.mjs`, `prompt.md` (časť o popisoch a e-mailoch), `schema.json`, `process.json` oproti `contracts.md` (K7, K8) a `runner/voice-call.mjs`. Nič som nemenil.

Overenie bez hovoru:
- `after.mjs` som spustil s `RUN_DRY=1 VOICE_NO_CALL=1` a bez `ELEVENLABS_API_KEY`.
- Ako vstup slúžil výstup dry-runu `~/.aios-runner/runs/morning-brief/2026-10-18T14-53-10-988Z-dry/output.json` a testovací `pending-callback.json` v scratch `AIOS_RUNNER_HOME`.
- Veľkosti premenných sú zmerané zo všetkých doterajších behov.

## Čo je v poriadku
- **`placeCallAndWait`:** volá sa s `kind: "morning-brief"`, minúty sa teda zapíšu do `voice-usage`. Posiela všetky 4 premenné.
- **`callGuard`:** brief ho nevolá. To je v súlade s K7: brief je výnimka z tichých hodín a limit callbackov sa ho netýka. Strop minút pri behu o 9:00 prakticky nehrozí.
- **`startFollowup`:** `kind: "morning-brief"`, predvolený `caller` (`mtoth`, `verified: true`, outbound na mtoth) a `depth` 0 sú správne.
- **Dry-run:** nevolá, nespustí followup a `pending-callback.json` nemaže. Overené: súbor po behu ostal.
- **Nezdvihnutý brief:** pending sa nemaže.
- **Mazanie pending:** odstraňujú sa len doručené položky (kľúč `at|callback_run|say`), takže položka pridaná počas hovoru ostane.
- **Formát `pending-callback.json`:** číta sa podľa I3 (`items[]`), tolerantne aj ako pole alebo jedna položka.

## Nálezy

### 1. Odložené výsledky callbacku strácajú ID úloh
- **Kde:** `processes/morning-brief/after.mjs:28` (`str`), použité na riadkoch 46 a 70.
- **Čo je zle:**
  - `str(x)` berie `what ?? summary ?? text`, kľúč úlohy (`result.key`, `task_key`, `key`) zahodí;
  - položky `done[]` z executora (I2) majú kľúč v `result`;
  - cieľ fázy 1, bod 2 („zopakovanie akcií s ID úloh“) tak pri odložených callbackoch neplatí;
  - kľúč nie je ani v `call_details`, takže ho agent nepovie ani na požiadanie.
- **Scenár zlyhania:** pending položka `done: [{ summary: "Vytvorená úloha Ponuka", result: { key: "IMP-1502" } }]`. Dry-run test: `call_content` obsahuje „Urobené: Vytvorená úloha Ponuka.“ a `grep -c IMP-1502 call-variables.json` vráti **0**. Marek sa nedozvie, ktorú úlohu má hľadať.
- **Návrh opravy:**
  - pridať `const keyOf = (x) => x?.task_key ?? x?.key ?? x?.result?.key ?? x?.result?.task_key ?? null;` a `str` rozšíriť na ``${text}${keyOf(x) ? ` (${keyOf(x)})` : ""}``;
  - pri `skipped` pridať aj dôvod `x.reason ?? x.why ?? x.error`, inak brief povie „Neurobené: X“ bez „prečo“;
  - rovnakú logiku má `processes/callback/after.mjs` (`keyOf`, `textOf`, `whyOf`).
- **Závažnosť:** major.

### 2. Pending sa zmaže aj vtedy, keď ho Marek reálne nepočul
- **Kde:** `processes/morning-brief/after.mjs:115–127`.
- **Čo je zle:**
  - `result.answered` znamená „aspoň jeden user turn“ (`voice-call.mjs`);
  - pending sa vyprázdni hneď po zdvihnutí, nezávisle od toho, či agent blok „Odložené zo spätného hovoru“ vôbec povedal a či hovor neskončil predčasne.
- **Scenár zlyhania:**
  - Marek zdvihne, povie „teraz nemôžem“ a zloží (1 user turn, 15 s);
  - pending sa zmaže, followup dostane `deferred_callback`, ale v prepise o ňom nič nie je;
  - výsledky executora a otázky z večerného callbacku sa stratia, ostane len kópia v run dire, ktorú nikto nečíta.
  - Rovnako pri výpadku SIP uprostred hovoru.
- **Návrh opravy:**
  - mazať len pri „dostatočnom“ hovore, napr. `termination_reason` obsahuje `end_call` (agent ukončil po zhrnutí) a `duration_secs >= 60`;
  - alternatíva: overiť, že niektorý `agent` turn v prepise obsahuje text odloženého bloku;
  - jednoduchšia alternatíva: nemazať v briefe a nechať followup označiť položky ako doručené (I2 má prepis).
  - Pri nesplnení pending nechať. Duplicitné zopakovanie zajtra je menšie zlo než strata.
- **Závažnosť:** major.

### 3. Veľkosť `call_details` nemá žiadny strop a rastie s počtom projektov
- **Kde:**
  - `processes/morning-brief/after.mjs:67–101`, skladanie `det` bez limitu;
  - `prompt.md:16`: popis 1–2 vety pre každú úlohu vrátane `in_progress` projektov bez zmeny;
  - `prompt.md:39`: plný obsah e-mailov.
- **Čo je zle:**
  - namerané `call_details`:
    - 16.–17. 10.: 4,7k / 14,5k / 8,3k znakov;
    - dnešné dry-runy s „všetkými projektmi“ (K8): **25,2k / 25,9k / 29,5k** znakov;
    - spolu s `call_content` (~7,7k) a `call_instructions` (~2,4k) je to ~40k znakov premenných;
  - schéma nemá `maxLength` ani `maxItems`; za týždeň s viac e-mailmi alebo projektmi to ľahko prekročí 50k;
  - celý prompt agenta sa posiela LLM pri **každom** turne. Pri dnešnom callbacku s ~3k znakmi premenných to bolo ~2–2,8k vstupných tokenov na turn; pri ~40k znakoch to bude ~12–14k tokenov na turn. 40 turnov tak dá ~0,5M tokenov na brief, vyššie `ttfb` a pomalšie odpovede v hovore;
  - limit ElevenLabs na veľkosť dynamickej premennej nie je zdokumentovaný (neoverené). Prekročenie by zhodilo štart hovoru celý brief (`call not started` → exit ≠ 0).
- **Scenár zlyhania:**
  - pondelok po víkende: 15 projektov, 60 otvorených úloh s popisom a 10 e-mailov s plným obsahom, `call_details` ~60–80k;
  - agent odpovedá s oneskorením, prípadne API hovor odmietne a brief nepríde.
- **Návrh opravy:**
  - v `after.mjs` pridať rozpočet, napr. `MAX_DETAILS = 30000`;
  - pri `taskLine` skrátiť popis na ~240 znakov a obsah e-mailu na ~800 znakov;
  - pri prekročení vynechávať v poradí: `otvorená` úlohy projektov bez zmeny → popisy `in_progress` → detaily nápadov a komunikácie;
  - na koniec pridať riadok „Podrobnosti skrátené, zvyšok zistím po hovore.“;
  - veľkosti logovať (už sa robí) a pri > 30k vypísať varovanie;
  - v `schema.json` doplniť `maxLength` na `description` (~300) a `content` (~1500).
- **Závažnosť:** major (dnes 29,5k, hranica 30k zo zadania je takmer dosiahnutá už pri bežnom dni).

### 4. Otázky z pending a z fronty otvorených otázok sa môžu zopakovať
- **Kde:** `processes/morning-brief/after.mjs:62–64` a 84.
- **Čo je zle:**
  - `allQs = [...pendingQs, ...o.questions]` bez deduplikácie podľa `id`;
  - otázka z callbacku (napr. `Q-001`) je podľa K6 zároveň v `context/otvorene-otazky.md`, ktorú brief číta do `o.questions`.
- **Scenár zlyhania:** callback s Q-001 sa odloží pre tiché hodiny, followup Q-001 zapísal do fronty, ranný brief sa ju opýta dvakrát (raz ako 1., raz ako 4.).
- **Návrh opravy:**
  - deduplikovať podľa `id` (prednosť má `o.questions`, ktoré nesú `topic`);
  - bez `id` deduplikovať podľa normalizovaného textu.
- **Závažnosť:** minor.

### 5. Inštrukcie hovoru verzus prompt agenta v ElevenLabs
- **Kde:**
  - `processes/morning-brief/after.mjs:64` (`[Q-001]` v `call_content`);
  - `after.mjs:95` (kľúče pri zhrnutí);
  - prompt agenta `agent_7701m5254wcqektavn4skbrdn86n`, časť „Ako hovoriť“.
- **Čo je zle:**
  - prompt agenta hovorí „Žiadne … dlhé identifikátory. Kľúče úloh … povedz, len keď sa Marek spýta.“;
  - brief to vedome prebíja (zhrnutie s kľúčmi, riadok 95). To je v poriadku a v súlade s cieľom fázy 1, ale nie je to výslovne označené ako výnimka. Model môže kolísať;
  - v `call_content` je pri otázkach `[Q-001]`, ktoré TTS môže prečítať nahlas („Q nula nula jedna“).
  - Inak sú pokyny konzistentné:
    - „Počas hovoru nič nevykonávaš“ sa odkazuje správne;
    - read-back „Platí?“ dopĺňa časť „Koniec hovoru“;
    - jediný zdroj pravdy sú obsah a podrobnosti.
- **Scenár zlyhania:** agent číta ID otázok nahlas, alebo pri zhrnutí kľúče vynechá, lebo sa drží základného promptu. Read-back s kľúčom je pritom podmienkou pre `destructive` akcie (K5).
- **Návrh opravy:**
  - v `call_instructions` dopísať „Pri záverečnom zhrnutí akcií kľúče úloh vyslov vždy, aj keď sa Marek nepýta (výnimka z pravidla o kľúčoch).“;
  - `[Q-001]` presunúť z `call_content` do `call_details` (riadok 84 ho tam už má).
- **Závažnosť:** minor.

### 6. Drobnosti v dry-run a vo followupe
- **Kde:** `processes/morning-brief/after.mjs:9` a 105–112, riadok 128.
- **Čo je zle:**
  - `DRY` číta iba `RUN_DRY`, nie `VOICE_NO_CALL`. Vlastná dry-vetva tiež zapisuje `call-variables.json` bez doplnenia povinných premenných, ktoré robí `placeCallAndWait`.
    - Pri `VOICE_NO_CALL=1` bez `RUN_DRY` to funguje vďaka `placeCallAndWait`, ale log neukazuje „DRY RUN“.
  - `startFollowup` sa volá bez `await`; je `async` a chyba by bola unhandled rejection.
- **Scenár zlyhania:**
  - nekonzistentné logy pri teste s `VOICE_NO_CALL`;
  - pri chybe `spawnProcess` (napr. chýba `RUN_DIR`) skončí after-step nečitateľnou chybou až po zmazaní pending.
- **Návrh opravy:**
  - `import { isDry } from voice-call.mjs` a `const DRY = isDry()`;
  - dry-vetvu nahradiť volaním `placeCallAndWait`, ktoré dry-run rieši samo a zapíše aj `guard`;
  - `await startFollowup(...)`;
  - pending mazať až po úspešnom `startFollowup`.
- **Závažnosť:** minor.

## Súhrn
- **Blocker:** žiadny.
- **Major:** 3.
  1. ID úloh v odložených výsledkoch;
  2. mazanie pending pri krátkom alebo prerušenom hovore;
  3. neobmedzená veľkosť `call_details` (dnes už 29,5k).
- **Minor:** 3 (duplicitné otázky, kľúče a ID v hlasovom výstupe, `isDry` a `await`).
