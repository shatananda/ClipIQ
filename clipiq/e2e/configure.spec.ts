import { test, expect } from '@playwright/test';

test.describe('Configure Page', () => {
  test('should load configure page with video settings', async ({ page }) => {
    // Navigate with query params
    await page.goto('/configure?videoId=test123&title=Test%20Video');

    // Check for heading with video title
    const heading = page.locator('h1');
    const text = await heading.textContent();
    expect(text).toContain('Configure Analysis');
  });

  test('should have caption toggle checkbox', async ({ page }) => {
    await page.goto('/configure?videoId=test123&title=Test%20Video');

    const captionLabel = page.locator('label').filter({ hasText: /Burn captions/i });
    await expect(captionLabel).toBeVisible();

    const checkbox = captionLabel.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
  });

  test('should have font size slider', async ({ page }) => {
    await page.goto('/configure?videoId=test123&title=Test%20Video');

    // Enable captions first
    const captionCheckbox = page.locator('input[type="checkbox"]').first();
    const isChecked = await captionCheckbox.isChecked();
    if (!isChecked) {
      await captionCheckbox.click();
    }

    // Font size slider should be visible
    const fontSizeLabel = page.locator('label').filter({ hasText: /Caption font size/i });
    await expect(fontSizeLabel).toBeVisible();

    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
  });

  test('should have crop orientation buttons', async ({ page }) => {
    await page.goto('/configure?videoId=test123&title=Test%20Video');

    const cropLabel = page.locator('label').filter({ hasText: /Crop orientation/i });
    await expect(cropLabel).toBeVisible();

    // Check for left, center, right buttons
    const leftButton = page.locator('button').filter({ hasText: 'left' });
    const centerButton = page.locator('button').filter({ hasText: 'center' });
    const rightButton = page.locator('button').filter({ hasText: 'right' });

    expect(await leftButton.count()).toBeGreaterThan(0);
    expect(await centerButton.count()).toBeGreaterThan(0);
    expect(await rightButton.count()).toBeGreaterThan(0);
  });

  test('should highlight selected crop orientation', async ({ page }) => {
    await page.goto('/configure?videoId=test123&title=Test%20Video');

    const centerButton = page.locator('button').filter({ hasText: 'center' }).first();

    // Center should be selected by default
    const style = await centerButton.getAttribute('style');
    expect(style).toContain('var(--primary)');
  });

  test('should have Start Analysis button', async ({ page }) => {
    await page.goto('/configure?videoId=test123&title=Test%20Video');

    const analyzeButton = page.locator('button').filter({ hasText: /Start Analysis/i });
    await expect(analyzeButton).toBeVisible();
    await expect(analyzeButton).toBeEnabled();
  });

  test('should show YouTube embed', async ({ page }) => {
    await page.goto('/configure?videoId=test123&title=Test%20Video');

    const iframe = page.locator('iframe[src*="youtube.com/embed"]');
    await expect(iframe).toBeVisible();

    // Verify video ID is in the iframe src
    const src = await iframe.getAttribute('src');
    expect(src).toContain('test123');
  });
});
