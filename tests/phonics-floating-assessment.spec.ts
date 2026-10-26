import { expect, test } from '@playwright/test';

for (const viewport of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`Phonics floating assessment opens the existing booking modal on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/phonics', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /online phonics classes for kids/i }).first()).toBeVisible();

    // The commercial enhancement reveals the floating CTA after meaningful scrolling.
    await page.evaluate(() => window.scrollTo(0, Math.max(900, window.innerHeight)));
    const floatingCta = page.locator('#ts-commercial-owner-cta');
    await expect(floatingCta).toHaveClass(/is-visible/, { timeout: 10000 });
    await floatingCta.getByRole('button', { name: 'Book free 35-minute assessment' }).click();

    await expect(page).toHaveURL(/\/phonics\?book=1(?:&|$)/);
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.locator('input#assessment-parent-name')).toBeVisible();

    // No real lead submission, WhatsApp message, or production Firestore write.
    await modal.getByRole('button', { name: 'Close assessment form' }).click();
    await expect(modal).toHaveCount(0);
  });
}
