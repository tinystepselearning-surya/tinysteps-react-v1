#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';

const DIST = path.resolve(process.cwd(), 'dist');
const PORT = process.env.PRERENDER_PORT ? Number(process.env.PRERENDER_PORT) : 4173;
const HOST = `http://127.0.0.1:${PORT}`;
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
  const args = ['preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'];
  console.log('Starting vite preview:', bin, args.join(' '));
  const proc = spawn(bin, args, {
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: process.platform === 'win32',
  });
  return proc;
}

async function waitForServer(url, timeout = 45000) {
  const start = Date.now();
  const alt = url.replace('127.0.0.1', 'localhost');
  let attempt = 0;
  const maxAttempts = Math.ceil(timeout / 500);
  while (Date.now() - start < timeout) {
    attempt++;
    for (const u of [url, alt]) {
      try {
        const res = await fetch(u, { method: 'GET' });
        if (res && (res.status === 200 || res.status === 204 || res.status === 301 || res.status === 302)) {
          console.log('Server responded at', u);
          return true;
        }
      } catch (e) {
        // ignore
      }
    }
    // back off a little after a few attempts
    await new Promise((r) => setTimeout(r, attempt > 6 ? 1000 : 500));
  }
  throw new Error('Server did not start in time: ' + url + ' (waited ' + timeout + 'ms)');
}

async function prerender() {
  const proc = startPreview();
  try {
    const baseUrl = HOST + '/';
    console.log('Waiting for server at', baseUrl);
    await waitForServer(baseUrl, 45000);

    let browser;
    try {
      browser = await chromium.launch();
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
    } catch (launchErr) {
      // Log full error stack for debugging and hint how to fix in CI
      console.error('Prerender failed with error:');
      console.error(launchErr && launchErr.stack ? launchErr.stack : launchErr);
      console.error("Tip: run `npx playwright install --with-deps chromium` in CI to ensure Playwright browsers are available.");
      throw launchErr;
    }
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
