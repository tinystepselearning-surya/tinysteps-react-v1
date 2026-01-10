#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';

const DIST = path.resolve(process.cwd(), 'dist');
const HOST = 'http://127.0.0.1:5173';
const PORT = 5173;
const ROUTES = [
  '/',
  '/courses',
  '/curriculum',
  '/blog',
  '/faq',
  // Parents hub + help pages
  '/parents',
  '/parents/getting-started',
  '/parents/choosing-course',
  '/parents/scheduling',
  '/parents/payments',
  '/parents/tracking-progress',
  '/parents/helping-with-homework',
  '/parents/phonics-mission',
  '/parents/reading-at-home',
  '/parents/speech-confidence',
  '/parents/common-mistakes',
];

function startPreview() {
  const bin = path.resolve(process.cwd(), 'node_modules', '.bin', 'vite');
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

async function prerender() {
  const proc = startPreview();
  try {
    await waitForServer(HOST + '/');

    const browser = await chromium.launch();
    const page = await browser.newPage();

    for (const route of ROUTES) {
      const url = `${HOST}${route}`;
      console.log('Prerendering', url);
      await page.goto(url, { waitUntil: 'networkidle' });
      const html = await page.content();

      if (route === '/') {
        await fs.writeFile(path.join(DIST, 'index.html'), html, 'utf8');
        console.log('Wrote', path.join(DIST, 'index.html'));
      } else {
        const outDir = path.join(DIST, route.replace(/^\//, ''));
        await fs.mkdir(outDir, { recursive: true });
        const outFile = path.join(outDir, 'index.html');
        await fs.writeFile(outFile, html, 'utf8');
        console.log('Wrote', outFile);
      }
    }

    await browser.close();
  } finally {
    try {
      proc.kill();
    } catch (e) {
      // ignore
    }
  }
}

prerender().catch((err) => {
  console.error(err);
  process.exit(1);
});
