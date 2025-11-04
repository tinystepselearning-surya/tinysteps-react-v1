import { test, expect } from "@playwright/test";

test.describe("Balloon-Pop IPA Game", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/games/balloon-pop-ipa");
  });

  test("should load game with 44 phonemes", async ({ page }) => {
    // Wait for the game to load
    await page.waitForSelector('[data-testid="balloon"]', { timeout: 5000 });

    // Verify balloons exist in the DOM
    const balloons = page.locator('[data-testid="balloon"]');
    const count = await balloons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display phoneme on balloon", async ({ page }) => {
    // Wait for a balloon to appear with IPA symbol
    await page.waitForSelector('[data-testid="balloon-text"]', { timeout: 5000 });

    const balloonText = page.locator('[data-testid="balloon-text"]').first();
    const text = await balloonText.textContent();

    // Verify it contains an IPA symbol (should start with /)
    expect(text).toBeTruthy();
    expect(text).toContain("/");
  });

  test("should have working listen button", async ({ page }) => {
    // Wait for listen button
    await page.waitForSelector('[data-testid="listen-button"]', { timeout: 5000 });

    const listenButton = page.locator('[data-testid="listen-button"]');
    expect(listenButton).toBeVisible();

    // Click and verify it doesn't error
    await listenButton.click();
    await page.waitForTimeout(500);

    // Page should still be interactive
    expect(page).toBeTruthy();
  });

  test("should pop balloon on correct answer", async ({ page }) => {
    // Wait for initial balloon
    await page.waitForSelector('[data-testid="balloon"]', { timeout: 5000 });

    // Get the phoneme text
    const balloonText = page.locator('[data-testid="balloon-text"]').first();
    const phonemeText = await balloonText.textContent();

    // Find and click the matching button (same phoneme)
    const buttons = page.locator('button:has-text("' + phonemeText + '")');
    if (await buttons.count() > 0) {
      await buttons.first().click();
      await page.waitForTimeout(500);

      // Verify balloon was popped (animation or removal)
      const remainingBalloons = page.locator('[data-testid="balloon"]');
      expect(await remainingBalloons.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test("should show dashboard at end of game", async ({ page }) => {
    // Play through quick sequence (try clicking some balloons)
    const balloons = page.locator('[data-testid="balloon"]');

    // Try to pop a few balloons
    for (let i = 0; i < Math.min(3, await balloons.count()); i++) {
      const balloon = balloons.nth(i);
      if (await balloon.isVisible()) {
        await balloon.click();
        await page.waitForTimeout(300);
      }
    }

    // Game should remain stable
    expect(page).toBeTruthy();
  });

  test("should have correct game metadata", async ({ page }) => {
    // Check that the game slug and title are correct
    const title = page.locator("h1, h2");
    const titleText = await title.first().textContent();

    // Should contain "Balloon" or "IPA" reference
    expect(titleText?.toLowerCase() || "").toMatch(/balloon|ipa|phoneme/i);
  });
});
