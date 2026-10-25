import { expect, test } from '@playwright/test';

// The homepage is a navigation gateway: verify the five owner routes retain
// a readable primary heading and do not introduce horizontal overflow.
const programmes = [
  { label: 'phonics', path: '/phonics' },
  { label: 'reading', path: '/reading-classes-for-kids' },
  { label: 'grammar', path: '/grammar' },
  { label: 'spoken English', path: '/spoken-english-classes-for-kids-online' },
  { label: 'public speaking', path: '/speaking' },
] as const;

for (const programme of programmes) {
  test(`homepage ${programme.label} link reaches its specialist page`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const hero = page.locator('section[aria-labelledby="homepage-title"]');
    const link = hero.locator(`a[href="${programme.path}"]`);
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${programme.path.replaceAll('/', '\\/')}/?$`));
    const title = page.locator('main h1').first();
    await expect(title).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
  });
}

test('homepage primary booking CTA opens existing assessment modal without leaving the page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('section[aria-labelledby="homepage-title"] a[href="/book-demo"]').click();
  await expect(page).toHaveURL(/\?book=1(?:&|$)/);
  await expect(page.locator('input#assessment-parent-name')).toBeVisible();
  // No submission here: a live lead must not be created by smoke tests.
});
