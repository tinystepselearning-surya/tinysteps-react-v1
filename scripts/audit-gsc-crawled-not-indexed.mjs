import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GSC_CRAWLED_NOT_INDEXED_AUDIT_DATE,
  GSC_CRAWLED_NOT_INDEXED_COUNTS,
  GSC_CRAWLED_NOT_INDEXED_URLS,
} from './gsc-crawled-not-indexed-manifest.mjs';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../src/lib/blogIndexingPolicy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const firebase = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'));
const hosting = firebase.hosting || {};
const redirects = Array.isArray(hosting.redirects) ? hosting.redirects : [];
const headers = Array.isArray(hosting.headers) ? hosting.headers : [];

const sitemapFiles = [
  'sitemap-static.xml',
  'sitemap-blog.xml',
  'sitemap-courses.xml',
  'sitemap-parents.xml',
];

const sitemapText = sitemapFiles
  .map((file) => {
    const full = path.join(root, 'public', file);
    return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  })
  .join('\n');

const problems = [];
const seen = new Set();

function fail(pathname, message) {
  problems.push(`${pathname}: ${message}`);
}

function hasPermanentRedirect(source, destination) {
  return redirects.some((rule) =>
    rule?.source === source &&
    rule?.destination === destination &&
    Number(rule?.type) === 301
  );
}

function hasNoindexHeader(source) {
  return headers.some((entry) =>
    entry?.source === source &&
    Array.isArray(entry?.headers) &&
    entry.headers.some((header) =>
      String(header?.key || '').toLowerCase() === 'x-robots-tag' &&
      /(^|[,\s])noindex([,\s]|$)/i.test(String(header?.value || ''))
    )
  );
}

function isInSitemap(pathname) {
  const url = `https://tinystepslearning.com${pathname === '/' ? '/' : pathname}`;
  return sitemapText.includes(`<loc>${url}</loc>`);
}

function resourceExists(pathname) {
  const full = path.join(root, 'public', pathname.replace(/^\//, ''));
  return fs.existsSync(full);
}

for (const row of GSC_CRAWLED_NOT_INDEXED_URLS) {
  if (seen.has(row.path)) fail(row.path, 'duplicate path in manifest');
  seen.add(row.path);

  if (row.action === 'resource') {
    if (!resourceExists(row.path)) fail(row.path, 'resource file is missing from public/');
    if (row.path.endsWith('rss.xml') && !hasNoindexHeader(row.path)) {
      fail(row.path, 'RSS resource must retain an X-Robots-Tag noindex header');
    }
    continue;
  }

  if (row.action === 'redirect') {
    if (row.normalization === 'trailingSlash') {
      if (hosting.trailingSlash !== false) {
        fail(row.path, 'expected Firebase trailingSlash:false canonical normalization');
      }
    } else if (!hasPermanentRedirect(row.path, row.target)) {
      fail(row.path, `missing 301 redirect to ${row.target}`);
    }
    continue;
  }

  if (row.action === 'noindex-archive') {
    if (!row.path.startsWith('/blog/')) {
      fail(row.path, 'noindex-archive is currently supported only for blog URLs');
      continue;
    }
    const slug = row.path.slice('/blog/'.length);
    if (!shouldNoindexBlogSlug(slug)) fail(row.path, 'blog indexing policy does not return noindex');
    if (shouldIncludeBlogSlugInSitemap(slug)) fail(row.path, 'archived weekly post is still eligible for sitemap inclusion');
    if (isInSitemap(row.path)) fail(row.path, 'archived weekly post appears in a canonical sitemap');
    continue;
  }

  if (row.action === 'index') {
    if (!isInSitemap(row.path)) fail(row.path, 'index target is missing from canonical sitemaps');
    if (row.path.startsWith('/blog/')) {
      const slug = row.path.slice('/blog/'.length);
      if (shouldNoindexBlogSlug(slug)) fail(row.path, 'index target is blocked by blog noindex policy');
    }
    continue;
  }

  fail(row.path, `unknown action ${row.action}`);
}

if (GSC_CRAWLED_NOT_INDEXED_URLS.length !== 52) {
  problems.push(`manifest: expected 52 Search Console examples, found ${GSC_CRAWLED_NOT_INDEXED_URLS.length}`);
}

console.log(`[gsc-crawled-audit] snapshot=${GSC_CRAWLED_NOT_INDEXED_AUDIT_DATE}`);
console.log(`[gsc-crawled-audit] urls=${GSC_CRAWLED_NOT_INDEXED_URLS.length}`);
console.log(`[gsc-crawled-audit] decisions=${JSON.stringify(GSC_CRAWLED_NOT_INDEXED_COUNTS)}`);

if (problems.length) {
  console.error('[gsc-crawled-audit] FAILED');
  for (const problem of problems) console.error(` - ${problem}`);
  process.exit(1);
}

console.log('[gsc-crawled-audit] PASS: all 52 URLs match the intended index/redirect/archive/resource policy.');
