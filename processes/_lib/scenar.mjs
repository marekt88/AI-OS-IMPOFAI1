// Script (scenár) helpers of the IMPOFAI content system (navrh.md §3, plugin impofai-reels 0.10 "IMPOFAI Scéna").
// Step B renders the description of a kanban task from the model's JSON; the production poller reads the machine
// blocks back (```json script``` → beats.json, ```json popis``` → popis-vN.json). One JSON source, so the human view
// (markdown tables) and the machine view cannot drift apart.

export const AVATAR_POSES = [
  "happy_idle", "neutral_idle", "laugh_idle", "surprised_idle", "serious_idle", "happy_wave", "happy_point_right", "happy_point_left",
  "excited_idea", "wink_thumbs_up", "thinking_chin", "worried_shrug", "confident_arms_crossed", "laugh_celebrate", "surprised_point_right",
];
// element IDs of impofai-video-style/references/elements.md (0.10); S:* sets and V:* metaphors may be new
const ELEMENT_RE = /^(S:[a-z0-9-]+|V:[a-z0-9-]+|L|X(10|[1-9])|A|D|R[12]|K(3|4|5|6|7|8|9|11|13|14)|T[1-3]|M[12]|Z[12])(:[a-z0-9-]+)?$/i;
const FORBIDDEN = [/každú sobotu/i, /\bvyral\b/i];
const CTA_LABEL = { workshop: "workshop", konzultacia: "konzultácia", "klucove-slovo": "kľúčové slovo", "diskusia-web": "diskusia/web" };

/** Problems that make a script unusable (empty = ok). Warnings are reported but do not block. */
export function validateScript(s) {
  const errors = [];
  const warnings = [];
  if (!s.lines?.length) errors.push("scenár nemá riadky");
  if (s.hooks?.length !== 3) errors.push(`hookov je ${s.hooks?.length ?? 0}, má byť 3`);
  const words = (s.lines ?? []).reduce((n, l) => n + String(l.titulky).trim().split(/\s+/).filter(Boolean).length, 0);
  if (words < 80 || words > 150) errors.push(`hlas má ${words} slov, má mať ~90–140`);
  const dur = s.lines?.length ? s.lines[s.lines.length - 1].t_to : 0;
  if (dur < 30 || dur > 75) errors.push(`dĺžka ${dur} s mimo 30–75 s`);
  (s.lines ?? []).forEach((l, i) => {
    const n = i + 1;
    if (!AVATAR_POSES.includes(l.avatar)) errors.push(`riadok ${n}: neznáma póza avatara „${l.avatar}“`);
    if (!/^S:[a-z0-9-]+$/i.test(l.set)) errors.push(`riadok ${n}: scéna musí byť S:*`);
    if (!/^V:[a-z0-9-]+$/i.test(l.metaphor)) errors.push(`riadok ${n}: metafora musí byť V:*`);
    for (const e of l.elements ?? []) if (!ELEMENT_RE.test(e)) errors.push(`riadok ${n}: neznámy prvok „${e}“`);
    if (!String(l.action).trim()) errors.push(`riadok ${n}: chýba akcia na obraze`);
    if (l.t_to <= l.t_from) errors.push(`riadok ${n}: čas ${l.t_from}–${l.t_to}`);
    if (l.t_to - l.t_from > 8.5) warnings.push(`riadok ${n}: ${(l.t_to - l.t_from).toFixed(1)} s v jednej myšlienke (tempo)`);
    if (/ej-áj|klód/i.test(l.titulky)) errors.push(`riadok ${n}: výslovnostný pravopis v titulkoch`);
    if (/\bAI\b|Claude/.test(l.elevenlabs)) errors.push(`riadok ${n}: v ElevenLabs texte ostal normálny pravopis (AI/Claude)`);
    if (/\d/.test(l.titulky) && !l.source_url && !(s.facts ?? []).some((f) => f.line === n)) warnings.push(`riadok ${n}: číslo bez zdroja v mape faktov`);
    if (l.source_url && !/^https?:\/\//.test(l.source_url)) errors.push(`riadok ${n}: neplatná URL zdroja`);
  });
  for (const f of s.facts ?? []) if (!/^https?:\/\//.test(f.url)) errors.push(`fakt bez platnej URL: ${f.claim.slice(0, 60)}`);
  if ([...(s.popis?.youtube?.title ?? "")].length > 70) errors.push("YouTube title > 70 znakov");
  if ([...(s.popis?.tiktok?.title ?? "")].length > 90) errors.push("TikTok title > 90 znakov");
  // only audience-facing text (the brand check itself says "never 'každú sobotu'")
  const shown = JSON.stringify([s.hooks, s.cta_text, s.cover_text, s.popis, (s.lines ?? []).map((l) => [l.titulky, l.elevenlabs, l.on_screen])]);
  for (const re of FORBIDDEN) if (re.test(shown)) errors.push(`zakázaný text ${re}`);
  return { errors, warnings, words, duration: dur };
}

const cell = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

/** Description of the kanban task (stage navrhnute). */
export function renderScript(s, { idea, version, projectDate, changes = [], warnings = [] }) {
  const h = s.hooks;
  const lines = [
    `**Nápad:** ${idea} · **Slug:** ${s.slug} · **Dátum projektu:** ${projectDate}`,
    `**Verzia:** v${version} · **Zmeny oproti v${version - 1}:** ${version > 1 && changes.length ? changes.join("; ") : "—"}`,
    `**Formát:** A grafické video (IMPOFAI Scéna) · **Dĺžka:** ${s.duration_s} s · **Slová hlasu:** ${s._words ?? "?"}`,
    `**CTA (${CTA_LABEL[s.cta_type] ?? s.cta_type}):** „${s.cta_text}“ · **Platnosť do:** ${s.valid_until ?? "bez expirácie"}`,
    "",
    "## Pointa",
    `${s.pointa} · **Open loop:** ${s.open_loop}`,
    "",
    "## Hooky (3 varianty)",
    "| # | Archetyp | Hlas (< 2 s) | Text na obraze | Frame 0 |",
    "|---|---|---|---|---|",
    ...h.map((x, i) => `| ${i + 1} | ${cell(x.archetype)} | ${cell(x.voice)} | ${cell(x.on_screen)} | ${cell(x.frame0)} |`),
    `**Vybraný:** #${s.chosen_hook} – ${s.hook_why}`,
    "",
    "## Scenár",
    "| Čas | Titulky | ElevenLabs | Avatar | Scéna | Na obraze (akcia) | Prvky | Zvuk | Zdroj |",
    "|---|---|---|---|---|---|---|---|---|",
    ...s.lines.map((l) => `| ${l.t_from}–${l.t_to} s | ${cell(l.titulky)} | ${cell(l.elevenlabs)} | ${cell(l.avatar)} | ${cell(l.set)} | ${cell(l.metaphor)}: ${cell(l.action)}${l.on_screen ? ` · „${cell(l.on_screen)}“` : ""}${l.highlight ? ` · zvýraznené: ${cell(l.highlight)}` : ""} | ${cell(l.elements.join(", "))} | ${cell(l.sound)} | ${l.source_url ? cell(l.source_url) : "—"} |`),
    "",
    "## Cover",
    `Frame 0 = hook #${s.chosen_hook}: ${s.cover_text} · thumb_offset_ms: 0`,
    "",
    "## Popis pre platformy (návrh, schvaľuje sa so scenárom)",
    `- **Instagram:** ${s.popis.instagram}`,
    `- **Facebook:** ${s.popis.facebook}`,
    `- **YouTube Shorts:** ${s.popis.youtube.title} · ${s.popis.youtube.description}`,
    `- **LinkedIn:** ${s.popis.linkedin}`,
    `- **TikTok:** ${s.popis.tiktok.title} · ${s.popis.tiktok.text}`,
    `- **Prvý komentár:** ${s.popis.first_comment ?? "—"}`,
    "",
    "## Potrebné podklady",
    ...(s.assets.length ? ["| ID | Čo | Stav | URL |", "|---|---|---|---|", ...s.assets.map((a) => `| ${cell(a.id)} | ${cell(a.what)} | ${a.status} | ${a.url ?? "—"} |`)] : ["—"]),
    "",
    "## Mapa faktov",
    ...(s.facts.length ? ["| Tvrdenie | Zdroj | Overené | Riadok |", "|---|---|---|---|", ...s.facts.map((f) => `| ${cell(f.claim)} | ${f.url} | ${f.checked} | ${f.line} |`)] : ["—"]),
    "",
    "## Netvrdiť",
    ...(s.do_not_claim.length ? s.do_not_claim.map((d) => `- ${d}`) : ["—"]),
    "",
    "## Kontrola značky",
    ...s.brand_check.map((b) => `- [${b.ok ? "x" : " "}] ${b.item}${b.note ? ` – ${b.note}` : ""}`),
    ...(warnings.length ? ["", "**Upozornenia kontroly:**", ...warnings.map((w) => `- ${w}`)] : []),
    "",
    "## Otvorené otázky",
    ...(s.questions.length ? s.questions.map((q) => `- ${q}`) : ["—"]),
    "",
    "Zmeny píš do komentára, scenár prepíše nová verzia. Description ručne neupravuj.",
    "",
    "<!-- strojová časť, generuje krok B; ručne neupravovať -->",
    "```json script",
    JSON.stringify(machineScript(s, { idea, version, projectDate })),
    "```",
    "```json popis",
    JSON.stringify({ ...s.popis, cta_type: s.cta_type, valid_until: s.valid_until }),
    "```",
  ];
  return lines.join("\n");
}

export function machineScript(s, { idea, version, projectDate }) {
  return {
    script_version: version, idea, slug: s.slug, project_date: projectDate, format: "A", style: "impofai-scena-0.10",
    cta_type: s.cta_type, cta_text: s.cta_text, valid_until: s.valid_until, duration_s: s.duration_s,
    hook: { chosen: s.chosen_hook, variants: s.hooks },
    beats: s.lines,
    voice_text: s.lines.map((l) => l.elevenlabs).join(" "),
    captions_text: s.lines.map((l) => l.titulky).join(" "),
    cover: { thumb_offset_ms: 0, text: s.cover_text },
    assets: s.assets, facts: s.facts,
  };
}

/** Reads a ```json <tag>``` block from a task description (null when missing or invalid). */
export function readBlock(description, tag) {
  const m = String(description ?? "").match(new RegExp("```json " + tag + "\\n([\\s\\S]*?)\\n```"));
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}
