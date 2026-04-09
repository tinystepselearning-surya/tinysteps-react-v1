#!/usr/bin/env node
import { chromium } from 'playwright';

const HOST = 'http://127.0.0.1:5173';
const PATHS = [
  'parents',
  'parents/getting-started',
  'parents/phonics-mission',
  'parents/common-mistakes',
];

async function check() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const path of PATHS) {
    const url = `${HOST}/${path}`;
    console.log('\n---- Visiting', url, '----');
    await page.goto(url, { waitUntil: 'load' });

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
}

check().catch((err) => {
  console.error(err);
  process.exit(1);
});
