import { test, expect } from '@playwright/test';

test.describe('Crop Selection Flow', () => {
  const mockClipIQState = {
    clips: [
      {
        id: 1,
        start_ms: 5000,
        end_ms: 95000,
        duration_seconds: 90,
        type: 'Hook',
        headline: 'Test Clip for Crop Selection',
        why_clip_worthy: 'Testing crop functionality',
        hook: 'This is a test',
        suggested_platforms: ['TikTok'],
        confidence: 95,
      },
    ],
    videoPath: '/tmp/test-video.mp4',
    videoId: 'jNQXAC9IVRw',
    title: 'Test Video',
  };

  test('crop position left is saved and passed to API', async ({ page }) => {
    // Set up mock state
    await page.addInitScript(({ state }) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
    }, { state: mockClipIQState });

    // Intercept API calls to verify crop position
    let extractedCropPosition = null;
    await page.route('**/api/extract', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();
      extractedCropPosition = postData.clip?.cropPosition;
      console.log('API received cropPosition:', extractedCropPosition);

      // Return mock response
      route.abort();
    });

    await page.goto('/review');

    // Click preview
    const previewButton = page.locator('button').filter({ hasText: 'Preview' }).first();
    await previewButton.click();

    // Wait for modal
    await expect(page.locator('iframe[title="Test Clip for Crop Selection"]')).toBeVisible();

    // Click "Left" crop button
    const leftButton = page.locator('button').filter({ hasText: '◀ Left' }).first();
    await leftButton.click();

    // Verify button is selected
    await expect(leftButton).toHaveCSS('border', /2px/);

    // Approve the clip
    const approveCheckbox = page.locator('input[type="checkbox"]').first();
    await approveCheckbox.check();
    await expect(approveCheckbox).toBeChecked();

    // Close modal
    const closeButton = page.locator('button').filter({ hasText: 'Close' }).first();
    await closeButton.click();

    // Go to download page
    const downloadButton = page.locator('button').filter({ hasText: /Go to Download/ }).first();
    await expect(downloadButton).toBeEnabled();
    await downloadButton.click();

    // Verify we're on download page
    await expect(page).toHaveURL('/download');

    // Click download button
    const clipDownloadButton = page.locator('button').filter({ hasText: 'Download' }).first();
    await clipDownloadButton.click();

    // Wait a moment for API call
    await page.waitForTimeout(500);

    // Check if crop position was sent
    console.log('Final cropPosition sent to API:', extractedCropPosition);
    expect(extractedCropPosition).toBe('left');
  });

  test('crop position center is default', async ({ page }) => {
    await page.addInitScript(({ state }) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
    }, { state: mockClipIQState });

    let extractedCropPosition = null;
    await page.route('**/api/extract', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();
      extractedCropPosition = postData.clip?.cropPosition;
      route.abort();
    });

    await page.goto('/review');

    const previewButton = page.locator('button').filter({ hasText: 'Preview' }).first();
    await previewButton.click();

    // Don't select a different crop, just approve with default (center)
    const approveCheckbox = page.locator('input[type="checkbox"]').first();
    await approveCheckbox.check();

    const closeButton = page.locator('button').filter({ hasText: 'Close' }).first();
    await closeButton.click();

    const downloadButton = page.locator('button').filter({ hasText: /Go to Download/ }).first();
    await downloadButton.click();

    await expect(page).toHaveURL('/download');

    const clipDownloadButton = page.locator('button').filter({ hasText: 'Download' }).first();
    await clipDownloadButton.click();

    await page.waitForTimeout(500);

    console.log('Default cropPosition sent to API:', extractedCropPosition);
    expect(extractedCropPosition).toBe('center');
  });

  test('crop position right is saved', async ({ page }) => {
    await page.addInitScript(({ state }) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
    }, { state: mockClipIQState });

    let extractedCropPosition = null;
    await page.route('**/api/extract', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();
      extractedCropPosition = postData.clip?.cropPosition;
      route.abort();
    });

    await page.goto('/review');

    const previewButton = page.locator('button').filter({ hasText: 'Preview' }).first();
    await previewButton.click();

    // Click "Right" crop button
    const rightButton = page.locator('button').filter({ hasText: 'Right ▶' }).first();
    await rightButton.click();

    const approveCheckbox = page.locator('input[type="checkbox"]').first();
    await approveCheckbox.check();

    const closeButton = page.locator('button').filter({ hasText: 'Close' }).first();
    await closeButton.click();

    const downloadButton = page.locator('button').filter({ hasText: /Go to Download/ }).first();
    await downloadButton.click();

    await expect(page).toHaveURL('/download');

    const clipDownloadButton = page.locator('button').filter({ hasText: 'Download' }).first();
    await clipDownloadButton.click();

    await page.waitForTimeout(500);

    console.log('Right cropPosition sent to API:', extractedCropPosition);
    expect(extractedCropPosition).toBe('right');
  });
});
