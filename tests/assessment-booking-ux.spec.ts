import { expect, test } from '@playwright/test';

// No form is submitted: these are visibility and navigation checks only.
test('homepage booking modal owns the screen and restores support after close', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 850 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Support loads after the intentional idle delay on public pages.
  const supportDock = page.locator('[data-floating-assistant="1"]');
  await expect(supportDock).toBeVisible({ timeout: 35000 });

  await page.evaluate(() => {
    window.dispatchEvent(new Event('tinysteps:open-assessment'));
  });

  const assessmentDialog = page.getByRole('dialog', { name: 'Book an assessment' });
  await expect(assessmentDialog).toBeVisible();
  await expect(assessmentDialog.getByRole('heading', { name: /Book your free assessment/i })).toBeVisible();
  await expect(supportDock).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ask TinySteps AI' })).toHaveCount(0);

  await assessmentDialog.getByRole('button', { name: 'Close assessment form' }).click();
  await expect(assessmentDialog).toHaveCount(0);
  await expect(supportDock).toBeVisible({ timeout: 5000 });
});

test('mobile assessment close control never overlays fields while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.dispatchEvent(new Event('tinysteps:open-assessment')));

  const dialog = page.getByRole('dialog', { name: 'Book an assessment' });
  const close = dialog.getByRole('button', { name: 'Close assessment form' });
  const scrollRegion = dialog.locator('[data-assessment-scroll-region="1"]');
  await expect(scrollRegion).toBeVisible();

  for (const viewport of [
    { width: 320, height: 640 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    await page.setViewportSize(viewport);
    await scrollRegion.evaluate((node) => { node.scrollTop = node.scrollHeight; });
    await expect(close).toBeInViewport();

    const measurements = await dialog.evaluate((node) => {
      const toolbar = node.querySelector('[data-assessment-toolbar="1"]');
      const scroller = node.querySelector('[data-assessment-scroll-region="1"]');
      const closeControl = node.querySelector('[aria-label="Close assessment form"]');
      if (!toolbar || !scroller || !closeControl) return null;
      return {
        closeBottom: closeControl.getBoundingClientRect().bottom,
        scrollTop: scroller.getBoundingClientRect().top,
        scrollOffset: scroller.scrollTop,
        toolbarBottom: toolbar.getBoundingClientRect().bottom,
      };
    });
    expect(measurements).not.toBeNull();
    expect(measurements!.closeBottom).toBeLessThanOrEqual(measurements!.scrollTop + 1);
    expect(measurements!.toolbarBottom).toBeLessThanOrEqual(measurements!.scrollTop + 1);
    expect(measurements!.scrollOffset).toBeGreaterThan(0);
  }
  await close.click();
  await expect(dialog).toHaveCount(0);
});

test('dedicated booking page has no floating support and shows the submit action on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/book-demo', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { level: 1, name: /Book a Free 35-Minute 1:1 English Assessment/i })).toBeVisible();
  const form = page.locator('#assessment-form form');
  await expect(form).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tell Us About Your Child' })).toBeVisible();
  await expect(form.getByRole('button', { name: /Request Free 35-Minute Demo/i })).toBeInViewport({ ratio: 0.8 });

  // The widgets used to appear after a deferred load and cover the form.
  await page.waitForTimeout(19000);
  await expect(page.locator('[data-floating-assistant="1"]')).toHaveCount(0);
});

test('phone-sized booking form stays usable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/book-demo', { waitUntil: 'domcontentloaded' });

  const form = page.locator('#assessment-form form');
  await expect(form.getByLabel('Parent Name')).toBeVisible();
  await expect(form.getByLabel('Child Age')).toBeVisible();
  await expect(form.getByLabel('Choose the area where your child needs support')).toBeVisible();

  const button = form.getByRole('button', { name: /Request Free 35-Minute Demo/i });
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeInViewport();
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
  await expect(page.locator('[data-floating-assistant="1"]')).toHaveCount(0);
});
