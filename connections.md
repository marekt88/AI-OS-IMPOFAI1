# Connections

Registry of every system your AIOS can reach. Naplnené 2026-09-14 z dôkazov v pošte (`context/emailova-mapa.md`, `context/projekty-a-tim.md`), nie z intake Q4-Q7 — tie sú ešte nezodpovedané. `/audit` kontroluje tento súbor na pokrytie domén a čerstvosť.

## Sedem domén

| # | Doména | Nástroj | Mechanizmus | Auth | Posledná kontrola |
|---|---|---|---|---|---|
| 1 | Revenue / Financials | **ClickUp `Internal > Monthly Income`** — 740 € MRR z 8 klientov + ručná hodinová fakturácia Bridgitu cez Google Drive. Výdavky nikde. | **mcp** (ClickUp) | OAuth | 2026-09-14 |
| 2 | Customer interactions | Gmail — `marek@impofai.com`, `impofai.toth@gmail.com` | **mcp** | OAuth | 2026-09-14 |
| 3 | Calendar | Google Calendar (pozvánky chodia z `impofai.ai@gmail.com`) + Calendly `calendly.com/impofai` | not yet connected | — | — |
| 4 | Communication | Gmail + Google Meet (ad-hoc linky) | **mcp** (len Gmail) | OAuth | 2026-09-14 |
| 5 | Project / task tracking | **ClickUp** — workspace „IMPOFAI team" `90151789670`, 3 priestory, 8 klientov, 227 úloh, 8 členov | **mcp** | OAuth | 2026-09-14 |
| 6 | Meeting intelligence | **Fireflies.ai** — overené 2026-10-14, že služba beží a bot Fred je na všetkých Meet hovoroch. Konektor repa cieli na účet **`impofai.ai@gmail.com`**, čaká na OAuth. Bez kanálov a bez integrácií. | **mcp** (`.mcp.json`, `references/fireflies-api.md`) | OAuth, neautorizované | 2026-10-14 |
| 7 | Knowledge / files | Google Drive | not yet connected | — | — |

## Prevádzkové systémy doložené v pošte

| Systém | Na čo | Mechanizmus | Posledný dôkaz |
|---|---|---|---|
| **ClickUp** | riadenie všetkých klientskych projektov, denné súhrny o 05:00 | not yet connected | 14.09.2026 |
| **Supabase** | databáza, pribudlo v septembri 2026 | not yet connected | 12.09.2026 |
| **Vercel** | deployment, úloha „Publish cez vercel" pre Zacharides eshop | not yet connected | 09/2026 |
| **GoHighLevel** | CRM, meeting „GHL-Monday - Jakub Kraľovanský" | not yet connected | 09.09.2026 |
| **ClickSend** | SMS, pribudlo v septembri 2026 | not yet connected | 13.09.2026 |
| **`bridgit@bridgit.one`** | automatický denný report o 06:00, osem neprečítaných za mesiac | prichádza e-mailom | 14.09.2026 |
| n8n (self-hosted) `n8n.srv903244.hstgr.cloud` | workflow „Agent tool - Price Calculator", hlasový asistent Imagewell | not yet connected | 03/2026 |
| Make.com `eu1.make.com` | scenár „Integration Webhooks, monday com" — **spadol 30.04.2026** | not yet connected | 04/2026 |
| FileMaker / DataSystem | API pre ImageWell: Projects, Orders, Orders_lines, konto dataOne | not yet connected | 05/2026 |
| **ElevenLabs** | hlasoví agenti (ElevenAgents), odchádzajúce hovory cez importovaný SIP trunk Linphone (`sip.linphone.org`), overené z UI | **mcp** (`.mcp.json`, hostovaný `https://api.elevenlabs.io/v1/mcp`, `references/elevenlabs-api.md`), OAuth (MCP) + API kľúč na serveri pre odchádzajúce hovory ranného briefu (`references/ranny-brief.md`) | 16.10.2026 |
| DIDWW | SMS a DID pre hlasového asistenta, číslo `+420 518 888 042`, A2P kampane SK/CZ | not yet connected | 06/2026 |
| OpenAI API | GPT-4.1 nano (uvedené GFelektru pri GDPR previerke) | not yet connected | 03/2026 |
| Namecheap | doména a Private Email pre `rewardly.online`, účet „Markot88" | not yet connected | 04/2026 |
| Google Workspace | domény `impofai.com`, adresy `marek@`, `daniel@` | not yet connected | 09/2026 |
| printingshop.sk | e-shop ImageWell, transakčné maily | not yet connected | 08/2026 |

## Čo chýba a čo prekáža

- **Doména 1 nie je systém, je to zvyk.** Faktúry sú PDF prílohy, podklady Drive linky. Žiadny účtovný softvér, žiadne bankové napojenie.
- **Doména 6 je zapojená, ale slepá do oboch strán.** Prepisy existujú a sú prístupné cez MCP, Fireflies však nemá ani jednu integráciu. Action items z hovorov do ClickUpu dnes prenáša človek.
- **monday.com je pravdepodobne mŕtvy.** Objavoval sa len cez Make scenár, ktorý spadol v apríli 2026. Riadenie prešlo do ClickUp.
- **Polovica inboxu je strojový šum.** ClickUp posiela jeden mail na každú zmenu statusu úlohy, k tomu Instagram, newslettre a marketing. 1 335 neprečítaných, nula štítkov.

**Mechanism options:** `mcp` (MCP server), `script` (Python/Bash hitting an API, in `scripts/`), `export` (CSV/JSON dump pipeline), `key+ref` (`.env` key + `references/{tool}-api.md` guide), `not yet connected`.

When you wire a new tool, also save `references/{tool}-api.md` capturing endpoints, auth flow, and common queries — researched-once-saved-forever.
