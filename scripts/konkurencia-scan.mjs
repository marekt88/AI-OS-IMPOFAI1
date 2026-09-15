#!/usr/bin/env node
// Monitoring konkurencie pre IMPOFAI.
// Stiahne stranky z watchlistu cez Jina reader, znormalizuje ich, ulozi snapshot
// a spravi riadkovy diff oproti poslednemu predchadzajucemu snapshotu.
//
// Pouzitie:
//   node scripts/konkurencia-scan.mjs              # bezny tyzdenny beh
//   node scripts/konkurencia-scan.mjs --baseline   # prvy beh, nediffuje
//   node scripts/konkurencia-scan.mjs --only mrdigital
//
// Vystup: data/konkurencia/snapshots/<slug>/<datum>__<label>.md
//         data/konkurencia/diffs/<datum>.json
// Na stdout vypise kompaktny sumar. LLM cita diff JSON, nie snapshoty.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data', 'konkurencia');
const SNAPS = path.join(DATA, 'snapshots');
const DIFFS = path.join(DATA, 'diffs');

const args = process.argv.slice(2);
const BASELINE = args.includes('--baseline');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const TODAY = new Date().toISOString().slice(0, 10);
const MAX_LINES_PER_SIDE = 40; // strop, aby report nenarastol do nepouzitelna

// --- normalizacia -----------------------------------------------------------
// Cielom je, aby sa tyzden po tyzdni nemenilo nic, co nie je realna zmena obsahu.
const VOLATILE = [
  /^Title:\s/i,
  /^URL Source:\s/i,
  /^Markdown Content:\s*$/i,
  /^Published Time:\s/i,
  /^Warning:\s/i,
  /cookie/i,
  /^\s*\d{1,2}[.:]\d{2}\s*$/,
  /^\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\.\s*\d{1,2}\.\s*\d{4})\s*$/,
  /^\s*(copyright|©|all rights reserved|vsetky prava vyhradene)/i,
  // Animovane pocitadla ("300+ projektov") sa pri kazdom scrape zachytia v inom
  // stave a vyrabaju falosne zmeny. Prvy realny beh 2026-09-15 nahlasil styri
  // take na piatich strankach. Holé cislo bez jednotky nie je obsah - cena ma
  // vzdy menu, takze o nu neprideme.
  // Percenta zamerne NEfiltrujeme - "80 %" byva realny claim o uspore, nie pocitadlo.
  /^\s*\d{1,6}\s*[+★]?\s*$/,
  /^\s*[★]{1,5}\s*$/,
];

function normalize(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    // odstran query parametre a fragmenty z URL, casto obsahuju tokeny a ID
    .map((l) => l.replace(/(https?:\/\/[^\s)]+?)[?#][^\s)]*/g, '$1'))
    .filter((l) => l.length > 0)
    .filter((l) => !VOLATILE.some((re) => re.test(l)))
    .filter((l, i, arr) => l !== arr[i - 1]); // zahod bezprostredne duplicity
}

// --- diff -------------------------------------------------------------------
// Multimnozinove porovnanie riadkov. Zachyti zmenu ceny, novy prispevok na blogu,
// pridanu sluzbu. Nezachyti preusporiadanie, co je zamer - to nie je zmena obsahu.
function diffLines(oldLines, newLines) {
  const count = (arr) => arr.reduce((m, l) => m.set(l, (m.get(l) || 0) + 1), new Map());
  const a = count(oldLines);
  const b = count(newLines);
  const added = [];
  const removed = [];
  for (const [line, n] of b) {
    const extra = n - (a.get(line) || 0);
    for (let i = 0; i < extra; i++) added.push(line);
  }
  for (const [line, n] of a) {
    const extra = n - (b.get(line) || 0);
    for (let i = 0; i < extra; i++) removed.push(line);
  }
  return { added, removed };
}

// --- IO ---------------------------------------------------------------------
async function fetchPage(url) {
  const target = `https://r.jina.ai/${url}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 45000);
      const res = await fetch(target, {
        headers: { 'User-Agent': 'impofai-competitor-monitor' },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text.trim().length < 200) throw new Error('prazdna odpoved');
      return { ok: true, text };
    } catch (err) {
      if (attempt === 3) return { ok: false, error: String(err.message || err) };
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
}

async function previousSnapshot(slug, label) {
  const dir = path.join(SNAPS, slug);
  let files;
  try {
    files = await fs.readdir(dir);
  } catch {
    return null;
  }
  const mine = files
    .filter((f) => f.endsWith(`__${label}.md`) && !f.startsWith(TODAY))
    .sort();
  if (!mine.length) return null;
  const latest = mine[mine.length - 1];
  return {
    date: latest.slice(0, 10),
    lines: (await fs.readFile(path.join(dir, latest), 'utf8')).split('\n').filter(Boolean),
  };
}

// --- main -------------------------------------------------------------------
const watchlist = JSON.parse(await fs.readFile(path.join(DATA, 'watchlist.json'), 'utf8'));
const competitors = watchlist.competitors.filter((c) => !ONLY || c.slug === ONLY);

const report = {
  date: TODAY,
  baseline: BASELINE,
  generatedAt: new Date().toISOString(),
  changes: [],
  unchanged: [],
  failures: [],
};

for (const comp of competitors) {
  for (const page of comp.pages) {
    process.stderr.write(`  ${comp.slug}/${page.label} … `);
    const got = await fetchPage(page.url);

    if (!got.ok) {
      process.stderr.write(`ZLYHALO (${got.error})\n`);
      report.failures.push({ competitor: comp.name, slug: comp.slug, label: page.label, url: page.url, error: got.error });
      continue;
    }

    const lines = normalize(got.text);
    const prev = await previousSnapshot(comp.slug, page.label);

    await fs.mkdir(path.join(SNAPS, comp.slug), { recursive: true });
    await fs.writeFile(path.join(SNAPS, comp.slug, `${TODAY}__${page.label}.md`), lines.join('\n'), 'utf8');

    if (BASELINE || !prev) {
      process.stderr.write(`baseline (${lines.length} riadkov)\n`);
      report.unchanged.push({ competitor: comp.name, label: page.label, note: 'prvy snapshot, neporovnavane' });
      continue;
    }

    const { added, removed } = diffLines(prev.lines, lines);
    if (!added.length && !removed.length) {
      process.stderr.write('bez zmeny\n');
      report.unchanged.push({ competitor: comp.name, label: page.label });
      continue;
    }

    process.stderr.write(`ZMENA (+${added.length} / -${removed.length})\n`);
    report.changes.push({
      competitor: comp.name,
      slug: comp.slug,
      label: page.label,
      url: page.url,
      porovnaneS: prev.date,
      pridane: added.slice(0, MAX_LINES_PER_SIDE),
      odstranene: removed.slice(0, MAX_LINES_PER_SIDE),
      orezane: added.length > MAX_LINES_PER_SIDE || removed.length > MAX_LINES_PER_SIDE,
      pocty: { pridanych: added.length, odstranenych: removed.length },
    });
  }
}

await fs.mkdir(DIFFS, { recursive: true });
const diffPath = path.join(DIFFS, `${TODAY}.json`);
await fs.writeFile(diffPath, JSON.stringify(report, null, 2), 'utf8');

console.log(JSON.stringify({
  diffFile: path.relative(ROOT, diffPath).replace(/\\/g, '/'),
  datum: TODAY,
  baseline: BASELINE,
  strankySoZmenou: report.changes.length,
  strankyBezZmeny: report.unchanged.length,
  zlyhania: report.failures.length,
  firmySoZmenou: [...new Set(report.changes.map((c) => c.competitor))],
}, null, 2));
