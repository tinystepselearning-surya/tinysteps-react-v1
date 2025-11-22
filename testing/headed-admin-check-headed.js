import fs from 'fs';
import path from 'path';
import { webkit, chromium } from 'playwright';

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:5173';
  const loginUrl = `${base}/surya/login`;
  const screenshotPath = path.resolve(process.cwd(), 'testing', 'admin-users-headed.png');
  const consoleLogPath = path.resolve(process.cwd(), 'testing', 'admin-console-headed.log');

  if (!fs.existsSync(path.dirname(screenshotPath))) {
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  }

  let browser;
  try {
    // Launch a headed WebKit for live debugging on macOS
    browser = await webkit.launch({ headless: false, slowMo: 50 });
    console.log('Launched WebKit (headed)');
  } catch (e) {
    console.warn('WebKit headed launch failed, falling back to headed Chromium:', e?.message || e);
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
    const text = `[pageerror] ${err.message}`;
    logs.push(text);
    console.error(text);
  });

  try {
    console.log('Opening login page:', loginUrl);
    await page.goto(loginUrl, { waitUntil: 'networkidle' });

    const emailSelector = 'input[aria-label="email"]';
    const passwordSelector = 'input[aria-label="password"]';
    const emailExists = await page.$(emailSelector);
    if (emailExists) {
      await page.fill(emailSelector, 'admin@test.com');
      await page.fill(passwordSelector, 'password123');
    } else {
      await page.waitForSelector('input', { timeout: 8000 });
      const inputs = await page.$$('input');
      if (inputs.length >= 2) {
        await inputs[0].fill('admin@test.com');
        await inputs[1].fill('password123');
      } else {
        throw new Error('Could not find login input fields');
      }
    }

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => null),
    ]);

    // Wait for client to stabilize then navigate to admin root
    await page.waitForTimeout(2000);
    await page.goto(`${base}/surya`, { waitUntil: 'networkidle' });

    // Wait for Users heading or table; give more time in headed mode
    const usersHeading = await page.waitForSelector('text=Users', { timeout: 15000 }).catch(() => null);
    if (!usersHeading) {
      console.warn('Users heading not found; attempting to capture page anyway');
    }

    await page.waitForTimeout(2000);

    // Capture screenshot and logs
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Saved screenshot to', screenshotPath);

    fs.writeFileSync(consoleLogPath, logs.join('\n'), 'utf8');
    console.log('Saved console log to', consoleLogPath);

    const tablePresent = await page.$('table');
    const noUsers = await page.$('text=No users found');

    if (tablePresent) {
      console.log('Users table found on the admin page.');
    } else if (noUsers) {
      console.log('No users found message present.');
    } else {
      console.warn('Neither users table nor "No users found" message detected.');
    }

    console.log('Headed run complete — leave the browser open for manual inspection.');

  } catch (err) {
    console.error('Error during headed admin check:', err);
  } finally {
    // Intentionally do not close the browser automatically; give user time to inspect.
    // await browser.close();
  }
})();
