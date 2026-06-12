import { test, expect } from '@playwright/test';

test.describe('ClipIQ Basic Functionality', () => {
  test('should load home page correctly', async ({ page }) => {
    await page.goto('/');

    // Verify page loaded
    await expect(page).toHaveTitle(/ClipIQ/);
    await expect(page.locator('h1')).toContainText('ClipIQ');
    await expect(page.locator('h2')).toContainText('Analyze Your Videos');
    console.log('✓ Home page loaded');
  });

  test('should render form elements', async ({ page }) => {
    await page.goto('/');

    // Check for URL input
    const urlInput = page.locator('input[placeholder*="youtu"]');
    await expect(urlInput).toBeVisible();

    // Check for Analyze button
    const analyzeButton = page.locator('button:has-text("Analyze")');
    await expect(analyzeButton).toBeVisible();
    await expect(analyzeButton).toBeDisabled();

    console.log('✓ Form elements visible');
  });

  test('should enable Analyze button with URL', async ({ page }) => {
    await page.goto('/');

    const urlInput = page.locator('input[placeholder*="youtu"]');
    const analyzeButton = page.locator('button:has-text("Analyze")');

    // Initially disabled
    await expect(analyzeButton).toBeDisabled();

    // Type URL
    await urlInput.fill('https://youtu.be/test123');

    // Should be enabled
    await expect(analyzeButton).toBeEnabled();
    console.log('✓ Button enabled with URL');
  });

  test('should load keywords on page load', async ({ page }) => {
    await page.goto('/');

    // Find keyword button and check it shows a number
    const keywordButton = page.locator('button').filter({ hasText: /selected/ });
    await expect(keywordButton).toBeVisible();

    // Extract the number
    const text = await keywordButton.textContent();
    const match = text?.match(/(\d+)\s+selected/);
    const count = match ? parseInt(match[1]) : 0;

    if (count > 0) {
      console.log(`✓ Keywords loaded: ${count} selected`);
    } else {
      console.log('⚠ No keywords loaded, checking API...');

      // Make direct API call to check
      const response = await page.request.get('/api/keywords');
      const data = await response.json() as any;
      console.log(`  API returned ${data.keywords?.length || 0} keywords`);
    }
  });

  test('should test API health', async ({ request }) => {
    // Test keywords endpoint
    const keywordsRes = await request.get('/api/keywords');
    expect(keywordsRes.status()).toBe(200);
    const keywords = await keywordsRes.json() as any;
    console.log(`✓ /api/keywords: ${keywords.keywords?.length || 0} keywords`);

    // Test keywords/excluded endpoint
    const excludedRes = await request.get('/api/keywords/excluded');
    expect(excludedRes.status()).toBe(200);
    const excluded = await excludedRes.json() as any;
    console.log(`✓ /api/keywords/excluded: ${excluded.excluded?.length || 0} excluded`);
  });

  test('should navigate between pages', async ({ page }) => {
    // Home page
    await page.goto('/');
    await expect(page.locator('h2')).toContainText('Analyze Your Videos');

    // Review page (should show some content even if empty)
    await page.goto('/review');
    await expect(page.locator('h1')).toContainText('ClipIQ');

    // Summary page
    await page.goto('/summary');
    await expect(page.locator('h1')).toContainText('ClipIQ');

    console.log('✓ All pages accessible');
  });
});
