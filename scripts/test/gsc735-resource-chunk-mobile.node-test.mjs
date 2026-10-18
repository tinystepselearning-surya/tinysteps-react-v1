// Production-artifact mobile smoke: force a lazy route module to fail.
// Serve exact dist/<resource>/index.html instead of Vite SPA fallback.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { TRACKED, GRAMMAR_HUB } from '../lib/gsc735TrackedResources.mjs';

const PORT = 4183;
const ORIGIN = 'http://127.0.0.1:' + PORT;
const DIST = path.resolve('dist');
const CHUNKS = {
  phonics: '/PhonicsKnowledgePage-',
  grammar: '/GrammarKnowledgePage-',
  vocabulary: '/VocabularyKnowledgePage-',
};
// Verify every flagged resource (including the Grammar hub) rather than
// extrapolating from the two pages where GSC exposed React Soft 404s.
const routes = [...TRACKED, { url: GRAMMAR_HUB }].map(({ url }) => ({
  path: url,
  chunk: url === GRAMMAR_HUB ? '/SubjectResourcesPage-' : CHUNKS[url.split('/')[2]],
}));

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
function createPreview() {
  return createServer(async (request, response) => {
    const pathname = new URL(request.url || '/', ORIGIN).pathname;
    const relative = decodeURIComponent(pathname).replace(/^\/+/, '');
    const file = path.resolve(DIST, path.extname(relative) ? relative : path.join(relative, 'index.html'));
    if (!file.startsWith(DIST + path.sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    try {
      const bytes = await readFile(file);
      response.setHeader('Content-Type', contentTypes[path.extname(file)] || 'application/octet-stream');
      response.writeHead(200);
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch {
      response.writeHead(404).end('Not found in prerendered build');
    }
  });
}

test('GSC #735: all 23 resource pages preserve prerendered content through dynamic import failures', { timeout: 240000 }, async () => {
  const server = createPreview();
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const route of routes) {
      for (const scenario of ['article-only', 'article-and-notfound']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
      const failures = [];
      page.on('pageerror', error => failures.push('pageerror: ' + error.message));
      page.on('console', message => { if (message.type() === 'error') failures.push('console: ' + message.text().slice(0, 200)); });
      page.on('requestfailed', request => failures.push('request: ' + request.url() + ' ' + request.failure()?.errorText));
      const originHtml = await (await fetch(ORIGIN + route.path)).text();
      console.log('Preloaded document evidence ' + JSON.stringify({
        route: route.path,
        htmlSize: originHtml.length,
        containsArticle: originHtml.includes('ts-answer-title'),
        containsRoot: originHtml.includes('id="root"'),
        hasCanonical: originHtml.includes('https://tinystepslearning.com' + route.path),
      }));
      const pristine = new JSDOM(originHtml).window.document;
      const expectedHeading = pristine.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim();
      assert.ok(expectedHeading, route.path + ': initial prerendered article heading is missing');
      let blocked = 0;
      await page.route('**/assets/*.js', async request => {
        if (request.request().url().includes(route.chunk)
            || (scenario === 'article-and-notfound' && request.request().url().includes('/NotFoundPage-'))) {
          blocked++;
          await request.abort('failed');
        } else {
          await request.continue();
        }
      });
      await page.goto(ORIGIN + route.path, { waitUntil: 'domcontentloaded', timeout: 40000 });
      try {
        await page.waitForFunction(() => document.querySelector('[data-ts-static-resource-recovery]'), null, { timeout: 12000 });
      } catch (error) {
        const state = await page.evaluate(() => ({
          url: location.href,
          heading: [...document.querySelectorAll('h1')].map(node => node.textContent),
          root: document.querySelector('#root')?.innerHTML.slice(0, 550),
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
          recovery: Boolean(document.querySelector('[data-ts-static-resource-recovery]')),
        }));
        console.error('Failed recovery diagnostic:', JSON.stringify({ blocked, failures: failures.slice(-10), state }));
        throw error;
      }
      assert.ok(blocked > 0, route.path + ': lazy module was not requested');
      if (scenario === 'article-and-notfound') {
        // The preferred behavior is for React Router to restore the article
        // *before* attempting to render the broken lazy NotFoundPage chunk.
        assert.equal(await page.locator('[data-ts-static-resource-recovery]').getAttribute('data-ts-static-resource-recovery'), 'router',
          route.path + ': router should preserve the article before a broken 404 module cascades');
      }
      const h1 = await page.locator('[data-ts-static-resource-recovery] main h1').first().textContent();
      assert.equal(h1?.replace(/\s+/g, ' ').trim(), expectedHeading, route.path + ': preserved wrong article');
      assert.ok((await page.locator('[data-ts-static-resource-recovery] main').first().innerText()).length >= 180,
        route.path + ': recovered article is unexpectedly thin');
      assert.equal(await page.locator('h1').filter({ hasText: 'Something went wrong' }).count(), 0);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      assert.equal(canonical, 'https://tinystepslearning.com' + route.path);
      console.log(route.path + ' (' + scenario + ') preserved its article after ' + blocked + ' intentionally aborted chunk request(s)');
      await page.close();
      }
    }
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
