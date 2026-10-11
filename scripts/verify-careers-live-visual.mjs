import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const URL = 'https://tinystepslearning.com/careers';
const OUT = path.resolve('artifacts/careers-production-visual-check');
await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const device of [
    { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false },
    { name: 'mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true },
  ]) {
    const page = await browser.newPage({
      viewport: device.viewport,
      deviceScaleFactor: device.deviceScaleFactor,
      isMobile: device.isMobile,
      hasTouch: device.isMobile,
    });
    const response = await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    if (!response || response.status() !== 200) throw new Error(device.name + ': Careers returned HTTP ' + (response?.status() ?? 'no response'));
    await page.getByRole('heading', { level: 1, name: /Teacher Recruitment Closed/i }).waitFor({ timeout: 30_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    const body = await page.locator('body').innerText();
    if (!body.includes('All online English teaching positions for this recruitment cycle have been filled.')) {
      throw new Error(device.name + ': closed status is not in the rendered body');
    }
    if (!body.includes('11 October 2026')) throw new Error(device.name + ': closing date not shown');
    if (await page.locator('form').filter({ hasText: /teaching experience|teaching profile|your full name/i }).count()) {
      throw new Error(device.name + ': closed teacher form is still visible');
    }
    const jsonld = await page.locator('script[type="application/ld+json"]').allTextContents();
    if (jsonld.some(text => /"@type"\s*:\s*"JobPosting"/i.test(text))) {
      throw new Error(device.name + ': active JobPosting schema still present');
    }
    const screenshot = path.join(OUT, 'careers-' + device.name + '.png');
    await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
    results.push({
      device: device.name,
      url: page.url(),
      status: response.status(),
      title: await page.title(),
      h1: await page.locator('h1').first().innerText(),
      screenshot: path.basename(screenshot),
      closedDatePresent: true,
      publicTeacherApplicationFormPresent: false,
      jobPostingSchemaPresent: false,
      checkedAt: new Date().toISOString(),
    });
    await page.close();
  }
} finally {
  await browser.close();
}
await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
