// Production-artifact mobile test: reproduce a lazy chunk failure, not Google's indexing decision.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { JSDOM } from 'jsdom';

const ORIGIN = 'http://127.0.0.1:4186';
const DIST = path.resolve('dist');
const ROUTES = [
  { path: '/group-phonics-classes-for-kids', chunk: '/GroupPhonicsClassesPage-' },
  { path: '/group-grammar-classes-for-kids', chunk: '/GroupGrammarClassesPage-' },
  { path: '/group-public-speaking-classes-for-kids', chunk: '/GroupPublicSpeakingClassesPage-' },
];
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2', '.json': 'application/json',
};
function serveBuild() {
  return createServer(async (request, response) => {
    const pathname = new URL(request.url || '/', ORIGIN).pathname;
    const relative = decodeURIComponent(pathname).replace(/^\/+/, '');
    const file = path.resolve(DIST, path.extname(relative) ? relative : path.join(relative, 'index.html'));
    if (!file.startsWith(DIST + path.sep)) return void response.writeHead(403).end('Forbidden');
    try {
      const bytes = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(bytes);
    } catch {
      response.writeHead(404).end('Missing build artifact');
    }
  });
}

test('all three group owners retain correct canonical HTML when mobile lazy imports fail', { timeout: 160000 }, async () => {
  const server = serveBuild();
  await new Promise(resolve => server.listen(4186, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const route of ROUTES) {
      const html = await (await fetch(ORIGIN + route.path)).text();
      const doc = new JSDOM(html).window.document;
      const canonical = 'https://tinystepslearning.com' + route.path;
      const expectedHeading = doc.querySelector('main.group-commercial-page h1')?.textContent?.replace(/\s+/g, ' ').trim();
      assert.ok(expectedHeading, route.path + ': production HTML missing programme heading');
      assert.equal(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'), canonical);
      assert.ok((doc.querySelector('main.group-commercial-page')?.textContent || '').length >= 600);
      for (const scenario of ['programme-chunk', 'programme-and-notfound']) {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
        let blockedProgramme = 0;
        let blockedNotFound = 0;
        try {
          await page.route('**/assets/*.js', async routeRequest => {
            const url = routeRequest.request().url();
            if (url.includes(route.chunk)) {
              blockedProgramme++;
              return routeRequest.abort('failed');
            }
            if (scenario === 'programme-and-notfound' && url.includes('/NotFoundPage-')) {
              blockedNotFound++;
              return routeRequest.abort('failed');
            }
            return routeRequest.continue();
          });
          await page.goto(ORIGIN + route.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForFunction(() => document.querySelector('[data-ts-static-resource-recovery]'), null, { timeout: 12000 });
          assert.ok(blockedProgramme > 0, route.path + ': programme import not intercepted');
          const recovery = page.locator('[data-ts-static-resource-recovery]');
          assert.equal(await recovery.getAttribute('data-ts-static-resource-recovery'), 'router');
          const heading = await recovery.locator('main.group-commercial-page h1').first().textContent();
          assert.equal(heading?.replace(/\s+/g, ' ').trim(), expectedHeading);
          assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), canonical);
          assert.equal(await page.getByText('Something went wrong', { exact: true }).count(), 0);
          assert.ok(await recovery.locator('a[href*="book-demo"]').count(), 'original enquiry link missing');
          console.log(route.path + ': ' + scenario + ' retained programme; imports aborted=' + blockedProgramme);
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
