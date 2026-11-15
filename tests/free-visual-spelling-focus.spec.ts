import { expect, test } from '@playwright/test';

const puzzleUrl = '/free-spelling-game-for-kids?play=1&mode=puzzles';

for (const viewport of [
  { label: 'phone', width: 375, height: 812 },
  { label: 'desktop', width: 1366, height: 768 },
]) {
  test(`visual spelling is immersive, anonymous and responsive on ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(puzzleUrl, { waitUntil: 'domcontentloaded' });

    const game = page.getByRole('region', { name: 'Spelling Puzzle Lab' });
    await expect(game.getByRole('heading', { name: 'Spelling Puzzle Lab', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Choose a puzzle challenge' })).toBeVisible();
    await expect(page.getByText(/free for ages 8–10\+.*no login.*no sound/i)).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', 'https://tinystepslearning.com/free-spelling-game-for-kids',
    );

    // The parent-facing marketing/phonics information and global support
    // widgets are not mounted during the dedicated older-child game.
    await expect(page.getByRole('heading', { name: 'Free Spelling Game for Kids' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Parent Guidance' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Book Free 35-Minute Demo' })).toHaveCount(0);
    await expect(page.locator('footer')).toHaveCount(0);

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2,
    );
    expect(horizontalOverflow).toBe(false);

    await page.getByRole('button', { name: /Word Explorer/ }).click();
    await expect(page.getByRole('heading', { name: 'Build the correct word' })).toBeVisible();

    await page.getByRole('button', { name: 'Exit to Free Games' }).click();
    await expect(page).toHaveURL(/\/free-english-games-for-kids$/);
  });
}

test('classic spelling remains accessible from the same canonical page', async ({ page }) => {
  await page.goto('/free-spelling-game-for-kids?play=1', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Spelling Adventure' })).toBeVisible();
});


test('guest puzzle progress resets completely on refresh', async ({ page }) => {
  await page.goto(puzzleUrl, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Word Explorer/ }).click();
  await expect(page.getByRole('heading', { name: 'Build the correct word' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Choose a puzzle challenge' })).toBeVisible();
  await expect(page.getByText('Puzzle 1 of 8')).toHaveCount(0);
});

test('long advanced sorting word fits a compact 320px screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(puzzleUrl, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Word Architect/ }).click();
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole('button', { name: /need a hint/i }).click();
    await page.getByRole('button', { name: /show answer & learn/i }).click();
    await page.getByRole('button', { name: /next puzzle/i }).click();
  }
  const word = page.getByText('interdependence', { exact: true });
  await expect(word).toBeVisible();
  const bounds = await word.boundingBox();
  expect(bounds).toBeTruthy();
  expect(bounds!.x).toBeGreaterThanOrEqual(-1);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(321);
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > window.innerWidth + 2
  );
  expect(overflow).toBe(false);
});
