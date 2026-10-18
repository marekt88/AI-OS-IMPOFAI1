# P4 – Červený tím: riziká AI platformy IMPOFAI (2026-10-18)

Stance: skeptik (je to rola, nie presvedčenie). Odhady sú označené ako odhady.

**Záver:** víziu najskôr nezastaví technika. Zastaviť ju môžu dve veci:
- podmienky predplatného Claude, keď sa platforma otvorí pre iných;
- jeden zlý zápis po hovore, ktorý vyvolá cudzí obsah z e-mailu alebo zle prepísaná reč.

Oboje treba vyriešiť vo fáze 1, kým beží iba Marekov agent.

## 1. Top riziká

| # | Riziko | Pravd. | Dopad | Dôkaz / zdroj | Mitigácia | Fáza | Kedy riešiť |
|---|---|---|---|---|---|---|---|
| 1 | **Podmienky predplatného pri multi-user použití.** Model „predplatné platí organizácia“, jeden Max účet beží pre viacerých ľudí a produkt sa ponúka iným firmám. | vysoká (pri produkte) | kritický: zablokovaný účet, model „bez API tokenov“ padá | [Claude Code Legal & compliance](https://code.claude.com/docs/en/legal-and-compliance): Anthropic nedovoľuje tretím stranám ponúkať claude.ai login ani smerovať požiadavky cez Free/Pro/Max „on behalf of their users“. Pri hostovaní Claude Code platí: „Customers may not pay for, resell, or intermediate Claude usage on their end users' behalf. Each end user must authenticate with their own… credentials.“ Limity Pro/Max „assume ordinary, individual usage“. Presadzovanie môže prísť „without prior notice“. | Interne: každý človek má vlastné prihlásenie (Team/Enterprise seat), žiadne zdieľanie Marekovho Max. Produkt pre iných: API kľúč alebo Bedrock/Vertex, prípadne neupravený Claude Code binár, do ktorého sa zákazník prihlási sám. Písomne sa opýtať Anthropic sales. | 1 → 2 | **pred prvým iným používateľom** |
| 2 | **OpenAI login ako náhrada.** Predpoklad, že „Sign in with ChatGPT“ vyrieši web aplikáciu. | stredná | vysoký | [Codex auth](https://developers.openai.com/codex/auth): oficiálne pre Codex. Rozšírenie na aplikácie tretích strán podľa [The New Stack](https://thenewstack.io/sign-in-with-chatgpt/) a [Flavio Copes](https://flaviocopes.com/sign-in-with-chatgpt/) je beta (údaje o dátumoch sa líšia), so samostatným súhlasom používateľa a týždennými limitmi. Neoficiálne proxy cez Codex token (typu OpenClaw) [nie sú podporované](https://developer.puter.com/tutorials/openai-oauth/). | Počítať s ním až po overení prístupu do beta programu. Architektúru stavať nezávisle od poskytovateľa (adapter). | 2 | pred návrhom auth vrstvy |
| 3 | **Prompt injection cez e-maily a hovory.** Cudzí text vedie agenta, ktorý má právo zapisovať a mazať. | stredná až vysoká | kritický: mazanie, financie, únik | `processes/morning-brief` číta Gmail s obsahom → ide do `call_content` → `call-followup` má v `allowedTools` celý server `mcp__claude_ai_Projekt_manazment_-_IMPOFAI` (všetky ~140 nástrojov vrátane `pm_delete_*`, `pm_grant_access`, `pm_remove_member`), `maxTurns: 120`. Prompt sám hovorí „smieš použiť všetky nástroje“. | Followup rozdeliť na: (a) model **iba navrhuje** akcie (JSON, bez zápisu); (b) deterministický vykonávač s allowlistom. Za potvrdenie sa berú len `user` turny, `call_content` je len dáta. Deštruktívne nástroje sa vypnú. | 1 | **hneď** |
| 4 | **Potvrdenie hlasom pri nepresnom prepise.** „Áno“ na zle pochopenú vetu, zámena mien (Filip/Martin), čísiel a súm. | vysoká | vysoký | Prompt followupu sám priznáva: „Prepis je z reči, môže mať chyby v menách a slovách. Opravuj ich podľa kontextu“, čiže model hádá. Niektoré hovory sa prerušili zo strany klienta (context.md). | Read-back s konkrétnym ID alebo menom („úloha IMP-1042, riešiteľ Filip Haraj, áno?“). Pri čiastkach a mazaní potvrdenie mimo hlasu (klik v PM alebo SMS kód). Prerušený hovor = nič sa nevykoná. | 1 | hneď |
| 5 | **Únik dát medzi agentmi.** Agent A pošle úlohu alebo knowledge agentovi B a s ňou aj kontext, na ktorý B nemá práva (financie, osobné údaje, iný klient). | stredná | vysoký (GDPR, NDA klientov) | PM má rozsahy tokenov FULL/RESTRICTED a `checkAccess`/`getReadableScope` (`/home/marek/impofai-pm/lib/permissions/index.ts`), ale správy medzi agentmi idú mimo tejto kontroly. Dnes všetko beží pod jednou identitou Mareka. | Každý agent má vlastný token. Odovzdáva sa len odkaz (ID), nie obsah. Príjemca číta vlastnými právami. Log zdieľania, osobné dáta len so súhlasom. | 2 | pred druhým agentom |
| 6 | **Serveroví agenti a produkcia.** Claude Code s Bash a git na serveri klienta, nasadenie bez človeka, tajomstvá v prostredí, odpovede „cez hlas“ ako schválenie. | stredná | kritický (výpadok klienta, zmluvná zodpovednosť) | Zadanie: „1 server = 1 projekt“, otázka „či smú nasadzovať do produkcie“ je otvorená. Runner robí `git pull` z `main` každých 5 min, takže push je nasadenie (`references/ai-runner.md`). | Iba vetva + preview, **nikdy** prod. Merge robí človek v PR. Kontajner bez prod tajomstiev, sieť len na allowlist. Žiadny agent na stroji s PM live. | 2 | pred prvým serverom |
| 7 | **Náklady na minútu hovoru.** | stredná | stredný | [ElevenLabs API pricing](https://elevenlabs.io/pricing/api): Agents 0,08 USD/min, burst 0,16 USD/min. LLM a telefónia sa podľa [getmacha](https://www.getmacha.com/blog/elevenlabs-agents-pricing-explained) a [happyrobot](https://www.happyrobot.ai/hub/elevenlabs-pricing) účtujú zvlášť. Odhad: 20 ľudí × 10 min/deň × 22 dní ≈ 4 400 min ≈ 350–600 USD/mes. Kampane interview to znásobia. | Rozpočet na používateľa a deň, tvrdý strop minút, kratšie briefy (najprv text, hovor na vyžiadanie). Mesačný report nákladov. | 1–2 | pred kampaňami |
| 8 | **GDPR nahrávok a prepisov zamestnancov.** | vysoká (pri kampaniach) | vysoký: pokuty, spor so zamestnancom | § 13 ods. 4 Zákonníka práce: nahrávanie hovorov na zariadení zamestnávateľa len so závažnými dôvodmi, s predchádzajúcim upozornením a prerokovaním so zástupcami ([epravo.sk](https://www.epravo.sk/top/clanky/monitorovanie-zamestnancov-bez-posudenia-vplyvu-cesta-k-pokute-4479.html), [aksamec.sk](https://www.aksamec.sk/gdpr-zamestnanec-2026/)). Chýbajúca DPIA = riziko pokuty (čl. 35 GDPR). Prepisy idú k ElevenLabs, Anthropic a Fireflies (subdodávatelia mimo EÚ). Interview o „chybovosti“ je de facto monitorovanie výkonu. | DPIA pred prvým hovorom inému človeku. Informačná povinnosť, retencia audia (napr. 30 dní), DPA s ElevenLabs. Interview dobrovoľné, výstupy agregované. Pre klientov firiem (Wellgard…) zmluvne riešiť spracovateľa. | 1 → 2 | pred kampaňou |
| 9 | **Spoľahlivosť SIP a Linphone.** | vysoká | stredný (brief nepríde, followup nič neurobí) | SIP 408 = telefón offline; hovory sa prerušujú (context.md). Linphone číslo je na prichádzajúce hovory priradené inému agentovi (Petra), takže „zavolať vlastnému agentovi“ dnes nefunguje. | Záložný kanál: textový brief do PM alebo e-mailu, keď hovor zlyhá. Retry s limitom. Monitoring „brief neprišiel do 9:15“. Mobilné číslo alebo app namiesto softfónu. | 1 | teraz |
| 10 | **Single point of failure: jeden server, jedno prihlásenie.** | vysoká | vysoký | Runner, PM live aj Postgres bežia na jednom stroji `Projektovy-manazment`. Celé AI ide cez jedno `claude /login` Mareka. Konektory sa musia ručne obnoviť v claude.ai. Runner sám priznáva, že neodhalí výpadok cronu. | Externý heartbeat (napr. healthchecks.io). Oddeliť runner od PM live. Zálohy DB mimo stroja. Runbook na relogin. Druhý admin účet. | 1 | do mesiaca |
| 11 | **Autonómia „smie všetko, čo má vlastník práva“** sa skopíruje na ďalších používateľov. | stredná | vysoký | Rozhodnutie vlastníka platí pre Mareka. Pri manažérovi s právom na financie ide o iný profil rizika. | Default pre nových: len čítanie + vytváranie úloh. Zápis sa rozširuje explicitne. | 2 | pred 2. používateľom |
| 12 | **Šírka rozsahu.** Chat, konektory, aplikácie, kampane, sieť agentov a serveroví agenti naraz. | vysoká | vysoký (nič nie je dotiahnuté) | Zoznam v brainstorme má viac ako 10 samostatných produktov. | Fáza 1 = jeden používateľ, tri procesy, merané. | 1 | teraz |

## 2. Pravidlá pre fázu 1 (guardrails)

1. **Oddelenie návrhu a vykonania.** Followup model vráti iba `proposed_actions[]` (nástroj, argumenty, citát Marekovej vety, čas v hovore). Zápisy robí kód podľa allowlistu. `allowedTools` sa zúži z celého servera na konkrétne nástroje.
2. **Bez druhého potvrdenia agent po hovore nesmie:**
   - mazať čokoľvek (`pm_delete_*`, `pm_delete_brain_note`);
   - meniť práva a členstvo (`pm_grant_access`, `pm_revoke_access`, `pm_remove_member`, `pm_update_member_role`, `pm_invite_member`);
   - zasahovať do financií (`pm_set_rate`, `pm_delete_rate`, pravidlá priradenia);
   - posielať e-maily alebo správy von;
   - meniť termíny alebo riešiteľov u iných ľudí.

   Druhé potvrdenie = klik v PM (stav `needs_review`) alebo SMS/push, nie ďalšie „áno“ v tom istom hovore.
3. **Limity na jeden hovor:** najviac 10 zápisov, 0 mazaní, 1 hovor späť. Pri prekročení sa nič nevykoná a vznikne úloha v AI Bugs.
4. **Zdroj potvrdenia:** platí len `role: user` z prepisu. Text z e-mailov, `call_content` a Fireflies je dáta, nikdy pokyn (rovnako ako dnes pri bankových textoch v PM).
5. **Prerušený alebo krátky hovor** (< 2 user turny, odpojenie klientom pred záverečným zhrnutím) = iba poznámka, žiadne akcie.
6. **Read-back s identifikátorom:** asistent na konci prečíta zoznam akcií s menami a ID. Bez záverečného „áno, všetko“ sa nevykoná nič.
7. **Testovací režim (`dryRun`):** prvé 2 týždne pri každom novom procese sa akcie iba zapisujú do `output.json` a do komentára v PM. Marek denne porovnáva, čo by sa stalo.
8. **Logy a audit:** každá akcia so zdrojovou vetou, `conversation_id` a výsledkom. Audio sa drží najviac 30 dní, prepis podľa retenčnej politiky.
9. **Rozpočet:** strop minút ElevenLabs za deň a mesiac v kóde (`voice-call.mjs`) a týždenný report.
10. **Identita:** žiadny ďalší človek nepoužíva Marekov Max ani jeho agenta. Kto sa pridá, má vlastný účet.
11. **Serveroví agenti** vo fáze 1 neexistujú, alebo bežia iba na sandboxe s preview a bez prod tajomstiev.

## 3. Otázky, ktoré musí rozhodnúť Marek

1. Bude produkt pre iné firmy bežať na **API (platené podľa spotreby)**, alebo na **vlastnom predplatnom každého používateľa** cez neupravený Claude Code? Model „organizácia platí jeden plán za všetkých“ podmienky Anthropic nepripúšťajú.
2. Smie followup **mazať a meniť financie** iba s druhým potvrdením mimo hlasu? Odporúčam áno, aj pre Mareka.
3. **Komu smie agent volať:** iba vlastníkovi, interným zamestnancom s DPIA, alebo aj klientom? Odporúčam vo fáze 1 iba vlastníkovi.
4. Je ochotný urobiť **DPIA a informovať zamestnancov** ešte pred prvou interview kampaňou?
5. Smú serveroví agenti **niekedy nasadiť do produkcie**? Odporúčam nie, iba preview + PR.
6. Aký je **mesačný strop** na hlas (napr. 100 EUR vo fáze 1)?
7. Kedy sa **runner oddelí** od servera s PM live?

## 4. Ktoré riziká sú pravdepodobne prehnané

- **Náklady na minútu (č. 7)** sú pri jednom používateľovi zanedbateľné: odhad 7 min × 22 dní × ~0,10–0,15 USD ≈ 15–25 USD/mes. Bolieť začnú až pri kampaniach a desiatkach ľudí.
- **GDPR (č. 8)** je pre Marekove vlastné hovory s jeho agentom prakticky nulové. Je to ten istý človek a správca, ide o osobné použitie. Riziko vzniká až pri hovoroch iným ľuďom.
- **Podmienky predplatného (č. 1)** pre súčasný stav, teda jeden človek, vlastný Max a `claude -p` na vlastnom serveri, pravdepodobne spĺňajú „ordinary, individual usage“. Hrozba je reálna až pri multi-user alebo produkte, nie dnes. Pozor však na objem: desiatky behov denne môžu naraziť na limity.
- **Agent↔agent únik (č. 5)** je dnes hypotetický, lebo existuje jedna identita. Netreba ho riešiť skôr ako pri druhom agentovi, len ho nezabudnúť navrhnúť.
- **SIP (č. 9)** je otravný, ale lacno sa mitiguje textovým fallbackom. Víziu nezabije.

Skutočne nebezpečné hneď teraz sú **č. 3 a č. 4**: followup s celým PM serverom, ktorý číta cudzie e-maily, a hlasové „áno“.
