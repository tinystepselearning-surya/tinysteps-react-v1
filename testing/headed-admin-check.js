import fs from 'fs';
import path from 'path';
import { webkit, chromium } from 'playwright';

(async () => {
  const port = process.env.DEV_PORT || process.env.VITE_PORT || '5173';
  const base = `http://localhost:${port}`;
  const loginUrl = `${base}/surya/login`;
  const screenshotPath = path.resolve(process.cwd(), 'testing', 'admin-users-headed.png');
  const consoleLogPath = path.resolve(process.cwd(), 'testing', 'admin-console-headed.log');

  if (!fs.existsSync(path.dirname(screenshotPath))) {
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  }

  let browser;
  try {
    // Prefer WebKit on macOS; launch in headed mode for live debugging
    browser = await webkit.launch({ headless: false, slowMo: 50 });
    console.log('Launched WebKit (headed)');
  } catch (e) {
    console.warn('WebKit launch failed, falling back to Chromium (headed):', e?.message || e);
    browser = await chromium.launch({ headless: false, slowMo: 50 });
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const logs = [];
  page.on('console', (msg) => {
    const text = `[console.${msg.type()}] ${msg.text()}`;
    logs.push(text);
    console.log(text);
  });
  page.on('pageerror', (err) => {
    const text = `[pageerror] ${err && err.message ? err.message : err}`;
    logs.push(text);
    console.error(text);
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure() ? request.failure().errorText : 'unknown';
    const text = `[requestfailed] ${request.method()} ${request.url()} -> ${failure}`;
    logs.push(text);
    console.error(text);
  });

  try {
    console.log('Opening login page:', loginUrl);
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Try to fill login form. Prefer aria-labeled inputs, fall back to first two inputs on the page.
    const emailSelector = 'input[aria-label="email"]';
    const passwordSelector = 'input[aria-label="password"]';
    const emailExists = await page.$(emailSelector);
    if (emailExists) {
      await page.fill(emailSelector, 'admin@test.com');
      await page.fill(passwordSelector, 'password123');
    } else {
      // Wait for any input and use the first two inputs
      await page.waitForSelector('input', { timeout: 15000 });
      const inputs = await page.$$('input');
      if (inputs.length >= 2) {
        await inputs[0].fill('admin@test.com');
        await inputs[1].fill('password123');
      } else {
        throw new Error('Could not find login input fields');
      }
    }

    // Submit
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => null),
    ]);

    // Give time for client to load admin page
    await page.waitForTimeout(1500);

    // Navigate explicitly to admin page in case redirect differs
    await page.goto(`${base}/surya`, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for Users heading or table to appear
    const usersHeading = await page.waitForSelector('text=Users', { timeout: 15000 }).catch(() => null);
    if (!usersHeading) {
      console.warn('Users heading not found; attempting to capture page anyway');
    }

    // Wait a bit for data to populate
    await page.waitForTimeout(2500);

    // Capture screenshot
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Saved screenshot to', screenshotPath);

    // Save console logs
    fs.writeFileSync(consoleLogPath, logs.join('\n'), 'utf8');
    console.log('Saved console log to', consoleLogPath);

    // Check for a table or "No users found" message
    const tablePresent = await page.$('table');
    const noUsers = await page.$('text=No users found');

    if (tablePresent) {
      console.log('Users table found on the admin page.');
    } else if (noUsers) {
      console.log('No users found message present.');
    } else {
      console.warn('Neither users table nor "No users found" message detected.');
    }

  } catch (err) {
    console.error('Error during headed admin check:', err);
    // ensure logs are written even on error
    try { fs.writeFileSync(consoleLogPath, logs.join('\n'), 'utf8'); } catch (e) { /* ignore */ }
  } finally {
    // keep browser open briefly so you can inspect it, then close
    console.log('Test finished — keeping browser open for 10s for inspection');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();
