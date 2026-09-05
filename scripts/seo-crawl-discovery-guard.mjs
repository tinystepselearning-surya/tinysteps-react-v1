#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  PUBLIC_REDIRECT_MANIFEST,
} from '../src/lib/publicRouteManifest.js';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');
const FIREBASE_JSON = path.join(ROOT, 'firebase.json');
const ARTIFACTS_DIR = path.join(ROOT, 'artifacts');
const SITE_ORIGIN = 'https://tinystepslearning.com';

// Brick 3 protects the same high-value discovery surface hardened by Brick 2.
// Every path must be discoverable through at least one rendered link from a
// different canonical, indexable sitemap URL.
const CRAWL_DISCOVERY_TARGETS = [
  '/phonics',
  '/grammar',
  '/speaking',
  '/pricing',
  '/courses',
  '/curriculum',
  '/faq',
  '/book-demo',
  '/phonics-fees-india',
  '/online-english-classes-for-kids',
  '/reading-classes-for-kids',
  '/writing-classes-for-kids',
  '/confidence-building-program-kids',
  '/summer-camp-for-kids-india',
  '/best-online-phonics-classes-for-kids-in-india',
  '/free-reading-games-for-kids',
  '/free-grammar-games-for-kids',
  '/free-sentence-building-games-for-kids',
  '/courses/phonics-foundation',
  '/courses/phonics-brush-up',
  '/courses/phonics-advanced',
  '/courses/grammar',
  '/courses/grammar-mastery',
  '/courses/public-speaking-foundations',
  '/courses/public-speaking-excellence',
  '/parents/choosing-course',
  '/parents/common-mistakes',
  '/parents/scheduling',
  '/parents/tracking-progress',
  '/parents/phonics-mission',
  '/for-schools',
];

const DISCOVERY_HUBS = new Set([
  '/',
  '/courses',
  '/curriculum',
  '/phonics',
  '/grammar',
  '/speaking',
  '/pricing',
  '/blog',
  '/parents',
  '/free-english-games-for-kids',
]);

let hasError = false;

function ok(message) {
  console.log(`OK: ${message}`);
}

function fail(message) {
  hasError = true;
  console.error(`ERROR: ${message}`);
}

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi), (match) => match[1].trim());
}

function extractHrefs(html) {
  const hrefs = [];
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)) {
    hrefs.push(match[2].trim());
  }
  return hrefs;
}

function normalizePathname(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if (/^(?:mailto|tel|javascript|data):/i.test(trimmed)) return null;

  try {
    const url = new URL(trimmed.replace(/&amp;/g, '&'), SITE_ORIGIN);
    if (url.origin !== SITE_ORIGIN) return null;
    const pathname = url.pathname.replace(/\/{2,}/g, '/');
    return pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
  } catch {
    return null;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findRenderedHtml(routePath) {
  if (routePath === '/') {
    const rootFile = path.join(DIST_DIR, 'index.html');
    return (await fileExists(rootFile)) ? rootFile : null;
  }

  const relative = routePath.replace(/^\/+/, '');
  const candidates = [
    path.join(DIST_DIR, relative, 'index.html'),
    path.join(DIST_DIR, `${relative}.html`),
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }
  return null;
}

async function loadCanonicalSitemapPaths() {
  const sitemapNames = [
    'sitemap-static.xml',
    'sitemap-blog.xml',
    'sitemap-courses.xml',
    'sitemap-parents.xml',
  ];

  const paths = [];
  for (const sitemapName of sitemapNames) {
    const xml = await fs.readFile(path.join(PUBLIC_DIR, sitemapName), 'utf8');
    for (const loc of extractLocs(xml)) {
      const url = new URL(loc);
      if (url.origin !== SITE_ORIGIN) {
        fail(`Non-canonical origin found in ${sitemapName}: ${loc}`);
        continue;
      }
      paths.push(normalizePathname(url.pathname));
    }
  }

  return paths.filter(Boolean);
}

async function loadRedirectSources() {
  const firebase = JSON.parse(await fs.readFile(FIREBASE_JSON, 'utf8'));
  const sources = new Set(
    PUBLIC_REDIRECT_MANIFEST.map((entry) => normalizePathname(entry.source)).filter(Boolean),
  );

  for (const entry of firebase?.hosting?.redirects ?? []) {
    const source = normalizePathname(entry?.source);
    if (source) sources.add(source);
  }
  return sources;
}

async function main() {
  const sitemapPaths = await loadCanonicalSitemapPaths();
  const canonicalPaths = new Set(sitemapPaths);
  const redirectSources = await loadRedirectSources();
  const duplicateCanonicalPaths = sitemapPaths.filter(
    (value, index) => sitemapPaths.indexOf(value) !== index,
  );

  if (duplicateCanonicalPaths.length) {
    for (const duplicate of new Set(duplicateCanonicalPaths)) {
      fail(`Canonical sitemap path appears more than once: ${duplicate}`);
    }
  }

  for (const target of CRAWL_DISCOVERY_TARGETS) {
    if (!canonicalPaths.has(target)) {
      fail(`Brick 3 discovery target is absent from canonical sitemaps: ${target}`);
    }
  }

  const inbound = new Map(
    CRAWL_DISCOVERY_TARGETS.map((target) => [target, new Set()]),
  );
  const hubInbound = new Map(
    CRAWL_DISCOVERY_TARGETS.map((target) => [target, new Set()]),
  );
  const redirectLinks = [];
  let renderedSources = 0;

  for (const sourcePath of canonicalPaths) {
    const htmlPath = await findRenderedHtml(sourcePath);
    if (!htmlPath) continue;
    renderedSources += 1;

    const html = await fs.readFile(htmlPath, 'utf8');
    const linkedPaths = new Set(extractHrefs(html).map(normalizePathname).filter(Boolean));

    for (const linkedPath of linkedPaths) {
      if (redirectSources.has(linkedPath)) {
        redirectLinks.push({ source: sourcePath, target: linkedPath });
      }

      if (!canonicalPaths.has(linkedPath) || linkedPath === sourcePath) continue;
      if (!inbound.has(linkedPath)) continue;

      inbound.get(linkedPath).add(sourcePath);
      if (DISCOVERY_HUBS.has(sourcePath)) hubInbound.get(linkedPath).add(sourcePath);
    }
  }

  // Internal crawl links should point directly to canonical destinations rather
  // than spending crawl budget on aliases that immediately redirect.
  for (const { source, target } of redirectLinks) {
    fail(`Canonical page ${source} links to redirect source ${target}; link directly to its canonical destination`);
  }

  const reportTargets = [];
  for (const target of CRAWL_DISCOVERY_TARGETS) {
    const sources = [...(inbound.get(target) ?? [])].sort();
    const hubs = [...(hubInbound.get(target) ?? [])].sort();

    if (sources.length === 0) {
      fail(`High-value canonical page is orphaned from rendered canonical pages: ${target}`);
    } else {
      ok(`${target} has ${sources.length} canonical inbound source${sources.length === 1 ? '' : 's'}${hubs.length ? ` (${hubs.length} discovery hub${hubs.length === 1 ? '' : 's'})` : ''}`);
    }

    reportTargets.push({
      path: target,
      inboundCount: sources.length,
      discoveryHubInboundCount: hubs.length,
      inboundSources: sources,
      discoveryHubSources: hubs,
    });
  }

  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  await fs.writeFile(
    path.join(ARTIFACTS_DIR, 'seo-crawl-discovery-report.json'),
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      renderedCanonicalSources: renderedSources,
      canonicalSitemapPaths: canonicalPaths.size,
      redirectLinkViolations: redirectLinks,
      targets: reportTargets,
    }, null, 2)}\n`,
    'utf8',
  );

  console.log(`[crawl-discovery] canonicalPaths=${canonicalPaths.size}`);
  console.log(`[crawl-discovery] renderedSources=${renderedSources}`);
  console.log(`[crawl-discovery] targets=${CRAWL_DISCOVERY_TARGETS.length}`);
  console.log(`[crawl-discovery] redirectLinkViolations=${redirectLinks.length}`);
  console.log('[crawl-discovery] report=artifacts/seo-crawl-discovery-report.json');

  if (hasError) process.exit(1);
  console.log('SEO crawl and discovery guard passed.');
}

main().catch((error) => {
  console.error(`ERROR: ${error.stack || error.message}`);
  process.exit(1);
});
