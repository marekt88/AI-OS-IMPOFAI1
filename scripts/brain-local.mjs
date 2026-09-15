#!/usr/bin/env node
// Nastavi lokalny 3D brain na kategorie z data/3d-brain-sources.json a prestava graf.
//
//   node scripts/brain-local.mjs
//
// Preco to existuje: apps/3d-brain/ je v .gitignore, takze appka sa medzi
// strojmi neprenasa. Prenasa sa len rozdelenie kategorii. Tento skript ho
// nasadi na lokalnu instalaciu, aby mozog vyzeral rovnako vsade.
//
// Ak apps/3d-brain/ este neexistuje, spusti najprv /3d-brain v Claude Code.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(ROOT, 'apps', '3d-brain');
const SRC = path.join(ROOT, 'data', '3d-brain-sources.json');
const CFG = path.join(APP, 'brain.config.json');

try {
  await fs.access(path.join(APP, 'build.mjs'));
} catch {
  console.error('apps/3d-brain/ tu nie je.\nSpusti najprv /3d-brain v Claude Code, potom tento skript znova.');
  process.exit(1);
}

const wanted = JSON.parse(await fs.readFile(SRC, 'utf8'));
delete wanted._comment;

// root a port si drzi lokalna instalacia, kategorie prichadzaju z repozitara.
let existing = {};
try { existing = JSON.parse(await fs.readFile(CFG, 'utf8')); } catch {}

const merged = {
  ...wanted,
  root: existing.root ?? '../..',
  port: existing.port ?? wanted.port ?? 4640,
  version: 1,
};

await fs.writeFile(CFG, JSON.stringify(merged, null, 2) + '\n');
console.log(`Kategorie nasadene: ${merged.sources.map(s => s.label).join(', ')}`);

const build = spawn(process.execPath, ['build.mjs'], { cwd: APP, stdio: 'inherit' });
build.on('exit', (code) => {
  if (code !== 0) process.exit(code);
  console.log(`\nHotovo. Spusti mozog:\n    cd apps/3d-brain && node serve.mjs`);
  console.log(`Potom otvor http://localhost:${merged.port}`);
  console.log(`\nNa workshope: Play demo pre rast, Cinema pre cistu prezentaciu.`);
  console.log(`Nezapinaj "Show all labels", pri 60 uzloch je to necitatelne.`);
});
