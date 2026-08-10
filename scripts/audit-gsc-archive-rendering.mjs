import fs from 'node:fs';
import path from 'node:path';
import {
  GSC_CRAWLED_NOT_INDEXED_URLS,
} from './gsc-crawled-not-indexed-manifest.mjs';

const root = process.cwd();
const origin = 'https://tinystepslearning.com';
const archives = GSC_CRAWLED_NOT_INDEXED_URLS.filter((row) => row.action === 'noindex-archive');
const failures = [];

const extract = (html, pattern) => html.match(pattern)?.[1]?.trim() || '';
const stripHtml = (value) => String(value || '')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&(?:amp|quot|#39|nbsp);/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

for (const row of archives) {
  const file = path.join(root, 'dist', row.path.slice(1), 'index.html');
  if (!fs.existsSync(file)) {
    failures.push(`${row.path}: missing prerendered archive HTML`);
    continue;
  }

  const html = fs.readFileSync(file, 'utf8');
  const robots = extract(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
  const canonical = extract(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const title = stripHtml(extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const h1 = stripHtml(extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i));
  const body = stripHtml(extract(html, /<body[^>]*>([\s\S]*?)<\/body>/i));
  const words = body.split(/\s+/).filter(Boolean).length;

  if (!/(?:^|[,\s])noindex(?:[,\s]|$)/i.test(robots)) {
    failures.push(`${row.path}: rendered robots is not noindex (${robots || 'missing'})`);
  }
  if (canonical !== `${origin}${row.path}`) {
    failures.push(`${row.path}: canonical is ${canonical || 'missing'}`);
  }
  if (!title || !h1 || /(?:404|not found|not available)/i.test(`${title} ${h1}`)) {
    failures.push(`${row.path}: archive rendered as missing content (title=${title || 'missing'}, h1=${h1 || 'missing'})`);
  }
  if (words < 200) failures.push(`${row.path}: archive prerender is too thin (${words} words)`);
}

console.log(`[gsc-archive-rendering] archives=${archives.length}`);
if (archives.length !== 12) failures.push(`manifest: expected 12 noindex archives, found ${archives.length}`);

if (failures.length) {
  console.error('[gsc-archive-rendering] FAILED');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('[gsc-archive-rendering] PASS: all 12 noindex archives are accessible, self-canonical, substantial prerendered pages with noindex robots.');
