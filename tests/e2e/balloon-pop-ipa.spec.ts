import { test, expect } from '@playwright/test';

// Stub speechSynthesis before any scripts run, so the app sees it as available
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.speechSynthesis = {
      _voices: [{ lang: 'en-US', name: 'English (US)' }],
      getVoices() { return this._voices; },
      speak: () => {},
      cancel: () => {},
      onvoiceschanged: null,
    } as any;
  });
  // Force-miss any phoneme audio files so UI uses TTS path
  await page.route('**/audio/phonemes/**', (route) => route.abort());
});

test('Balloon Pop IPA — smoke: running, balloon spawn, TTS Listen, no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore network abort noise from our forced audio misses
      if (/Failed to load resource/i.test(text)) return;
      errors.push(`[console.${msg.type()}] ${text}`);
    }
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${String(err)}`));

  // Go to the Balloon Pop IPA route
  await page.goto('/games/balloon-pop-ipa');

  // The page should render the playfield and spawn at least one balloon quickly
  const playfield = page.locator('[data-test="playfield"]');
  await expect(playfield).toBeVisible();

  // Wait for at least one balloon to appear (should be within ~1s after start); allow up to 3s buffer
  const balloon = page.locator('[data-test="balloon"]').first();
  await expect(balloon).toBeVisible({ timeout: 3000 });

  // Find the Listen button — should be the one with text containing "Listen"
  const listenBtn = page.locator('button:has-text("Listen")');
  await expect(listenBtn).toBeVisible();
  await expect(listenBtn).toHaveText(/🦉\s*Listen/);

  // Text should reflect TTS path (🦉 Listen) since files are likely missing in test
  // If file audio exists, it may show 🔊 Listen — accept either, but prefer TTS presence
  const btnText = await listenBtn.textContent();
  expect(btnText?.includes('🦉')).toBeTruthy();

  // Click Listen and ensure no console errors are emitted as a result
  await listenBtn.click();

  // Let the game run for ~12s and ensure no console errors occur
  await page.waitForTimeout(12_000);
  expect(errors, `No console errors expected, got:\n${errors.join('\n')}`).toHaveLength(0);
});
