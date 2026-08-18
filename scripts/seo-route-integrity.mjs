#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  PUBLIC_REDIRECT_MANIFEST,
  PUBLIC_ROUTE_MANIFEST,
} from '../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');
const FIREBASE_PATH = path.join(ROOT, 'firebase.json');
const NOT_FOUND_PATH = path.join(ROOT, 'functions', 'src', 'notFoundRoute.ts');
const FUNCTIONS_INDEX_PATH = path.join(ROOT, 'functions', 'src', 'index.ts');
const SITE_ORIGIN = 'https://tinystepslearning.com';

const REQUIRED_SPA_REWRITE_SOURCES = [
  '/login',
  '/*/login',
  '/unauthorized',
  '/surya',
  '/surya/**',
  '/Surya',
  '/Surya/**',
  '/admin',
  '/admin/**',
  '/teacher',
  '/teacher/**',
  '/parent',
  '/parent/**',
  '/kids',
  '/kids/**',
  '/kid',
  '/kid/**',
  '/messages',
  '/messages/**',
  '/learning-partner/dashboard',
  '/learning-partner/dashboard/**',
  '/learningpartner/dashboard',
  '/learningpartner/dashboard/**',
  '/dev',
  '/dev/**',
  '/debug-lessons',
];

let failureCount = 0;

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  failureCount += 1;
  console.error(`FAIL: ${message}`);
}

function isNoindex(robots) {
  return typeof robots === 'string' && /\bnoindex\b/i.test(robots);
}

function isNormalizedRoutePath(routePath, { allowTrailingSlash = false } = {}) {
  if (typeof routePath !== 'string' || !routePath.startsWith('/')) return false;
  if (routePath.includes('?') || routePath.includes('#') || routePath.includes('//')) return false;
  if (!allowTrailingSlash && routePath !== '/' && routePath.endsWith('/')) return false;
  return true;
}

function canonicalUrlForPath(routePath) {
  return routePath === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${routePath}`;
}

function countValue(values, expected) {
  return values.filter((value) => value === expected).length;
}

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi), (match) => match[1].trim());
}

function parseAttributes(tag) {
  const attributes = new Map();
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/gs)) {
    attributes.set(match[1].toLowerCase(), match[3].trim());
  }
  return attributes;
}

function findMetaContent(html, name) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    if ((attributes.get('name') || '').toLowerCase() === name.toLowerCase()) {
      return attributes.get('content') || '';
    }
  }
  return '';
}

function findCanonicalHref(html) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    if ((attributes.get('rel') || '').toLowerCase() === 'canonical') {
      return attributes.get('href') || '';
    }
  }
  return '';
}

function normalizedRobots(value) {
  return value
    .toLowerCase()
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .sort()
    .join(',');
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findPrerenderedHtml(routePath) {
  if (routePath === '/') {
    const rootFile = path.join(DIST_DIR, 'index.html');
    return (await fileExists(rootFile)) ? rootFile : null;
  }

  const relativePath = routePath.replace(/^\/+/, '');
  const candidates = [
    path.join(DIST_DIR, relativePath, 'index.html'),
    path.join(DIST_DIR, `${relativePath}.html`),
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }
  return null;
}

function validateManifest() {
  const routePaths = new Set();
  const redirectSources = new Set();

  for (const entry of PUBLIC_ROUTE_MANIFEST) {
    if (routePaths.has(entry.path)) fail(`Manifest route is duplicated: ${entry.path}`);
    else routePaths.add(entry.path);

    if (!isNormalizedRoutePath(entry.path)) fail(`Manifest route path is not normalized: ${entry.path}`);
    if (!isNormalizedRoutePath(entry.canonicalPath)) {
      fail(`Manifest canonicalPath is not normalized for ${entry.path}: ${entry.canonicalPath}`);
    }
    if (!['static', 'parents', 'legal', 'seasonal'].includes(entry.group)) {
      fail(`Manifest route has an unsupported group for ${entry.path}: ${entry.group}`);
    }
    for (const field of ['indexable', 'prerender', 'sitemap']) {
      if (typeof entry[field] !== 'boolean') fail(`Manifest ${field} policy is not explicit for ${entry.path}`);
    }
    if (!entry.indexable && entry.sitemap) {
      fail(`Non-indexable manifest route cannot be emitted in a sitemap: ${entry.path}`);
    }
  }

  for (const redirect of PUBLIC_REDIRECT_MANIFEST) {
    if (redirectSources.has(redirect.source)) fail(`Redirect source is duplicated: ${redirect.source}`);
    else redirectSources.add(redirect.source);

    if (!isNormalizedRoutePath(redirect.source, { allowTrailingSlash: true })) {
      fail(`Redirect source is invalid: ${redirect.source}`);
    }
    if (!isNormalizedRoutePath(redirect.destination)) {
      fail(`Redirect destination is not normalized for ${redirect.source}: ${redirect.destination}`);
    }
    if (redirect.source === redirect.destination) {
      fail(`Redirect source and destination are identical: ${redirect.source}`);
    }
    if (![301, 308].includes(redirect.status)) {
      fail(`Redirect status must be 301 or 308 for ${redirect.source}: ${redirect.status}`);
    }
    if (routePaths.has(redirect.source)) {
      fail(`Redirect source also acts as a public manifest route: ${redirect.source}`);
    }
  }

  if (failureCount === 0) {
    pass(`Manifest integrity (${PUBLIC_ROUTE_MANIFEST.length} routes, ${PUBLIC_REDIRECT_MANIFEST.length} redirects)`);
  }
}

function validateSeoRegistry() {
  for (const entry of PUBLIC_ROUTE_MANIFEST) {
    const seo = ROUTE_SEO_REGISTRY[entry.path];
    if (!seo) {
      fail(`SEO registry entry is missing: ${entry.path}`);
      continue;
    }
    if (!String(seo.title || '').trim()) fail(`SEO title is missing: ${entry.path}`);
    if (!String(seo.description || '').trim()) fail(`SEO description is missing: ${entry.path}`);

    const actualCanonical = seo.canonicalPath || entry.path;
    if (actualCanonical !== entry.canonicalPath) {
      fail(`SEO canonical mismatch for ${entry.path}: expected ${entry.canonicalPath}, found ${actualCanonical}`);
    }

    if (entry.indexable && isNoindex(seo.robots)) {
      fail(`Indexable manifest route is noindex in SEO registry: ${entry.path} (${seo.robots})`);
    }
    if (!entry.indexable && !isNoindex(seo.robots)) {
      fail(`Non-indexable manifest route lacks deliberate noindex policy: ${entry.path}`);
    }
    if (!entry.indexable && entry.sitemap) {
      fail(`Non-indexable route is configured for sitemap emission: ${entry.path}`);
    }
  }

  pass('SEO registry parity checked');
}

async function validateSitemaps() {
  const sitemapNames = (await fs.readdir(PUBLIC_DIR))
    .filter((name) => /^sitemap.*\.xml$/i.test(name))
    .sort();
  const pageUrls = [];

  for (const sitemapName of sitemapNames) {
    const xml = await fs.readFile(path.join(PUBLIC_DIR, sitemapName), 'utf8');
    if (/<urlset\b/i.test(xml)) pageUrls.push(...extractLocs(xml));
  }

  for (const entry of PUBLIC_ROUTE_MANIFEST.filter((route) => route.indexable && route.sitemap)) {
    const expectedUrl = canonicalUrlForPath(entry.path);
    const count = countValue(pageUrls, expectedUrl);
    if (count !== 1) {
      fail(`Sitemap coverage must be exactly once for ${entry.path}: found ${count}`);
    }
  }

  for (const redirect of PUBLIC_REDIRECT_MANIFEST) {
    const count = countValue(pageUrls, canonicalUrlForPath(redirect.source));
    if (count !== 0) fail(`Redirect source appears in sitemap XML: ${redirect.source} (found ${count})`);
  }

  for (const entry of PUBLIC_ROUTE_MANIFEST.filter((route) => !route.indexable)) {
    const count = countValue(pageUrls, canonicalUrlForPath(entry.path));
    if (count !== 0) fail(`Noindex route appears in sitemap XML: ${entry.path} (found ${count})`);
  }

  for (const url of pageUrls) {
    const pathname = new URL(url).pathname;
    const seo = ROUTE_SEO_REGISTRY[pathname];
    if (seo && isNoindex(seo.robots)) fail(`SEO-registry noindex route appears in sitemap XML: ${pathname}`);
  }

  const canonicalCount = countValue(
    pageUrls,
    canonicalUrlForPath('/online-english-classes-for-kids'),
  );
  if (canonicalCount !== 1) {
    fail(`/online-english-classes-for-kids must appear once across sitemap XML: found ${canonicalCount}`);
  }
  const indiaAliasCount = countValue(
    pageUrls,
    canonicalUrlForPath('/online-english-classes-for-kids-india'),
  );
  if (indiaAliasCount !== 0) {
    fail(`/online-english-classes-for-kids-india must not appear in sitemap XML: found ${indiaAliasCount}`);
  }

  pass(`Sitemap parity checked across ${sitemapNames.length} generated files`);
}

async function validatePrerenderOutput() {
  for (const entry of PUBLIC_ROUTE_MANIFEST.filter((route) => route.prerender)) {
    const htmlPath = await findPrerenderedHtml(entry.path);
    if (!htmlPath) {
      fail(`Prerendered HTML is missing: ${entry.path}`);
      continue;
    }

    const html = await fs.readFile(htmlPath, 'utf8');
    const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || '';
    const description = findMetaContent(html, 'description');
    const canonicalHref = findCanonicalHref(html);
    const robots = findMetaContent(html, 'robots');
    const expectedCanonical = canonicalUrlForPath(entry.canonicalPath);

    if (!title) fail(`Prerendered title is empty: ${entry.path}`);
    if (!description) fail(`Prerendered meta description is empty: ${entry.path}`);
    if (!canonicalHref) {
      fail(`Prerendered canonical link is missing: ${entry.path}`);
    } else if (canonicalHref !== expectedCanonical) {
      fail(`Prerendered canonical mismatch for ${entry.path}: expected ${expectedCanonical}, found ${canonicalHref}`);
    }

    if (entry.indexable) {
      if (!robots || isNoindex(robots) || !/\bindex\b/i.test(robots)) {
        fail(`Prerendered robots directive is not indexable for ${entry.path}: ${robots || '(missing)'}`);
      }
    } else {
      const expectedRobots = ROUTE_SEO_REGISTRY[entry.path]?.robots || '';
      if (!isNoindex(robots)) {
        fail(`Prerendered non-indexable route lacks noindex: ${entry.path} (${robots || 'missing'})`);
      } else if (expectedRobots && normalizedRobots(robots) !== normalizedRobots(expectedRobots)) {
        fail(`Prerendered robots mismatch for ${entry.path}: expected ${expectedRobots}, found ${robots}`);
      }
    }
  }

  pass('Prerender parity and rendered metadata checked');
}

async function validateFirebase() {
  const firebase = JSON.parse(await fs.readFile(FIREBASE_PATH, 'utf8'));
  const redirects = firebase?.hosting?.redirects || [];
  const rewrites = firebase?.hosting?.rewrites || [];

  for (const expected of PUBLIC_REDIRECT_MANIFEST) {
    const actual = redirects.find((entry) => entry.source === expected.source);
    if (!actual) {
      fail(`Firebase redirect is missing: ${expected.source}`);
      continue;
    }
    if (actual.destination !== expected.destination) {
      fail(`Firebase redirect destination mismatch for ${expected.source}: expected ${expected.destination}, found ${actual.destination}`);
    }
    if (actual.type !== expected.status) {
      fail(`Firebase redirect status mismatch for ${expected.source}: expected ${expected.status}, found ${actual.type}`);
    }
  }

  const finalRewrite = rewrites.at(-1);
  if (finalRewrite?.source !== '**') fail('Final Firebase rewrite is not the universal catch-all');
  if (finalRewrite?.function?.functionId !== 'notFoundRoute') {
    fail('Final Firebase catch-all does not route to notFoundRoute');
  }
  if (finalRewrite?.function?.region !== 'asia-south1') {
    fail(`Final Firebase catch-all region mismatch: ${finalRewrite?.function?.region || '(missing)'}`);
  }

  const finalIndex = rewrites.length - 1;
  const apiIndex = rewrites.findIndex((entry) => entry.source === '/api/contact');
  if (apiIndex < 0 || apiIndex >= finalIndex) fail('/api/contact rewrite is missing or occurs after the final catch-all');

  for (const source of REQUIRED_SPA_REWRITE_SOURCES) {
    const rewriteIndex = rewrites.findIndex(
      (entry) => entry.source === source && entry.destination === '/index.html',
    );
    if (rewriteIndex < 0) fail(`Private SPA rewrite is missing: ${source}`);
    else if (rewriteIndex >= finalIndex) fail(`Private SPA rewrite occurs after final catch-all: ${source}`);
  }

  for (const rewrite of rewrites) {
    if (rewrite.source === '**' && rewrite.destination === '/index.html') {
      fail('Universal /index.html fallback still exists');
    }
  }

  pass('Firebase redirects, SPA rewrites, and final 404 catch-all checked');
}

async function validateNotFoundFunction() {
  const source = await fs.readFile(NOT_FOUND_PATH, 'utf8');
  const indexSource = await fs.readFile(FUNCTIONS_INDEX_PATH, 'utf8');

  if (!/response\.status\(\s*404\s*\)/.test(source)) fail('notFoundRoute does not set HTTP status 404');
  if (!/X-Robots-Tag[\s\S]*noindex/i.test(source)) fail('notFoundRoute lacks an X-Robots-Tag noindex directive');
  if (!/<meta\s+name=["']robots["'][^>]*noindex/i.test(source)) fail('notFoundRoute lacks a noindex robots meta tag');
  if (!/Cache-Control[\s\S]*no-store/i.test(source)) fail('notFoundRoute lacks a no-store cache policy');
  const escapesRequestPathDirectly = /escapeHtml\(\s*request\.(?:path|originalUrl)/.test(source);
  const escapesNormalizedRequestPath = /const\s+rawPath\s*=\s*normalizePath\([^;]{0,160}request\.(?:path|originalUrl)/.test(source)
    && /escapeHtml\(\s*rawPath\s*\)/.test(source);
  if (!escapesRequestPathDirectly && !escapesNormalizedRequestPath) {
    fail('notFoundRoute does not escape the displayed request path');
  }
  if (!/export\s+\{\s*notFoundRoute\s*\}\s+from\s+["']\.\/notFoundRoute["']/.test(indexSource)) {
    fail('functions/src/index.ts does not export notFoundRoute');
  }

  pass('Genuine 404 function status, robots, cache, escaping, and export checked');
}

async function main() {
  validateManifest();
  validateSeoRegistry();
  await validateSitemaps();
  await validatePrerenderOutput();
  await validateFirebase();
  await validateNotFoundFunction();

  if (failureCount > 0) {
    console.error(`\nSEO route integrity failed with ${failureCount} invariant violation(s).`);
    process.exit(1);
  }

  console.log('\nSEO route integrity passed.');
}

main().catch((error) => {
  console.error(`FAIL: SEO route integrity could not complete: ${error.stack || error.message}`);
  process.exit(1);
});
