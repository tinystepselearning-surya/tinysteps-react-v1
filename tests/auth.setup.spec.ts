import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

type RoleConfig = {
  name: string;
  loginPath: string;
  emailEnv: string;
  passEnv: string;
  outFile: string;
};

const roles: RoleConfig[] = [
  { name: 'admin', loginPath: '/surya/login', emailEnv: 'PW_ADMIN_EMAIL', passEnv: 'PW_ADMIN_PASS', outFile: '.auth/admin.json' },
  { name: 'teacher', loginPath: '/teacher/login', emailEnv: 'PW_TEACHER_EMAIL', passEnv: 'PW_TEACHER_PASS', outFile: '.auth/teacher.json' },
  { name: 'parent', loginPath: '/parent/login', emailEnv: 'PW_PARENT_EMAIL', passEnv: 'PW_PARENT_PASS', outFile: '.auth/parent.json' },
  { name: 'lp', loginPath: '/learning-partner/login', emailEnv: 'PW_LP_EMAIL', passEnv: 'PW_LP_PASS', outFile: '.auth/lp.json' },
];

// Ensure output directory exists
const authDir = path.resolve(process.cwd(), '.auth');
if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

async function loginAndSave(r: RoleConfig, browser: any) {
  const email = process.env[r.emailEnv];
  const pass = process.env[r.passEnv];
  if (!email || !pass) {
    throw new Error(`Missing env ${r.emailEnv} or ${r.passEnv}`);
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(r.loginPath, { waitUntil: 'domcontentloaded' });

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', pass);

    // Click sign in using role selector and wait for a URL that does not include /login
    // Use an exact-case-insensitive match so we don't hit the Google sign-in button.
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 60000 }).catch(() => {});

    const outPath = path.resolve(process.cwd(), r.outFile);
    await context.storageState({ path: outPath });
    console.log(`Saved ${r.name} storageState -> ${r.outFile}`);
  } finally {
    await context.close();
  }
}

// Set per-test timeout to 2 minutes
test.setTimeout(2 * 60 * 1000);

test('admin: save storageState', async ({ browser }, testInfo) => {
  const r = roles.find((x) => x.name === 'admin')!;
  const email = process.env[r.emailEnv];
  const pass = process.env[r.passEnv];
  test.skip(!email || !pass, `Skipping admin: missing ${r.emailEnv} or ${r.passEnv}`);
  await loginAndSave(r, browser);
});

test('teacher: save storageState', async ({ browser }, testInfo) => {
  const r = roles.find((x) => x.name === 'teacher')!;
  const email = process.env[r.emailEnv];
  const pass = process.env[r.passEnv];
  test.skip(!email || !pass, `Skipping teacher: missing ${r.emailEnv} or ${r.passEnv}`);
  await loginAndSave(r, browser);
});

test('parent: save storageState', async ({ browser }, testInfo) => {
  const r = roles.find((x) => x.name === 'parent')!;
  const email = process.env[r.emailEnv];
  const pass = process.env[r.passEnv];
  test.skip(!email || !pass, `Skipping parent: missing ${r.emailEnv} or ${r.passEnv}`);
  await loginAndSave(r, browser);
});

test('lp: save storageState', async ({ browser }, testInfo) => {
  const r = roles.find((x) => x.name === 'lp')!;
  const email = process.env[r.emailEnv];
  const pass = process.env[r.passEnv];
  test.skip(!email || !pass, `Skipping lp: missing ${r.emailEnv} or ${r.passEnv}`);
  await loginAndSave(r, browser);
});
