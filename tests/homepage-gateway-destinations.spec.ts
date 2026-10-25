import { expect, test } from '@playwright/test';

// Follow each crawlable homepage subject link to its specialist owner page.
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

    await expect.poll(() => new URL(page.url()).pathname).toBe(programme.path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      bodyWidth: document.body.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  });
}

test('homepage demo CTA opens the existing assessment modal without submitting a lead', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('section[aria-labelledby="homepage-title"] a[href="/book-demo"]').click();

  await expect(page).toHaveURL(/\?book=1(?:&|$)/);
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await expect(modal.locator('input#assessment-parent-name')).toBeVisible();

  // Do not submit the form, open WhatsApp, or create real leads in automated tests.
});
