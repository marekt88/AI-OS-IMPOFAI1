# R1: Predplatné a Kylon (2026-10-18)

Stance: skeptický overovateľ. Zdroje sú primárne dokumenty, ak nie je uvedené inak. Odhady sú označené.

## Krátka odpoveď

- **Claude.** Prihlásenie predplatným cez **našu** web aplikáciu a server-side `claude -p` pod tokenom, ktorý držíme my, je **zakázané**. Povolené sú dve cesty:
  - (a) používateľ si spustí Claude Code na **vlastnom stroji**, kde je prihlásený vlastným účtom;
  - (b) platforma hostuje **neupravený** Claude Code binár a používateľ sa doň prihlási **cez flow Anthropicu**. Musíme však byť na Commercial Terms a nesmieme token zbierať, ukladať ani sprostredkovať.

  Varianta (c), teda jeho OAuth token na našom serveri, je výslovne zakázaná.
- **OpenAI.** Existuje oficiálny program „Sign in with ChatGPT“ s využitím plánu (scopes pre Responses API). Pre platené alebo hostované aplikácie je však v **limitovanom triale cez waitlist**. Použiť tokeny z Codex CLI (`auth.json`) v našej aplikácii nie je podporená cesta.
- **Kylon:**
  - Claude Code beží **iba na počítači používateľa** (gateway daemon `kylon gateway run`).
  - Codex vie bežať aj **hostovane na Kylon Cloud** s prihlásením ChatGPT cez device code.
  - Hostovaný Claude s predplatným Kylon **neponúka**, čo zodpovedá podmienkam Anthropic.
- **Pre V1** (bez AI v platforme, iba MCP) je to **čisté**: používateľ volá naše MCP zo svojho Claude alebo ChatGPT a podmienky AI poskytovateľov sa nás netýkajú. Pre always-on agentov je čistý model API kľúč (náš alebo BYOK) alebo lokálny runner používateľa podľa vzoru Kylon.

## Claude: technicky / podmienky

**Technicky** ([Authentication](https://code.claude.com/docs/en/authentication)):
- `claude setup-token` vytvorí ročný OAuth token, ktorý sa nastaví ako `CLAUDE_CODE_OAUTH_TOKEN`. Doslovne: „For CI pipelines, scripts, or other environments where interactive browser login isn't available“. Vyžaduje Pro, Max, Team alebo Enterprise. Token „can only make model requests“, takže nenačíta claude.ai konektory ani Remote Control.
- Poradie credentials: Bedrock/Vertex/Foundry → `ANTHROPIC_AUTH_TOKEN` → `ANTHROPIC_API_KEY` → `apiKeyHelper` → `CLAUDE_CODE_OAUTH_TOKEN` → profily → `/login`.
- `apiKeyHelper` vracia **API kľúč**. Na podstrčenie predplatného neslúži.
- V kontajneri funguje `/login` s kódom vloženým ručne („common in WSL2, SSH sessions, and containers“).

Technicky teda všetky tri varianty fungujú. Rozhodujú podmienky.

**Podmienky** ([Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)):
- OAuth je „intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications.“
- „Anthropic does not permit third-party developers to offer Claude.ai login into their own applications, or to route requests through Free, Pro, or Max plan credentials on behalf of their users. Moreover, developers may not collect, store, or intermediate Claude.ai credentials or session tokens — sign-in to a Claude account must complete through Anthropic's own flow.“
- Výnimka: „Nor does it prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription, including where a platform hosts Claude Code…“
- Hosting Claude Code v produkte vyžaduje Commercial Terms, binár sa nesmie upraviť a „Customers may not pay for, resell, or intermediate Claude usage on their end users' behalf. Each end user must authenticate with their own … credentials.“
- Limity Pro/Max „assume ordinary, individual usage of Claude Code and the Agent SDK“. Presadzovanie môže prísť „without prior notice“.
- [Consumer Terms](https://www.anthropic.com/legal/consumer-terms) zakazujú prístup „through automated or non-human means, whether through a bot, script, or otherwise“, okrem prístupu cez API kľúč alebo tam, kde to Anthropic povolí. Zakazujú tiež „share your Account login information … or make your Account available to anyone else“ a „resell the Services“.
- Kontext (sekundárne zdroje): serverové blokovanie OAuth v nástrojoch tretích strán od 9. 1. 2026 a písomná politika od 19. 2. 2026 ([GIGAZINE](https://gigazine.net/gsc_news/en/20260220-anthropic-third-party-block), [WinBuzzer](https://winbuzzer.com/2026/02/19/anthropic-bans-claude-subscription-oauth-in-third-party-apps-xcxwbn/)). Thariq Shihipar (Anthropic) povedal, že lokálne experimenty s `claude -p` a Agent SDK sú v poriadku a biznisy na SDK majú používať API kľúče.

**Varianty:**

| Var. | Popis | Verdikt |
|---|---|---|
| (a) | Používateľ má Claude Code na **svojom** stroji a prihlási sa sám. My posielame úlohy (napr. lokálny daemon alebo MCP). | **OK.** Je to „ordinary use“ natívnej aplikácie. Riziko: always-on automatika s mnohými behmi denne naráža na „ordinary, individual usage“ a na zákaz „automated means“ pre spotrebiteľské plány (šedá zóna, odhad). |
| (b) | Hostujeme neupravený Claude Code v kontajneri a používateľ sa prihlási flow Anthropicu. | **Podmienene OK.** Potrebujeme Commercial Terms, neupravený binár, nesmieme platiť za používanie ani ho sprostredkovať. Problém: credentials potom fyzicky ležia v `~/.claude/.credentials.json` v **našom** kontajneri. Je to na hrane vety „may not collect, store … session tokens“. Treba **písomne overiť**. |
| (c) | Jeho OAuth token (`setup-token`) držíme na serveri a spúšťame `claude -p`. | **Zakázané.** Ide o „collect, store, or intermediate“ a „route requests … on behalf of their users“. |

## OpenAI: technicky / podmienky

**Codex CLI** ([Auth](https://learn.chatgpt.com/docs/auth), presmerované z developers.openai.com/codex/auth):
- „Sign in with ChatGPT for subscription access“ alebo API kľúč „for usage-based access“.
- Pre programové použitie: „Use API key authentication for programmatic Codex CLI workflows, such as CI/CD jobs.“
- Headless: `codex login --device-auth`.
- Tokeny ležia v `~/.codex/auth.json` („treat … like a password“) a sú „intended for trusted scripts, schedulers, and private CI runners“. Teda pre vlastnú infraštruktúru používateľa, nie pre tretiu stranu.
- [Terms of Use](https://openai.com/policies/row-terms-of-use/) obsahujú klauzulu „may not share your account credentials or make your account available to anyone else“ (overené cez kópie a [ConductAtlas](https://conductatlas.com/platform/openai/terms-of-use-row/provision/CA-P-017119/account-credential-sharing-prohibited/), live stránka vrátila 403).

**Sign in with ChatGPT pre tretie strany** ([Quickstart](https://developers.openai.com/siwc/quickstart), [Open-source](https://developers.openai.com/siwc/token-sharing-open-source)):
- „currently available to selected commercial partners through a limited trial“.
- Plán: „Using a ChatGPT plan requires separate Responses API scopes that the user must authorize“, a to len pre „Apps approved for ChatGPT plan usage“.
- Plne otvorené je to len pre open-source a lokálne aplikácie. Paid alebo „remotely hosted“ aplikácia ide cez [interest form](https://openai.com/form/sign-in-with-chatgpt-interest/).
- Podľa help centra (cez vyhľadávanie, priamy fetch 403) to platí len pre plány Go, Plus a Pro a používateľ si nastavuje týždenný limit na aplikáciu.

**Varianty:**

| Var. | Verdikt |
|---|---|
| (a) | Codex/`codex exec` na stroji používateľa, prihlásený sám: **OK**. |
| (b) | Hostovaný Codex s device-code prihlásením používateľa: technicky to robí Kylon (nižšie). Právne je to čistejšie než pri Anthropic, lebo OpenAI to nezakazuje výslovne. Bez partnerstva je to však šedá zóna a pre automatiku OpenAI odporúča API kľúč. |
| (c) | Držať jeho `auth.json` na našom serveri mimo programu SIWC: **nepodporované**, v rozpore s „make your account available to anyone else“. Oficiálna cesta je SIWC s plan scopes **po schválení** do programu. |

## Kylon: ako to robí

- **Čo je Kylon** ([kylon.io](https://kylon.io/)): „company harness“, teda workspace s roomami a threadmi, kde sú ľudia aj agenti členovia s pamäťou a právami. Ďalej knowledge, appky a databázy, automatizácie (cron, webhook) a voice.
- **Claude Code:** iba „computer-based“ agent.
  - „Claude Code runs in the connected local computer and project environment“ ([blog](https://kylon.io/blog/claude-code-kylon-workspace)).
  - „Each person brings the agent they use… The machines and accounts remain separate“ ([blog](https://kylon.io/blog/codex-claude-code-agents-home)).
  - Napojenie: na stroji používateľa beží CLI gateway daemon (`kylon gateway run`, [Gateway](https://docs.kylon.io/cli/gateway-run)), ktorý spúšťa nainštalovaný Claude Code ako subproces a premosťuje ho do workspace.
  - Setup prebieha tak, že sa prompt vloží do Claude Code. „Computer-based providers use the sign-in and files available on the connected computer“ ([Providers](https://docs.kylon.io/cli/providers)).
  - Kylon teda token nikdy nevidí. Ide o variant (a).
- **Codex:** dve cesty.
  - Lokálne rovnako ako Claude.
  - **„Codex on Kylon Cloud“** ([tutorial](https://docs.kylon.io/tutorials/use-your-chatgpt-subscription)): Kylon spustí cloud computer, používateľ zadá device code na `auth.openai.com/codex/device`. „Codex usage uses your ChatGPT plan“, každá správa ide na plán vlastníka, aj správy od iných členov s prístupom. Vlastníctvo sa nedá preniesť. Funkciu zapína Kylon per workspace. Kde a ako je token uložený, nepíšu. Ide o variant (b)/(c) pre OpenAI.
- **Hostované agenty:** „Kylon-hosted“ (úrovne Fast/Pro/Max, modely nemenované, „Model usage uses Kylon credits“), Codex Cloud a Devin Cloud ([Agents](https://docs.kylon.io/agents/overview)). **Claude Code s predplatným hostovane neponúkajú.**
- **Cenník** ([pricing](https://kylon.io/pricing)): per workspace. Core od 50 USD/mes. obsahuje 500 kreditov a do 10 agentov, Pro a Ultra cez kontakt. Kredity pokrývajú „conversations, reasoning, tool calls, workflow runs“. Po minutí kreditov sa agenti zastavia. „Bring Your Own Agent is a concept preview“, kredity ani oprávnenosť nie sú finálne.
- **Podmienky:** web ani docs Anthropic ani OpenAI terms nespomínajú. Architektúra (Claude iba lokálne, Codex hostovane) však presne kopíruje to, čo dnes dovoľujú primárne podmienky. Či má Kylon s OpenAI partnerstvo SIWC, **nie je overené**: v zozname partnerov som ho nehľadal a z docs to nevyplýva.

## Odporúčanie

**V1 (bez AI v platforme):**
- Platforma je iba **MCP server + OAuth pre claude.ai, ChatGPT a Gemini konektory**. Používateľ volá nás zo svojho AI, takže nemáme žiadne AI credentials a žiadne sprostredkovanie. Je to technicky aj právne čisté.
- Na onboardingu ani nikde inde neponúkať „Prihlás sa Claude“. Iba „pripoj náš MCP vo svojom Claude“.
- Pomenovanie: nepoužívať „Claude“ v názve funkcií. Pravidlá loga sú v [Legal](https://code.claude.com/docs/en/legal-and-compliance).

**V2+ (always-on agenti, plán za 45 €):** v poradí podľa čistoty.
1. **API, platené nami** (Claude API, Bedrock, Vertex). Cena je v pláne. Je to čisté, ale nesie náklady a maržové riziko.
2. **BYOK API kľúč používateľa** (Console alebo Bedrock). Výslovne povolené, „billed to the key owner“.
3. **Lokálny runner podľa vzoru Kylon.** Náš daemon na stroji používateľa spúšťa jeho neupravený Claude Code alebo Codex s jeho prihlásením, token nikdy neopustí jeho stroj. Daň: agent nie je always-on, keď je počítač vypnutý. Pri vysokom objeme je tu riziko „ordinary, individual usage“.
4. **Codex hostovane cez SIWC plan scopes** až po prijatí do programu OpenAI. Podať interest form hneď.
5. **Nerobiť:**
   - hostovaný kontajner s Claude predplatným (variant b), kým to Anthropic písomne nepotvrdí;
   - nikdy variant (c);
   - zdieľanie Marekovho Max pre iných.

**Písomne overiť:**
- **Anthropic (sales, link v Legal):**
  1. Spĺňa variant (b) (hostovaný neupravený Claude Code, prihlásenie cez flow Anthropicu, credentials v našom kontajneri) vetu „may not collect, store“?
  2. Spĺňa lokálny daemon, ktorý automaticky spúšťa `claude -p` pod predplatným používateľa, „ordinary use“ a výnimku z „automated means“? Existujú objemové hranice?
  3. Je pre nás Team/Enterprise seat používateľa v inej pozícii než Pro/Max?
  4. Platí Commercial Terms aj pre MCP-only integráciu, a vznikajú pri nej vôbec nejaké povinnosti?
- **OpenAI (interest form a rep):**
  1. Prijatie do SIWC s plan usage pre hostovanú SaaS.
  2. Smieme hostovať Codex s device-code prihlásením používateľa mimo programu?
  3. Pravidlá uloženia tokenov na našom serveri.

## Neistoty

- Kylon: nevieme, kde ukladá ChatGPT token, či je partner SIWC, ani aké modely bežia pod „Kylon-hosted“. Docs to neuvádzajú.
- Help center OpenAI (plány Go, Plus, Pro a limity) mám iba z vyhľadávania, priamy fetch vrátil 403. Program je v „limited trial“ a môže sa rýchlo meniť.
- Variant (b) pri Anthropic: dokument ho výslovne pripúšťa („including where a platform hosts Claude Code“), zároveň však zakazuje ukladať session tokeny. Ako sa tieto dve vety zmieria v praxi, je nejasné, odhad: konzervatívne čítanie = nerobiť.
- Hranica „ordinary, individual usage“ nie je kvantifikovaná. Presadzovanie je bez varovania (sekundárne zdroje hlásia bany pri ťažkej automatike).
- Podmienky Anthropic sa v roku 2026 menili viackrát (január, február). Pred buildom V2 treba znova skontrolovať [Legal](https://code.claude.com/docs/en/legal-and-compliance).
