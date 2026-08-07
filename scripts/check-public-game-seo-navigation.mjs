#!/usr/bin/env node
import { chromium } from 'playwright';

const origin = String(process.argv[2] || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const SITE_ORIGIN = 'https://tinystepslearning.com';
const INDEXABLE_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const PUBLIC_ROUTES = [
  '/free-letter-tracing-game-for-kids',
  '/free-sentence-building-games-for-kids',
  '/free-sentence-making-game-for-kids',
];

const readSeo = (page) => page.evaluate(() => ({
  path: window.location.pathname,
  title: document.title,
  robots: [...document.querySelectorAll('meta[name="robots"]')].map((node) => node.content),
  googlebot: [...document.querySelectorAll('meta[name="googlebot"]')].map((node) => node.content),
  canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map((node) => node.href),
  h1: document.querySelector('h1')?.textContent?.trim() || '',
}));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`${origin}/login`, { waitUntil: 'load' });
  await page.waitForFunction(() => /noindex/i.test(document.querySelector('meta[name="robots"]')?.content || ''));
  const privateSeo = await readSeo(page);
  assert(privateSeo.robots.length === 1 && /noindex/i.test(privateSeo.robots[0]), 'Login route must start noindex');

  for (const routePath of PUBLIC_ROUTES) {
    await page.evaluate((nextPath) => {
      window.history.pushState({}, '', nextPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, routePath);
    await page.waitForFunction(
      (nextPath) => window.location.pathname === nextPath && Boolean(document.querySelector('h1')),
      routePath,
    );
    await page.waitForTimeout(100);

    const seo = await readSeo(page);
    assert(seo.robots.length === 1, `${routePath}: expected one robots tag`);
    assert(seo.googlebot.length === 1, `${routePath}: expected one googlebot tag`);
    assert(seo.canonicals.length === 1, `${routePath}: expected one canonical tag`);
    assert(seo.robots[0] === INDEXABLE_ROBOTS, `${routePath}: unexpected robots ${seo.robots.join(' | ')}`);
    assert(seo.googlebot[0] === INDEXABLE_ROBOTS, `${routePath}: unexpected googlebot ${seo.googlebot.join(' | ')}`);
    assert(seo.canonicals[0] === `${SITE_ORIGIN}${routePath}`, `${routePath}: unexpected canonical ${seo.canonicals.join(' | ')}`);
    assert(Boolean(seo.title) && Boolean(seo.h1), `${routePath}: title and H1 are required`);
    console.log(`PASS ${routePath}: one indexable robots tag, one googlebot tag, one self-canonical`);
  }
} finally {
  await browser.close();
}
