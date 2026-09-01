#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const DEFAULT_HOST = 'tinystepslearning.com';
const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_REQUEST = 10000;
const MAX_ATTEMPTS = 3;

function validateKey(key) {
  return /^[A-Za-z0-9-]{8,128}$/.test(key);
}

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
        const pathname = new URL(sitemapUrl).pathname.replace(/^\//, '');
        const nestedPath = path.resolve(process.cwd(), 'dist', pathname);
        const nestedXml = await fs.readFile(nestedPath, 'utf8');
        return extractLocs(nestedXml);
      }),
    );
    return nested.flat();
  }

  return locs;
}

function normalizeUrls(urls, host) {
  const expectedHost = host.toLowerCase();
  const normalized = [];

  for (const candidate of urls) {
    try {
      const url = new URL(candidate);
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      if (url.hostname.toLowerCase() !== expectedHost) continue;
      url.hash = '';
      normalized.push(url.toString());
    } catch {
      // Ignore malformed URLs instead of poisoning the whole submission batch.
    }
  }

  return [...new Set(normalized)];
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitBatch({ endpoint, host, key, keyLocation, urls }) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'TinySteps-IndexNow/1.0',
        },
        body: JSON.stringify({
          host,
          key,
          keyLocation,
          urlList: urls,
        }),
      });

      if ([200, 202].includes(response.status)) {
        return response.status;
      }

      const body = await response.text();
      lastError = new Error(`IndexNow submission failed (${response.status}): ${body.slice(0, 400)}`);

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === MAX_ATTEMPTS) break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === MAX_ATTEMPTS) break;
    }

    await sleep(500 * 2 ** (attempt - 1));
  }

  throw lastError ?? new Error('IndexNow submission failed for an unknown reason.');
}

async function main() {
  const key = (process.env.INDEXNOW_KEY || '').trim();
  if (!key) {
    console.log('INDEXNOW_KEY not set; skipping IndexNow submission.');
    return;
  }

  if (!validateKey(key)) {
    throw new Error('INDEXNOW_KEY format is invalid; expected 8-128 letters, numbers, or dashes.');
  }

  const endpoint = (process.env.INDEXNOW_ENDPOINT || DEFAULT_ENDPOINT).trim();
  const host = (process.env.INDEXNOW_HOST || DEFAULT_HOST).trim().toLowerCase();
  const sitemapPath = process.env.INDEXNOW_SITEMAP || 'dist/sitemap.xml';
  const keyLocation = (process.env.INDEXNOW_KEY_LOCATION || `https://${host}/${key}.txt`).trim();

  const keyLocationUrl = new URL(keyLocation);
  if (keyLocationUrl.hostname.toLowerCase() !== host) {
    throw new Error('INDEXNOW_KEY_LOCATION must be hosted on the same host being submitted.');
  }

  const urls = normalizeUrls(await loadUrlsFromSitemap(sitemapPath), host);

  if (!urls.length) {
    console.log('No canonical URLs found for IndexNow submission; skipping.');
    return;
  }

  const batches = chunk(urls, MAX_URLS_PER_REQUEST);
  let submitted = 0;

  for (const batch of batches) {
    const status = await submitBatch({ endpoint, host, key, keyLocation, urls: batch });
    submitted += batch.length;
    console.log(`IndexNow accepted batch ${submitted}/${urls.length} URL(s) with status ${status}.`);
  }

  console.log(`IndexNow submission complete for ${submitted} canonical URL(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
