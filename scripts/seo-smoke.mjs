#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const HOSTNAME = 'tinystepslearning.com';
const PRIVATE_PREFIXES = [
  '/admin',
  '/surya',
  '/teacher',
  '/parent',
  '/kids',
  '/learning-partner/login',
  '/learning-partner/dashboard',
  '/learningpartner',
  '/dev',
];

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1].trim());
}

function urlToPath(url) {
  const parsed = new URL(url);
  if (parsed.hostname !== HOSTNAME) {
    throw new Error(`Unexpected hostname in sitemap: ${url}`);
  }
  return parsed.pathname || '/';
}

function pathToHtmlFile(routePath) {
  if (routePath === '/') return path.join(DIST_DIR, 'index.html');
  return path.join(DIST_DIR, routePath.replace(/^\//, ''), 'index.html');
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadSitemapUrls() {
  const indexPath = path.join(DIST_DIR, 'sitemap.xml');
  const indexXml = await fs.readFile(indexPath, 'utf8');
  const childSitemaps = extractLocs(indexXml);
  const urls = new Set();

  for (const sitemapUrl of childSitemaps) {
    const sitemapPath = path.join(DIST_DIR, urlToPath(sitemapUrl).replace(/^\//, ''));
    const xml = await fs.readFile(sitemapPath, 'utf8');
    for (const loc of extractLocs(xml)) {
      urls.add(loc);
    }
  }

  return [...urls].sort();
}

function assertPublicPath(routePath) {
  const blockedPrefix = PRIVATE_PREFIXES.find((prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`));
  if (blockedPrefix) {
    throw new Error(`Private route leaked into sitemap: ${routePath}`);
  }
}

function assertTag(html, regex, message) {
  if (!regex.test(html)) {
    throw new Error(message);
  }
}

async function validateHtml(url) {
  const routePath = urlToPath(url);
  assertPublicPath(routePath);

  const htmlPath = pathToHtmlFile(routePath);
  const html = await fs.readFile(htmlPath, 'utf8');

  assertTag(html, /<title>[^<]+<\/title>/i, `Missing <title> in ${routePath}`);
  assertTag(html, /<meta\s+name=["']description["'][^>]*content=["'][^"']+["'][^>]*>/i, `Missing meta description in ${routePath}`);

  const canonicalMatch = html.match(/<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (!canonicalMatch) {
    throw new Error(`Missing canonical link in ${routePath}`);
  }
  if (canonicalMatch[1] !== url) {
    throw new Error(`Canonical mismatch in ${routePath}: expected ${url}, got ${canonicalMatch[1]}`);
  }

  if (/<link\s+rel=["']alternate["'][^>]*hreflang=/i.test(html)) {
    throw new Error(`Unexpected hreflang alternate in ${routePath}`);
  }

  const robotsMatch = html.match(/<meta\s+name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (!robotsMatch) {
    throw new Error(`Missing robots meta in ${routePath}`);
  }
  if (/noindex/i.test(robotsMatch[1])) {
    throw new Error(`Indexable sitemap route is marked noindex in ${routePath}`);
  }

  assertTag(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>/i, `Missing JSON-LD in ${routePath}`);

  const text = stripHtml(html);
  const minTextLength = routePath.startsWith('/blog/') ? 700 : 140;
  if (text.length < minTextLength) {
    throw new Error(`Rendered HTML too thin in ${routePath}: ${text.length} chars`);
  }
}

async function main() {
  const urls = await loadSitemapUrls();

  if (!urls.length) {
    throw new Error('No URLs found in dist sitemaps');
  }

  for (const url of urls) {
    await validateHtml(url);
  }

  console.log(`SEO smoke check passed for ${urls.length} sitemap URLs.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
