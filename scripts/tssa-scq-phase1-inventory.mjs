#!/usr/bin/env node
// TSSA-SCQ Phase 1: audit generated canonical content inventory and HTML.
// Entirely offline. No public requests, Google indexing calls, or deployments.
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { PHONICS_AGE_PROGRAMME_PATHS } from '../src/lib/phonicsAgeProgrammeRegistry.js';

const root = process.cwd();
const dist = path.join(root, 'dist');
const output = path.join(root, 'artifacts', 'tssa-scq-phase1');
const origin = 'https://tinystepslearning.com';
// This is the current generated inventory; the frozen 19 Oct 260/279
// reference remains in tssa7-b1-content-authority-ledger.mjs.
const additionalApprovedCount = PHONICS_AGE_PROGRAMME_PATHS.length;
const expectedIndexableCount = 260 + additionalApprovedCount;
const expectedCorpusCount = 279 + additionalApprovedCount;
const expectedChildCounts = new Map([
  ['sitemap-static.xml', 159 + additionalApprovedCount],
  ['sitemap-blog.xml', 83],
  ['sitemap-courses.xml', 7],
  ['sitemap-parents.xml', 11],
]);
fs.mkdirSync(output, { recursive: true });
const read = (p) => fs.readFileSync(p, 'utf8');
const findings = [];
const issue = (severity, pathOrPage, code, detail) =>
  findings.push({ severity, url: pathOrPage, code, detail });

const toCanonicalUrl = (value) => {
  let parsed;
  try { parsed = new URL(value); }
  catch { issue('ERROR', value, 'INVALID_URL', 'Malformed canonical URL'); return null; }
  if (parsed.origin !== origin || parsed.search || parsed.hash ||
      parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
    issue('ERROR', value, 'NONCANONICAL_URL', 'URL must be root-hosted, query-free and without trailing slash');
    return null;
  }
  return parsed.href;
};
const sitemapRows = [];
for (const [file, expectedCount] of expectedChildCounts) {
  const xml = read(path.join(dist, file));
  const locs = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
  if (locs.length !== expectedCount)
    issue('ERROR', file, 'CHILD_SITEMAP_COUNT', 'Expected ' + expectedCount + ', found ' + locs.length);
  for (const loc of locs) {
    const canonical = toCanonicalUrl(loc);
    if (canonical) sitemapRows.push({ url: canonical, sitemap: file });
  }
}
const sitemapCount = sitemapRows.length;
const membership = new Map();
for (const row of sitemapRows) {
  if (membership.has(row.url))
    issue('ERROR', row.url, 'DUPLICATE_SITEMAP_OWNER', 'Found in ' + membership.get(row.url) + ' and ' + row.sitemap);
  else membership.set(row.url, row.sitemap);
}
const indexXml = read(path.join(dist, 'sitemap.xml'));
const childLinks = [...indexXml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(m => m[1].trim());
for (const file of expectedChildCounts.keys())
  if (childLinks.filter(x => x === origin + '/' + file).length !== 1)
    issue('ERROR', '/sitemap.xml', 'SITEMAP_INDEX_CHILD', file + ' not referenced exactly once');
if (childLinks.length !== expectedChildCounts.size)
  issue('ERROR', '/sitemap.xml', 'SITEMAP_INDEX_COUNT', 'Unexpected sitemap index children: ' + childLinks.length);

const index = JSON.parse(read(path.join(dist, 'ai-resource-index.json')));
const corpus = Object.entries(index.corpus || {})
  .flatMap(([family, entries]) => entries.map(entry => ({ ...entry, family })));
const corpusByUrl = new Map();
for (const entry of corpus) {
  const url = toCanonicalUrl(entry.canonical_url);
  if (!url) continue;
  if (corpusByUrl.has(url)) issue('ERROR', url, 'DUPLICATE_CORPUS_OWNER', entry.family);
  else corpusByUrl.set(url, entry);
}
const indexIntended = corpus.filter(e => e.indexing_state === 'indexable');
const noindex = corpus.filter(e => e.indexing_state === 'noindex');
if (corpus.length !== expectedCorpusCount || indexIntended.length !== expectedIndexableCount || noindex.length !== 19)
  issue('ERROR', 'machine-directory', 'SOURCE_COUNT_DRIFT',
    'Corpus=' + corpus.length + '; indexable=' + indexIntended.length + '; excluded=' + noindex.length);
if (sitemapCount !== expectedIndexableCount || membership.size !== expectedIndexableCount)
  issue('ERROR', 'sitemaps', 'SITEMAP_COUNT_DRIFT',
    'Entries=' + sitemapCount + '; unique=' + membership.size);

for (const entry of indexIntended) {
  if (!membership.has(entry.canonical_url))
    issue('ERROR', entry.canonical_url, 'INDEXABLE_NOT_IN_SITEMAP', 'Source declares indexable, sitemap absent');
}
for (const entry of noindex) {
  if (membership.has(entry.canonical_url))
    issue('ERROR', entry.canonical_url, 'EXCLUDED_IN_SITEMAP', 'Noindex source URL leaked into sitemap');
}
for (const url of membership.keys()) {
  const entry = corpusByUrl.get(url);
  if (!entry) issue('ERROR', url, 'ORPHAN_SITEMAP_ENTRY', 'No matching machine-directory canonical owner');
  else if (entry.indexing_state !== 'indexable')
    issue('ERROR', url, 'SITEMAP_POLICY_CONFLICT', 'Source marks ' + entry.indexing_state);
}
const firebase = JSON.parse(read(path.join(root, 'firebase.json')));
const exactRedirects = (firebase.hosting?.redirects || [])
  .filter(r => r.source && !/[*:{}]/.test(r.source));
for (const redirect of exactRedirects) {
  if (membership.has(origin + redirect.source))
    issue('ERROR', redirect.source, 'REDIRECT_IN_SITEMAP', 'Sitemap contains a Firebase redirect source');
}

const pages = [];
for (const [url, sitemap] of membership) {
  const parsed = new URL(url);
  const relative = parsed.pathname === '/' ? 'index.html' : path.join(parsed.pathname.slice(1), 'index.html');
  const htmlPath = path.join(dist, relative);
  const entry = corpusByUrl.get(url);
  const row = {
    url, family: entry?.family || 'UNREGISTERED', sitemap,
    html_exists: fs.existsSync(htmlPath), canonical: '',
    title: '', meta_description_chars: 0, h1_count: 0, text_chars: 0,
    jsonld_blocks: 0, invalid_jsonld: 0, robots_directives: '',
    result: 'PASS',
  };
  if (!row.html_exists) {
    issue('ERROR', url, 'MISSING_PRERENDER', 'Generated HTML file missing: ' + relative);
    row.result = 'FAIL';
    pages.push(row);
    continue;
  }
  const document = new JSDOM(read(htmlPath), { url }).window.document;
  const canonicalElements = [...document.querySelectorAll('link[rel="canonical"]')];
  row.canonical = canonicalElements[0]?.getAttribute('href') || '';
  row.title = document.querySelector('title')?.textContent?.trim() || '';
  row.meta_description_chars = (document.querySelector('meta[name="description"]')?.content || '').trim().length;
  row.h1_count = document.querySelectorAll('h1').length;
  const main = document.querySelector('main') || document.querySelector('#root') || document.body;
  row.text_chars = (main?.textContent || '').replace(/\s+/g, ' ').trim().length;
  const robots = ['robots', 'googlebot', 'bingbot'].map(name => {
    const v = document.querySelector('meta[name="' + name + '"]')?.content || '';
    return name + ':' + v;
  });
  row.robots_directives = robots.join('|');
  const ld = [...document.querySelectorAll('script[type="application/ld+json"]')];
  row.jsonld_blocks = ld.length;
  for (const node of ld) {
    try { JSON.parse(node.textContent || ''); }
    catch { row.invalid_jsonld++; }
  }
  const critical = (code, message) => { issue('ERROR', url, code, message); row.result = 'FAIL'; };
  if (canonicalElements.length !== 1 || row.canonical !== url)
    critical('CANONICAL_MISMATCH', 'Expected one self canonical (' + url + '), got ' + canonicalElements.length + ': ' + row.canonical);
  if (!row.title) critical('MISSING_TITLE', 'No pre-rendered title');
  if (!row.meta_description_chars) critical('MISSING_DESCRIPTION', 'No pre-rendered meta description');
  if (/(:|,|\s)(?:noindex|none)(?:,|\s|$)/i.test(' ' + row.robots_directives))
    critical('NOINDEX_INTENDED_PAGE', 'Index-intended page contains robot exclusion');
  if (row.invalid_jsonld) critical('INVALID_JSONLD', row.invalid_jsonld + ' invalid structured-data block(s)');
  if (row.h1_count !== 1) {
    issue('REVIEW', url, 'H1_COUNT', 'Rendered heading count=' + row.h1_count);
    if (row.result === 'PASS') row.result = 'REVIEW';
  }
  if (row.text_chars < 180) {
    issue('REVIEW', url, 'LOW_RENDERED_TEXT', 'Rendered main text has ' + row.text_chars + ' characters');
    if (row.result === 'PASS') row.result = 'REVIEW';
  }
  if (!row.jsonld_blocks) {
    issue('REVIEW', url, 'NO_JSONLD', 'No JSON-LD block; may be intentional for page type');
    if (row.result === 'PASS') row.result = 'REVIEW';
  }
  pages.push(row);
}

const csvColumns = [
  'url', 'family', 'sitemap', 'html_exists', 'canonical', 'title',
  'meta_description_chars', 'h1_count', 'text_chars',
  'jsonld_blocks', 'invalid_jsonld', 'robots_directives', 'result',
];
const csv = value => '"' + String(value ?? '').replaceAll('"', '""').replace(/^[=+@-]/, m => "'" + m) + '"';
fs.writeFileSync(path.join(output, `URL_MACHINE_READABILITY_${expectedIndexableCount}.csv`),
  csvColumns.join(',') + '\n' + pages.map(p => csvColumns.map(k => csv(p[k])).join(',')).join('\n') + '\n');
fs.writeFileSync(path.join(output, 'FINDINGS.json'), JSON.stringify(findings, null, 2) + '\n');
fs.writeFileSync(path.join(output, `CANONICAL_INVENTORY_${expectedCorpusCount}.json`), JSON.stringify(
  [...corpusByUrl.entries()].map(([url, e]) => ({
    url, family: e.family, indexing_state: e.indexing_state,
    in_sitemap: membership.has(url), sitemap: membership.get(url) || null,
  })).sort((a, b) => a.url.localeCompare(b.url)), null, 2) + '\n');
const summary = {
  audited_at_utc: new Date().toISOString(),
  evidence: 'generated local build artifact; NOT live HTTP, current Google or Bing indexed state, or AI citation evidence',
  frozen_2026_10_19_baseline: { content: 279, indexable: 260, noindex: 19 },
  additional_approved_age_routes: PHONICS_AGE_PROGRAMME_PATHS,
  source_content_count: corpus.length,
  source_indexable: indexIntended.length,
  source_noindex: noindex.length,
  generated_sitemap_entries: sitemapCount,
  unique_sitemap_urls: membership.size,
  by_sitemap: Object.fromEntries([...expectedChildCounts].map(([f]) => [f, pages.filter(p => p.sitemap === f).length])),
  inspected_html: pages.filter(p => p.html_exists).length,
  pass: pages.filter(p => p.result === 'PASS').length,
  review: pages.filter(p => p.result === 'REVIEW').length,
  fail: pages.filter(p => p.result === 'FAIL').length,
  error_findings: findings.filter(f => f.severity === 'ERROR').length,
  review_findings: findings.filter(f => f.severity === 'REVIEW').length,
  excluded_sitemap_leaks: findings.filter(f => f.code === 'EXCLUDED_IN_SITEMAP').length,
  missing_source_owners: findings.filter(f => f.code === 'ORPHAN_SITEMAP_ENTRY').length,
};
fs.writeFileSync(path.join(output, 'SUMMARY.json'), JSON.stringify(summary, null, 2) + '\n');
console.log('TSSA-SCQ/Phase1 summary: ' + JSON.stringify(summary));
for (const f of findings.slice(0, 30)) console.log(f.severity + ': ' + f.url + ' — ' + f.code + ': ' + f.detail);
if (summary.error_findings) process.exitCode = 1;
