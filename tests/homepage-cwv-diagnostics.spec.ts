import { expect, test } from '@playwright/test';

/**
 * Read-only homepage CWV diagnostic and UX regression probe.
 *
 * Intentionally does not change production code or invent a baseline. Run this
 * suite on both main and a candidate branch under the same browser conditions.
 * CrUX field values cannot be reproduced from a single Playwright navigation.
 */

type ShiftRecord = {
  at: number;
  value: number;
  sources: Array<{
    tag: string;
    previous: { x: number; y: number; width: number; height: number } | null;
    current: { x: number; y: number; width: number; height: number } | null;
  }>;
};

function largestClsSessionWindow(shifts: ShiftRecord[]): number {
  let largest = 0;
  let running = 0;
  let start = 0;
  let previous = 0;

  for (const shift of shifts) {
    if (running === 0 || shift.at - previous > 1000 || shift.at - start > 5000) {
      running = 0;
      start = shift.at;
    }
    running += shift.value;
    largest = Math.max(largest, running);
    previous = shift.at;
  }
  return largest;
}

const devices = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1366', width: 1366, height: 850 },
] as const;

for (const device of devices) {
  test('homepage CWV audit and UI guard: ' + device.name, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.addInitScript(() => {
      type BrowserShift = PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
        sources?: Array<{
          node?: Node | null;
          previousRect?: DOMRectReadOnly | null;
          currentRect?: DOMRectReadOnly | null;
        }>;
      };

      const shifts: ShiftRecord[] = [];
      const rectangle = (r?: DOMRectReadOnly | null) => r
        ? { x: r.x, y: r.y, width: r.width, height: r.height }
        : null;

      if (typeof PerformanceObserver !== 'undefined' &&
          PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
        const observer = new PerformanceObserver((list) => {
          for (const raw of list.getEntries()) {
            const entry = raw as BrowserShift;
            if (entry.hadRecentInput || !Number.isFinite(entry.value)) continue;
            shifts.push({
              at: entry.startTime,
              value: entry.value,
              // Do not collect text, field values, classes, IDs or user information.
              sources: (entry.sources || []).slice(0, 4).map((source) => ({
                tag: source.node instanceof Element ? source.node.tagName.toLowerCase() : 'unknown',
                previous: rectangle(source.previousRect),
                current: rectangle(source.currentRect),
              })),
            });
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true } as PerformanceObserverInit);
      }

      (window as typeof window & { __tinyStepsCwvProbe?: { shifts: ShiftRecord[] } }).__tinyStepsCwvProbe = { shifts };
    });

    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), 'homepage navigation should succeed').toBe(true);

    const hero = page.locator('section[aria-labelledby="homepage-title"]');
    const heading = page.getByRole('heading', { name: /Online English Classes for Kids/i, level: 1 });
    const booking = hero.getByRole('link', { name: 'Book Free 35-Minute Demo' });
    await expect(heading).toBeVisible();
    await expect(booking).toBeVisible();
    await expect(booking).toHaveAttribute('href', '/book-demo');

    const image = hero.locator('img[src="/blog/hero-families/Tiny_Steps_Speaking.webp"]');
    await expect(image).toHaveAttribute('srcset', /Tiny_Steps_Speaking_720\.webp 720w/);
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);

    if (device.width < 640) {
      const menu = page.getByRole('button', { name: 'Toggle menu' });
      await expect(menu).toBeVisible();
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('#mobile-nav-menu').getByRole('link', { name: 'Courses' })).toBeVisible();
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
    }

    const initial = await page.screenshot({ fullPage: false });
    await testInfo.attach(device.name + '-initial.png', { body: initial, contentType: 'image/png' });

    // Delayed public chrome, footer, and support activation occur well after
    // ordinary Lighthouse loading snapshots. Keep observing through that window.
    // Observe footer activation while the real final CTA occupies the viewport.
    // Then return to the hero for the later support-widget activation window.
    await page.locator('#homepage-final-invitation').scrollIntoViewIfNeeded();
    await page.waitForTimeout(15_000);
    await testInfo.attach(device.name + '-bottom-after-footer.png', {
      body: await page.screenshot({ fullPage: false }),
      contentType: 'image/png',
    });
    await heading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(12_000);
    await expect(page.locator('footer')).toBeVisible();
    await expect(booking).toBeVisible();
    await expect(page.locator('#homepage-final-invitation a[href="/book-demo"]')).toHaveCount(1);

    const result = await page.evaluate(() => {
      const probe = (window as typeof window & { __tinyStepsCwvProbe?: { shifts: ShiftRecord[] } })
        .__tinyStepsCwvProbe;
      return {
        shifts: probe?.shifts || [],
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        footerPresent: Boolean(document.querySelector('footer')),
        heroPresent: Boolean(document.getElementById('homepage-title')),
      };
    });

    const report = {
      device: device.name,
      audit: 'read-only',
      largestSessionCls: largestClsSessionWindow(result.shifts),
      cumulativeShiftValues: result.shifts.reduce((sum, shift) => sum + shift.value, 0),
      shiftCount: result.shifts.length,
      largestIndividualShifts: [...result.shifts]
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      documentWidth: result.documentWidth,
      viewportWidth: result.viewportWidth,
      footerPresent: result.footerPresent,
      heroPresent: result.heroPresent,
    };

    await testInfo.attach(device.name + '-cwv.json', {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: 'application/json',
    });
    console.log('[homepage-cwv-audit] ' + JSON.stringify(report));

    expect(report.documentWidth, 'unexpected horizontal overflow').toBeLessThanOrEqual(device.width + 1);
    expect(report.footerPresent).toBe(true);
    expect(report.heroPresent).toBe(true);

    // Deliberately no pass/fail threshold for CLS yet: first establish a
    // comparable main-branch measurement, then require candidate <= baseline.
  });
}
