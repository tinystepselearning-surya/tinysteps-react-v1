import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'compact phone', width: 320, height: 700 },
  { name: 'small phone', width: 375, height: 812 },
  { name: 'large phone', width: 430, height: 932 },
  { name: 'portrait tablet', width: 768, height: 1024 },
  { name: 'landscape tablet', width: 1024, height: 768 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'wide desktop', width: 1920, height: 1080 },
] as const;

for (const viewport of viewports) {
  test(`homepage premium gateway — ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('section[aria-labelledby="homepage-title"]');
    const pathways = page.locator('#learning-pathways');
    const heading = page.getByRole('heading', { level: 1, name: /Online English Classes for Kids/i });

    await expect(heading).toBeVisible();
    await expect(hero.getByRole('link', { name: 'Book Free 35-Minute Demo' })).toBeVisible();
    await expect(hero.getByRole('link', { name: /Explore our learning pathways/i })).toBeVisible();
    await expect(pathways.getByRole('heading', { level: 2, name: /From Letter Sounds to Confident Communication/i })).toBeVisible();

    for (const href of [
      '/phonics',
      '/reading-classes-for-kids',
      '/grammar',
      '/spoken-english-classes-for-kids-online',
      '/speaking',
    ]) {
      await expect(hero.locator(`a[href="${href}"]`)).toHaveCount(1);
    }

    const intro = pathways.locator('p', { hasText: 'The complete English-learning journey' });
    await expect(intro).toBeVisible();
    await expect(intro).toHaveCSS('color', 'rgb(255, 122, 0)');
    await expect(intro).toHaveCSS('background-color', 'rgb(16, 42, 67)');

    await expect(pathways.locator('a[href="/phonics"]')).toBeVisible();
    await expect(pathways.locator('a[href="/reading-classes-for-kids"]')).toBeVisible();
    await expect(pathways.locator('a[href="/grammar"]')).toBeVisible();
    await expect(pathways.locator('a[href="/speaking"]')).toBeVisible();

    const expectedCards = [
      ['Phonics', '/phonics'],
      ['Reading', '/reading-classes-for-kids'],
      ['Grammar', '/grammar'],
      ['Public Speaking', '/speaking'],
    ] as const;
    for (const [label, href] of expectedCards) {
      const card = pathways.locator(`a[href="${href}"]`);
      await expect(card).toHaveAttribute('aria-label', `Explore ${label} online classes for kids`);
      await expect(card.getByRole('heading', { name: label })).toBeVisible();
      await expect(card).toContainText('Explore');
    }
    await expect(pathways.locator('a[aria-label^="Explore "]')).toHaveCount(4);

    const programmePanel = pathways.locator('div.grid.gap-px');
    await expect(programmePanel).toBeVisible();
    await expect(programmePanel).toHaveCSS('gap', '1px');
    await expect(programmePanel.locator('a[aria-label^="Explore "]')).toHaveCount(4);
    await expect(programmePanel.locator('a span.rounded-full')).toHaveCount(0);

    const measures = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      bodyWidth: document.body.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      headingWidth: document.querySelector('#homepage-title')?.getBoundingClientRect().width ?? 0,
    }));
    expect(measures.headingWidth).toBeGreaterThan(0);
    expect(measures.bodyWidth, 'homepage body should not scroll horizontally').toBeLessThanOrEqual(measures.viewportWidth + 1);
    expect(measures.documentWidth, 'homepage document should not scroll horizontally').toBeLessThanOrEqual(measures.viewportWidth + 1);

    const image = hero.locator('img[src="/blog/hero-families/Tiny_Steps_Speaking.webp"]');
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);

    await hero.getByRole('link', { name: /Explore our learning pathways/i }).click();
    await expect(page).toHaveURL(/#learning-pathways$/);
    await expect(pathways).toBeInViewport();
  });
}


test('premium pathway cards honour reduced-motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1366, height: 850 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const card = page.locator('#learning-pathways a[href="/phonics"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  await card.hover();
  const transform = await card.evaluate(element => getComputedStyle(element).transform);
  expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
  await card.focus();
  await expect(card).toBeFocused();
});


test('premium cards use restrained hover and visible keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 850 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const panel = page.locator('#learning-pathways div.grid.gap-px');
  const card = panel.locator('a[href="/grammar"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  await expect(card).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await card.hover();
  await expect(card).toHaveCSS('background-color', 'rgb(250, 251, 253)');
  await expect(card.getByText('Explore', { exact: true })).toHaveCSS('border-bottom-color', 'rgb(255, 122, 0)');
  await card.focus();
  await expect(card).toBeFocused();
  await expect(card.getByText('Explore', { exact: true })).toHaveCSS('border-bottom-color', 'rgb(255, 122, 0)');
});
