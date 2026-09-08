#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  RESOURCE_ECOSYSTEM_REGISTRY,
} from '../src/lib/resourcesArchitectureRegistry.js';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_DIR = path.join(ROOT, 'artifacts', 'seo', 'resources-r0');
const SITE_ORIGIN = 'https://tinystepslearning.com';
const shouldWrite = process.argv.includes('--write');

let errors = 0;
let warnings = 0;
const diagnostics = [];

function record(level, code, message, context = {}) {
  diagnostics.push({ level, code, message, ...context });
  if (level === 'error') errors += 1;
  if (level === 'warning') warnings += 1;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findHtml(pathname) {
  if (pathname === '/') {
    const candidate = path.join(DIST_DIR, 'index.html');
    return (await exists(candidate)) ? candidate : null;
  }
  const relative = pathname.replace(/^\/+/, '');
  for (const candidate of [
    path.join(DIST_DIR, relative, 'index.html'),
    path.join(DIST_DIR, `${relative}.html`),
  ]) {
    if (await exists(candidate)) return candidate;
  }
  return null;
}

function parseAttrs(tag) {
  const attrs = new Map();
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/gs)) {
    attrs.set(match[1].toLowerCase(), match[3].trim());
  }
  return attrs;
}

function decodeEntities(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(value) {
  return decodeEntities(String(value || '').replace(/<[^>]+>/g, ' '));
}

function firstMeta(html, name) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = parseAttrs(match[0]);
    if ((attrs.get('name') || '').toLowerCase() === name.toLowerCase()) return attrs.get('content') || '';
  }
  return '';
}

function canonicalHref(html) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = parseAttrs(match[0]);
    if ((attrs.get('rel') || '').toLowerCase() === 'canonical') return attrs.get('href') || '';
  }
  return '';
}

function internalLinks(html) {
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const attrs = parseAttrs(match[0]);
    const href = attrs.get('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    try {
      const url = new URL(href, SITE_ORIGIN);
      if (url.origin !== SITE_ORIGIN) continue;
      const pathname = url.pathname.replace(/\/+$/, '') || '/';
      links.push(pathname);
    } catch {
      // Ignore malformed non-navigation values; other SEO guards own link validity.
    }
  }
  return [...new Set(links)];
}

function collectSchemaTypes(value, output = new Set()) {
  if (Array.isArray(value)) {
    for (const child of value) collectSchemaTypes(child, output);
    return output;
  }
  if (!value || typeof value !== 'object') return output;
  const type = value['@type'];
  if (Array.isArray(type)) type.forEach((item) => output.add(String(item)));
  else if (type) output.add(String(type));
  for (const child of Object.values(value)) collectSchemaTypes(child, output);
  return output;
}

function schemaTypes(html) {
  const types = new Set();
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1]);
      collectSchemaTypes(data, types);
    } catch {
      // Existing schema validation is owned by rendered SEO checks; inventory records parseable types only.
    }
  }
  return [...types].sort();
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function loadSitemapLastmods() {
  const map = new Map();
  const files = (await fs.readdir(PUBLIC_DIR)).filter((name) => /^sitemap.*\.xml$/i.test(name));
  for (const name of files) {
    const xml = await fs.readFile(path.join(PUBLIC_DIR, name), 'utf8');
    for (const match of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/gi)) {
      const url = match[1].trim();
      const lastmod = match[2].match(/<lastmod>([^<]+)<\/lastmod>/i)?.[1]?.trim() || null;
      try {
        const pathname = new URL(url).pathname.replace(/\/+$/, '') || '/';
        if (lastmod) map.set(pathname, lastmod);
      } catch {
        // Ignore malformed historical URLs; other sitemap guards own validity.
      }
    }
  }
  return map;
}

async function main() {
  if (!(await exists(DIST_DIR))) {
    console.error('ERROR: dist/ is missing. Run npm run build before the rendered R0 audit.');
    process.exitCode = 1;
    return;
  }

  const sitemapLastmods = await loadSitemapLastmods();
  const rows = [];

  for (const item of RESOURCE_ECOSYSTEM_REGISTRY) {
    if (!['route', 'blog-route'].includes(item.currentState)) {
      rows.push({
        path: item.path,
        currentState: item.currentState,
        htmlPresent: false,
        title: null,
        h1: null,
        canonical: null,
        robots: null,
        schemaTypes: [],
        internalLinks: [],
        sitemapLastmod: sitemapLastmods.get(item.path) || null,
      });
      continue;
    }

    const htmlPath = await findHtml(item.path);
    if (!htmlPath) {
      record('error', 'missing-prerender', `Protected R0 page has no prerendered HTML: ${item.path}`);
      rows.push({ path: item.path, currentState: item.currentState, htmlPresent: false });
      continue;
    }

    const html = await fs.readFile(htmlPath, 'utf8');
    const title = stripTags(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
    const h1 = stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
    const canonical = canonicalHref(html);
    const robots = firstMeta(html, 'robots');
    const schemas = schemaTypes(html);
    const links = internalLinks(html);
    const expectedCanonical = item.path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${item.path}`;

    if (!title) record('error', 'missing-title', `Rendered title missing: ${item.path}`);
    if (!h1) record('warning', 'missing-h1', `Rendered H1 not detected: ${item.path}`);
    if (!canonical) record('error', 'missing-canonical', `Rendered canonical missing: ${item.path}`);
    else if (canonical !== expectedCanonical) {
      record('error', 'canonical-mismatch', `Rendered canonical mismatch for ${item.path}`, { expectedCanonical, canonical });
    }
    if (/\bnoindex\b/i.test(robots)) record('error', 'protected-noindex', `Protected R0 page rendered noindex: ${item.path}`, { robots });
    if (links.length === 0) record('warning', 'no-internal-links', `No internal links detected in rendered HTML: ${item.path}`);

    rows.push({
      path: item.path,
      currentState: item.currentState,
      htmlPresent: true,
      htmlPath: path.relative(ROOT, htmlPath),
      title,
      h1: h1 || null,
      canonical,
      robots: robots || null,
      schemaTypes: schemas,
      internalLinks: links,
      internalLinkCount: links.length,
      sitemapLastmod: sitemapLastmods.get(item.path) || null,
    });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    productionBehaviorChangedByR0: false,
    pagesAudited: rows.filter((row) => ['route', 'blog-route'].includes(row.currentState)).length,
    errors,
    warnings,
  };

  if (shouldWrite) {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(path.join(OUTPUT_DIR, 'resources-r0-rendered.json'), `${JSON.stringify({ summary, diagnostics, rows }, null, 2)}\n`);
    const headers = [
      'path', 'currentState', 'htmlPresent', 'title', 'h1', 'canonical', 'robots',
      'schemaTypes', 'internalLinkCount', 'majorInternalLinks', 'sitemapLastmod',
    ];
    const data = rows.map((row) => [
      row.path,
      row.currentState,
      row.htmlPresent,
      row.title,
      row.h1,
      row.canonical,
      row.robots,
      (row.schemaTypes || []).join('|'),
      row.internalLinkCount ?? '',
      (row.internalLinks || []).slice(0, 25).join('|'),
      row.sitemapLastmod,
    ].map(csvEscape).join(','));
    await fs.writeFile(path.join(OUTPUT_DIR, 'resources-r0-rendered.csv'), `${headers.join(',')}\n${data.join('\n')}\n`);
  }

  console.log('\nTiny Steps Resources R0 Rendered Inventory');
  console.log('==========================================');
  console.log(`Rendered protected pages audited: ${summary.pagesAudited}`);
  console.log(`Errors: ${errors} | Warnings: ${warnings}`);
  for (const item of diagnostics) {
    console.log(`${item.level.toUpperCase()}: [${item.code}] ${item.message}`);
  }
  if (shouldWrite) console.log(`Wrote ${path.relative(ROOT, OUTPUT_DIR)}/resources-r0-rendered.{json,csv}`);
  if (errors > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
