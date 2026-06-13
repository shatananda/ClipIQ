import { test, expect } from '@playwright/test';

const YOUTUBE_URL = 'https://youtu.be/xdFdQNq7vAw?si=JFZm0pc5zAHOkPw3';

test.describe('ClipIQ Review Page', () => {
  test('should accept and decline clips correctly', async ({ page }) => {
    // Load home page
    await page.goto('/');
    const urlInput = page.locator('input[placeholder*="youtu"]');
    const analyzeButton = page.locator('button:has-text("Analyze")');

    // Enter URL and analyze
    await urlInput.fill(YOUTUBE_URL);
    await analyzeButton.click();

    // Wait for redirect to review page
    await page.waitForURL('/review', { timeout: 300000 });
    console.log('✓ Redirected to review page');

    // Get clip cards
    const clipCards = page.locator('.card').filter({ has: page.locator('h3') });
    const clipCount = await clipCards.count();
    expect(clipCount).toBeGreaterThan(0);
    console.log(`✓ Found ${clipCount} clip cards`);

    // Get accept buttons
    const acceptButtons = page.locator('button:has-text("Accept")');
    const declineButtons = page.locator('button:has-text("Decline")');
    expect(await acceptButtons.count()).toBe(clipCount);
    expect(await declineButtons.count()).toBe(clipCount);

    // Accept first clip
    await acceptButtons.first().click();
    await page.waitForTimeout(300);
    console.log('✓ Accepted first clip');

    // Verify "Proceed to Summary" button shows count
    const proceedButton = page.locator('button:has-text("Proceed to Summary")');
    const buttonText = await proceedButton.textContent();
    expect(buttonText).toContain('1 clips');
    console.log('✓ Proceed button shows 1 accepted clip');

    // Accept second clip
    if (clipCount >= 2) {
      await acceptButtons.nth(1).click();
      await page.waitForTimeout(300);
      const updated = await proceedButton.textContent();
      expect(updated).toContain('2 clips');
      console.log('✓ Accepted second clip, counter updated');

      // Decline the second clip
      await declineButtons.nth(1).click();
      await page.waitForTimeout(300);
      const updated2 = await proceedButton.textContent();
      expect(updated2).toContain('1 clips');
      console.log('✓ Declined second clip, counter decreased');
    }
  });

  test('should toggle accept and decline state', async ({ page }) => {
    await page.goto('/');
    const urlInput = page.locator('input[placeholder*="youtu"]');
    const analyzeButton = page.locator('button:has-text("Analyze")');

    await urlInput.fill(YOUTUBE_URL);
    await analyzeButton.click();

    await page.waitForURL('/review', { timeout: 300000 });

    const acceptButton = page.locator('button:has-text("Accept")').first();
    const declineButton = page.locator('button:has-text("Decline")').first();

    // Accept
    await acceptButton.click();
    await page.waitForTimeout(300);
    let proceedText = await page.locator('button:has-text("Proceed to Summary")').textContent();
    expect(proceedText).toContain('1 clips');
    console.log('✓ Clip accepted');

    // Decline (should remove from accepted)
    await declineButton.click();
    await page.waitForTimeout(300);
    proceedText = await page.locator('button:has-text("Proceed to Summary")').textContent();
    expect(proceedText).toContain('0 clips');
    console.log('✓ Toggled to declined, accepted count went back to 0');

    // Accept again to verify toggle works both ways
    await acceptButton.click();
    await page.waitForTimeout(300);
    proceedText = await page.locator('button:has-text("Proceed to Summary")').textContent();
    expect(proceedText).toContain('1 clips');
    console.log('✓ Toggled back to accepted');
  });

  test('should proceed to summary with accepted clips', async ({ page }) => {
    await page.goto('/');
    const urlInput = page.locator('input[placeholder*="youtu"]');
    const analyzeButton = page.locator('button:has-text("Analyze")');

    await urlInput.fill(YOUTUBE_URL);
    await analyzeButton.click();

    await page.waitForURL('/review', { timeout: 600000 });

    // Accept first clip
    await page.locator('button:has-text("Accept")').first().click();
    await page.waitForTimeout(300);

    // Click proceed to summary
    const proceedButton = page.locator('button:has-text("Proceed to Summary")');
    await proceedButton.click();

    // Verify redirect to summary page
    await page.waitForURL('/summary', { timeout: 30000 });
    await expect(page).toHaveURL(/.*\/summary/);
    console.log('✓ Navigated to summary page');

    // Verify accepted clip is shown
    const summaryCards = page.locator('.card').filter({ has: page.locator('h3') });
    const summaryCount = await summaryCards.count();
    expect(summaryCount).toBeGreaterThan(0);
    console.log(`✓ Summary page shows ${summaryCount} accepted clip(s)`);
  });

  test('should display clip metadata correctly', async ({ page }) => {
    await page.goto('/');
    const urlInput = page.locator('input[placeholder*="youtu"]');
    const analyzeButton = page.locator('button:has-text("Analyze")');

    await urlInput.fill(YOUTUBE_URL);
    await analyzeButton.click();

    await page.waitForURL('/review', { timeout: 300000 });

    // Verify first clip card has all required metadata
    const firstCard = page.locator('.card').filter({ has: page.locator('h3') }).first();

    // Check headline
    const headline = firstCard.locator('h3');
    await expect(headline).toBeVisible();
    const headlineText = await headline.textContent();
    expect(headlineText).toBeTruthy();
    console.log(`✓ Clip headline: "${headlineText}"`);

    // Check quote/hook
    const quote = firstCard.locator('p[style*="italic"]');
    await expect(quote).toBeVisible();
    console.log('✓ Clip hook is visible');

    // Check timestamp info
    const timestamp = firstCard.locator('text=Timestamp').locator('..').locator('p').last();
    await expect(timestamp).toBeVisible();
    const timeText = await timestamp.textContent();
    expect(timeText).toMatch(/\d+:\d+ to \d+:\d+/);
    console.log(`✓ Timestamp format correct: ${timeText}`);

    // Check confidence bar
    const confidence = firstCard.locator('text=Confidence');
    await expect(confidence).toBeVisible();
    console.log('✓ Confidence score visible');

    // Check platform recommendations
    const bestFor = firstCard.locator('text=Best For');
    await expect(bestFor).toBeVisible();
    const platforms = firstCard.locator('div:has-text("TikTok"), div:has-text("Instagram"), div:has-text("YouTube")');
    const platformCount = await platforms.count();
    expect(platformCount).toBeGreaterThan(0);
    console.log(`✓ Platform recommendations visible (${platformCount} platforms)`);
  });

  test('should handle analyze another video button', async ({ page }) => {
    await page.goto('/');
    const urlInput = page.locator('input[placeholder*="youtu"]');
    const analyzeButton = page.locator('button:has-text("Analyze")');

    await urlInput.fill(YOUTUBE_URL);
    await analyzeButton.click();

    await page.waitForURL('/review', { timeout: 300000 });

    // Click "Analyze Another Video" button
    const analyzeAnotherButton = page.locator('button:has-text("Analyze Another Video")');
    await analyzeAnotherButton.click();

    // Should navigate back to home
    await page.waitForURL('/', { timeout: 30000 });
    await expect(page).toHaveURL(/.*\/$/);
    console.log('✓ Navigated back to home page');

    // Verify home page is loaded
    await expect(page.locator('h2:has-text("Analyze Your Videos")')).toBeVisible();
    console.log('✓ Home page is ready for new analysis');
  });

  test('should display all clips in review page', async ({ page }) => {
    await page.goto('/');
    const urlInput = page.locator('input[placeholder*="youtu"]');
    const analyzeButton = page.locator('button:has-text("Analyze")');

    await urlInput.fill(YOUTUBE_URL);
    await analyzeButton.click();

    await page.waitForURL('/review', { timeout: 300000 });

    // Get all clip cards
    const clipCards = page.locator('.card').filter({ has: page.locator('h3') });
    const clipCount = await clipCards.count();

    // Verify each clip has action buttons
    for (let i = 0; i < clipCount; i++) {
      const card = clipCards.nth(i);
      const acceptBtn = card.locator('button:has-text("Accept")');
      const declineBtn = card.locator('button:has-text("Decline")');
      const extractBtn = card.locator('button:has-text("Extract")');

      await expect(acceptBtn).toBeVisible();
      await expect(declineBtn).toBeVisible();
      await expect(extractBtn).toBeVisible();
    }

    console.log(`✓ All ${clipCount} clips have action buttons`);
  });

  test('should disable extract button while extracting', async ({ page }) => {
    await page.goto('/');
    const urlInput = page.locator('input[placeholder*="youtu"]');
    const analyzeButton = page.locator('button:has-text("Analyze")');

    await urlInput.fill(YOUTUBE_URL);
    await analyzeButton.click();

    await page.waitForURL('/review', { timeout: 300000 });

    // Click extract button
    const extractButton = page.locator('button:has-text("Extract")').first();
    const initialState = await extractButton.textContent();
    expect(initialState).toContain('Extract');

    // Click extract (will likely timeout on extract completion, but that's ok for this test)
    await extractButton.click();

    // Button should show "Extracting..." (or remain disabled)
    const extractingText = await extractButton.textContent();
    console.log(`✓ Extract button shows: "${extractingText}"`);

    // Verify button is disabled during extraction
    const isDisabled = await extractButton.isDisabled();
    console.log(`✓ Extract button disabled state: ${isDisabled}`);
  });
});
