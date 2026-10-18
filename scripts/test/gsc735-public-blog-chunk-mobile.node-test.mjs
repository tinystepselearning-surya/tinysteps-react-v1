// GSC #735 original 58-URL cohort — true prerendered blog HTML in mobile Chromium.
// Inject BlogPostPage and optionally NotFoundPage lazy import failures.
// No fake Googlebot claim: this tests app fallbacks, not Google's indexing decision.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { JSDOM } from 'jsdom';

const ORIGIN = 'http://127.0.0.1:4185';
const DIST = path.resolve('dist');
// Derive blog cohort from the exact 58-URL owner ledger. Never test 301 aliases
// as independent articles; keep all 13 eligible blog routes under regression.
const ledger = await readFile('docs/seo/indexing-recovery-735/MASTER_58_URL_RECONCILIATION.md', 'utf8');
const redirectRules = JSON.parse(await readFile('firebase.json', 'utf8')).hosting.redirects;
const aliases = new Set(redirectRules.map(rule => rule.source));
const ROUTES = ledger.split(/\r?\n/)
  .map(line => line.match(/^\|\s*[DC]\d{2}\s*\|\s*(\/blog\/[a-z0-9-]+)\s*\|/)?.[1])
  .filter(Boolean)
  .filter(route => !aliases.has(route));
assert.equal(ROUTES.length, 13, 'GSC #735: expected all 13 canonically indexable blog pages');

function serveBuild() {
  return createServer(async (req, res) => {
    const url = new URL(req.url || '/', ORIGIN);
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const full = path.resolve(DIST, path.extname(relative) ? relative : path.join(relative, 'index.html'));
    if (!full.startsWith(DIST + path.sep)) return void res.writeHead(403).end('Forbidden');
    try {
      const data = await readFile(full);
      const ext = path.extname(full);
      const mime = ext === '.html' ? 'text/html; charset=utf-8'
        : ext === '.js' ? 'text/javascript; charset=utf-8'
        : ext === '.css' ? 'text/css; charset=utf-8'
        : ext === '.svg' ? 'image/svg+xml'
        : ext === '.json' ? 'application/json'
        : ext === '.png' ? 'image/png'
        : ext === '.webp' ? 'image/webp'
        : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
        : ext === '.woff2' ? 'font/woff2' : 'application/octet-stream';
      res.writeHead(200, { 'content-type': mime }).end(data);
    } catch {
      res.writeHead(404).end('Not found in prerendered build');
    }
  });
}

test('GSC #735: all 13 canonical blog articles survive article/NotFound lazy chunk failures', { timeout: 480000 }, async () => {
  const server = serveBuild();
  await new Promise(resolve => server.listen(4185, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const url of ROUTES) {
      const html = await (await fetch(ORIGIN + url)).text();
      const doc = new JSDOM(html).window.document;
      const expectedHeading = doc.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim();
      assert.ok(expectedHeading, url + ': prerendered article heading missing');
      assert.equal(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'), 'https://tinystepslearning.com' + url);
      for (const scenario of ['article-only', 'article-and-notfound']) {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
        try {
          let blocked = 0;
          await page.route('**/assets/*.js', async route => {
            const address = route.request().url();
            if (address.includes('/BlogPostPage-')
                || (scenario === 'article-and-notfound' && address.includes('/NotFoundPage-'))) {
              blocked++;
              await route.abort('failed');
            } else {
              await route.continue();
            }
          });
          await page.goto(ORIGIN + url, { waitUntil: 'domcontentloaded', timeout: 40000 });
          await page.waitForFunction(() => document.querySelector('[data-ts-static-resource-recovery]'), null, { timeout: 13000 });
          assert.ok(blocked >= 1, url + ': no real blog JS module request was blocked');
          const recovery = page.locator('[data-ts-static-resource-recovery]');
          assert.equal(await recovery.getAttribute('data-ts-static-resource-recovery'), 'router');
          const observed = await recovery.locator('main h1').first().textContent();
          assert.equal(observed?.replace(/\s+/g, ' ').trim(), expectedHeading, url + ': recovered wrong article');
          assert.ok((await recovery.locator('main').first().innerText()).length >= 450, url + ': recovered empty article');
          assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://tinystepslearning.com' + url);
          assert.equal(await page.getByText('Something went wrong', { exact: true }).count(), 0);
          console.log(url + ' ' + scenario + ': preserved correct article under ' + blocked + ' blocked lazy JS imports');
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
