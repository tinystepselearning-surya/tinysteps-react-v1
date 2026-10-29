#!/usr/bin/env node
// Full source-of-truth registry. No network requests and no Search Console credentials.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PUBLIC_ROUTE_MANIFEST,
  PUBLIC_REDIRECT_MANIFEST,
  APPLICATION_ROUTE_INTENT_MANIFEST,
} from '../src/lib/publicRouteManifest.js';
import { extractBlogEntriesFromPostFiles, listMdxEntries } from './blog-route-utils.mjs';
import { shouldIncludeBlogSlugInSitemap } from '../src/lib/blogIndexingPolicy.js';
import { RETIRED_BLOG_PATH_REDIRECTS } from './blog-consolidation-map.mjs';

export const ORIGIN = 'https://tinystepslearning.com';
export const SITEMAPS = ['sitemap-static.xml', 'sitemap-blog.xml', 'sitemap-courses.xml', 'sitemap-parents.xml'];

export function sitemapLocs(xml) {
  // Match URL entries, not the <loc> entries in a sitemap index.
  return [...String(xml).matchAll(/<url>\s*([\s\S]*?)<\/url>/gi)]
    .map((match) => match[1].match(/<loc>\s*([^<]+)\s*<\/loc>/i)?.[1]?.trim())
    .filter(Boolean);
}
export function normalizePath(value) {
  const url = new URL(value, ORIGIN);
  if (url.origin !== ORIGIN || url.username || url.password || url.search || url.hash) {
    throw new Error('Noncanonical or off-site URL: ' + value);
  }
  return url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');
}
const absolute = (pathname) => ORIGIN + pathname;
const category = (p) => p.startsWith('/resources/phonics/') ? 'phonics-guide'
  : p.startsWith('/resources/grammar/') ? 'grammar-guide'
  : p.startsWith('/resources/vocabulary/') ? 'vocabulary-guide'
  : p.startsWith('/blog/') ? 'blog'
  : p.startsWith('/courses/') ? 'course'
  : p.startsWith('/parents/') ? 'parent-guide'
  : p.startsWith('/resources/') ? 'resource-hub'
  : 'site';
const priority = { unclassified: 0, index: 1, noindex: 2, redirect: 3, 'genuine-404': 4 };
const isConcrete = (s) => typeof s === 'string' && !/[\\*?{}]/.test(s) && !/(^|\\/):[a-z]/i.test(s);

export function assembleRegistry({ sitemaps = [], published = [], blogs = [], redirects = [], noindex = [] }) {
  const map = new Map();
  function insert(inputPath, intent, source, target = null, sitemapFile = null) {
    if (!isConcrete(inputPath)) return;
    const p = normalizePath(inputPath);
    let row = map.get(p);
    if (!row) {
      row = { url: absolute(p), pathname: p, category: category(p), intended_state: 'unclassified',
        canonical_url: '', redirect_to: '', in_sitemap: false, sitemap_files: [], sources: [], problems: [] };
      map.set(p, row);
    }
    if (sitemapFile) {
      row.in_sitemap = true;
      if (!row.sitemap_files.includes(sitemapFile)) row.sitemap_files.push(sitemapFile);
    }
    if (!row.sources.includes(source)) row.sources.push(source);
    if ((priority[intent] ?? -1) > (priority[row.intended_state] ?? -1)) row.intended_state = intent;
    if (target && intent === 'redirect') row.redirect_to = absolute(normalizePath(target));
  }
  for (const { url, file } of sitemaps) insert(url, 'index', 'sitemap', null, file);
  for (const entry of published) insert(entry.path, entry.intent || (entry.indexable === false ? 'noindex' : 'index'), 'public-route-manifest');
  for (const { path: p, indexable } of blogs) insert(p, indexable ? 'index' : 'noindex', 'blog-source');
  for (const { source, destination } of redirects) insert(source, 'redirect', 'redirect-config', destination);
  for (const p of noindex) insert(p, 'noindex', 'application-route-manifest');
  const rows = [...map.values()].map((r) => {
    r.canonical_url = r.intended_state === 'index' ? r.url : '';
    if (r.intended_state === 'index' && !r.in_sitemap) r.problems.push('indexable_missing_from_sitemap');
    if (r.in_sitemap && r.intended_state !== 'index') r.problems.push('nonindex_url_in_sitemap');
    if (r.intended_state === 'unclassified') r.problems.push('unclassified_url');
    for (const field of ['sitemap_files', 'sources', 'problems']) r[field] = [...new Set(r[field])].sort();
    return r;
  }).sort((a, b) => a.pathname.localeCompare(b.pathname));
  if (rows.length !== map.size) throw new Error('Duplicate canonical paths in URL registry');
  return rows;
}
export function toCsv(rows) {
  const columns = ['url','pathname','category','intended_state','canonical_url','redirect_to','in_sitemap','sitemap_files','sources','problems'];
  const csvCell = (v) => {
    const s = Array.isArray(v) ? v.join(';') : String(v ?? '');
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return columns.join(',') + '\n' + rows.map((r) => columns.map((k) => csvCell(r[k])).join(',')).join('\n') + '\n';
}
export function makeRegistry(root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))) {
  const entries = [];
  for (const file of SITEMAPS) {
    const filename = path.join(root, 'public', file);
    if (!fs.existsSync(filename)) throw new Error('Generate sitemaps before registry: missing ' + file);
    for (const url of sitemapLocs(fs.readFileSync(filename, 'utf8'))) entries.push({ url, file });
  }
  const postsDir = path.join(root, 'src/content/blog/posts');
  const mdxDir = path.join(root, 'src/content/blog');
  const slugs = new Set([...extractBlogEntriesFromPostFiles(postsDir).map((v) => v.slug),
    ...listMdxEntries(mdxDir).map((v) => v.slug)]);
  const blogs = [...slugs].map((slug) => ({
    path: '/blog/' + slug, indexable: shouldIncludeBlogSlugInSitemap(slug),
  }));
  const firebase = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'));
  const redirects = [...PUBLIC_REDIRECT_MANIFEST,
    ...(firebase.hosting?.redirects ?? []).map((v) => ({ source: v.source, destination: v.destination })),
    ...Object.entries(RETIRED_BLOG_PATH_REDIRECTS).map(([source, destination]) => ({ source, destination }))];
  return assembleRegistry({
    sitemaps: entries, published: PUBLIC_ROUTE_MANIFEST, blogs, redirects,
    noindex: APPLICATION_ROUTE_INTENT_MANIFEST
      .filter((v) => v.intent === 'noindex' && isConcrete(v.path)).map((v) => v.path),
  });
}
function main() {
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const rows = makeRegistry(root);
  const dir = path.join(root, 'docs/seo/gsc-inspection');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'URL_REGISTRY.json'), JSON.stringify({
    property: 'sc-domain:tinystepslearning.com', generatedAt: new Date().toISOString(),
    source: 'repository route and blog manifests plus four checked-in sitemap files',
    counts: Object.fromEntries(['index','noindex','redirect','unclassified'].map((s) => [s, rows.filter((r) => r.intended_state === s).length])),
    problems: rows.filter((r) => r.problems.length).length, rows,
  }, null, 2) + '\n');
  fs.writeFileSync(path.join(dir, 'URL_REGISTRY.csv'), toCsv(rows));
  const issues = rows.filter((r) => r.problems.length);
  console.log(`GSC URL registry: ${rows.length} paths, ${rows.filter((r) => r.intended_state === 'index').length} intended index, ${issues.length} source/sitemap mismatches.`);
  if (issues.length) console.log('Review flagged URLs in URL_REGISTRY.csv before scanning; no site changes were made.');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
