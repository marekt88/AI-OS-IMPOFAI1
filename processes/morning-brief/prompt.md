Priprav ranný brief pre Mareka Tótha (spoluzakladateľ IMPOFAI). Dnes je {{today}}, časové pásmo {{tz}}.

**Obdobie briefu: od {{since}} do {{now}}** (UTC). Za „nové“ považuj len to, čo vzniklo alebo sa zmenilo v tomto okne. Staršie veci smú byť len kontext.

## Pravidlá
- Iba čítaj. Nič nikam nezapisuj.
- Nič si nevymýšľaj. Každá položka briefu musí mať aspoň jeden skutočný zdroj (`sources`) z volaní nástrojov nižšie. Ak niečo nevieš overiť, nedávaj to tam.
- Ak zdroj zlyhá, zapíš to do `sources_checked` so `status: "failed"` a pokračuj s ostatnými. `ok: false` vráť len vtedy, keď zlyhajú všetky zdroje.
- Ak za obdobie nie je nič nové, `nothing_new: true` a sekcia `new` ostane prázdna. Úlohy na dnes môžu byť aj tak.
- Texty (`text`) píš po slovensky, jedna krátka veta na položku, ako by si ju povedal do telefónu. Bez URL a bez markdownu. Mená ľudí a klientov presne podľa zdroja.
- Rozsah: `new` max 8 položiek, `today` max 5, `ideas` max 3, `comms` max 4. Radšej menej a podstatné.

## Zdroje (prejdi všetky)
1. **PM second brain log**: `pm_list_brain_log` so `since` = {{since}}, `response_format: "json"`, stránkuj kým `has_more`. Šum: `actor.kind = "system"` a operácie `import` a `index`; drobné opravy (lint, odkazy). Dôležité: nové alebo zmenené klientske stránky, výťahy hovorov, rozhodnutia.
2. **PM hovory**: `pm_list_brain_calls` s `date_from` = dátum zo {{since}}. Ber len hovory s `date` v okne. Pri hovore s `summary_status: "hotovy"` si prečítaj výťah (`pm_read_brain_note`, `summary_note_id`) a vytiahni rozhodnutia a úlohy. Pri hovore bez výťahu len spomeň, že prebehol. Pozri aj `pm_list_brain_call_queue`.
3. **PM notifikácie**: `pm_list_notifications`, `response_format: "json"`, stránkuj kým je `created_at` novší ako {{since}}. Zoskup podľa projektu a človeka (napr. „Andrii dokončil 5 úloh v …“), nevypisuj jednotlivo.
4. **PM moje úlohy**: `pm_list_my_tasks` so `sort: "priority"`, `limit: 100`, stránkuj kým `has_more` (prečítaj všetky). Do `today` daj len neblokované úlohy s vysokou prioritou alebo blížiacim sa termínom. Blokované úlohy spomeň len ak sa blokovanie v okne zmenilo.
5. **PM aktivita naprieč projektmi**: `pm_list_tasks` so `sort: "updated_at"`, `order: "desc"`, `limit: 100`, stránkuj kým majú úlohy `updated_at` v okne. Ber len úlohy s `updated_at` v okne. Zaujímavé sú dokončené a nové úlohy.
6. **Gmail** (účet impofai.toth@gmail.com): `search_threads` s dopytom `after:<unix sekundy zo {{since}}> -in:sent -category:promotions -category:social`. Šum: automatické maily (Make.com, ClickUp, Meta, ElevenLabs, newslettre, denný report Bridgit, noreply adresy). Dôležité: maily od skutočných ľudí, klientov, `IMPORTANT`, nezodpovedané vlákna. Pri dôležitom vlákne si prečítaj obsah (`get_thread`).
7. **Google Calendar** (impofai.ai@gmail.com, pozvaný na všetky Meet hovory): `list_events` na dnešok a zajtrajšok, časové pásmo {{tz}}. Dnešné meetingy patria do `today` (čo pripraviť).
8. **Fireflies**: `fireflies_get_transcripts` s `fromDate` = dátum zo {{since}}. Len ako doplnok, ak hovor ešte nie je v PM.

## Ako poskladať brief
- `new`: čo sa za obdobie stalo (hovory a ich závery, zmeny v projektoch, dôležité maily, zmeny v second braine).
- `today`: čo by mal Marek dnes urobiť (meetingy na prípravu, urgentné neblokované úlohy, maily čakajúce na odpoveď).
- `ideas`: nápady, ako zlepšiť projekty, o ktorých máš kontext zo second brainu a úloh. Každý nápad opri o konkrétny zdroj (napr. opakujúci sa problém v úlohách alebo záver z hovoru). Ak taký zdroj nie je, nápad nedávaj.
- `comms`: navrhované e-maily a meetingy (komu, o čom, prečo). Len návrhy, nič neposielaj.
- `why`: krátko, z čoho to vyplýva, aby to agent vedel vysvetliť pri doplňujúcej otázke.
- `sources_checked`: všetkých 8 zdrojov so stavom a počtom relevantných nálezov.
- Časy (`at`) zapisuj ako ISO s časovou zónou presne podľa zdroja. V texte (`text`, `why`) uvádzaj časy len v miestnom čase {{tz}}.
- `period_label`: obdobie po slovensky v miestnom čase, napr. „od včera 9:00 do dnes 8:30“.
