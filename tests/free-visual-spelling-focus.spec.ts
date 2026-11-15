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
    await expect(page.getByRole('heading', { name: 'Choose your spelling level' })).toBeVisible();
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

    await page.getByRole('button', { name: /Everyday Words/ }).click();
    await expect(page.getByRole('heading', { name: 'Build the correct word' })).toBeVisible();

    // In-level back stays inside the spelling game, not the unrelated
    // English Excellence Games directory, and preserves the puzzle URL.
    await page.getByRole('button', { name: 'All Spelling Levels' }).click();
    await expect(page.getByRole('heading', { name: 'Choose your spelling level' })).toBeVisible();
    await expect(page).toHaveURL(/\/free-spelling-game-for-kids\?play=1&mode=puzzles$/);

    // A separate, explicitly labelled exit is available only on the chooser.
    await page.getByRole('button', { name: 'Spelling Game Page' }).click();
    await expect(page).toHaveURL(/\/free-spelling-game-for-kids$/);
    await expect(page).not.toHaveURL(/\/free-english-games-for-kids$/);
  });
}

test('one concise indexed spelling page presents exactly two distinct free games', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/free-spelling-game-for-kids', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Free Spelling Game for Kids', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose your spelling game' })).toBeVisible();
  await expect(page.getByRole('link', { name: /play spelling adventure/i })).toHaveAttribute(
    'href', '/free-spelling-game-for-kids?play=1'
  );
  await expect(page.getByRole('link', { name: /play spelling puzzle lab/i })).toHaveAttribute(
    'href', '/free-spelling-game-for-kids?play=1&mode=puzzles'
  );
  await expect(page.getByRole('link', { name: 'Play Free', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Ready for the next step?' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Parent FAQ' })).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href', 'https://tinystepslearning.com/free-spelling-game-for-kids'
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)).toBe(false);
});

test('classic spelling opens at a playable word and scrolls as a normal page on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/free-spelling-game-for-kids?play=1', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Spelling Adventure', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Build a Word', level: 2 })).toBeVisible();
  // Picture assets can fall back to the authored emoji; the meaning clue
  // and word-building challenge must work in either rendering.
  await expect(page.getByText('A small pet that says meow.')).toBeVisible();
  await expect(page.getByRole('button', { name: /letter c/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /start spelling adventure/i })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Parent FAQ' })).toHaveCount(0);
  await expect(page.locator('footer')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)).toBe(false);
  // An ordinary scroll moves the document; there is no fixed overlay or
  // separate embedded viewport trapping touch/wheel scrolling.
  expect(await page.evaluate(() => document.querySelector('[data-testid="public-spelling-adventure"]')?.getBoundingClientRect().top)).toBeGreaterThanOrEqual(-1);
  await page.evaluate(() => window.scrollTo(0, 360));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await page.getByRole('button', { name: /spelling games/i }).click();
  await expect(page).toHaveURL(/\/free-spelling-game-for-kids$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole('heading', { name: 'Free Spelling Game for Kids', level: 1 })).toBeVisible();
});

test('English Games directory has no duplicate standalone Puzzle Lab listing', async ({ page }) => {
  await page.goto('/free-english-games-for-kids', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Visual Spelling Puzzle Lab', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /play free spelling puzzles/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /play free spelling game for kids/i }).first()).toHaveAttribute(
    'href', '/free-spelling-game-for-kids'
  );
});


test('guest puzzle progress resets completely on refresh', async ({ page }) => {
  await page.goto(puzzleUrl, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Everyday Words/ }).click();
  await expect(page.getByRole('heading', { name: 'Build the correct word' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Choose your spelling level' })).toBeVisible();
  await expect(page.getByText('Puzzle 1 of 8')).toHaveCount(0);
});

test('long advanced sorting word fits a compact 320px screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(puzzleUrl, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Long Word Challenge/ }).click();
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
