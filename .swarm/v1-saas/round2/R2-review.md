# R2 – Cross-review R3 a R4 voči kódu (empirik)

Odhady dní sú **(odhad)**, 1 dev-deň = 1 agent s review. Cesty sú voči `/home/marek/impofai-pm`.

## 1. Realizovateľnosť R3 voči kódu

**Dá sa znovu použiť:**
- Živá detekcia MCP (R3 1A/5): `McpToken.lastUsedAt` sa už zapisuje v `authenticateToken()` (`lib/services/mcp.ts:248`) a OAuth grant má tiež `lastUsedAt`. Stačí malý polling endpoint, migrácia netreba.
- Prompt pre pozvaného, invite landing: `components/auth/invite-card.tsx`, `lib/auth/invitations.ts` (`initialGrants`).
- Šablóny: `lib/brain-hub/templates.ts` (10 ks, štruktúra s variantmi Claude/OpenAI a `UNVERIFIED_LABEL`). Ďalších 8 je len obsah.
- Skill ZIP-y: `skills/second-brain/manifest.json`, `lib/brain-hub/skill-package.ts`.
- Mini mapa brainu: `components/brain/graph-tab.tsx` + `/api/v1/brain/graph`. Dnes je len pre admina, pre membra treba filtrovať cez `brainNoteWhere`.
- Export po triale (R4): `buildBrainArchive()` v `lib/services/brain/backup.ts` už robí Markdown tar.gz. Chýba export PM dát (úlohy, čas) do JSON.
- Annotácie `readOnlyHint` už MCP nástroje majú (`lib/mcp/utils.ts:43`).
- Share UI: `components/spaces/share-dialog.tsx` stačí zavesiť do menu v `components/nav/space-tree-container.tsx`.

**Treba migráciu DB:**
- `Organization`: `plan`, `trialEndsAt`, `subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId`, `lockedAt`, `signupSource` (UTM).
- `User.emailVerifiedAt` a tabuľka tokenov (reset, overenie).
- Odpovede z onboardingu: `UserSettings.onboarding Json` alebo `OrgMember.onboarding`.
- Brain úroveň: `OrgMember.brainLevel`, `Invitation.brainLevel`, `McpToken.brainWrite` (pozri bod 3).
- Pri `BrainScopeMap` zmeniť `onDelete`.

**Veľké:**
- Stripe + zámok + read-only režim naprieč web aj MCP.
- Granty na task list. `AccessGrant` má len space/folder a `lib/permissions/index.ts` počíta úroveň po reťazci kontajnerov, takže ide o zásah do jadra a testov. **Navrhujem pre V1 len space/folder v strome.**
- ClickUp sync: súhlasím s R4, vo V1 len „BYO ClickUp MCP“ a šablóny.
- Google signup (R3 4): nový OAuth klient. **Odložiť.**

## 2. Balíky pre stavebný swarm

Spoločné pravidlo: `prisma/schema.prisma` má jedného vlastníka (P3). Ostatné balíky mu pošlú diff modelov a každý balík dostane vlastný migračný súbor v poradí P3 → P2 → P5 → P4.

| # | Balík | Vlastní súbory | DB | Závisí od | Dni |
|---|---|---|---|---|---|
| P1 | Landing + pricing | `app/(public)/**`, `components/landing/**`, metadata 4 € → 6 € | nie | finálny copy (R3 §4), grafika | 2–3 |
| P2 | Auth + e-maily + pozvánky | nové `lib/email/**`, `lib/auth/**` (okrem `session.ts`), `app/(auth)/**` + `forgot`/`reset`/`verify`, `app/api/auth/**`, `components/auth/**`, `createInvitation` v `lib/services/orgs.ts` (odoslanie), rate limit signupu | `User.emailVerifiedAt`, `AuthToken` | Marekova úloha: provider + SPF/DKIM/DMARC | 3–4 |
| P3 | Trial + Stripe + zámok + export | `prisma/schema.prisma`, nové `lib/billing/**`, `app/api/billing/**` (checkout, portal, webhook), `app/(app)/settings/billing`, `lib/auth/session.ts` (`requireActor`), lock v `authenticateToken` → MCP vráti chybu s linkom, `middleware.ts`, export org | polia `Organization` | P2 (e-maily D25/zámok), Marekova úloha: Stripe účet | 5–6 |
| P4 | Onboarding + guide „?“ + šablóny + `/brain/start` | `app/(onboarding)/**`, `components/spaces/onboarding-form.tsx`, `components/shell/help-button.tsx` (+ nový tour), `lib/brain-hub/**`, `components/brain-hub/**`, `app/(app)/brain/start`, nové `app/(app)/templates`, checklist v shell | `onboarding Json`, `signupSource` | P6 (prompt), P5 (mapa pre membra) | 5–7 |
| P5 | Prístupy v strome + brain R/W | `components/nav/space-tree-container.tsx`, `components/spaces/share-dialog.tsx`, `lib/permissions/brain.ts`, `lib/brain/access-rules.ts`, `lib/services/brain/{admin,notes,core}.ts`, `components/brain/admin-tab.tsx`, `lib/services/access.ts`, scope picker pre `brainWrite` | `brainLevel`, `brainWrite`, `BrainScopeMap` | nič (P2 len UI voľby v pozvánke) | 4–5 |
| P6 | MCP Easy setup + hardening tenantov | `components/mcp/**`, `app/(app)/mcp`, `BRAIN_MCP_URL` → z `APP_URL` (`lib/brain-hub/hub.ts`), endpoint stavu pripojenia, troubleshooting prompty, nové `tests/unit/tenant/**` (token org A × id org B pre každý nástroj), `internalClients` default `[]` pre nové org | nie | nič | 3–4 |

Spolu (odhad) **22–29 dev-dní**, pri 6 paralelných balíkoch ~1,5 týždňa + 2–3 dni integrácie a e2e. Mimo swarmu ostávajú: Peppol fakturácia (R4), DPA, VOP a offsite zálohy.

## 3. Návrh: brain read vs. read+write a prístup po zmene štruktúry

**Read / read+write:**
1. `enum BrainLevel { NONE READ WRITE }`. `OrgMember.brainLevel @default(READ)` a `Invitation.brainLevel`, ktoré `acceptInvitation()` skopíruje.
2. `McpToken.brainWrite Boolean @default(true)`, aby sa dal vydať aj read-only token pre člena s WRITE. Efektívna úroveň = min(člen, token).
3. `lib/permissions/brain.ts`:
   - `getBrainVisibility` vráti aj `level`;
   - pri NONE sa vráti prázdna viditeľnosť;
   - `canWriteBrainNote(actor, vis, note)` pridá podmienku `vis.level === "WRITE"`;
   - kontrola v `notes.ts:246` (create) ostáva.
4. `Actor` netreba rozširovať o DB volanie navyše: `brainLevel` sa načíta v `getBrainVisibility` spolu s mapovaniami.
5. Admin je vždy WRITE. `pm_get_current_identity` vypíše `brain_access`, aby to prompt z R3 2D vedel bez hádania.

**Zmena štruktúry brainu:**
1. **Mapovanie podľa cesty.** `BrainScopeMap.kind` rozšíriť o `"path"` (slug = prefix, napr. `projekty/acme/`). V `canSeeBrainItem` a `scopeWhere` pridať vetvu `path startsWith`. Pre SQL vo `brainNoteSqlFilter` použiť `n."path" LIKE ANY($5)`.
2. **Fallback pravidlo v `lib/brain/access-rules.ts`.** Pre nové org nastaviť `DEFAULT_ACCESS_RULES` ako posledné pravidlo `{ match: { client_missing: false, internal_client: false }, access: "projekt" }`, aby poznámka s klientom v novom priečinku nespadla na admin-only. IMPOFAI si nechá svoje pravidlá v `BrainSettings`.
3. **Raw cesty konfigurovateľné.** `BrainSettings.rawPrefixes String[]` s defaultom `context/prepisy/`, `context/dokumenty/`. `classifyPath()` (`lib/brain/markdown.ts:303`) ich dostane ako parameter.
4. **Premenovanie klienta.** Admin nástroj `renameBrainSlug(kind, old, new)` v transakcii prepíše `BrainNote.client/project`, `BrainCall`, `BrainEmailMap`, `BrainScopeMap` a frontmatter. Potom zavolá `recomputeDefaultAccess()`.
5. **Zmazanie kontajnera.** Na `BrainScopeMap.spaceId/folderId` zmeniť `onDelete: Cascade` → `SetNull` a v admin UI ukázať „mapovanie bez kontajnera“. Do `pm_lint_brain` doplniť varovanie „klient bez mapovania → vidí len admin“.
6. **Presun poznámky.** Nová operácia `move`: zmení `path`, prepočíta `deriveAttrs` a access, prepíše `BrainLink.target`.

## 4. Námietky

1. **R3 ignoruje, že nová org nemá žiadne mapovania.** Pozvaný člen (R3 1B) uvidí v brainu nulu a zápis cez `pm_create_brain_note` mu padne s „outside your access scope“ (`notes.ts:246`). Kým admin nenamapuje klienta na folder, nedosiahne ani aktiváciu „≥3 zápisy“. Riešenie: Easy setup prompt ownera musí po vytvorení foldrov volať `pm_set_brain_mapping`, alebo vznik foldra v space „Klienti“ mapovanie ponúkne automaticky.
2. **R3 „O viac požiadaj ownera, vytvorí úlohu“** predpokladá list, do ktorého člen smie písať. Bez grantu zápis zlyhá (P13: list ani nevidí). Treba systémový „Requests“ list s EDIT pre všetkých, alebo notifikáciu cez `Notification` namiesto úlohy. Druhé je jednoduchšie.
3. **R4 §5 #12** navrhuje `readOnlyHint` ako mitigáciu. Už existuje (`lib/mcp/utils.ts`). Reálna medzera je inde: chýba soft-delete pre úlohy a foldre a v PM chýba undo. Brain revízie už existujú (`BrainRevision`).
4. **R4: zálohy sú „len predeploy dumpy“.** Nie celkom. Brain má denný tar.gz (`lib/services/brain/backup.ts`, 30 ks), ale na **rovnakom volume** a GDPR purge ho nemaže. PM dáta (úlohy, čas) denne zálohované nie sú. Riziko je teda presnejšie: nie „žiadna záloha“, ale „záloha na tom istom disku, ktorá odporuje purge“.
5. **R4: read-only 60–90 dní po triale.** Pre V1 je to drahšie ako treba. Ide o druhý režim naprieč ~125 nástrojmi a všetkými write routami. Pre čl. 20 GDPR a Data Act stačí, aby **export** ostal dostupný: zamknúť všetko okrem `/settings/billing` a exportu, MCP vráti chybu s linkom. Read-only pridať až v ďalšej verzii.
