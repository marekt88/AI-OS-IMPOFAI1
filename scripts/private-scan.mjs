#!/usr/bin/env node
// Vypise kazdy subor s `private: true` vo frontmatteri a skontroluje, ci sa
// do repozitara nedostal credential.
//
//   node scripts/private-scan.mjs            zoznam + kontrola tajomstiev
//   node scripts/private-scan.mjs --secrets  len kontrola tajomstiev
//   node scripts/private-scan.mjs --paths    len cesty, jedna na riadok
//
// Navratovy kod 1, ak nieco vyzera ako credential. Da sa zapojit do CI.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const ONLY_PATHS = args.includes('--paths');
const ONLY_SECRETS = args.includes('--secrets');
const SKIP = new Set(['.git', 'node_modules', 'apps', 'data', '.scratch', 'archives']);

// Vzory, ktore v repozitari nemaju co hladat. Zamerne uzke, aby to nekricalo
// na kazdy retazec. Radsej prehliadnut nez zahltit falosnymi poplachmi.
const SECRET_PATTERNS = [
  [/\bsk-[A-Za-z0-9_-]{20,}/g, 'API kluc (sk-...)'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/g, 'GitHub token'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/g, 'Slack token'],
  [/\bAKIA[0-9A-Z]{16}\b/g, 'AWS access key'],
  [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./g, 'JWT'],
  [/(?:heslo|password|passwd|pwd|api[_-]?key|token|secret)\s*[:=]\s*\S{8,}/gi, 'pomenovane tajomstvo'],
];

async function walk(dir, out = []) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (/\.(md|txt|json|mjs|js)$/i.test(e.name)) out.push(full);
  }
  return out;
}

const files = await walk(ROOT);
const priv = [];
const hits = [];

for (const file of files) {
  const text = await fs.readFile(file, 'utf8');
  const rel = path.relative(ROOT, file).split(path.sep).join('/');

  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fm && /^private:\s*true\s*$/m.test(fm[1])) priv.push(rel);

  if (rel === 'scripts/private-scan.mjs') continue; // vlastne vzory
  for (const [re, label] of SECRET_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const line = text.slice(0, m.index).split('\n').length;
      hits.push({ rel, line, label });
    }
  }
}

if (ONLY_PATHS) {
  for (const p of priv) console.log(p);
} else if (!ONLY_SECRETS) {
  console.log(`Sukromne subory (private: true): ${priv.length}`);
  for (const p of priv) console.log('  ' + p);
  console.log('\nPred tym, nez das niekomu pristup do repozitara, rozhodni sa o kazdom z nich.');
}

if (!ONLY_PATHS) {
  if (hits.length) {
    console.log(`\nMOZNE TAJOMSTVA: ${hits.length}`);
    for (const h of hits) console.log(`  ${h.rel}:${h.line}  ${h.label}`);
    console.log('\nCredential v gite zostava v historii navzdy. Odstran ho a zmen ho.');
    process.exit(1);
  }
  console.log('\nZiadne tajomstva nenajdene.');
}
