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
    await expect(page.getByRole('heading', { name: 'Everyday Words', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Build the Word', level: 3 })).toBeVisible();

    // In-level back stays inside the spelling game, not the unrelated
    // English Excellence Games directory, and preserves the puzzle URL.
    await page.getByRole('button', { name: 'All Spelling Levels' }).click();
    await expect(page.getByRole('heading', { name: 'Choose your spelling level' })).toBeVisible();
    await expect(page).toHaveURL(/\/free-spelling-game-for-kids\?play=1&mode=puzzles$/);

    // A separate, explicitly labelled exit is available only on the chooser.
    await page.getByRole('button', { name: 'Spelling Game Page' }).click();
    await expect(page).toHaveURL(/\/free-spelling-game-for-kids$/);
    await expect(page).not.toHaveURL(/\/free-english-games-for-kids$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByRole('heading', { name: 'Free Spelling Game for Kids', level: 1 })).toBeVisible();
  });
}

test('every puzzle level opens an appropriately different child-readable challenge', async ({ page }) => {
  await page.goto(puzzleUrl, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Choose your spelling level' })).toBeVisible();
  const cases = [
    { level: /everyday words/i, title: 'Everyday Words', heading: 'Build the Word', clue: 'A trip from one place to another.' },
    { level: /vowel spelling patterns/i, title: 'Vowel Spelling Patterns', heading: 'Build from Word Parts', clue: 'A coat worn to stay dry in the rain.' },
    { level: /patterns & endings/i, title: 'Patterns & Endings', heading: 'Sort by Word Ending', clue: 'Not paying enough attention or care.' },
    { level: /longer & compound words/i, title: 'Longer & Compound Words', heading: 'Build from Word Parts', clue: 'A tall flower with a large yellow head.' },
    { level: /syllable spelling/i, title: 'Syllable Spelling', heading: 'Build from Word Parts', clue: 'A meal eaten outdoors.' },
    { level: /plural & word changes/i, title: 'Plural & Word Changes', heading: 'Build from Word Parts', clue: 'Moved off the ground using your legs in the past.' },
    { level: /tricky spellings/i, title: 'Tricky Spellings', heading: 'Fill the Missing Letters', clue: 'Something that is needed or required.' },
    { level: /prefixes & word parts/i, title: 'Prefixes & Word Parts', heading: 'Build from Word Parts', clue: 'The feeling of not being happy.' },
    { level: /word roots & meanings/i, title: 'Word Roots & Meanings', heading: 'Build from Word Parts', clue: 'A device used to talk to someone far away.' },
    { level: /long word challenge/i, title: 'Long Word Challenge', heading: 'Build from Word Parts', clue: 'Involving two or more countries.' },
  ];
  for (const item of cases) {
    await page.getByRole('button', { name: item.level }).click();
    await expect(page.getByRole('heading', { name: item.title, level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: item.heading, level: 3 })).toBeVisible();
    await expect(page.getByText('Now playing: ' + item.title)).toBeVisible();
    await expect(page.getByText(item.clue)).toBeVisible();
    await page.getByRole('button', { name: 'All Spelling Levels' }).click();
    await expect(page.getByRole('heading', { name: 'Choose your spelling level' })).toBeVisible();
  }
});

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
  // A compact game may fit the entire 667px viewport. Do not require
  // artificial scrolling when there is nothing below the fold; when content
  // does overflow, verify it uses ordinary document scrolling.
  expect(await page.evaluate(() => document.querySelector('[data-testid="public-spelling-adventure"]')?.getBoundingClientRect().top)).toBeGreaterThanOrEqual(-1);
  const scrollRoom = await page.evaluate(() => Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
  ) - window.innerHeight);
  if (scrollRoom > 100) {
    await page.evaluate(() => window.scrollTo(0, 360));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  } else {
    await expect(page.getByRole('button', { name: /letter c/i })).toBeInViewport();
  }
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
  await expect(page.getByRole('heading', { name: 'Everyday Words', level: 2 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Build the Word', level: 3 })).toBeVisible();
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


test('expanded visual spelling remains usable from 320px phones to wide desktop', async ({ page }) => {
  const screens = [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
  ];
  for (const screen of screens) {
    await page.setViewportSize(screen);
    await page.goto(puzzleUrl, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Everyday Words/ }).click();
    await expect(page.getByRole('heading', { name: 'Everyday Words', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Build the Word', level: 3 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check spelling' })).toBeAttached();
    const { scrollWidth, viewportWidth } = await page.evaluate(() => ({
      scrollWidth: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
      viewportWidth: window.innerWidth,
    }));
    expect(scrollWidth, 'visual overflow at ' + screen.width + 'x' + screen.height)
      .toBeLessThanOrEqual(viewportWidth + 2);
    const check = page.getByRole('button', { name: 'Check spelling' });
    await check.scrollIntoViewIfNeeded();
    await expect(check).toBeVisible();
    // Small phones may scroll naturally; never clip or hide the primary action.
    if (screen.width >= 1024) {
      await page.evaluate(() => window.scrollTo(0, 0));
      const bounds = await check.boundingBox();
      expect(bounds!.y + bounds!.height, 'gameplay height at ' + screen.width + 'x' + screen.height)
        .toBeLessThanOrEqual(screen.height + 16);
    }
  }
});

test('classic spelling tabs wrap and meaningless decorative clue icons are omitted', async ({ page }) => {
  for (const screen of [
    { width: 320, height: 568 }, { width: 375, height: 667 },
    { width: 768, height: 1024 }, { width: 1024, height: 768 },
    { width: 1366, height: 768 },
  ]) {
    await page.setViewportSize(screen);
    await page.goto('/free-spelling-game-for-kids?play=1', { waitUntil: 'domcontentloaded' });
    const game = page.getByTestId('public-spelling-adventure');
    await expect(game).toBeVisible();
    await expect(game.getByRole('tab')).toHaveCount(6);
    const width = await page.evaluate(() => Math.max(
      document.body.scrollWidth, document.documentElement.scrollWidth,
    ));
    expect(width, 'classic overflow at ' + screen.width + 'x' + screen.height)
      .toBeLessThanOrEqual(screen.width + 2);
    await game.getByRole('tab', { name: /Go to Fix a Spelling Mistake/ }).click();
    await expect(game.getByRole('heading', { name: 'Fix a Spelling Mistake' })).toBeVisible();
    await expect(game.locator('[aria-label="friend"]')).toHaveCount(0);
    await expect(game.getByRole('textbox', { name: 'Correct spelling' })).toBeVisible();
  }
});

test('two-letter warm-up remains optional, compact and separate from classic 6-step spelling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/free-spelling-game-for-kids?play=1', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Build a Word' })).toBeVisible();
  await page.getByRole('button', { name: 'Try two-letter words' }).click();
  await expect(page.getByRole('heading', { name: 'Two-Letter Words' })).toBeVisible();
  await expect(page.getByText('I ___ happy to be here.')).toBeVisible();
  await expect(page.getByText('0/6 completed this round')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)).toBe(false);
  await page.getByRole('button', { name: 'Letter a' }).click();
  await page.getByRole('button', { name: 'Letter m' }).click();
  await expect(page.getByText('Correct: am')).toBeVisible();
  await expect(page.getByText('She ate ___ apple.')).toBeVisible();
  await page.getByRole('tab', { name: 'Go to Word Families' }).click();
  await expect(page.getByRole('heading', { name: 'Word Families' })).toBeVisible();
  await expect(page.getByText(/0\/30 completed this round/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Build a Word' })).toBeVisible();
  await expect(page.getByText('A small pet that says meow.')).toBeVisible();
});

test('tablet touch: puzzles are operable without mouse drag and do not clip at iPad size', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 820, height: 1180 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  try {
    const page = await context.newPage();
    await page.goto(puzzleUrl, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Longer & Compound Words/ }).tap();
    await expect(page.getByRole('heading', { name: 'Build from Word Parts' })).toBeVisible();
    // Tap-based placement is a complete alternative to desktop drag-and-drop.
    await page.getByRole('button', { name: /Add tile sun, position/ }).tap();
    await page.getByRole('button', { name: /Add tile flower, position/ }).tap();
    await page.getByRole('button', { name: 'Check spelling' }).tap();
    await expect(page.getByText(/you got it: sunflower/i)).toBeVisible();
    const widths = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
    await page.getByRole('button', { name: /All Spelling Levels/ }).tap();
    await expect(page.getByRole('heading', { name: 'Choose your spelling level' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('1366px laptop shows correct feedback and Next puzzle without a second screen', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(puzzleUrl, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Everyday Words/ }).click();
  for (const letter of ['j', 'o', 'u', 'r', 'n', 'e', 'y']) {
    await page.getByRole('button', { name: new RegExp('Add tile ' + letter + ', position') }).click();
  }
  await page.getByRole('button', { name: 'Check spelling' }).click();
  const next = page.getByRole('button', { name: 'Next puzzle' });
  await expect(next).toBeVisible();
  const bounds = await next.boundingBox();
  expect(bounds).toBeTruthy();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height, 'Next puzzle must fit 1366x768 without another full screen')
    .toBeLessThanOrEqual(768 + 8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)).toBe(false);
});

test('meaning-only clues do not show a generic cloud or other unrelated icon', async ({ page }) => {
  await page.goto('/free-spelling-game-for-kids?play=1', { waitUntil: 'domcontentloaded' });
  const game = page.getByTestId('public-spelling-adventure');
  await game.getByRole('tab', { name: 'Go to Fix a Spelling Mistake' }).click();
  await expect(page.getByText('A person you like and enjoy spending time with.')).toBeVisible();
  await expect(page.getByText('Meaning clue')).toBeVisible();
  await expect(game.locator('img')).toHaveCount(0);
  await expect(game.getByRole('textbox', { name: 'Correct spelling' })).toBeVisible();
});
