# ElevenLabs — konektor

Zapojené 2026-10-16. Hlasoví agenti (ElevenAgents) a odchádzajúce hovory cez SIP trunk Linphone, pozri [[connections]].

## Čo je zapojené

`.mcp.json` v koreni repa registruje **hostovaný** MCP server ElevenLabs:

```json
{ "mcpServers": { "elevenlabs": { "type": "http", "url": "https://api.elevenlabs.io/v1/mcp" } } }
```

Prvé spustenie: v Claude Code `/mcp`, vybrať `elevenlabs`, prejsť OAuth v prehliadači účtom ElevenLabs. Token sa uloží do klienta, nie do repa. **Žiadny API kľúč sa nepoužíva**, v gite nie je tajomstvo.

Regionálne varianty (iba pri data residency účtoch, sú to oddelené účty): EU `https://api.eu.residency.elevenlabs.io/v1/mcp`, India `https://api.in.residency.elevenlabs.io/v1/mcp`, Singapur `https://api.sg.residency.elevenlabs.io/v1/mcp`.

## Prečo hostovaný, nie lokálny

ElevenLabs má dva oficiálne servery:

| | Hostovaný (zapojený) | Lokálny `elevenlabs/elevenlabs-mcp` |
|---|---|---|
| Spustenie | nič sa neinštaluje | `uvx elevenlabs-mcp` (Python, `uv`) |
| Auth | OAuth, scoped prístup | `ELEVENLABS_API_KEY` |
| Stav | aktuálny smer ElevenLabs | deprecated, repo archivované, bez opráv |
| Telefónne čísla | dokumentácia ich nespomína | `list_phone_numbers`, `make_outbound_call` |

Rozhodnutie vlastníka 2026-10-16: hostovaný s OAuth.

## Čo vie (podľa dokumentácie)

- agenti: vypísať, porovnať konfigurácie, vytvoriť, upraviť, duplikovať, zmazať
- procedúry, nástroje, MCP servery a knowledge base dokumenty agentov
- testy agentov, branche a drafty, triage tickety, odhad nákladov, konfigurácia widgetu
- text-to-speech

**Pozor:** zmeny cez MCP sa publikujú rovno do cieľového branchu alebo `main`, nie ako draft. Živý agent sa tým zmení okamžite.

## Otvorené

- **Telefónne čísla a SIP trunk (Linphone):** dokumentácia hostovaného servera ich nespomína. Po autorizácii over, či niektorý nástroj vypíše čísla. Ak nie, Linphone trunk zostáva spravovaný v ElevenLabs UI; alternatíva je lokálny server s API kľúčom alebo priame volanie REST API `GET /v1/convai/phone-numbers`.

Zdroje: [Hosted MCP server](https://elevenlabs.io/docs/eleven-agents/operate/hosted-mcp), [elevenlabs/elevenlabs-mcp](https://github.com/elevenlabs/elevenlabs-mcp).
