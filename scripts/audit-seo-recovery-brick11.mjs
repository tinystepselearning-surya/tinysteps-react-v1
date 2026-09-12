#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../src/lib/blogWeekRenames.js';
import { RETIRED_BLOG_PATH_REDIRECTS } from './blog-consolidation-map.mjs';

const ROOT = process.cwd();
const failures = [];

const STATIC_PRIMARY_PATHS = [
  '/phonics',
  '/best-online-phonics-classes-for-kids-in-india',
  '/phonics-fees-india',
  '/free-letter-tracing-game-for-kids',
  '/letter-tracing-with-sounds-game',
];

const BLOG_PRIMARY_PATHS = [
  '/blog/satpin-phonics-guide',
  '/blog/phonics-satpin-launch',
  '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
];

const REQUIRED_DIRECT_REDIRECTS = Object.freeze({
  '/online-phonics-reading-classes': '/phonics',
  '/phonics-classes-for-kids': '/phonics',
  '/best-online-phonics-classes-india': '/best-online-phonics-classes-for-kids-in-india',
});

const GENERATED_DISCOVERY_FILES = [
  'public/sitemap-blog.xml',
  'public/rss.xml',
  'public/feed.xml',
  'public/blog/rss.xml',
  'public/blog/feed.xml',
  'public/llms.txt',
  'public/llms-full.txt',
];

function read(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`missing required file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function absolute(pathname) {
  return `https://tinystepslearning.com${pathname}`;
}

function assertNoRedirectChain(map, label) {
  const sources = new Set(Object.keys(map));
  for (const [source, destination] of Object.entries(map)) {
    if (source === destination) failures.push(`${label} self-redirect: ${source}`);
    if (sources.has(destination)) {
      failures.push(`${label} redirect chain: ${source} -> ${destination}`);
    }
  }
}

const staticSitemap = read('public/sitemap-static.xml');
const blogSitemap = read('public/sitemap-blog.xml');
const notFoundRoute = read('functions/src/notFoundRoute.ts');
const viteConfig = read('vite.config.js');
const sitemapGenerator = read('scripts/generate-sitemaps.js');
const rssGenerator = read('scripts/generate-rss.mjs');
const packageJsonText = read('package.json');
const firebaseText = read('firebase.json');

let firebase = null;
try {
  firebase = firebaseText ? JSON.parse(firebaseText) : null;
} catch (error) {
  failures.push(`firebase.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

for (const pathname of STATIC_PRIMARY_PATHS) {
  const config = ROUTE_SEO_REGISTRY[pathname];
  if (!config) {
    failures.push(`route SEO registry missing primary: ${pathname}`);
    continue;
  }
  if ((config.canonicalPath || pathname) !== pathname) {
    failures.push(`primary is not self-canonical: ${pathname} -> ${config.canonicalPath}`);
  }
  if (/noindex/i.test(config.robots || '')) failures.push(`primary is noindex: ${pathname}`);
  if (!staticSitemap.includes(`<loc>${absolute(pathname)}</loc>`)) {
    failures.push(`static sitemap missing primary: ${pathname}`);
  }
}

for (const pathname of BLOG_PRIMARY_PATHS) {
  if (!blogSitemap.includes(`<loc>${absolute(pathname)}</loc>`)) {
    failures.push(`blog sitemap missing primary: ${pathname}`);
  }
}

for (const [source, destination] of Object.entries(RETIRED_BLOG_PATH_REDIRECTS)) {
  const sourceUrl = absolute(source);
  for (const relativePath of GENERATED_DISCOVERY_FILES) {
    const text = read(relativePath);
    if (text.includes(sourceUrl)) {
      failures.push(`${relativePath} contains retired URL: ${source}`);
    }
  }

  if (!notFoundRoute.includes(`\"${source}\": \"${destination}\"`)
      && !notFoundRoute.includes(`\"${source}\": PHONICS_COMPARISON_OWNER`)) {
    failures.push(`server redirect missing or indirect: ${source} -> ${destination}`);
  }
}

for (const [source, destination] of Object.entries(LEGACY_WEEK_BLOG_PATH_REDIRECTS)) {
  const sourceUrl = absolute(source);
  for (const relativePath of GENERATED_DISCOVERY_FILES) {
    const text = read(relativePath);
    if (text.includes(sourceUrl)) {
      failures.push(`${relativePath} contains legacy weekly URL: ${source}`);
    }
  }
  if (!blogSitemap.includes(`<loc>${absolute(destination)}</loc>`)) {
    failures.push(`blog sitemap missing renamed public URL: ${destination}`);
  }
}

assertNoRedirectChain(RETIRED_BLOG_PATH_REDIRECTS, 'retired-blog');
assertNoRedirectChain(LEGACY_WEEK_BLOG_PATH_REDIRECTS, 'legacy-week');

const hostingRedirects = firebase?.hosting?.redirects ?? [];
for (const [source, destination] of Object.entries(REQUIRED_DIRECT_REDIRECTS)) {
  const redirect = hostingRedirects.find((candidate) => candidate.source === source);
  if (!redirect) {
    failures.push(`Firebase redirect missing: ${source}`);
    continue;
  }
  if (redirect.destination !== destination || redirect.type !== 301) {
    failures.push(`Firebase redirect must be direct 301: ${source} -> ${destination}`);
  }
}

if (!viteConfig.includes('canonicalInternalBlogLinks')) {
  failures.push('Vite canonical internal-link rewrite plugin is missing');
}
if (!viteConfig.includes('Object.entries(RETIRED_BLOG_PATH_REDIRECTS)')) {
  failures.push('Vite plugin is not driven by the retired blog redirect map');
}
if (!sitemapGenerator.includes('RETIRED_BLOG_SLUGS')) {
  failures.push('sitemap generator does not defensively exclude retired blog slugs');
}
if (!sitemapGenerator.includes('extractBlogEntriesFromPostFiles')) {
  failures.push('sitemap generator is not using public blog entry normalization');
}
if (!rssGenerator.includes('rewriteLegacyWeekBlogPaths(rewriteRetiredBlogPaths(text))')) {
  failures.push('LLM discovery normalization does not canonicalize retired and legacy paths');
}
if (!packageJsonText.includes('npm run gen:sitemaps && npm run seo:blog-consolidation')) {
  failures.push('build order no longer regenerates sitemaps before consolidation audit');
}
if (!packageJsonText.includes('"prebuild": "npm run check:shadowing && node scripts/generate-rss.mjs"')) {
  failures.push('prebuild no longer regenerates RSS/discovery artifacts');
}

if (failures.length) {
  console.error(`FAIL: SEO recovery Brick 11 technical consolidation (${failures.length} issue${failures.length === 1 ? '' : 's'})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `PASS: SEO recovery Brick 11 technical consolidation (${STATIC_PRIMARY_PATHS.length} static primaries, ${BLOG_PRIMARY_PATHS.length} blog primaries, ${Object.keys(RETIRED_BLOG_PATH_REDIRECTS).length} retired blog redirects, ${Object.keys(LEGACY_WEEK_BLOG_PATH_REDIRECTS).length} legacy weekly paths)`,
);
