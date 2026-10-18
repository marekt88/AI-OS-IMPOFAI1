# Decisions Log

Append-only record of meaningful decisions and why they were made. `/level-up` Phase 2 (Method interview) writes scoped automation specs here. You can also append manually whenever you decide something worth remembering.

**Format per entry:**

```
## YYYY-MM-DD — Short title

**Decision:** what was decided.

**Why:** the reasoning, constraints, and what would change your mind.

**Alternatives considered:** what else was on the table.

**Owner:** who's accountable.
```

Keep it terse. Future-you will thank present-you for capturing the *why*, not just the *what*.

---

## 2026-09-06 - Audit evidence and routing maintenance

**Decision:** Ship audit rubric v2 and a small /link skill. Audit scores working evidence across the Four Cs, checks operating-manual routing and freshness, and passes one concrete gap into /level-up. A selected repair can improve an existing workflow instead of creating another skill.

**Why:** File counts, configured keys, named rituals, and recent edits do not prove an operational AIOS. Source findability and freshness need explicit checks.

**Alternatives considered:** Keeping presence-based scoring or requiring a hot cache. Neither reliably establishes retrieval quality or successful execution.

## 2026-09-06 - Portable skills and automatic audit history

**Decision:** Ship all four skills for Claude Code and Codex, with bundled resources, matching operating manuals, and a script for regenerating Codex copies. Audit reports are saved automatically, preserve previous runs, and track findings across comparable inspections.

**Why:** Students need the same shared guidance when switching assistants and evidence of actual improvements over time. Intentional runtime adaptations, unknown verification, and confirmed defects are reported separately.

## 2026-09-06 - Portable 3D Brain skill

**Decision:** Add `/3d-brain` for Claude Code and Codex. Ask for a name and categories, map selected local folders, and scaffold a bundled, configurable application with spherical placement, Cinema, and interactive growth replay.

**Why:** Shipping the working renderer preserves the intended appearance and interactions across AIOS installations. A prose-only prompt would produce inconsistent recreations. User config and graph data remain local; the public package includes only code, documentation, dependency notices, and fictional test inputs.

## 2026-09-06 - Add ongoing context interviews

**Decision:** Adapt Herk-2's grill-me skill for the student kit and ship matching Claude/Codex packages. Save every answer to brainstorms/, preserve resumable Q&A history, and update canonical context only with confirmed facts during requested context-building sessions.

**Why:** Onboarding is an initial snapshot. Ongoing interviews capture changing priorities, decisions, and preferences while keeping tentative ideas distinct from current business facts.

## 2026-10-16 - Spúšťač AI procesov na serveri (A2)

**Decision:** Opakované AI procesy bežia na serveri `Projektovy-manazment` cez headless `claude -p` na predplatnom claude.ai Max (žiadne API tokeny). Jeden proces = priečinok `processes/<meno>/` (definícia, prompt, schéma, krok po behu). Rozvrh spúšťa jeden cron tick každých 5 minút, ktorý rieši slovenský čas a letný čas v kóde. Nasadenie = `git pull --ff-only` pred každým tickom. Chyby (aj neplatné prihlásenie Claude Code) idú ako bug úlohy do PM listu Startups / Projekt Manazment / AI Bugs cez vlastný PM MCP token, nie cez Claude.

**Why:** Prihlásenie claude.ai sa obnovuje samo a jediné sprístupňuje claude.ai konektory (Gmail, Calendar, Fireflies). Dlhodobý `setup-token` konektory nenačíta. Cron funguje bez sudo a pridanie procesu nevyžaduje nič okrem definície. Hlásenie chýb musí fungovať aj vtedy, keď je pokazený práve Claude.

**Alternatives considered:** systemd user timery (vyžadujú linger cez sudo), stále bežiaci daemon, ručné nasadzovanie, ntfy push notifikácie (vlastník chce chyby v PM, e-mail notifikácie pre AI Bugs pribudnú neskôr).

**Owner:** Marek Tóth

## 2026-10-16 - Zdroje ranného briefu (B1)

**Decision:** Brief pokrýva obdobie od posledného úspešného briefu. Zdroje: PM second brain log (presný čas, bez system importov a indexovania), PM hovory a výťahy (hlavný zdroj hovorov), PM notifikácie (zoskupené po projektoch), PM moje úlohy a aktivita naprieč projektmi, Gmail impofai.toth@gmail.com (bez automatických mailov), Google Calendar impofai.ai@gmail.com (pozvaný na všetky Meet hovory, má platený Fireflies) a Fireflies ako doplnok. ClickUp nie, PM stačí.

**Why:** Toto sú zdroje dostupné v `claude -p` na serveri s filtrom podľa času. Šum (automatické maily, system importy) tvorí väčšinu obsahu a do briefu nepatrí.

**Alternatives considered:** pevných 24 hodín (vynechá alebo zdvojí veci pri vynechanom dni), ClickUp, ďalšie e-mailové účty.

**Owner:** Marek Tóth

## 2026-10-16 - Tok ranného briefu (B2)

**Decision:** O 8:30 `claude -p` zozbiera dáta a vráti štruktúrovaný brief, kde každá položka má povinný zdroj. O 9:00 `after.mjs` zavolá ElevenLabs SIP trunk outbound call (agent „IMPOFAI - Ranný brief“, Linphone trunk, cieľ `mtoth`) a brief odovzdá v dynamických premenných. Agent smie hovoriť len z briefu. Nezdvihnutý hovor sa raz zopakuje po 10 minútach a nie je to chyba. Linphone číslo ostáva pre prichádzajúce hovory priradené agentovi „IMPOFAI - manager“.

**Why:** ElevenLabs agent nemá prístup k MCP, takže brief musí dostať hotový. Povinný zdroj pri každej položke bráni vymýšľaniu a umožňuje spätne ukázať, odkiaľ informácia je. Hovor zazvoní načas, aj keď zber trvá dlhšie.

**Alternatives considered:** prepísanie promptu agenta pri každom hovore (override), agent so živým prístupom k MCP. Akcie počas hovoru (úlohy, e-maily, meetingy, otázky) a indexovanie prepisu prídu neskôr cez server tools a post-call webhook do PM.

**Owner:** Marek Tóth

## 2026-10-18 - Plán AI platformy a fáza 1

**Decision:** Cieľ a plán sú zapísané v `references/ai-platforma-ciel.md` a `references/ai-platforma-plan.md` (fázy 0–6). Fáza 1 beží v AIOS runneri bez zmien v PM:
- prichádzajúci hovor k osobnému asistentovi (Linphone číslo prepnuté z testovacej Petry);
- followup akcie iba navrhne, vykoná ich samostatný `action-executor` (úzky zoznam nástrojov, limit 10, záloha pred zmazaním, audit komentárom, prístupy, financie a e-maily len cez úlohu na schválenie);
- spätný hovor s tichými hodinami 21:00–7:30, max 3 za deň, strop 60 min za deň;
- brief v3 so všetkými aktívnymi projektmi a frontou otázok;
- opakovanie pri prechodných chybách a testovací režim `--dry-run`.

Presun do PM (entity Agent, AgentRun, Call, Approval, Question) príde vo fáze 3.

**Why:** Swarm 4 agentov s krížovou recenziou. Dáta ukazujú, že dnes bolí spoľahlivosť a chýbajúca slučka „zavolaj – urobí – zavolá späť“, nie chýbajúca infraštruktúra v PM. Červený tím ukázal riziko prompt injection (followup s právami zapisovať čítal e-maily), preto oddelenie návrhu a vykonania.

**Alternatives considered:** fronta jobov v PM hneď (architekt), druhé potvrdenie mimo hlasu a 2 týždne testovacieho režimu (červený tím), samostatné druhé číslo pre asistenta. Otvorené pre Mareka: model predplatného pre produkt pre iné firmy (Anthropic nepovoľuje zdieľať predplatné), prvý server pre serverových agentov.

**Owner:** Marek Tóth (rozhodnutia orchestrátora v autonómnom režime, na potvrdenie)
