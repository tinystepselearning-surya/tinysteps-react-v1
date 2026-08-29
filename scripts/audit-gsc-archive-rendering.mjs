import fs from 'node:fs';
import path from 'node:path';
import {
  GSC_CRAWLED_NOT_INDEXED_URLS,
} from './gsc-crawled-not-indexed-manifest.mjs';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../src/lib/blogWeekRenames.js';
import { shouldNoindexBlogSlug } from '../src/lib/blogIndexingPolicy.js';

const root = process.cwd();
const origin = 'https://tinystepslearning.com';
const historicalArchives = GSC_CRAWLED_NOT_INDEXED_URLS.filter((row) => row.action === 'noindex-archive');
const failures = [];
const notFoundRoutePath = path.join(root, 'functions', 'src', 'notFoundRoute.ts');
const notFoundRoute = fs.existsSync(notFoundRoutePath)
  ? fs.readFileSync(notFoundRoutePath, 'utf8')
  : '';

const extract = (html, pattern) => html.match(pattern)?.[1]?.trim() || '';
const stripHtml = (value) => String(value || '')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&(?:amp|quot|#39|nbsp);/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function canonicalArchivePath(pathname) {
  return LEGACY_WEEK_BLOG_PATH_REDIRECTS[pathname] || pathname;
}

let activeNoindexCount = 0;
let promotedCount = 0;

for (const row of historicalArchives) {
  const canonicalPath = canonicalArchivePath(row.path);
  const canonicalSlug = canonicalPath.startsWith('/blog/')
    ? canonicalPath.slice('/blog/'.length)
    : '';
  const expectsNoindex = shouldNoindexBlogSlug(canonicalSlug);

  if (expectsNoindex) activeNoindexCount += 1;
  else promotedCount += 1;

  // The 2026-08-09 GSC manifest is historical evidence. After the week-label
  // migration, the historical URL remains a permanent alias. A later quality
  // audit may promote the cleaned canonical from noindex archive to indexable.
  if (canonicalPath !== row.path) {
    if (!notFoundRoute.includes(`\"${row.path}\": \"${canonicalPath}\"`)) {
      failures.push(`${row.path}: missing permanent migration redirect to ${canonicalPath}`);
    }
  }

  const file = path.join(root, 'dist', canonicalPath.slice(1), 'index.html');
  if (!fs.existsSync(file)) {
    failures.push(`${row.path}: cleaned canonical ${canonicalPath} is missing prerendered HTML`);
    continue;
  }

  const html = fs.readFileSync(file, 'utf8');
  const robots = extract(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
  const canonical = extract(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const title = stripHtml(extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const h1 = stripHtml(extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i));
  const body = stripHtml(extract(html, /<body[^>]*>([\s\S]*?)<\/body>/i));
  const words = body.split(/\s+/).filter(Boolean).length;

  if (expectsNoindex) {
    if (!/(?:^|[,\s])noindex(?:[,\s]|$)/i.test(robots)) {
      failures.push(`${canonicalPath}: rendered robots is not noindex (${robots || 'missing'})`);
    }
  } else if (/(?:^|[,\s])noindex(?:[,\s]|$)/i.test(robots)) {
    failures.push(`${canonicalPath}: quality-promoted canonical still renders noindex (${robots})`);
  }

  if (canonical !== `${origin}${canonicalPath}`) {
    failures.push(`${canonicalPath}: canonical is ${canonical || 'missing'}`);
  }
  if (!title || !h1 || /(?:404|not found|not available)/i.test(`${title} ${h1}`)) {
    failures.push(`${canonicalPath}: canonical rendered as missing content (title=${title || 'missing'}, h1=${h1 || 'missing'})`);
  }
  if (words < 200) failures.push(`${canonicalPath}: prerender is too thin (${words} words)`);
}

console.log(`[gsc-archive-rendering] historicalArchives=${historicalArchives.length}`);
console.log(`[gsc-archive-rendering] activeNoindex=${activeNoindexCount}`);
console.log(`[gsc-archive-rendering] qualityPromoted=${promotedCount}`);
if (historicalArchives.length !== 12) failures.push(`manifest: expected 12 historical noindex-archive rows, found ${historicalArchives.length}`);

if (failures.length) {
  console.error('[gsc-archive-rendering] FAILED');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('[gsc-archive-rendering] PASS: all historical archive URLs preserve migration redirects; cleaned canonicals render substantial content with robots matching their current quality-audit indexability policy.');
