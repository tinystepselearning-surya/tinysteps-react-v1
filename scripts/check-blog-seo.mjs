#!/usr/bin/env node
import { spawn } from 'child_process';
import { chromium } from 'playwright';

const HOST = 'http://127.0.0.1:5173';
const PORT = 5173;
const SLUGS = [
  'week-1-phonics-satpin-launch',
  'online-english-classes-for-kids-india',
  'best-phonics-classes-for-kids',
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

    for (const slug of SLUGS) {
      const url = `${HOST}/blog/${slug}`;
      console.log('\n---- Visiting', url, '----');
      await page.goto(url, { waitUntil: 'load' });

      const title = await page.title();
      const description = await page.locator('meta[name="description"]').first().getAttribute('content');
      const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
      const ogType = await page.locator('meta[property="og:type"]').first().getAttribute('content');
      const jsonLd = await page.locator('script[type="application/ld+json"][data-ts-seo="1"]').first().textContent();

      console.log('title:', title);
      console.log('description:', description);
      console.log('canonical:', canonical);
      console.log('og:type:', ogType);
      console.log('jsonLd (trimmed):', jsonLd ? jsonLd.slice(0, 400).replace(/\n/g, ' ') + (jsonLd.length > 400 ? '…' : '') : 'NONE');
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
