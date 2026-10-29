// Reproduce Google's October 29 live Soft 404: route chunk failure after HTTP 200
// must preserve route-specific prerendered educational HTML, not an error page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { JSDOM } from 'jsdom';

const ORIGIN = 'http://127.0.0.1:4192';
const DIST = path.resolve('dist');
const ROUTES = [
  { pathname: '/free-reading-fluency-game-for-kids', chunk: '/FreeEnglishGameLandingPage-', heading: 'Free Reading Fluency Game for Kids' },
  { pathname: '/free-phonics-games-for-kids', chunk: '/FreeEnglishGamesCategoryPage-', heading: 'Free Phonics Games for Kids' },
  { pathname: '/why-tiny-steps', chunk: '/WhyTinyStepsPage-', heading: 'Why Parents Choose Tiny Steps Learning' },
  { pathname: '/resources', chunk: '/ResourcesPage-', heading: 'English Learning Resources for Kids, Parents & Educators' },
];
const MIME = {
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
      response.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' }).end(bytes);
    } catch {
      response.writeHead(404).end('Missing build artifact');
    }
  });
}

test('four public GSC exclusion owners survive route module failure in mobile Chromium', { timeout: 180000 }, async () => {
  const server = serveBuild();
  await new Promise(resolve => server.listen(4192, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const route of ROUTES) {
      const response = await fetch(ORIGIN + route.pathname);
      assert.equal(response.status, 200, route.pathname + ': build route missing');
      const document = new JSDOM(await response.text()).window.document;
      const canonical = 'https://tinystepslearning.com' + route.pathname;
      assert.equal(document.querySelector('link[rel="canonical"]')?.getAttribute('href'), canonical);
      assert.equal(document.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim(), route.heading);
      assert.ok((document.querySelector('main')?.textContent || '').trim().length >= 600);
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
      let blocked = 0;
      try {
        await page.route('**/assets/*.js', async request => {
          if (request.request().url().includes(route.chunk)) {
            blocked++;
            return request.abort('failed');
          }
          return request.continue();
        });
        await page.goto(ORIGIN + route.pathname, { waitUntil: 'domcontentloaded', timeout: 40000 });
        await page.waitForFunction(() => document.querySelector('[data-ts-static-resource-recovery]'), null, { timeout: 16000 });
        assert.ok(blocked > 0, route.pathname + ': route script was not intercepted');
        const recovered = page.locator('[data-ts-static-resource-recovery]');
        assert.equal(await recovered.getAttribute('data-ts-static-resource-recovery'), 'router');
        assert.equal((await recovered.locator('h1').first().textContent())?.replace(/\s+/g, ' ').trim(), route.heading);
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), canonical);
        assert.equal(await page.getByText('Page temporarily unavailable', { exact: true }).count(), 0);
        console.log(route.pathname + ': prerender content preserved after ' + blocked + ' simulated module failure');
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
