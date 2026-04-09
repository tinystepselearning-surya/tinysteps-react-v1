#!/usr/bin/env node
import { spawn } from 'child_process';
import { chromium } from 'playwright';

const HOST = 'http://127.0.0.1:5173';
const PORT = 5173;
const PATHS = [
  'parents',
  'parents/getting-started',
  'parents/phonics-mission',
  'parents/common-mistakes',
];

function startPreview() {
  const bin = new URL('../node_modules/.bin/vite', import.meta.url).pathname;
  const proc = spawn(bin, ['preview', '--port', String(PORT), '--strictPort'], {
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: process.platform === 'win32',
  });
  return proc;
}

async function waitForServer(url, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return true;
    } catch (e) {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Server did not start in time: ' + url);
}

async function check() {
  const proc = startPreview();
  try {
    await waitForServer(HOST + '/');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    for (const path of PATHS) {
      const url = `${HOST}/`;
      console.log('\n---- Navigating client-side to', '/' + path, '----');
      await page.goto(url, { waitUntil: 'load' });

      // Use history API to navigate client-side so SPA router handles the route
      await page.evaluate((p) => {
        history.pushState({}, '', '/' + p);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, path);

      // Allow time for client-side rendering and applySeo to run
      await page.waitForTimeout(500);

      const title = await page.title();
      const description = await page.evaluate(() => {
        const m = document.querySelector('meta[name="description"]');
        return m ? m.getAttribute('content') : null;
      });
      const canonical = await page.evaluate(() => {
        const l = document.querySelector('link[rel="canonical"]');
        return l ? l.getAttribute('href') : null;
      });
      const ogTitle = await page.evaluate(() => {
        const m = document.querySelector('meta[property="og:title"]');
        return m ? m.getAttribute('content') : null;
      });
      const ogDesc = await page.evaluate(() => {
        const m = document.querySelector('meta[property="og:description"]');
        return m ? m.getAttribute('content') : null;
      });

      console.log('title:', title);
      console.log('description:', description);
      console.log('canonical:', canonical);
      console.log('og:title:', ogTitle);
      console.log('og:description:', ogDesc);
    }

    await browser.close();
  } finally {
    try { proc.kill(); } catch (e) {}
  }
}

check().catch((err) => {
  console.error(err);
  process.exit(1);
});
