# Spúšťač AI procesov (`runner/`)

Opakované AI procesy bežia na serveri `Projektovy-manazment` (rovnaký stroj ako IMPOFAI PM live) cez headless Claude Code `claude -p`, na predplatnom claude.ai Max, nie na API tokenoch. Rozhodnutia: [[decisions/log]] (2026-10-16).

## Ako to beží

- **Cron** (`crontab -l` používateľa `marek`) volá každých 5 minút `node runner/run.mjs tick`.
- **Tick** urobí tri veci:
  1. `git pull --ff-only` v `/home/marek/brain-src/repo`. Push do `main` je teda nasadenie, do 5 minút je na serveri.
  2. Nájde procesy, ktorým v slovenskom čase (`Europe/Bratislava`, letný čas rieši kód) prišiel slot podľa `schedule`, a každý spustí v samostatnom procese.
  3. Znova pošle hlásenia chýb, ktoré sa predtým nepodarilo doručiť.
- **Beh procesu:**
  1. Kontrola `claude auth status`. Musí ísť o prihlásenie claude.ai. `ANTHROPIC_API_KEY` a ďalšie premenné, ktoré by prepli účtovanie, runner pred spustením maže.
  2. `claude -p` s promptom, povolenými nástrojmi a prípadne s JSON schémou.
  3. Voliteľne čakanie na `deliverAt` a krok `after.mjs`.

## Pridanie nového procesu

Nový priečinok `processes/<meno>/`. Spúšťač sa nemení.

| Súbor | Povinný | Čo obsahuje |
|---|---|---|
| `process.json` | áno | definícia (nižšie) |
| `prompt.md` | áno | zadanie pre `claude -p`; premenné `{{since}}` (posledný úspešný beh, ISO), `{{now}}`, `{{today}}`, `{{tz}}` |
| `system.md` | nie | doplnok systémového promptu (rola, pravidlá) |
| `schema.json` | nie | JSON Schema výstupu (`--json-schema`). Ak má pole `ok`, `ok: false` znamená zlyhanie behu |
| `after.mjs` | nie | čo sa stane s výstupom (napr. zavolanie API). Dostane `RUN_OUTPUT`, `RUN_DIR`, `RUN_SINCE`, `RUN_MANUAL` a hodnoty zo `secrets.env`. Nenulový exit = zlyhanie |

`process.json`:

```json
{
  "description": "čo proces robí",
  "enabled": true,
  "schedule": "40 8 * * *",
  "tz": "Europe/Bratislava",
  "model": "sonnet",
  "maxTurns": 30,
  "timeoutMin": 20,
  "allowedTools": ["mcp__claude_ai_Projekt_manazment_-_IMPOFAI__pm_list_brain_log"],
  "requireTools": ["mcp__claude_ai_Projekt_manazment_-_IMPOFAI__pm_list_brain_log"],
  "builtinTools": [],
  "deliverAt": "09:00",
  "catchUpMin": 30,
  "firstSinceHours": 24
}
```

- `schedule`: cron s 5 poľami v `tz`. Hodnota `null` znamená iba ručné spúšťanie.
- `allowedTools`: presné mená MCP nástrojov. Nič iné proces nesmie (`--permission-mode dontAsk`). Zápisové nástroje sem nedávaj, kým to proces nepotrebuje.
- `requireTools`: nástroje, ktoré sa musia úspešne zavolať. Ak sa nezavolajú, beh je neúspešný, aj keď model niečo napísal.
- `builtinTools`: vstavané nástroje (`Read`, `Bash`…). Štandardne žiadne, `ToolSearch` je vždy zapnutý, inak by sa načítali schémy všetkých konektorov naraz a prompt pretiekol.
- `cwd`: `"repo"` spustí proces v repozitári, čím sa načíta `CLAUDE.md`. Inak beží v prázdnom pracovnom priečinku.

Ručný beh: `node runner/run.mjs run <meno>` (nečaká na `deliverAt`). Prehľad: `node runner/run.mjs list`.

## Čo zabezpečuje spúšťač pre všetky procesy

| Čo | Kde |
|---|---|
| log každého behu (čas, trvanie, výsledok, chyba, volané nástroje) | `~/.aios-runner/runs/<proces>/<beh>/run.json`, prepis `transcript.jsonl`, výstup `output.json`; súhrn `~/.aios-runner/logs/runs.jsonl`; posledných 30 behov |
| čas posledného úspešného behu | `~/.aios-runner/state/<proces>.json` → `lastSuccessAt` (len po úspechu celého behu vrátane `after.mjs`) |
| ochrana proti súbežnému behu | `~/.aios-runner/locks/process-<proces>.lock` (PID, mŕtvy zámok sa prevezme) |
| jasné zlyhanie | nenulový exit, `is_error`, limit krokov/času, chýbajúci výstup podľa schémy, `ok:false`, nezavolaný `requireTools`, chyba `after.mjs`, chyba prihlásenia v MCP nástroji |
| hlásenie chýb | úloha typu bug v PM liste **Startups / Projekt Manazment / AI Bugs**, opakovanie = komentár, obnova = komentár „Obnovené“ |
| tajomstvá | `~/.aios-runner/secrets.env` (chmod 600, mimo gitu) |

Hlásenie chýb ide do PM cez obyčajné HTTP volanie PM MCP s vlastným tokenom (`PM_MCP_TOKEN`), nie cez Claude. Funguje teda aj vtedy, keď je problém práve v prihlásení Claude Code. Ak PM nie je dostupné, hlásenie čaká v `~/.aios-runner/state/undelivered.jsonl` a odošle sa pri ďalšom ticku. Hlásia sa aj zlyhaný `git pull`, neplatná definícia, súbežný beh a pád spúšťača. Neodhalí sa len to, že prestane bežať samotný cron.

## Keď niečo prestane fungovať

- **„Claude Code na serveri nie je prihlásený predplatným“**: na serveri spusti `~/.local/bin/claude`, potom `/login`.
- **„MCP konektor potrebuje znova prihlásiť“**: konektor si obnov v nastaveniach konektorov claude.ai.
- **Hlásenia nechodia do AI Bugs**: skontroluj `PM_MCP_TOKEN` v `secrets.env`, potom `node runner/run.mjs report-test`.

## Testovací proces

`processes/test-pm-identity/` sa spúšťa len ručne. Cez PM MCP prečíta identitu a zapíše ju do `output.json`.
