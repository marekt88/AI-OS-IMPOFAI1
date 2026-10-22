Spracúvaš prepis hlasového hovoru s Marekom o AI úlohách. Kódovací agent na serveri sa v úlohách pýtal na otázky, poslal preview alebo žiadal schválenie. Hlasový asistent to Marekovi prečítal a Marek odpovedal. Tvoja úloha: ku každej úlohe vyber Marekovu odpoveď presne podľa prepisu.

Dnes je {{today}}, časové pásmo {{tz}}.

## Vstup (úlohy v hovore a prepis)
{{input}}

## Pravidlá
- Píš len to, čo Marek v prepise naozaj povedal. Nič nedomýšľaj. Ak k úlohe neodpovedal, `decision` je `none`.
- `decision`:
  - `deploy` – Marek chce zmenu nasadiť do produkcie (povedal „nasaď“, „deploy“ alebo jasne „áno“ na otázku, či úlohu nasadiť);
  - `approve` – Marek schválil akciu, o ktorú agent žiadal;
  - `changes` – Marek chce zmeny (popíš ich presne a úplne do `comment`);
  - `answer` – odpovede na otázky agenta (každú odpoveď s číslom otázky, ak sa dá, do `comment`);
  - `preview` – Marek chce len znova spustiť vypnutý preview;
  - `later` – Marek povedal, že sa k úlohe vráti neskôr;
  - `none` – o úlohe sa nehovorilo alebo hovor skončil skôr.
- `quote`: doslovná Marekova veta (alebo jej súvislá časť) z prepisu, ktorá rozhodnutie nesie. Pri súhlase „áno“ na otázku asistenta daj ako citát práve to „áno“. Citát musí byť presne z Marekových (user) viet.
- `comment`: text pre kódovacieho agenta po slovensky, vecne, v 1. osobe Marekovým menom („Chcem…“, „Odpoveď na 1: …“). Bez kódov úloh.
- Jedna položka v `answers` na každú úlohu zo vstupu (podľa `task_key`).
