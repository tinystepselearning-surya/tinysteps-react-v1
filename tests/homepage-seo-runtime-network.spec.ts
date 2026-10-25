import { expect, test } from '@playwright/test';

test('homepage does not fetch specialist route SEO manifests on initial load', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') requests.push(request.url());
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: /Online English Classes for Kids/i })).toBeVisible();
  await page.waitForLoadState('networkidle');

  const specialist = requests.filter((url) =>
    /(?:vocabularyAuthoritySeoManifest|grammarProgrammaticSeoManifest|grammarReferenceExtensionSeoManifest)[-_.]/.test(url),
  );
  expect(specialist, `Specialist SEO bundles downloaded on homepage: ${specialist.join(', ')}`).toEqual([]);

  // The actual browser must still expose the canonical metadata and structured data.
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://tinystepslearning.com/');
  await expect(page.locator('#ts-jsonld')).toContainText('Organization');
});
