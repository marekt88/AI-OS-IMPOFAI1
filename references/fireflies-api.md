# Fireflies.ai — konektor a API

Zapojené 2026-10-14. Doména 6 (meeting intelligence) v [[connections]] už nie je diera. Transkripty z hovorov sú prístupné priamo z tohto repozitára.

## Čo je zapojené

`.mcp.json` v koreni repa registruje remote MCP server Fireflies. Každá session Claude Code spustená v tomto projekte ho vidí ako nástroje `fireflies_*`.

```json
{ "mcpServers": { "fireflies": { "type": "http", "url": "https://api.fireflies.ai/mcp" } } }
```

Prvé spustenie si vyžiada autorizáciu: v Claude Code príkaz `/mcp`, vybrať `fireflies`, prejsť OAuth v prehliadači. Token sa uloží do klienta, nie do repa, takže v gite nie je žiadna tajnosť.

## Ktorý účet, na tom záleží

Konektor tohto repa patrí účtu **`impofai.ai@gmail.com`**. Config účet nepripína, rozhoduje sa až pri OAuth, takže pri autorizácii treba vedome prihlásiť ten správny.

V hre sú dva samostatné Fireflies účty:

| Účet | Kde je zapojený | Rola |
|---|---|---|
| `impofai.ai@gmail.com` | **tento repo konektor** (`.mcp.json`) | organizátor väčšiny klientskych hovorov, kanonický účet pre AIOS |
| `impofai.toth@gmail.com` | claude.ai konektor „Fireflies" (osobný, mimo repa) | admin, 751 minút prepisov, vidí hovory, kde bol účastníkom |

Sú to naozaj dve identity, nie jedna. V kontaktoch účtu `toth` vystupuje `impofai.ai@gmail.com` ako samostatný používateľ s menom „IMPOFAI".

Pri autorizácii pozor na dve veci:

- **Prehliadač ťa prihlási tým, čím si už prihlásený.** Ak v ňom visí session účtu `toth`, OAuth prebehne bez otázky na nesprávny účet. Použi anonymné okno alebo sa najprv odhlás, a skontroluj, aký účet stránka ponúka.
- **Po autorizácii over, komu token patrí:** zavolaj `fireflies_get_user` a pozri `Email`. Ak tam je `toth`, token treba zrušiť (`https://api.fireflies.ai/revoke`, prípadne odpojiť v Fireflies → Settings → Integrations) a autorizovať znova.

Claude.ai konektor `Fireflies` zostáva pri účte `toth`, kým ho neprepojíš v nastaveniach konektorov na claude.ai. Ak bežia oba naraz, v session sú dva Fireflies nástrojové sety z dvoch účtov a nedá sa z nich pozerať na jeden stav. Pre prácu v tomto projekte je čistejšie mať zapnutý len repo konektor.

## Auth, overené sondou 2026-10-14

| Endpoint | Transport | Auth | Dôkaz |
|---|---|---|---|
| `https://api.fireflies.ai/mcp` | Streamable HTTP | **OAuth 2.1**, PKCE S256, dynamická registrácia klienta, scopes `profile email` | `POST` bez hlavičky vráti `401` a `www-authenticate: Bearer ... resource_metadata=.../.well-known/oauth-protected-resource/mcp` |
| `https://api.fireflies.ai/graphql` | HTTP POST | **API kľúč** v `Authorization: Bearer <key>` | `POST` bez kľúča vráti `auth_failed` s textom o API kľúči |

OAuth metadáta: `authorization_endpoint https://api.fireflies.ai/authorize`, `token_endpoint /token`, `registration_endpoint /register`, `revocation_endpoint /revoke`.

**MCP endpoint cez API kľúč nie je overený.** Discovery hlási OAuth. Ak by niekedy bolo treba neinteraktívne auth, cesta je GraphQL, nie MCP.

## Čo je v dátach (stav 2026-10-14)

Zistené z účtu `impofai.toth@gmail.com`, lebo ten bol v čase stavby jediný autorizovaný. **Účet `impofai.ai@gmail.com` zatiaľ zmapovaný nie je**, prvé čo po jeho autorizácii treba spustiť, je `fireflies_get_user` a `fireflies_get_transcripts(limit: 10)` a tento oddiel prepísať.

Spoločné pre oba, ide o rovnaký plán a rovnaký spôsob práce:

- Hovory bežia cez Google Meet, bot Fred sa pripája automaticky (`Fred Joined: true` na všetkých záznamoch).
- **Žiadne kanály ani zložky.** `fireflies_list_channels` vracia prázdno, takže filtrovanie podľa `channelId` je zatiaľ nepoužiteľné.
- **Žiadne integrácie.** Fireflies nikam sám neposiela, prepojenie na ClickUp či Drive neexistuje.
- Súhrny nie sú na všetkých hovoroch. Staršie a krátke majú `Summary Status: skipped`, takže `get_summary` vráti prázdno a treba ísť cez `get_transcript`.
- Hovor vidí len ten účet, ktorý bol organizátorom alebo účastníkom. Prepisy nie sú zdieľané automaticky, takže dva účty vidia dva rôzne výseky. Pod `impofai.ai` čakaj klientske hovory (StartFIN, verejné obstarávanie), pod `toth` interné (Bridgit).

## Nástroje

Čítanie:

| Nástroj | Na čo |
|---|---|
| `fireflies_get_transcripts` | zoznam hovorov s filtrami `fromDate`, `toDate`, `keyword`, `participants`, `organizers`, `mine`, `limit` (max 50) |
| `fireflies_search` | to isté cez mini gramatiku, napr. `keyword:"cena" scope:sentences from:2026-09-01 limit:20` |
| `fireflies_get_transcript` | plný prepis podľa `transcriptId`, vety s časovými značkami, bez súhrnu |
| `fireflies_get_summary` | súhrn, keywords, action items, bez prepisu |
| `fireflies_fetch` | prepis aj metadáta aj insights v jednom |
| `fireflies_get_user`, `fireflies_get_user_contacts`, `fireflies_get_usergroups` | účet, kontakty, skupiny |
| `fireflies_get_active_meetings` | hovory práve prebiehajúce, live prepis ako snapshot |
| `fireflies_get_analytics` | štatistiky hovorov |
| `fireflies_list_channels`, `fireflies_get_channel` | zložky, v tomto účte prázdne |
| `fireflies_get_soundbites`, `fireflies_get_rule_executions` | klipy a behy automatizačných pravidiel |

Zapisovanie, mení stav v cudzom systéme, takže len na výslovné zadanie:

`fireflies_create_soundbite`, `fireflies_move_meeting`, `fireflies_share_meeting`, `fireflies_revoke_meeting_access`, `fireflies_update_meeting_privacy`, `fireflies_update_meeting_title`.

## Bežné dopyty

```
# posledných 10 hovorov
fireflies_get_transcripts(limit: 10)

# všetko s klientom za posledný mesiac
fireflies_get_transcripts(participants: ["pavol.mitrik@gmail.com"], fromDate: "2026-09-14")

# kde sa riešila cena
fireflies_search(query: 'keyword:"cena" scope:sentences from:2026-09-01 limit:20')

# action items z konkrétneho hovoru
fireflies_get_summary(transcriptId: "01M497X4X0S8RYA9C3VCAZYV8C")
```

Odkaz na hovor: `https://app.fireflies.ai/view/{id}`, na konkrétny moment `?t={sekundy}`.

Formát odpovede `format: "toon"` je default a je najlacnejší. `"text"` je čitateľný pre človeka, `"json"` pre skripty.

## Čo tým ide robiť

1. **Action items z hovorov do ClickUpu.** Fireflies ich už extrahuje s časovou značkou a menom. ClickUp je zapojený cez MCP. Prepojenie dnes robí človek ručne, úloha „Poslat transkript z fireflies" v ClickUpe to dokazuje.
2. **Naplnenie second brainu.** Prepisy sú jediný zdroj, kde je zachytené, čo si s klientmi naozaj dohodol. E-maily to nemajú.
3. **Klientske kontexty.** `context/klienti/` sa dá dopĺňať z hovorov podľa účastníka.

## Limity, o ktorých treba vedieť

- **Cloudový beh neprejde OAuth.** Scheduled task v cloude si nevie otvoriť prehliadač. Ak má Fireflies bežať automaticky, treba skript proti GraphQL s `FIREFLIES_API_KEY` v `.env` (kľúč: Fireflies → Settings → Developer Settings). Lokálna session s OAuth stačí na prácu rukou.
- `limit` je strop 50 na dopyt, viac len cez `skip`.
- Prepisy obsahujú citlivé klientske rozhovory. Platí rovnaké pravidlo ako pre `context/klienti/`: do repa sa nekopírujú, čítajú sa za behu.
