// Step A of the IMPOFAI content system (navrh.md §3): ideas JSON from claude -p → tasks "Nápad: …" in KAPSA.
// The model has read-only tools; only this script writes, with the content token (config token_env).
// - validates every idea (URLs, forbidden strings, required context), drops invalid ones into the report
// - deterministic dedup: same dedup_key + angle already in the folder of the board (config ideas_list) → skipped
// - renders the description template (common header + type block + machine block ```json idea```)
// - creates the card in the board "Obsah" (first custom status Nápad, labels = source zdroj-novinky or
//   zdroj-pripadovka + okruh-1..5, okruh 5 priority high) with agent run "queued": content-pipeline then writes its
//   script into the same card, one at a time (Marek 2026-11-23: Nápad and Scenár are one step). Video and audio
//   start only when a person moves the card.
// RUN_DRY=1: pmTool does not send writes; the rendered tasks are saved in RUN_DIR.
import fs from "node:fs";
import path from "node:path";
import { hasSecret, pmTool } from "../../runner/pm.mjs";
import { isDry, localParts, readJson, ROOT, writeFileAtomic, writeJson } from "../_lib/zdroje.mjs";

const RUN_DIR = process.env.RUN_DIR;
const dry = isDry();
const now = new Date();
const nowIso = now.toISOString();
const { date: today } = localParts(now);
const { output: o } = JSON.parse(fs.readFileSync(process.env.RUN_OUTPUT, "utf8"));
const cfg = readJson(path.join(ROOT, "config", "content.json"), {});
const list = cfg.ideas_list || (dry ? "(nerozhodnutý list nápadov)" : null);
const tokenEnv = cfg.token_env || "CONTENT_PM_TOKEN";
const folder = cfg.content_folder || String(list ?? "").split(" / ").slice(0, -1).join(" / ");
if (!list) {
  console.error("config/content.json: ideas_list nie je nastavený (rozhodne Marek)");
  process.exit(1);
}
if (!dry && !hasSecret(tokenEnv)) {
  console.error(`${tokenEnv} chýba v ~/.aios-runner/secrets.env`);
  process.exit(1);
}

const TYPE_LABEL = { novinka: "novinka", tutorial: "tutoriál", "tip-claude": "tip na Claude", "pripadova-studia": "prípadová štúdia / use case", nazor: "názor / mýtus", "tyzdenny-suhrn": "týždenný súhrn" };
const FORMAT_LABEL = { A: "A (grafické video)", B: "B (talking head)", C: "C (screen recording)", D: "D (obrázok)", E: "E (carousel)" };
const FORBIDDEN = [/každú sobotu/i, /\bvyral\b/i];

function problems(i) {
  const p = [];
  const text = JSON.stringify({ ...i, do_not_claim: undefined }); // "Netvrdiť" may quote what must not be said
  for (const re of FORBIDDEN) if (re.test(text)) p.push(`zakázaný text ${re}`);
  for (const f of i.facts) for (const s of f.sources) if (!/^https?:\/\//.test(s)) p.push(`fakt bez platnej URL: ${f.text.slice(0, 60)}`);
  if (!i.details.length) p.push("chýba typový blok (details)");
  if (i.type === "novinka" && !i.facts.length) p.push("novinka bez overených faktov");
  if (i.valid_until && Number.isNaN(Date.parse(i.valid_until))) p.push("neplatné valid_until");
  if (i.valid_until && Date.parse(i.valid_until) < now.getTime()) p.push("novinka už expirovala");
  if (![1, 2, 3, 4, 5].includes(i.okruh)) p.push("chýba okruh 1–5");
  return p;
}

function render(i) {
  const lines = [
    `**Okruh:** ${i.okruh} · **Typ:** ${TYPE_LABEL[i.type]} · **Pilier:** ${i.pillar} · **Navrhovaný formát:** ${FORMAT_LABEL[i.format]}`,
    `**Typ CTA:** ${i.cta_type} · **Preferencia slotu (nezáväzné):** ${i.slot_pref}`,
    `**Jadro:** ${i.core}`,
    `**Pre koho a prečo teraz:** ${i.for_whom_why_now}`,
    `**Väzba na IMPOFAI:** ${i.impofai_link}`,
    "",
    "**Overené fakty:**",
    ...(i.facts.length ? i.facts.map((f) => `- ${f.text} · ${f.sources.join(" · ")} · ${f.date}`) : ["- —"]),
    "",
    "**Netvrdiť / rozpory:**",
    ...(i.do_not_claim.length ? i.do_not_claim.map((d) => `- ${d.text} – ${d.reason}`) : ["- —"]),
    "",
    `**Dostupnosť SK/EÚ:** ${i.eu_availability}`,
    `**Vizuálne podklady:** ${i.visual_assets}`,
    `**Kto musí niečo nahrať:** ${i.recording}`,
    `**Inšpirácia od creatora:** ${i.creator ? `${i.creator.handle} · ${i.creator.title} · ${i.creator.url} · prevzaté: ${i.creator.taken} · kredit: ${i.creator.credit ? "áno" : "nie"}` : "—"}`,
    `**Platnosť do:** ${i.valid_until ?? "bez expirácie"}`,
    `**Dedup kľúč:** ${i.dedup_key} · **Uhol:** ${i.angle}`,
    `**Zdroj behu:** krok A · ${process.env.RUN_ID ?? "manual"} · vstupy: ${i.inputs.join(", ") || "—"}`,
    "",
    `### ${TYPE_LABEL[i.type][0].toUpperCase()}${TYPE_LABEL[i.type].slice(1)}`,
    ...i.details.map((d) => `**${d.label}:** ${d.text}`),
    "",
    "<!-- strojová časť, generuje krok A; ručne neupravovať -->",
    "```json idea",
    JSON.stringify({ idea_version: 1, okruh: i.okruh, type: i.type, pillar: i.pillar, format: i.format, cta_type: i.cta_type, dedup_key: i.dedup_key, angle: i.angle, valid_until: i.valid_until, facts: i.facts, do_not_claim: i.do_not_claim, creator: i.creator, inputs: i.inputs }),
    "```",
  ];
  return lines.join("\n");
}

async function existing(i) {
  if (!hasSecret(tokenEnv)) return null; // dry-run without the token: dedup is skipped and noted in the report
  const r = await pmTool("pm_list_tasks", { folder, query: i.dedup_key, limit: 20 }, { tokenEnv });
  for (const t of r.items ?? []) {
    const full = await pmTool("pm_get_task", { task: t.key }, { tokenEnv });
    if (String(full.description ?? "").includes(`**Uhol:** ${i.angle}`)) return t.key;
  }
  return null;
}

const created = [];
const skipped = [...(o.skipped ?? []).map((s) => ({ why: "model", text: s }))];
const rendered = [];
const seen = new Set();
for (const i of o.ideas ?? []) {
  const p = problems(i);
  const key = `${i.dedup_key}#${i.angle}`;
  if (seen.has(key)) p.push("duplicita v tomto behu");
  seen.add(key);
  if (p.length) {
    skipped.push({ why: p.join("; "), text: i.name });
    continue;
  }
  const dup = await existing(i);
  if (dup) {
    skipped.push({ why: `rovnaká udalosť a uhol už existuje (${dup})`, text: i.name });
    continue;
  }
  const task = {
    task_list: list,
    name: `Nápad: ${i.name}`,
    status: "to_do",
    priority: i.okruh === 5 ? "high" : "normal",
    labels: [i.type === "pripadova-studia" ? "zdroj-pripadovka" : "zdroj-novinky", `okruh-${i.okruh}`],
    description: render(i),
  };
  rendered.push(task);
  const res = await pmTool("pm_create_task", task, { tokenEnv });
  // the script is written right away: content-pipeline starts content-scenare for queued ideas, one at a time
  if (res.key) await pmTool("pm_update_agent_run", { task: res.key, agent_run_status: "queued" }, { tokenEnv });
  created.push({ key: res.key ?? null, name: task.name, format: i.format, okruh: i.okruh, dry: Boolean(res.dry_run) });
}

// report (a file per run, never rewritten)
const report = [
  `# Nápady ${today} (krok A${dry ? ", testovací beh" : ""})`,
  "",
  o.notes_sk ? `> ${o.notes_sk}` : "",
  "",
  `Vytvorené: ${created.length} · Vynechané: ${skipped.length}${hasSecret(tokenEnv) ? "" : " · dedup proti KAPSA preskočený (chýba token)"}`,
  "",
  ...created.map((c) => `- ${c.key ?? "(dry-run)"} ${c.name} · okruh ${c.okruh} · formát ${c.format}`),
  "",
  ...(skipped.length ? ["## Vynechané", "", ...skipped.map((s) => `- ${s.text} (${s.why})`)] : []),
].join("\n");
if (dry) {
  writeJson(path.join(RUN_DIR, "dry-tasks.json"), rendered);
  fs.writeFileSync(path.join(RUN_DIR, "dry-report.md"), report);
} else {
  writeFileAtomic(path.join(ROOT, "zdroje", "napady", `${today}_${process.env.RUN_ID ?? nowIso}_napady-report.md`), report + "\n");
}

// step B: every new idea is queued, content-pipeline writes the scripts one by one (Marek 2026-11-23)
const stepB = `scenár v poradí pre ${created.length} nápadov (content-pipeline)`;
console.log(JSON.stringify({ dry, created: created.length, skipped: skipped.length, stepB }));
