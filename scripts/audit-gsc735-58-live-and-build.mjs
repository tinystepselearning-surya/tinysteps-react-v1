#!/usr/bin/env node
// GSC #735: repeatable, read-only batch technical audit of exactly 58 owner-provided URLs.
// "Googlebot" is only a simulated UA header. This cannot determine Google Index inclusion.
// Never submits forms, posts indexing requests, or deploys production.
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const BASE = 'https://tinystepslearning.com';
const DIST = path.resolve('dist');
const LEDGER = path.resolve('docs/seo/indexing-recovery-735/MASTER_58_URL_RECONCILIATION.md');
const OUT = path.resolve('artifacts');
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const GOOGLEBOT_UA = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const escapeCsv = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
const unique = values => [...new Set(values)];
const normalize = value => {
  try {
    const u = new URL(value, BASE);
    if (u.origin !== BASE) return null;
    return (u.pathname.replace(/\/+$/, '') || '/');
  } catch { return null; }
};
const htmlText = document => (document.querySelector('main')?.textContent || '').replace(/\s+/g, ' ').trim();
function parseHtml(html, pathname) {
  const document = new JSDOM(html, { url: BASE + pathname }).window.document;
  const canonicalNodes = [...document.querySelectorAll('link[rel="canonical"]')];
  const robotsTags = [...document.querySelectorAll('meta[name="robots"],meta[name="googlebot"],meta[name="bingbot"]')];
  const title = document.querySelector('title')?.textContent?.trim() || '';
  const h1 = document.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim()
    || document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const main = htmlText(document);
  const schema = [...document.querySelectorAll('script[type="application/ld+json"]')];
  const scriptSrc = [...document.querySelectorAll('script[src]')].map(el => el.getAttribute('src'));
  return {
    title, h1: h1.slice(0, 170), mainChars: main.length,
    canonicalCount: canonicalNodes.length,
    canonical: canonicalNodes[0]?.getAttribute('href') || null,
    noindex: robotsTags.some(n => /\bnoindex\b/i.test(n.getAttribute('content') || '')),
    description: !!document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim(),
    structuredDataCount: schema.length,
    errorScreen: /^(something went wrong|404 - page not found|page not found)/i.test(main.slice(0, 120))
      || html.includes("We've been notified and will fix it soon"),
    scriptSrc
  };
}
async function walkHtml(root = DIST) {
  const results = [];
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const loc = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(loc);
      else if (entry.name === 'index.html') results.push(loc);
    }
  }
  await visit(root);
  return results;
}
async function get(url, ua = USER_AGENT, redirect = 'manual') {
  try {
    const response = await fetch(url, {
      redirect,
      headers: { accept: '*/*', 'user-agent': ua },
      signal: AbortSignal.timeout(20000)
    });
    const text = await response.text();
    return {
      status: response.status, responseUrl: response.url, location: response.headers.get('location'),
      cache: response.headers.get('cache-control'), type: response.headers.get('content-type'),
      xRobots: response.headers.get('x-robots-tag'),
      bytes: text.length, body: text,
      cdnCache: response.headers.get('cf-cache-status') || response.headers.get('x-cache') || null
    };
  } catch (error) { return { error: error?.message || String(error) }; }
}
async function concurrent(items, limit, fn) {
  const results = Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}
const ledger = await readFile(LEDGER, 'utf8');
const lines = ledger.split(/\r?\n/).filter(x => /^\|\s*[DC]\d{2}\s*\|/.test(x));
const inventory = lines.map(line => {
  const m = line.match(/^\|\s*([DC]\d{2})\s*\|\s*(\/[^|\s]+)\s*\|/);
  if (!m) throw new Error('Cannot parse ledger row: ' + line);
  return { id: m[1], path: m[2], originalGscGroup: m[1][0] === 'D' ? 'Discovered' : 'Crawled' };
});
if (inventory.length !== 58 || unique(inventory.map(x => x.path)).length !== 58
  || inventory.filter(x => x.originalGscGroup === 'Discovered').length !== 28) {
  throw new Error('Refusing a partial or duplicated 58-URL inventory');
}
const hosting = JSON.parse(await readFile('firebase.json', 'utf8')).hosting;
const redirects = new Map(hosting.redirects.map(x => [normalize(x.source), x]));
const rssOrXml = path => /\.xml$/i.test(path);
const sitemaps = {};
for (const name of (await readdir(DIST)).filter(n => /^sitemap.*\.xml$/.test(n))) {
  const xml = await readFile(path.join(DIST, name), 'utf8');
  sitemaps[name] = unique([...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(x => x[1].trim()));
}
const listedLocations = new Set(Object.values(sitemaps).flat().filter(x => x.startsWith(BASE)));
const htmlFiles = await walkHtml();
const referring = new Map();
for (const filename of htmlFiles) {
  const sourcePath = '/' + path.relative(DIST, path.dirname(filename)).split(path.sep).join('/');
  const source = sourcePath === '/.' ? '/' : sourcePath;
  const html = await readFile(filename, 'utf8');
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map(x => x[1]);
  for (const target of unique(hrefs.map(normalize).filter(Boolean))) {
    if (!referring.has(target)) referring.set(target, []);
    if (target !== source) referring.get(target).push(source);
  }
}
const rows = await concurrent(inventory, 6, async x => {
  const redirectRule = redirects.get(x.path);
  const kind = redirectRule ? 'redirect' : rssOrXml(x.path) ? 'machine' : 'html';
  const row = {
    id: x.id, path: x.path, originalGscGroup: x.originalGscGroup,
    kind, destination: redirectRule?.destination || null,
    inSitemaps: Object.entries(sitemaps).filter(([, urls]) => urls.includes(BASE + x.path)).map(([name]) => name),
    inboundCount: unique(referring.get(x.path) || []).length,
    inboundExamples: unique(referring.get(x.path) || []).slice(0, 7),
  };
  if (kind === 'html') {
    try {
      const filename = path.join(DIST, x.path.slice(1), 'index.html');
      const sourceHtml = await readFile(filename, 'utf8');
      row.build = parseHtml(sourceHtml, x.path);
      row.build.selfCanonical = normalize(row.build.canonical) === x.path
        && row.build.canonical === BASE + x.path;
    } catch (error) { row.buildError = error?.message || String(error); }
  }
  const remote = await get(BASE + x.path);
  const { body, ...remoteMeta } = remote;
  row.live = remoteMeta;
  if (body && kind === 'html' && /text\/html/i.test(remote.type || '')) {
    const p = parseHtml(body, x.path);
    row.liveHtml = { ...p, scriptSrc: p.scriptSrc.slice(0, 4) };
    row.liveHtml.selfCanonical = p.canonical === BASE + x.path;
  } else if (body && kind === 'machine') {
    row.liveXml = {
      leadingText: body.slice(0, 110).replace(/\s+/g, ' '),
      seemsXml: /^\s*<\?xml\b/i.test(body) || /^\s*<(?:urlset|sitemapindex|rss|feed)\b/i.test(body)
    };
  }
  if (kind === 'redirect') {
    row.redirectMatchesSourceRule = remote.status === 301
      && normalize(new URL(remote.location || '/', BASE).href) === normalize(row.destination);
    const dest = await get(new URL(row.destination, BASE).href);
    row.targetLive = { status: dest.status, cache: dest.cache, xRobots: dest.xRobots,
      error: dest.error, type: dest.type };
    if (dest.body && /text\/html/i.test(dest.type || '')) {
      const info = parseHtml(dest.body, normalize(row.destination));
      row.targetLive.canonical = info.canonical;
      row.targetLive.h1 = info.h1;
      row.targetLive.noindex = info.noindex;
      row.targetLive.mainChars = info.mainChars;
    }
  }
  if (kind === 'html') {
    row.flags = [];
    if (row.buildError) row.flags.push('missing-build-html');
    if (row.build && (!row.build.selfCanonical || row.build.noindex)) row.flags.push('bad-build-indexability');
    if (row.build && (row.build.mainChars < 450 || !row.build.h1)) row.flags.push('thin-build-or-missing-h1');
    if (!row.inSitemaps.length) row.flags.push('not-in-generated-sitemap');
    if (!row.inboundCount) row.flags.push('zero-inbound-links-in-prerender-build');
    if (remote.error) row.flags.push('live-fetch-error');
    if (!remote.error && remote.status !== 200) row.flags.push('live-status-not-200');
    if (row.liveHtml && (!row.liveHtml.selfCanonical || row.liveHtml.noindex || row.liveHtml.errorScreen)) row.flags.push('bad-live-html');
    if (!row.liveHtml && !remote.error) row.flags.push('live-html-not-parsed');
    if (row.live?.cache && /\bmax-age=(?:[1-9]\d*)\b/.test(row.live.cache)
      && !/\bno-cache\b/i.test(row.live.cache)) row.flags.push('cacheable-clean-html');
  } else if (kind === 'redirect') {
    row.flags = [];
    if (!row.redirectMatchesSourceRule) row.flags.push('301-missing-or-wrong-location');
    if (!row.targetLive?.status || row.targetLive?.status !== 200) row.flags.push('redirect-target-not-200');
    if (row.inSitemaps.length) row.flags.push('redirect-alias-in-sitemap');
  } else {
    row.flags = [];
    if (remote.status !== 200) row.flags.push('machine-resource-not-200');
    if (row.liveXml && !row.liveXml.seemsXml) row.flags.push('machine-resource-not-xml');
  }
  console.log('AUDIT_URL ' + JSON.stringify({ ...row, build: row.build && {
    h1: row.build.h1, mainChars: row.build.mainChars, canonical: row.build.canonical,
    selfCanonical: row.build.selfCanonical, noindex: row.build.noindex
  }, liveHtml: row.liveHtml && {
    canonical: row.liveHtml.canonical, selfCanonical: row.liveHtml.selfCanonical,
    h1: row.liveHtml.h1, mainChars: row.liveHtml.mainChars, noindex: row.liveHtml.noindex,
    errorScreen: row.liveHtml.errorScreen
  }}));
  return row;
});
const samples = ['/blog/grammar-assessment', '/blog/online-phonics-classes-vs-school',
  '/blog/online-english-classes-for-kids-india', '/resources/phonics/magic-e-phonics',
  '/resources/grammar', '/courses', '/free-word-building-game-for-kids'];
const botSamples = await concurrent(samples, 3, async pathname => {
  const r = await get(BASE + pathname, GOOGLEBOT_UA);
  const record = { path: pathname, status: r.status, error: r.error, cache: r.cache,
    xRobots: r.xRobots, type: r.type };
  if (r.body && /text\/html/i.test(r.type || '')) {
    const p = parseHtml(r.body, pathname);
    record.canonical = p.canonical; record.h1 = p.h1;
    record.mainChars = p.mainChars; record.noindex = p.noindex; record.errorScreen = p.errorScreen;
  }
  console.log('AUDIT_BOT_SAMPLE ' + JSON.stringify(record));
  return record;
});
const pages = rows.filter(r => r.kind === 'html');
const counts = { total: rows.length, html: pages.length, redirects: rows.filter(r => r.kind === 'redirect').length,
  machine: rows.filter(r => r.kind === 'machine').length,
  status200: rows.filter(r => r.live?.status === 200).length,
  redirect301: rows.filter(r => r.live?.status === 301).length,
  errors: rows.filter(r => r.live?.error).length,
  htmlWithSourceIssues: pages.filter(r => r.flags.length).length,
  zeroInbound: pages.filter(r => r.flags.includes('zero-inbound-links-in-prerender-build')).length };
const flagCounts = {};
for (const row of rows) for (const flag of row.flags) flagCounts[flag] = (flagCounts[flag] || 0) + 1;
const titles = new Map();
for (const r of pages) if (r.build?.title) {
  if (!titles.has(r.build.title)) titles.set(r.build.title, []);
  titles.get(r.build.title).push(r.path);
}
const duplicateTitles = [...titles].filter(([,paths])=>paths.length>1).map(([title,paths])=>({title,paths}));
await mkdir(OUT,{recursive:true});
const audit = { observedAt: new Date().toISOString(), sourceCommit: process.env.GITHUB_SHA || 'local',
  observationLimits: [
    'Google Index cannot be determined by this script: only owner Search Console URL Inspection can confirm it',
    'Googlebot UA is simulated and is not verified Google traffic',
    'Internal linking is observed in generated <a href> only and does not prove Google has crawled those links',
    'HTTP GET cannot guarantee JavaScript bundles succeed in Google Inspection Tool or demonstrate Google content selection'
  ], counts, flagCounts, duplicateTitles, sitemaps: Object.fromEntries(Object.entries(sitemaps).map(([k,v])=>[k,v.length])),
  prerenderedHtmlFiles: htmlFiles.length, botSamples, rows };
await writeFile(path.join(OUT,'gsc735-58-batch-audit.json'), JSON.stringify(audit,null,2)+'\n');
const header=['id','path','gsc_group','type','http','cache','x_robots','canonical','body_chars','sitemaps','inbound_count','inbound_examples','redirect_destination','redirect_301_ok','destination_http','flags'];
const csv=[header.join(','), ...rows.map(x=>[
  x.id,x.path,x.originalGscGroup,x.kind,x.live.status ?? x.live.error ?? '',
  x.live.cache,x.live.xRobots,x.liveHtml?.canonical || x.build?.canonical,
  x.liveHtml?.mainChars ?? x.build?.mainChars, x.inSitemaps.join(';'),
  x.inboundCount, x.inboundExamples.join(';'), x.destination,
  x.redirectMatchesSourceRule, x.targetLive?.status, x.flags.join(';')
].map(escapeCsv).join(','))].join('\n');
await writeFile(path.join(OUT,'gsc735-58-batch-audit.csv'),csv+'\n');
console.log('AUDIT_SUMMARY '+JSON.stringify({counts,flagCounts,duplicateTitles,sitemaps:audit.sitemaps,prerenderedHtmlFiles:htmlFiles.length}));
console.log('AUDIT_FILES artifacts/gsc735-58-batch-audit.json artifacts/gsc735-58-batch-audit.csv');
