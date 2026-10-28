// Actual built HTML in mobile Chromium; simulate route-chunk fetch failures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { JSDOM } from 'jsdom';

const ORIGIN = 'http://127.0.0.1:4187';
const DIST = path.resolve('dist');
const ROUTES = [
  { pathname: '/courses', chunk: '/CoursesPage-', heading: 'Find the Right English Course for Your Child' },
  { pathname: '/pricing', chunk: '/PricingPage-', heading: 'Online English Classes for Kids: Fees & Pricing' },
  { pathname: '/phonics', chunk: '/phonics-', heading: 'Online Phonics Classes for Kids' },
  { pathname: '/grammar', chunk: '/grammar-', heading: 'Online Grammar Classes for Kids' },
  { pathname: '/speaking', chunk: '/speaking-', heading: 'Online Public Speaking Classes for Kids' },
  { pathname: '/reading-classes-for-kids', chunk: '/ReadingClassesForKidsPage-', heading: 'Online Reading Classes for Kids' },
];
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2', '.json': 'application/json',
};
function serve() {
  return createServer(async (req, res) => {
    const relative = decodeURIComponent(new URL(req.url || '/', ORIGIN).pathname).replace(/^\/+/, '');
    const file = path.resolve(DIST, path.extname(relative) ? relative : path.join(relative, 'index.html'));
    if (!file.startsWith(DIST + path.sep)) return void res.writeHead(403).end('Forbidden');
    try {
      const bytes = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' }).end(bytes);
    } catch {
      res.writeHead(404).end('Build file not found');
    }
  });
}

test('six commercial pages retain correct owner under their lazy route import failure', { timeout: 190000 }, async () => {
  const server = serve();
  await new Promise(resolve => server.listen(4187, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const route of ROUTES) {
      const raw = await (await fetch(ORIGIN + route.pathname)).text();
      const doc = new JSDOM(raw).window.document;
      const canonical = 'https://tinystepslearning.com' + route.pathname;
      assert.equal(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'), canonical);
      assert.equal(doc.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim(), route.heading);
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
      let blocked = 0;
      try {
        await page.route('**/assets/*.js', async r => {
          if (r.request().url().includes(route.chunk)) {
            blocked++;
            return r.abort('failed');
          }
          return r.continue();
        });
        await page.goto(ORIGIN + route.pathname, { waitUntil: 'domcontentloaded', timeout: 40000 });
        await page.waitForFunction(() => document.querySelector('[data-ts-static-resource-recovery]'), null, { timeout: 16000 });
        assert.ok(blocked > 0, route.pathname + ': route chunk not blocked');
        const restored = page.locator('[data-ts-static-resource-recovery]');
        assert.equal(await restored.getAttribute('data-ts-static-resource-recovery'), 'router');
        assert.equal((await restored.locator('main h1').first().textContent())?.replace(/\s+/g, ' ').trim(), route.heading);
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), canonical);
        assert.equal(await page.getByText('Something went wrong', { exact: true }).count(), 0);
        console.log(route.pathname + ': recovered real prerender after ' + blocked + ' simulated chunk failure');
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
