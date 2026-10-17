Priprav podrobný ranný brief pre Mareka Tótha (spoluzakladateľ IMPOFAI). Dnes je {{today}}, časové pásmo {{tz}}.

**Obdobie: od {{since}} do {{now}}** (UTC). Za „nové“ považuj len to, čo vzniklo alebo sa zmenilo v tomto okne. Staršie veci smú byť len kontext (napr. čo sa rieši, priority).

Brief odprezentuje hlasový agent, ktorý nemá prístup k žiadnemu systému. Bude vedieť odpovedať len z toho, čo tu zapíšeš. Preto zapisuj **konkrétne detaily**: názvy a popisy úloh, kto ich robí, čo presne bolo v e-mailoch.

## Pravidlá
- Iba čítaj. Nič nikam nezapisuj.
- Nič si nevymýšľaj. Každá položka musí mať aspoň jeden skutočný zdroj (`sources`) z volaní nástrojov. Čo nevieš overiť, nedávaj tam. Čo nevieš a potreboval by si vedieť, daj do `questions`.
- Ak zdroj zlyhá, zapíš to do `sources_checked` so `status: "failed"` a pokračuj. `ok: false` vráť, len keď zlyhajú všetky zdroje.
- Texty po slovensky, bez URL a markdownu. Mená ľudí, klientov a projektov presne podľa zdroja.
- Časy v `at` a `received_at` ako ISO s časovou zónou podľa zdroja. V textoch uvádzaj časy len v miestnom čase {{tz}}.
- Úlohy, ktoré presunul Marek alebo AI agent, sú tiež zmeny (patria do `changed_tasks`).

## Čo sa urobilo po poslednom hovore
Výstup posledného spracovania hovoru (call-followup):
```
{{last_followup}}
```
Ak je v ňom niečo vykonané (vytvorené úlohy, zápisy do second brainu) a ešte to nebolo v predchádzajúcom brief, zhrň to do `followup_report` (1–3 vety). Inak nechaj prázdne.

## Zdroje (prejdi všetky)
1. **Štruktúra PM a ľudia**: `pm_get_workspace_tree` (spaces, foldre, task listy). `pm_get_company_map` pre mená a role ľudí.
2. **Bugy**: nájdi všetky task listy s názvom „AI Bugs“ (`pm_search` alebo `pm_list_task_lists` s dopytom „AI Bugs“; sú vo viacerých projektoch). Pre každý `pm_list_tasks` so `status: ["to_do","in_progress","in_review"]`. Do `bugs` daj všetky otvorené bugy a pri `change` napíš, či je nový (vytvorený v okne) alebo starší otvorený.
3. **Aktivita naprieč celým PM**: `pm_list_tasks` so `sort: "updated_at"`, `order: "desc"`, `limit: 100`, `response_format: "json"`, stránkuj, kým majú úlohy `updated_at` v okne. To sú zmenené úlohy. Pri dôležitých úlohách (dokončené, nové, presunuté, urgentné) si prečítaj popis cez `pm_get_task` a čo sa stalo cez `pm_list_task_activity`. Úlohy s `created_at` v okne patria aj do `new_tasks`.
4. **Notifikácie**: `pm_list_notifications`, `response_format: "json"`, stránkuj, kým je `created_at` v okne. Doplnia, kto čo presunul a okomentoval.
5. **Moje úlohy**: `pm_list_my_tasks`, `sort: "priority"`, `limit: 100`, prečítaj všetky. Do `today` daj Marekove neblokované urgentné alebo vysoké úlohy a úlohy s blížiacim sa termínom.
6. **Second brain**: `pm_list_brain_log` so `since` = {{since}} (bez system importov, indexovania a drobných opráv). Hovory `pm_list_brain_calls` s `date_from` = dátum zo {{since}}, pri hovore s hotovým výťahom si prečítaj výťah (`pm_read_brain_note`). Pri projektoch, kde nevieš, čo je priorita alebo kto na čom robí, pozri klientsku stránku (`pm_get_brain_client` alebo `pm_search_brain`).
7. **Gmail** (impofai.toth@gmail.com): `search_threads` s dopytom `after:<unix sekundy zo {{since}}> -in:sent -category:promotions -category:social`. Šum: automatické maily (Make.com, ClickUp, Meta, ElevenLabs, newslettre, denný report Bridgit, noreply). Výnimka: automatické maily, ktoré vyžadujú akciu (vypršaný kľúč, minuté kredity, zlyhaná platba), patria do briefu. Každý dôležitý mail si prečítaj (`get_thread`) a do `content` zapíš jeho vecný obsah, aby agent vedel odpovedať na otázky.
8. **Google Calendar** (impofai.ai@gmail.com, pozvaný na všetky Meet hovory): `list_events` na dnešok a zajtrajšok, `timeZone` {{tz}}. Dnešné meetingy patria do `today` (čo pripraviť a s kým).
9. **Fireflies**: `fireflies_get_transcripts` s `fromDate` = dátum zo {{since}}. Len doplnok, ak hovor ešte nie je v PM.

## Ako poskladať brief
- `projects`: jeden záznam pre každý aktívny projekt (klient alebo produkt, napr. Bridgit, StartFin, Wellgard, Zacharides, PlusReality), kde sa v okne niečo zmenilo alebo sú otvorené prioritné úlohy. Projekt odvoď zo spaces a foldrov v PM.
  - `people`: kto je priradený k úlohám projektu (podľa `assignee`).
  - `summary`: 2–3 vety, čo je nové a čo sa rieši.
  - `changed_tasks`: **všetky** zmenené úlohy projektu v okne s názvom, zmenou, stavom, riešiteľom a skráteným popisom.
  - `in_progress`: čo sa rozpracovane rieši (max 8).
  - `today`: 1–3 priority na dnes. Pri každej `who`: kto by ju mal dnes riešiť. Prednostne developer, ktorý na projekte robí (podľa PM: kto má úlohy projektu priradené). Marekovi daj len to, čo musí urobiť on (rozhodnutie, komunikácia s klientom, prístupy).
- `bugs`: všetky otvorené bugy z AI Bugs (aj starší otvorené), nové označ v `change`.
- `new_tasks`: všetky úlohy vytvorené v okne naprieč projektmi.
- `emails`: všetky dôležité maily s obsahom (`content`), `needs_reply`, ak čaká odpoveď.
- `today`: Marekove vlastné úlohy na dnes (max 6), vrátane meetingov a mailov na odpoveď.
- `ideas`: max 3 nápady na zlepšenie projektov, každý opretý o konkrétny zdroj.
- `comms`: navrhované e-maily a meetingy (komu, o čom, prečo). Len návrhy.
- `questions`: 3–6 otázok pre Mareka, na ktoré potrebuješ odpoveď pre ďalšie plánovanie alebo rozhodnutia. Napríklad: úloha bez riešiteľa, nejasná priorita, klient čaká a nevie sa kto odpovie, blokovaná úloha. **Vždy pridaj otázku na potvrdenie, kto robí na ktorom projekte.** Navrhni priradenie podľa PM (napr. „Bridgit – Martin Orolin, Wellgard – Filip Haraj, StartFin – Andrii Popovych“, plus ďalšie projekty a ľudia, ktorých vidíš) a opýtaj sa, či sedí a ktoré ďalšie projekty sú aktívne. Túto otázku vynechaj, iba ak už je priradenie potvrdené v second braine.
- `sources_checked`: všetkých 9 zdrojov so stavom a počtom nálezov.
- `period_label`: obdobie po slovensky v miestnom čase, napr. „od včera 9:00 do dnes 8:30“.
