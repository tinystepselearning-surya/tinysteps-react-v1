import fs from 'fs';
import path from 'path';
import { webkit, chromium } from 'playwright';

(async () => {
  const base = 'http://localhost:5173';
  const loginUrl = `${base}/surya/login`;
  const screenshotPath = path.resolve(process.cwd(), 'testing', 'admin-users.png');
  const consoleLogPath = path.resolve(process.cwd(), 'testing', 'admin-console.log');

  if (!fs.existsSync(path.dirname(screenshotPath))) {
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  }

  let browser;
  try {
    // Prefer WebKit on macOS for better compatibility in some environments
    browser = await webkit.launch({ headless: true });
    console.log('Launched WebKit');
  } catch (e) {
    console.warn('WebKit launch failed, falling back to Chromium:', e?.message || e);
    browser = await chromium.launch({ headless: true });
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', (msg) => {
    const text = `[console.${msg.type()}] ${msg.text()}`;
    logs.push(text);
    console.log(text);
  });
  page.on('pageerror', (err) => {
    const text = `[pageerror] ${err.message}`;
    logs.push(text);
    console.error(text);
  });

  try {
    console.log('Opening login page:', loginUrl);
    await page.goto(loginUrl, { waitUntil: 'networkidle' });

    // Try to fill login form. Prefer aria-labeled inputs, fall back to first two inputs on the page.
    const emailSelector = 'input[aria-label="email"]';
    const passwordSelector = 'input[aria-label="password"]';
    const emailExists = await page.$(emailSelector);
    if (emailExists) {
      await page.fill(emailSelector, 'admin@test.com');
      await page.fill(passwordSelector, 'password123');
    } else {
      // Wait for any input and use the first two inputs
      await page.waitForSelector('input', { timeout: 8000 });
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
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => null),
    ]);

    // Give time for client to load admin page
    await page.waitForTimeout(1500);

    // Navigate explicitly to admin page in case redirect differs
    await page.goto(`${base}/surya`, { waitUntil: 'networkidle' });

    // Wait for Users heading or table to appear
    const usersHeading = await page.waitForSelector('text=Users', { timeout: 8000 }).catch(() => null);
    if (!usersHeading) {
      console.warn('Users heading not found; attempting to capture page anyway');
    }

    // Wait a bit for data to populate
    await page.waitForTimeout(1500);

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
    console.error('Error during headless admin check:', err);
  } finally {
    await browser.close();
  }
})();
