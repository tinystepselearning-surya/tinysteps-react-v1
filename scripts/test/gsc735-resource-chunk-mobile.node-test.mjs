// Production-artifact mobile smoke: force a lazy route module to fail.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';

const PORT = 4183;
const ORIGIN = 'http://127.0.0.1:' + PORT;
const bin = path.resolve('node_modules/.bin/vite');
const routes = [
  { path: '/resources/grammar/simple-past-tense-for-kids', chunk: '/GrammarKnowledgePage-', title: /Simple Past/i },
  { path: '/resources/vocabulary/vocabulary-for-better-writing', chunk: '/VocabularyKnowledgePage-', title: /Vocabulary for Better Writing/i },
];

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 40000) {
    try { const res = await fetch(ORIGIN + '/resources/grammar/simple-past-tense-for-kids');
      if (res.ok) return; } catch { /* startup */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Vite preview did not start');
}

test('GSC #735: mobile resource content survives a failed dynamically imported route module', { timeout: 120000 }, async () => {
  const server = spawn(bin, ['preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], {
    stdio: 'ignore', shell: process.platform === 'win32',
  });
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ headless: true });
    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
      let blocked = 0;
      await page.route('**/assets/*.js', async request => {
        if (request.request().url().includes(route.chunk)) {
          blocked++;
          await request.abort('failed');
        } else {
          await request.continue();
        }
      });
      await page.goto(ORIGIN + route.path, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await page.waitForFunction(() => document.querySelector('[data-ts-static-resource-recovery]'), null, { timeout: 25000 });
      assert.ok(blocked > 0, route.path + ': lazy module was not requested');
      const h1 = await page.locator('[data-ts-static-resource-recovery] main h1').first().textContent();
      assert.match(h1 || '', route.title, route.path);
      assert.equal(await page.locator('h1').filter({ hasText: 'Something went wrong' }).count(), 0);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      assert.equal(canonical, 'https://tinystepslearning.com' + route.path);
      console.log(route.path + ' preserved its article after ' + blocked + ' intentionally aborted chunk request(s)');
      await page.close();
    }
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }
});
