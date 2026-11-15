import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const STATE_VERSION = 1;

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi), (match) =>
    match[1].trim().replace(/&amp;/g, '&'));
}

function withinDirectory(directory, filename) {
  const root = path.resolve(directory);
  const absolute = path.resolve(root, filename);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) {
    throw new Error('Sitemap URL resolves outside the public build directory.');
  }
  return absolute;
}

export async function loadCanonicalUrls(sitemapFile, distDir, host) {
  const xml = await fs.readFile(sitemapFile, 'utf8');
  let locs = extractLocs(xml);
  if (/<sitemapindex\b/i.test(xml)) {
    const nested = await Promise.all(locs.map(async (location) => {
      const url = new URL(location);
      if (url.hostname.toLowerCase() !== host.toLowerCase() || url.search) {
        throw new Error('Unexpected sitemap index location: ' + location);
      }
      const filename = withinDirectory(distDir, decodeURIComponent(url.pathname).replace(/^\/+/, ''));
      return extractLocs(await fs.readFile(filename, 'utf8'));
    }));
    locs = nested.flat();
  }

  const result = new Set();
  for (const item of locs) {
    try {
      const url = new URL(item);
      if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== host.toLowerCase()) continue;
      if (url.username || url.password) continue;
      url.hash = '';
      result.add(url.toString());
    } catch {
      // A bad sitemap entry must never cause submission to an external host.
    }
  }
  return [...result].sort();
}

function attribute(tag, name) {
  const pattern = new RegExp('(?:^|\\s)' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i');
  const match = pattern.exec(tag);
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : '';
}

function collapse(value) {
  return value.replace(/\s+/g, ' ').trim();
}

export function fingerprintHtml(html) {
  const head = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] || '';
  const tags = head.match(/<(?:meta|link)\b[^>]*>/gi) || [];
  const metadata = [];
  for (const tag of tags) {
    const name = attribute(tag, 'name').toLowerCase();
    const rel = attribute(tag, 'rel').toLowerCase();
    if (['description', 'robots', 'bingbot', 'googlebot'].includes(name)) {
      metadata.push(name + ':' + attribute(tag, 'content'));
    } else if (rel === 'canonical') {
      metadata.push('canonical:' + attribute(tag, 'href'));
    }
  }
  metadata.sort();
  const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1] || '';
  const schemas = Array.from(head.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))
    .filter((match) => attribute(match[1], 'type').toLowerCase() === 'application/ld+json')
    .map((match) => collapse(match[2]));
  const body = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1]
    || /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1]
    || html;
  const content = body
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(?:script|style|svg|noscript)\b[^>]*>[\s\S]*?<\/(?:script|style|svg|noscript)\s*>/gi, ' ')
    .replace(/<a\b([^>]*)>/gi, (_, attrs) => ' link:' + attribute(attrs, 'href') + ' ')
    .replace(/<img\b([^>]*)>/gi, (_, attrs) =>
      ' image:' + attribute(attrs, 'src') + ' alt:' + attribute(attrs, 'alt') + ' ')
    .replace(/<[^>]*>/g, ' ');
  const payload = JSON.stringify({
    title: collapse(title),
    metadata,
    schemas,
    content: collapse(content),
  });
  return createHash('sha256').update(payload).digest('hex');
}

export async function createPageState(urls, distDir) {
  const pages = {};
  const missing = [];
  for (const location of urls) {
    const url = new URL(location);
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '').replace(/\/+$/, '');
    const filename = withinDirectory(distDir, path.join(relative, 'index.html'));
    try {
      pages[location] = fingerprintHtml(await fs.readFile(filename, 'utf8'));
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      // Still track canonical URLs that do not have a corresponding prerendered file.
      // New/removed pages are reported; unchanged missing files are not re-submitted.
      pages[location] = null;
      missing.push(location);
    }
  }
  return { pages, missing };
}

export function changedUrls(previous, next) {
  const before = previous.pages;
  const after = next.pages;
  const changed = new Set();
  for (const [url, digest] of Object.entries(after)) {
    if (!(url in before) || before[url] !== digest) changed.add(url);
  }
  // IndexNow accepts notifications for deleted/redirected URLs as well.
  for (const url of Object.keys(before)) {
    if (!(url in after)) changed.add(url);
  }
  return [...changed].sort();
}

export function validateState(value, host) {
  if (!value || value.version !== STATE_VERSION || value.host !== host
      || !value.pages || typeof value.pages !== 'object' || Array.isArray(value.pages)) {
    throw new Error('Invalid or incompatible IndexNow submitted-state manifest.');
  }
  for (const [location, digest] of Object.entries(value.pages)) {
    const url = new URL(location);
    if (url.protocol !== 'https:' || url.hostname !== host || (digest !== null && !/^[a-f0-9]{64}$/.test(digest))) {
      throw new Error('Invalid URL or fingerprint in IndexNow submitted-state manifest.');
    }
  }
  return value;
}
