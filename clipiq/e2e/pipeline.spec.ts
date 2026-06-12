import { test, expect } from '@playwright/test';

const YOUTUBE_URL = 'https://youtu.be/xdFdQNq7vAw?si=JFZm0pc5zAHOkPw3';

test.describe('ClipIQ E2E Pipeline', () => {
  test('should complete full analysis pipeline from YouTube URL to summary', async ({ page, context }) => {
    // Capture console logs and network errors
    const consoleLogs: string[] = [];
    const networkErrors: any[] = [];

    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('response', (response) => {
      if (!response.ok()) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });

    // Step 1: Load home page
    await page.goto('/');
    await expect(page.locator('h2')).toContainText('Analyze Your Videos');
    console.log('✓ Home page loaded');

    // Verify UI is loaded
    const urlLabel = page.locator('label').filter({ hasText: 'YouTube URL' });
    await expect(urlLabel).toBeVisible();
    const keywordsLabel = page.locator('label').filter({ hasText: 'Keywords' });
    await expect(keywordsLabel).toBeVisible();

    // Step 2: Wait for keywords to load
    await page.waitForTimeout(1000);

    // Step 3: Enter YouTube URL
    const urlInput = page.locator('input[placeholder*="youtu"]');
    await urlInput.fill(YOUTUBE_URL);
    await expect(urlInput).toHaveValue(YOUTUBE_URL);
    console.log('✓ YouTube URL entered');

    // Step 4: Click Analyze button
    const analyzeButton = page.locator('button:has-text("Analyze")');
    await analyzeButton.click();
    console.log('✓ Analyze button clicked');

    // Step 5: Wait for processing stages with timeout handling
    try {
      // Download stage
      await expect(page.locator('text=Downloading Video')).toBeVisible({ timeout: 15000 });
      console.log('✓ Download stage started');

      // Transcribing stage
      await expect(page.locator('text=Transcribing Audio')).toBeVisible({ timeout: 90000 });
      console.log('✓ Transcribing stage started');

      // Analyzing stage
      await expect(page.locator('text=Analyzing with Claude')).toBeVisible({ timeout: 90000 });
      console.log('✓ Analyzing stage started');
    } catch (e) {
      console.error('⚠ Processing stages error - checking network');
      if (networkErrors.length > 0) {
        console.error('Network errors detected:');
        networkErrors.forEach((err) => {
          console.error(`  - ${err.url}: ${err.status} ${err.statusText}`);
        });
      }
      console.error('Console logs:');
      consoleLogs.forEach((log) => console.error(`  ${log}`));
      throw e;
    }

    // Step 6: Wait for redirect to review page (processing complete)
    try {
      await page.waitForURL('/review', { timeout: 180000 });
      console.log('✓ Redirected to review page');
    } catch (e) {
      console.error('⚠ Failed to redirect to review page');
      console.error('Current URL:', page.url());
      if (networkErrors.length > 0) {
        console.error('Network errors:');
        networkErrors.forEach((err) => {
          console.error(`  - ${err.url}: ${err.status}`);
        });
      }
      throw e;
    }

    // Step 7: Verify review page content
    await expect(page).toHaveURL(/.*\/review/);

    // Wait for clip cards to load
    const clipCards = page.locator('.card');
    await expect(clipCards).toHaveCount(3, { timeout: 10000 });
    console.log('✓ Clip cards loaded');

    // Verify clip card structure
    const firstCard = clipCards.first();
    await expect(firstCard.locator('h3')).toBeVisible();
    await expect(firstCard.locator('text=Platform')).toBeVisible();

    // Step 8: Accept first clip
    const acceptButtons = page.locator('button:has-text("Accept")');
    await expect(acceptButtons).toHaveCount(3);
    await acceptButtons.first().click();
    console.log('✓ Accepted first clip');

    // Verify button state changed
    await expect(acceptButtons.first()).toHaveClass(/selected|active|accepted/);

    // Step 9: Navigate to summary
    const continueButton = page.locator('button:has-text("Review Complete")');
    await expect(continueButton).toBeVisible();
    await continueButton.click();

    // Step 10: Wait for summary page
    await page.waitForURL('/summary', { timeout: 30000 });
    await expect(page).toHaveURL(/.*\/summary/);
    console.log('✓ Redirected to summary page');

    // Step 11: Verify summary content
    await expect(page.locator('h2')).toContainText('Summary');
    const summaryCards = page.locator('.card');
    await expect(summaryCards).toHaveCount(1);
    console.log('✓ Summary shows 1 accepted clip');

    // Step 12: Verify download button exists
    const downloadButton = page.locator('button:has-text("Download")');
    await expect(downloadButton).toBeVisible();
    console.log('✓ Download button available');
  });

  test('should handle keyword filtering', async ({ page }) => {
    await page.goto('/');

    // Load keywords
    const keywordButton = page.locator('button').filter({ hasText: /\d+ selected/ }).first();
    await keywordButton.click();
    await page.waitForTimeout(500);

    // Look for the keyword drawer that should have opened
    const keywordForm = page.locator('input[placeholder*="keyword"]');
    await expect(keywordForm).toBeVisible();
    console.log('✓ Keyword drawer expanded');
  });

  test('should add custom keyword', async ({ page }) => {
    await page.goto('/');

    // Open keywords drawer
    const keywordButton = page.locator('button').filter({ hasText: /\d+ selected/ }).first();
    await keywordButton.click();

    // Add custom keyword
    const input = page.locator('input[placeholder*="keyword"]');
    await input.fill('custom-test-keyword');

    const addButton = page.locator('button:has-text("Add")');
    await addButton.click();

    // Wait for keyword to appear
    await expect(page.locator('text=custom-test-keyword')).toBeVisible();
    console.log('✓ Custom keyword added');
  });

  test('should validate empty URL submission', async ({ page }) => {
    await page.goto('/');

    const analyzeButton = page.locator('button:has-text("Analyze")');

    // Button should be disabled when URL is empty
    await expect(analyzeButton).toBeDisabled();
    console.log('✓ Analyze button disabled when URL empty');

    // Type invalid URL
    const urlInput = page.locator('input[placeholder*="youtu"]');
    await urlInput.fill('not-a-youtube-url');

    // Button should be enabled for any non-empty value
    await expect(analyzeButton).toBeEnabled();
    console.log('✓ Analyze button enabled with non-empty URL');
  });

  test('should handle navigation between pages', async ({ page }) => {
    // Verify header is consistent across pages
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('ClipIQ');

    await page.goto('/review');
    await expect(page.locator('h1')).toContainText('ClipIQ');

    await page.goto('/summary');
    await expect(page.locator('h1')).toContainText('ClipIQ');

    console.log('✓ Header consistent across all pages');
  });
});
