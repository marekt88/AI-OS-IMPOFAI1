# R2 – Audit PM kódu pre V1 (empirik)

Zdroj: kód `/home/marek/impofai-pm` (stav 18. 10. 2026) + live čítanie cez PM MCP (`pm_list_brain_mappings`, `pm_list_members`). Nič nemenené.

## 1. Second brain prístupy dnes

**Tri vrstvy, ktoré sa skladajú (AND):**

1. **Rola v org** (`OrgRole` ADMIN | USER, `prisma/schema.prisma`). `isOrgAdmin()` v `lib/permissions/index.ts` = ADMIN **a** nie RESTRICTED token. Admin vidí a píše všetko (B1), `/brain` (prehliadanie, admin, graf) je len pre admina (`app/(app)/brain/page.tsx` → `notFound()`).
2. **Pole `access` poznámky** (`BrainAccess` ADMIN | PROJECT na `BrainNote` aj `BrainCall`). Odvodzuje sa:
   - `deriveAttrs()` v `lib/services/brain/core.ts` číta frontmatter `klient`, `projekt`, `druh`, `typ` a `pristup`; typ/vrstvu určuje `classifyPath()` v `lib/brain/markdown.ts:303` podľa **pevných ciest** (`context/prepisy/` → RAW prepis, `context/dokumenty/` → RAW, `context/hovory/` → hovor, `context/klienti/` → klient, `context/ludia*`, `decisions/`, `context/*.md` → firma, inak `poznamka`);
   - explicitné `pristup: admin|projekt` vo frontmatteri → `accessOverride = true` (pravidlá ho už neprepíšu); meniť ho smie len admin (`notes.ts:232`, `pm_set_brain_note_access`);
   - inak `defaultAccess()` → `evaluateAccess()` v `lib/brain/access-rules.ts`: zoradené pravidlá (`BrainSettings.accessRules`, prvé platí, **bez zhody = admin**). Predvolené: prepis, ľudia/osoba, interní klienti (`internalClients` default `["impofai","neurcene"]` pre **každú** org), bez klienta, firma/schema/rozhodnutie → admin; hovor/klient/dokument/projekt → projekt.
3. **Mapovanie klient/projekt → space/folder** (`BrainScopeMap`, admin cez `lib/services/brain/admin.ts setMapping`). `getBrainVisibility()` v `lib/permissions/brain.ts`: ne-admin vidí poznámku iba ak `access = PROJECT` **a** namapovaný kontajner je v jeho `getReadableScope()` (AccessGrant ∩ scope tokenu, potomkovia áno, pass-through predkovia nie). Projekt má prednosť pred klientom; namapovaný, ale nedostupný projekt nespadne späť na klienta. Nenamapované = len admin.

**Tokeny:** `McpToken.scopeType` FULL | RESTRICTED (`McpTokenScope` = space/folder/taskList). `authenticateToken()` (`lib/services/mcp.ts:235`) overí členstvo a postaví `Actor.tokenScope`. RESTRICTED token admina = nie je admin (žiadne admin akcie, brain len cez mapovanie).

**Zápis (B4, `canWriteBrainNote`):** každý, kto poznámku vidí, môže písať do vrstvy WIKI; RAW nikto, SCHEMA len admin. **Neexistuje rozlíšenie read vs. read+write.** `AccessLevel` má iba `EDIT | MANAGE` – v PM ani v brain nie je úroveň READ.

**Live stav (IMPOFAI):** 15 mapovaní, všetky na foldre v space „Clients“ (napr. `imagewell` → `Clients / Zacharides`, `lestero` → `Clients / Jakub Kralovansky`, projekt `wellgard` → `…/Wellgard`). 9 členov, 2 admini (Marek, Daniel), v org je aj účet „Tester“.

**Čo sa stane pri zmene štruktúry:**
- **Nové priečinky / iné cesty v brain:** cesta mimo pevných prefixov dostane typ `poznamka` (alebo frontmatter `typ`) → žiadne predvolené pravidlo „projekt“ nesedí → **admin-only**. Prístup podľa cesty sa dá dosiahnuť iba pravidlom `path_prefix` (admin, `/api/v1/brain/rules`). Raw ochrana (immutable) je natvrdo na `context/prepisy/` a `context/dokumenty/`; iné umiestnenie prepisov = bežná zapisovateľná wiki. Presun/premenovanie poznámky nie je (iba create/delete), staré `[[odkazy]]` sa nepresmerujú.
- **Iné mapovanie klientov / premenovanie slugu:** prístup visí na reťazci `client`/`project` v poznámke. Nový slug bez mapovania → poznámky zmiznú ne-adminom; staré mapovanie ostane ako `orphanMappings` (admin UI). Hromadná zmena slugu neexistuje.
- **Zmena pravidiel:** `recomputeDefaultAccess()` (`lib/services/brain/notes.ts:479`) prepočíta všetky ne-override poznámky aj hovory.
- **Spaces/foldre:** mapovanie je cez **id**, takže premenovanie alebo presun foldra mapovanie nerozbije; viditeľnosť sa však zmení podľa grantov nového rodiča. Zmazanie spacu/foldra kaskádovo zmaže `BrainScopeMap` (onDelete Cascade) → poznámky tichom prejdú na admin-only. Pozvánky s `initialGrants` na zmazané kontajnery sa preskočia.
- **E-mail → klient** (`BrainEmailMap`) sa seeduje z `context/ludia.md` (`import.ts:284`) – iná štruktúra súboru = Fireflies hovory bez klienta = admin-only.

## 2. Inventúra V1

| Položka | Stav | Cesta / poznámka |
|---|---|---|
| Landing page | **Existuje, zastaraná** | `app/(public)/page.tsx`, `components/landing/*`. Positioning „PM pre AI-first dev tímy“, cena **4 €/seat**, žiadna zmienka o second braine, bez grafiky pre reklamy. Prepísať. |
| Pricing | Existuje, zlý obsah | `app/(public)/pricing/page.tsx` – 1 plán 4 €, „no tiers“. Chýba 6 € / 45 € (vypredané) / Enterprise. |
| Signup | Existuje (len účet) | `app/(auth)/signup`, `app/api/auth/signup/route.ts` → `lib/auth/users.ts signup()`. Bez overenia e-mailu, bez CAPTCHA, bez rate limitu (login ho má). Org vzniká až v onboardingu. |
| Trial / predplatné | **Chýba** | `Organization` nemá žiadne polia (trial, plan, status, seats, stripeCustomerId). |
| E-maily (reset, pozvánky) | **Chýba úplne** | Žiadny nodemailer/resend/SMTP v `package.json` ani v kóde. Reset hesla neexistuje (ani route, ani UI). Pozvánka = admin skopíruje link (`invitationUrl()` v `lib/auth/invitations.ts`, TTL 14 dní). |
| Signup pozvaných | Čiastočne | `app/(auth)/invite/[token]`, `components/auth/invite-card.tsx`: zobrazí org, rolu, kto pozval; signup/login s tou adresou → Join; `acceptInvitation()` aplikuje `initialGrants` (EDIT/MANAGE). Chýba e-mail, iný onboarding, iný MCP prompt, voľba brain read/read+write. |
| Onboarding | Minimálny | `app/(onboarding)/onboarding/page.tsx` + `components/spaces/onboarding-form.tsx`: názov org, prefix kľúča (globálne unikátny), prvý workspace. Nič o brain, AI, MCP. |
| Guide z „?“ | Čiastočne | `components/shell/help-button.tsx`: popover so skratkami + odkaz na `/mcp`. Žiadny krokový guide/tour. |
| MCP stránka (Easy setup) | Čiastočne | `app/(app)/mcp/page.tsx`, `components/mcp/mcp-page.tsx`: tokeny (FULL/RESTRICTED, `scope-picker.tsx`), OAuth connections. Chýba Easy-setup prompt, krok „vlož prompt“ a Skip/OK/Pokazilo sa. |
| `/brain/start` | Existuje, zložitý | `app/(app)/brain/start/page.tsx` → `components/brain-hub/brain-hub.tsx`, 3 taby `setup | autofill | templates` (`lib/brain-hub/hub.ts`), 6 variantov skill ZIP (claude/openai/generic × sk/en, `skills/second-brain/manifest.json`), `connect-guide.tsx`, `autofill-guide.tsx`. `BRAIN_MCP_URL` natvrdo `https://project-managment.impofai.com/api/mcp`. |
| Šablóny | **10 existuje**, len plnenie brainu | `lib/brain-hub/templates.ts`: fireflies-daily-calls, email-new-messages, cloud-docs-weekly, team-chat-decisions, calendar-unrecorded-meetings, crm-client-pages, issue-tracker-project-status, competitor-watch, weekly-client-synthesis, brain-health-lint. Chýbajú chat/voice prompty, interviewer, ranný brief, draft e-mailu, e-mail skill, tipy. Nie je samostatná stránka. |
| Mapa second brainu | Len admin | `components/brain/graph-tab.tsx` v `/brain` (admin), `/api/v1/brain/graph`. Pre membrov a v guide nie je. |
| Prístupy v sidebar strome | **Chýba** | `components/nav/space-tree-container.tsx` menu má len New folder / task list / Upload. `ShareDialog` (`components/spaces/share-dialog.tsx`) je na stránke spacu/foldra (`container-view.tsx`) a v `/settings/access`. Na task liste granty vôbec nie sú (AccessGrant iba space/folder). |
| Brain read / read+write pre pozvaných | **Chýba** | Model to nevie: žiadna úroveň READ, write = visible+WIKI. Treba nové pole (napr. `OrgMember.brainAccess` alebo úroveň na mapovaní) + `canWriteBrainNote`. |
| Zámok platformy a MCP po triale | **Chýba** | Prirodzené body: `requireActor()`/`getActorFromRequest()` v `lib/auth/session.ts`, `authenticateToken()` v `lib/services/mcp.ts`, `middleware.ts`. |
| Stripe | **Chýba** | Žiadny SDK, webhook ani model. (Zmienky „Stripe“ sú iba v seed dátach.) |
| ClickUp integrácia | **Chýba** | Nič v kóde. |
| Fireflies | Existuje, single-tenant | `lib/services/brain/fireflies.ts`: jeden `FIREFLIES_API_KEY` z env a jedna org `BRAIN_SYNC_ORG`. Pre zákazníkov nepoužiteľné bez per-org kľúča. |

## 3. Onboarding a pozvánka dnes

**Nový používateľ:** `/signup` (meno, e-mail, heslo) → session → `/onboarding` (org, prefix, workspace) → `createOrganization()` (`lib/services/orgs.ts:82`) spraví ho ADMIN-om → landing do appky. Prázdny workspace, žiadny brain setup, žiadny e-mail, žiadny trial.

**Pozvánka:** admin v `/settings/members` (alebo `pm_invite_member`) vytvorí `Invitation` (rola, voliteľné `initialGrants` EDIT/MANAGE na space/folder) → dostane **URL na skopírovanie** → pozvaný otvorí `/invite/<token>` → signup/login s presne tou adresou → Join → `acceptInvitation()` založí `OrgMember` a granty. Potom ten istý onboarding ako všetci (pozvaný už má org, takže `/onboarding` ho presmeruje domov). Člen vidí `/brain/start`, ale nie `/brain`; brain obsah dostane len cez vlastné MCP pripojenie a mapovania.

## 4. Riziká pri predaji tretím stranám

- **Izolácia org:** silná stránka. Všetky loadery v `lib/permissions/index.ts` filtrujú `{ id, orgId: actor.orgId }`; brain cez `brainNoteWhere`/`brainNoteSqlFilter` (orgId bound, `$queryRawUnsafe` iba s parametrami v `search.ts`); token viazaný na `orgId` + kontrola členstva. Testy: `tests/unit/permissions.test.ts`, `tests/unit/a/spaces-access.test.ts`. **Odporúčam** vlastný cross-tenant e2e test pred predajom (odhad: nie je pokrytý systematicky pre všetkých ~140 MCP nástrojov).
- **IMPOFAI-špecifické konštanty pre všetkých:** `BRAIN_MCP_URL` natvrdo, `internalClients` default `impofai, neurcene`, slovenské cesty a typy (`context/klienti`, `prepis`, `hovor`), slovenská schéma `context/mapa-mozgu.md` v `notes.ts:700+`, landing/UI anglicky. Nová org dostane IMPOFAI konvencie.
- **Globálne unikátne:** `taskKeyPrefix` je unikátny naprieč všetkými org (`assertPrefixFree`) → enumerácia a kolízie (napr. „IMP“).
- **Fireflies/scheduler single-tenant** (env kľúč + `BRAIN_SYNC_ORG`); scheduler beží in-process, backup pre každú org s poznámkami.
- **Seedy:** `prisma/seed.ts` + `seed-data.ts` (účty z `SEED_*` env, testovacie `*@impofai.test`, heslá „member“). `db:reset` dropne DB; na live sa nesmie spustiť. Na live je člen „Tester“ (`videosend858@gmail.com`) v IMPOFAI org; live prihlasovacie údaje sú v `.swarm/pm-build/credentials.md` (`deploy/README.md`) – mimo git, ale v repo strome.
- **Admin účty / super-admin:** neexistuje platformový admin (žiadna správa tenantov, zákazníkov, podpory). Každý signup si vytvorí vlastnú org; neobmedzený počet org na používateľa.
- **Logy:** `lib/log/safe-error.ts` loguje bez message (dobré). `BrainAudit` ukladá `target` (cesty poznámok, max 500 znakov) neobmedzene dlho, bez retencie.
- **GDPR purge:** `purgeClient()` (`lib/services/brain/admin.ts:262`) maže poznámky, revízie, hovory, raw, dokumenty, e-mail mapu a mapovania jedného klienta, **ale nie denné zálohy** (`lib/services/brain/backup.ts`, 30 tar.gz v `UPLOAD_DIR/brain-backups/<org>`) ani zmienky v textoch iných klientov (vráti iba zoznam). **Chýba zmazanie účtu, zmazanie org a export dát org** (`organization.delete`/`user.delete` nikde v `lib`/`app`). Pre SaaS treba aj DPA, retenciu záloh, dataregión.
- **Signup bez overenia e-mailu a bez rate limitu** → spam org, a pozvánka sa páruje len na zhodu e-mailu (bez overenia vlastníctva adresy si ktokoľvek môže zaregistrovať cudzí e-mail vopred; pozvánku však musí poznať → nízke riziko, ale pri e-mailových pozvánkach treba overenie).
- **Plán vs. kód:** cena 4 € natvrdo na landingu, pricingu aj v metadata; nové 6 € treba zmeniť na 3 miestach.

## Hlavné medzery pre V1 (zoradené podľa závislostí, odhad)
1. E-mail infra (SMTP/Resend + noreply) → reset hesla, e-mailové pozvánky, overenie signupu.
2. Billing model na `Organization` (trialEndsAt, status, seats, stripe ids) + Stripe Checkout/Portal/webhook + zámok v `requireActor` a `authenticateToken`.
3. Brain úroveň read/read+write (schéma + `canWriteBrainNote` + pozvánka).
4. Share v sidebar strome (znovupoužiť `ShareDialog`) + granty na task list (nová schéma) alebo len space/folder.
5. Prepis landing/pricing, onboarding (otázky, MCP krok), Easy-setup prompt na `/mcp`, stránka šablón, zjednodušený `/brain/start`, guide z „?“.
6. Odstránenie IMPOFAI konštánt (MCP URL z `APP_URL`, internalClients prázdne), per-org Fireflies, GDPR purge záloh, zmazanie org/účtu.
7. ClickUp integrácia: od nuly.
