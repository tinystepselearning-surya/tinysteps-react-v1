#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  APPLICATION_ROUTE_INTENT_MANIFEST,
  PUBLIC_ROUTE_MANIFEST,
} from '../src/lib/publicRouteManifest.js';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');
const FIREBASE_JSON = path.join(ROOT, 'firebase.json');
const ARTIFACTS_DIR = path.join(ROOT, 'artifacts');
const SITE_ORIGIN = 'https://tinystepslearning.com';

let failureCount = 0;

function ok(message) {
  console.log(`OK: ${message}`);
}

function fail(message) {
  failureCount += 1;
  console.error(`ERROR: ${message}`);
}

function normalizePathname(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if (/^(?:mailto|tel|javascript|data):/i.test(trimmed)) return null;

  try {
    const decoded = trimmed.replace(/&amp;/g, '&');
    const url = new URL(decoded, SITE_ORIGIN);
    if (url.origin !== SITE_ORIGIN) return null;
    const pathname = url.pathname.replace(/\/{2,}/g, '/');
    return pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
  } catch {
    return null;
  }
}

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi), (match) => match[1].trim());
}

function stripHtml(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAnchors(html) {
  const anchors = [];
  for (const match of html.matchAll(/<a\b([^>]*)\bhref\s*=\s*(["'])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const rawHref = match[3].trim();
    const targetPath = normalizePathname(rawHref);
    if (!targetPath) continue;
    anchors.push({
      rawHref,
      targetPath,
      text: stripHtml(match[5]).slice(0, 160),
    });
  }
  return anchors;
}

function extractTitle(html) {
  return html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || '';
}

function extractH1(html) {
  return stripHtml(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
}

function looksLikeSoft404(html) {
  const title = extractTitle(html);
  const h1 = extractH1(html);
  const visibleText = stripHtml(html);
  const headingSignal = `${title} ${h1}`;

  if (/\b(?:404|page not found|not found|page unavailable|not available)\b/i.test(headingSignal)) {
    return { isSoft404: true, reason: `404/not-found signal in title or H1 (${headingSignal.trim()})` };
  }

  if (visibleText.length < 120) {
    return { isSoft404: true, reason: `rendered page is unexpectedly thin (${visibleText.length} visible characters)` };
  }

  return { isSoft404: false, reason: null };
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

async function internalFileExists(routePath) {
  const relative = routePath.replace(/^\/+/, '');
  if (!relative) return true;
  return (await fileExists(path.join(DIST_DIR, relative)))
    || (await fileExists(path.join(PUBLIC_DIR, relative)));
}

function matchesIntentPattern(routePath, pattern) {
  if (!pattern || pattern === '/**') return false;
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return routePath === prefix || routePath.startsWith(`${prefix}/`);
  }
  return routePath === pattern;
}

async function loadCanonicalSitemapPaths() {
  const names = (await fs.readdir(PUBLIC_DIR))
    .filter((name) => /^sitemap-(?:static|blog|courses|parents)\.xml$/i.test(name))
    .sort();

  const paths = [];
  for (const name of names) {
    const xml = await fs.readFile(path.join(PUBLIC_DIR, name), 'utf8');
    for (const loc of extractLocs(xml)) {
      const url = new URL(loc);
      if (url.origin !== SITE_ORIGIN) {
        fail(`Non-canonical sitemap origin in ${name}: ${loc}`);
        continue;
      }
      const normalized = normalizePathname(url.pathname);
      if (normalized) paths.push(normalized);
    }
  }
  return paths;
}

async function main() {
  const firebase = JSON.parse(await fs.readFile(FIREBASE_JSON, 'utf8'));
  const canonicalPaths = new Set(await loadCanonicalSitemapPaths());
  const redirectSources = new Set(
    (firebase?.hosting?.redirects ?? [])
      .map((entry) => normalizePathname(entry?.source))
      .filter(Boolean),
  );
  const publicRoutes = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
  const appIntentPatterns = APPLICATION_ROUTE_INTENT_MANIFEST.map((entry) => entry.path);

  const deadLinks = [];
  const redirectLinks = [];
  const soft404Pages = [];
  let renderedCanonicalPages = 0;
  let internalLinksChecked = 0;

  for (const sourcePath of canonicalPaths) {
    const htmlPath = await findRenderedHtml(sourcePath);
    if (!htmlPath) {
      fail(`Canonical sitemap page has no prerendered HTML: ${sourcePath}`);
      continue;
    }

    renderedCanonicalPages += 1;
    const html = await fs.readFile(htmlPath, 'utf8');
    const soft404 = looksLikeSoft404(html);
    if (soft404.isSoft404) {
      soft404Pages.push({ path: sourcePath, reason: soft404.reason });
      fail(`Canonical page looks like a soft 404: ${sourcePath} — ${soft404.reason}`);
    }

    const anchorsByTarget = new Map();
    for (const anchor of extractAnchors(html)) {
      if (!anchorsByTarget.has(anchor.targetPath)) anchorsByTarget.set(anchor.targetPath, anchor);
    }

    for (const [targetPath, anchor] of anchorsByTarget) {
      internalLinksChecked += 1;

      if (redirectSources.has(targetPath)) {
        redirectLinks.push({ source: sourcePath, target: targetPath, rawHref: anchor.rawHref, text: anchor.text });
        fail(`Canonical page ${sourcePath} links to redirect alias ${targetPath} (href=${JSON.stringify(anchor.rawHref)}, text=${JSON.stringify(anchor.text)})`);
        continue;
      }

      if (canonicalPaths.has(targetPath) || publicRoutes.has(targetPath)) continue;
      if (appIntentPatterns.some((pattern) => matchesIntentPattern(targetPath, pattern))) continue;
      if (await findRenderedHtml(targetPath)) continue;
      if (await internalFileExists(targetPath)) continue;

      deadLinks.push({ source: sourcePath, target: targetPath, rawHref: anchor.rawHref, text: anchor.text });
      fail(`Dead internal link from ${sourcePath} -> ${targetPath} (href=${JSON.stringify(anchor.rawHref)}, text=${JSON.stringify(anchor.text)})`);
    }
  }

  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    canonicalPages: canonicalPaths.size,
    renderedCanonicalPages,
    internalLinksChecked,
    deadLinks,
    redirectAliasLinks: redirectLinks,
    soft404Pages,
  };
  await fs.writeFile(
    path.join(ARTIFACTS_DIR, 'seo-dead-url-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );

  console.log(`[dead-url] canonicalPages=${canonicalPaths.size}`);
  console.log(`[dead-url] renderedCanonicalPages=${renderedCanonicalPages}`);
  console.log(`[dead-url] internalLinksChecked=${internalLinksChecked}`);
  console.log(`[dead-url] deadLinks=${deadLinks.length}`);
  console.log(`[dead-url] redirectAliasLinks=${redirectLinks.length}`);
  console.log(`[dead-url] soft404Pages=${soft404Pages.length}`);
  console.log('[dead-url] report=artifacts/seo-dead-url-report.json');

  if (failureCount > 0) process.exit(1);
  ok('Brick 4 dead URL and soft-404 guard passed');
}

main().catch((error) => {
  console.error(`ERROR: ${error.stack || error.message}`);
  process.exit(1);
});
