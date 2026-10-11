import {defineConfig} from '@playwright/test';

/** Only for demo-project Firebase Emulator business browser acceptance.
 * The application's regular Playwright config/production credentials are unused.
 */
export default defineConfig({
  testDir: 'tests/stage2',
  testMatch: '**/*.spec.ts',
  timeout: 75_000,
  expect: {timeout: 15_000},
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
    timezoneId: 'Asia/Kolkata',
    viewport: {width: 1366, height: 850},
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173/teacher/login',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
