#!/usr/bin/env node
// Objavovanie URL na weboch konkurencie — nezávisle od toho, či na ne niekde vedie odkaz.
//
// Reťaz zdrojov, zhora nadol, prvý ktorý zaberie vyhrá:
//   1. robots.txt → direktíva Sitemap:   (aj netypické cesty, napr. mrdigital.sk/sitemap)
//   2. bežné cesty k sitemape
//   3. sitemap index → vnorené sitemapy
//   4. RSS / Atom / WordPress wp-json
// Každý krok najprv priamo, pri zlyhaní cez Jina reader (webize.sk blokuje priamy fetch).
//
// Porovnáva množinu URL týždeň po týždni. Nová URL = nová stránka, aj keď na ňu
// nikde nevedie odkaz. Zmenený lastmod = prepísaná stránka.
//
//   node scripts/konkurencia-urls.mjs
//   node scripts/konkurencia-urls.mjs --baseline
//   node scripts/konkurencia-urls.mjs --only webize

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data', 'konkurencia');
const URLS = path.join(DATA, 'urls');

const args = process.argv.slice(2);
const BASELINE = args.includes('--baseline');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const TODAY = new Date().toISOString().slice(0, 10);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const JINA_UA = 'impofai-competitor-monitor';

const CANDIDATES = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap', '/sitemap-index.xml', '/sitemap.txt'];
const FEEDS = ['/feed', '/rss.xml', '/feed.xml', '/atom.xml', '/blog/feed', '/wp-json/wp/v2/posts?per_page=100'];

// Pozor na User-Agent: weby chcu vyzerat ako prehliadac, ale Jina reader na
// browserovy UA vracia 403 (brani sa tak zneuzitiu). Kazdy kanal ma vlastny.
async function raw(url, { timeout = 15000, ua = UA } = {}) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeout);
    const r = await fetch(url, { signal: c.signal, redirect: 'follow', headers: { 'User-Agent': ua, Accept: '*/*' } });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.text();
  } catch { return null; }
}

// Priamo, a keď to nevyjde, cez Jinu. Vracia aj to, ktorou cestou sa to podarilo.
async function fetchAny(url) {
  const direct = await raw(url);
  if (direct && direct.length > 40) return { body: direct, via: 'direct' };
  const proxied = await raw(`https://r.jina.ai/${url}`, { timeout: 45000, ua: JINA_UA });
  if (proxied && proxied.length > 40 && !/^Warning:/i.test(proxied.trim())) return { body: proxied, via: 'jina' };
  return null;
}

// Z XML alebo z markdownu, ktorý vráti Jina, vytiahni URL patriace danej doméne.
function extractUrls(body, host) {
  const out = new Map();
  for (const m of body.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>\s*(.*?)\s*<\/loc>/)?.[1];
    const mod = m[1].match(/<lastmod>\s*(.*?)\s*<\/lastmod>/)?.[1] || null;
    if (loc) out.set(loc.trim(), mod);
  }
  if (!out.size) {
    for (const m of body.matchAll(/<loc>\s*(.*?)\s*<\/loc>/g)) out.set(m[1].trim(), null);
  }
  if (!out.size) {
    const re = new RegExp(`https?://${host.replace(/\./g, '\\.')}/[^\\s)<>"'\\]]*`, 'gi');
    for (const m of body.matchAll(re)) {
      const clean = m[0].replace(/[.,;:]+$/, '').replace(/[?#].*$/, '');
      out.set(clean, null);
    }
  }
  return out;
}

function isNested(body) {
  return /<sitemapindex/i.test(body);
}

async function discover(host) {
  const tried = [];

  // 1. robots.txt
  const robots = await fetchAny(`https://${host}/robots.txt`);
  const declared = [];
  if (robots) {
    for (const m of robots.body.matchAll(/Sitemap:\s*(\S+)/gi)) declared.push(m[1].trim());
  }

  const queue = [...declared, ...CANDIDATES.map((p) => `https://${host}${p}`)];
  const seen = new Set();
  const urls = new Map();
  let source = null;

  for (const candidate of queue) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const got = await fetchAny(candidate);
    tried.push(`${candidate} → ${got ? got.via : 'zlyhalo'}`);
    if (!got) continue;

    if (isNested(got.body)) {
      const children = [...got.body.matchAll(/<loc>\s*(.*?)\s*<\/loc>/g)].map((m) => m[1].trim());
      for (const child of children.slice(0, 25)) {
        if (seen.has(child)) continue;
        seen.add(child);
        const sub = await fetchAny(child);
        if (!sub) continue;
        for (const [u, mod] of extractUrls(sub.body, host)) urls.set(u, mod);
      }
      if (urls.size) { source = `${candidate} (sitemap index)`; break; }
      continue;
    }

    const found = extractUrls(got.body, host);
    if (found.size >= 3) {
      for (const [u, mod] of found) urls.set(u, mod);
      source = `${candidate} (${got.via})`;
      break;
    }
  }

  // 4. feedy ako záchrana, keď sitemap nič nedala
  if (!urls.size) {
    for (const p of FEEDS) {
      const got = await fetchAny(`https://${host}${p}`);
      tried.push(`https://${host}${p} → ${got ? got.via : 'zlyhalo'}`);
      if (!got) continue;
      let found = new Map();
      if (/^\s*[[{]/.test(got.body)) {
        try {
          for (const post of JSON.parse(got.body)) if (post.link) found.set(post.link, post.modified || post.date || null);
        } catch { /* nevadí */ }
      } else {
        for (const m of got.body.matchAll(/<link[^>]*>\s*(https?:\/\/[^<\s]+)/gi)) found.set(m[1], null);
        for (const m of got.body.matchAll(/<link[^>]*href="(https?:\/\/[^"]+)"/gi)) found.set(m[1], null);
      }
      if (found.size >= 3) { for (const [u, d] of found) urls.set(u, d); source = `https://${host}${p} (feed)`; break; }
    }
  }

  return { urls, source, tried };
}

async function previous(slug) {
  try {
    const files = (await fs.readdir(path.join(URLS, slug))).filter((f) => f.endsWith('.json') && !f.startsWith(TODAY)).sort();
    if (!files.length) return null;
    const latest = files[files.length - 1];
    return { date: latest.slice(0, 10), data: JSON.parse(await fs.readFile(path.join(URLS, slug, latest), 'utf8')) };
  } catch { return null; }
}

const watchlist = JSON.parse(await fs.readFile(path.join(DATA, 'watchlist.json'), 'utf8'));
const competitors = watchlist.competitors.filter((c) => !ONLY || c.slug === ONLY);

const report = { date: TODAY, baseline: BASELINE, noveUrl: [], zmizleUrl: [], upraveneUrl: [], bezZdroja: [], zdroje: [] };

for (const comp of competitors) {
  const host = comp.site || new URL(comp.pages[0].url).host;
  process.stderr.write(`  ${comp.slug} (${host}) … `);
  const { urls, source, tried } = await discover(host);

  if (!urls.size) {
    process.stderr.write('ZIADEN ZDROJ URL\n');
    report.bezZdroja.push({ competitor: comp.name, slug: comp.slug, host, skusane: tried });
    continue;
  }

  const snapshot = { host, source, generatedAt: new Date().toISOString(), urls: Object.fromEntries(urls) };
  await fs.mkdir(path.join(URLS, comp.slug), { recursive: true });
  await fs.writeFile(path.join(URLS, comp.slug, `${TODAY}.json`), JSON.stringify(snapshot, null, 2), 'utf8');
  report.zdroje.push({ competitor: comp.name, source, pocetUrl: urls.size });

  const prev = await previous(comp.slug);
  if (BASELINE || !prev) {
    process.stderr.write(`baseline (${urls.size} URL, zdroj: ${source})\n`);
    continue;
  }

  const old = new Map(Object.entries(prev.data.urls || {}));
  const added = [...urls.keys()].filter((u) => !old.has(u));
  const gone = [...old.keys()].filter((u) => !urls.has(u));
  const touched = [...urls.entries()].filter(([u, mod]) => old.has(u) && mod && old.get(u) && mod !== old.get(u))
    .map(([u, mod]) => ({ url: u, predtym: old.get(u), teraz: mod }));

  if (added.length) report.noveUrl.push({ competitor: comp.name, porovnaneS: prev.date, urls: added });
  if (gone.length) report.zmizleUrl.push({ competitor: comp.name, porovnaneS: prev.date, urls: gone });
  if (touched.length) report.upraveneUrl.push({ competitor: comp.name, porovnaneS: prev.date, zmeny: touched.slice(0, 30) });

  process.stderr.write(`${urls.size} URL | nove: ${added.length}, zmizle: ${gone.length}, upravene: ${touched.length}\n`);
}

await fs.mkdir(path.join(DATA, 'diffs'), { recursive: true });
const out = path.join(DATA, 'diffs', `${TODAY}__urls.json`);
await fs.writeFile(out, JSON.stringify(report, null, 2), 'utf8');

console.log(JSON.stringify({
  diffFile: path.relative(ROOT, out).replace(/\\/g, '/'),
  novychUrl: report.noveUrl.reduce((n, c) => n + c.urls.length, 0),
  zmizlychUrl: report.zmizleUrl.reduce((n, c) => n + c.urls.length, 0),
  upravenychUrl: report.upraveneUrl.reduce((n, c) => n + c.zmeny.length, 0),
  firmyBezZdroja: report.bezZdroja.map((b) => b.competitor),
}, null, 2));
