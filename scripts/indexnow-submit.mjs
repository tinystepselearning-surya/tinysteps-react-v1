#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const DEFAULT_HOST = 'tinystepslearning.com';
const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1].trim());
}

async function loadUrlsFromSitemap(sitemapPath) {
  const absolutePath = path.resolve(process.cwd(), sitemapPath);
  const xml = await fs.readFile(absolutePath, 'utf8');
  const locs = extractLocs(xml);

  if (/<sitemapindex/i.test(xml)) {
    const nested = await Promise.all(
      locs.map(async (sitemapUrl) => {
        const nestedPath = path.resolve(process.cwd(), 'dist', new URL(sitemapUrl).pathname.replace(/^\//, ''));
        const nestedXml = await fs.readFile(nestedPath, 'utf8');
        return extractLocs(nestedXml);
      }),
    );
    return nested.flat();
  }

  return locs;
}

async function main() {
  const key = (process.env.INDEXNOW_KEY || '').trim();
  if (!key) {
    console.log('INDEXNOW_KEY not set; skipping IndexNow submission.');
    return;
  }

  const endpoint = (process.env.INDEXNOW_ENDPOINT || DEFAULT_ENDPOINT).trim();
  const host = (process.env.INDEXNOW_HOST || DEFAULT_HOST).trim();
  const sitemapPath = process.env.INDEXNOW_SITEMAP || 'dist/sitemap.xml';
  const urls = [...new Set(await loadUrlsFromSitemap(sitemapPath))].slice(0, 10000);

  if (!urls.length) {
    console.log('No URLs found for IndexNow submission; skipping.');
    return;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      host,
      key,
      urlList: urls,
    }),
  });

  if (![200, 202].includes(response.status)) {
    const body = await response.text();
    throw new Error(`IndexNow submission failed (${response.status}): ${body.slice(0, 400)}`);
  }

  console.log(`IndexNow accepted ${urls.length} URL(s) with status ${response.status}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
