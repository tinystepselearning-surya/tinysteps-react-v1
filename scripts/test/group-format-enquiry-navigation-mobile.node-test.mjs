// Run after "npm run build:deploy". Prevent public-booking click capture
// from replacing programme-specific group registration with a 1:1 modal.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { JSDOM } from 'jsdom';

const PORT = 4188;
const ORIGIN = 'http://127.0.0.1:' + PORT;
const DIST = path.resolve('dist');
const cases = [
  { route: '/group-phonics-classes-for-kids', program: 'phonics', heading: 'Phonics' },
  { route: '/group-grammar-classes-for-kids', program: 'grammar', heading: 'Grammar' },
  { route: '/group-public-speaking-classes-for-kids', program: 'speaking', heading: 'Public Speaking' },
];
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.json': 'application/json',
};
function serveBuild() {
  return createServer(async (req, res) => {
    const pathname = new URL(req.url || '/', ORIGIN).pathname;
    const relative = decodeURIComponent(pathname).replace(/^\/+/, '');
    const file = path.resolve(DIST, path.extname(relative) ? relative : path.join(relative, 'index.html'));
    if (!file.startsWith(DIST + path.sep)) return void res.writeHead(403).end('Forbidden');
    try {
      const bytes = await readFile(file);
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(bytes);
    } catch {
      res.writeHead(404).end('Missing build artifact');
    }
  });
}

test('all nine group-class CTAs navigate to the matching group enquiry, never the generic modal', { timeout: 180000 }, async () => {
  const server = serveBuild();
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const target of cases) {
      const href = '/book-demo?format=small_group&program=' + target.program;
      const html = await (await fetch(ORIGIN + target.route)).text();
      const doc = new JSDOM(html).window.document;
      const elements = doc.querySelectorAll('main.group-commercial-page a[href="' + href + '"]');
      assert.equal(elements.length, 3, target.route + ': three distinct group registration CTAs required');
      assert.ok([...elements].every(el => el.getAttribute('data-no-booking-intercept') === '1'), target.route);
      for (let i = 0; i < elements.length; i++) {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
        try {
          await page.goto(ORIGIN + target.route, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForFunction(() => {
            const node = document.querySelector('[data-ts-surface="public"]');
            return Boolean(node && Object.keys(node).some(k => k.startsWith('__reactProps$')));
          }, null, { timeout: 15000 });
          const links = page.locator('main.group-commercial-page a[href="' + href + '"]');
          assert.equal(await links.count(), 3);
          await links.nth(i).click({ timeout: 12000 });
          await page.waitForURL(url => url.pathname === '/book-demo' && url.searchParams.get('format') === 'small_group'
            && url.searchParams.get('program') === target.program, { timeout: 12000 });
          // Client-side routing updates the URL before its lazy BookDemoPage
          // finishes rendering; wait for that destination, not the old H1.
          const destinationHeading = page.getByRole('heading', {
            name: 'Register Interest in Group ' + target.heading + ' Classes', level: 1,
          });
          await destinationHeading.waitFor({ state: 'visible', timeout: 15000 });
          const selectedGroupFormat = page.getByRole('button', { name: 'Group Classes' });
          await selectedGroupFormat.waitFor({ state: 'visible', timeout: 15000 });
          assert.equal(await selectedGroupFormat.getAttribute('aria-pressed'), 'true');
          assert.equal(await page.getByRole('dialog').count(), 0, 'generic booking modal opened instead of group page');
          console.log(target.route + ' CTA ' + (i + 1) + ' correctly reaches its programme-specific group form');
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
