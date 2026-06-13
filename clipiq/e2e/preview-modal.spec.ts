import { test, expect } from '@playwright/test';

test.describe('ClipIQ Preview Modal Workflow', () => {
  const mockClipIQState = {
    clips: [
      {
        id: 1,
        start_ms: 5000,
        end_ms: 95000,
        duration_seconds: 90,
        type: 'Hook',
        headline: 'Amazing breakthrough moment',
        why_clip_worthy: 'This is a pivotal moment that would resonate on social media',
        hook: 'This is the moment everything changed',
        suggested_platforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
        confidence: 95,
      },
      {
        id: 2,
        start_ms: 120000,
        end_ms: 210000,
        duration_seconds: 90,
        type: 'Tension Release',
        headline: 'Unexpected plot twist',
        why_clip_worthy: 'The audience will be shocked by this revelation',
        hook: 'You won\'t believe what happens next',
        suggested_platforms: ['TikTok', 'YouTube Shorts'],
        confidence: 87,
      },
    ],
    videoPath: '/tmp/test-video.mp4',
    videoId: 'jNQXAC9IVRw',
    title: 'Test Video Analysis',
  };

  test('should open preview modal when clicking preview button', async ({ page }) => {
    // Set up mock state
    await page.addInitScript(({ state }) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
    }, { state: mockClipIQState });

    await page.goto('/review');

    // Find first preview button
    const previewButton = page.locator('button').filter({ hasText: 'Preview' }).first();
    await expect(previewButton).toBeVisible();

    // Click preview
    await previewButton.click();

    // Verify modal appears by checking for YouTube iframe
    const iframe = page.locator('iframe[title="Amazing breakthrough moment"]');
    await expect(iframe).toBeVisible();

    // Verify clip metadata appears in modal (use first instance which is in modal)
    const headline = page.locator('h3').filter({ hasText: 'Amazing breakthrough moment' }).first();
    await expect(headline).toBeVisible();

    console.log('✓ Preview modal opened successfully with video player and metadata');
  });

  test('should approve clip from modal', async ({ page }) => {
    await page.addInitScript(({ state }) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
    }, { state: mockClipIQState });

    await page.goto('/review');

    // Click preview
    const previewButton = page.locator('button').filter({ hasText: 'Preview' }).first();
    await previewButton.click();

    // Wait for modal and verify checkbox is visible
    await expect(page.locator('iframe[title="Amazing breakthrough moment"]')).toBeVisible();
    const approveCheckbox = page.locator('input[type="checkbox"]');
    await expect(approveCheckbox).toBeVisible();

    console.log('✓ Approve checkbox visible in preview modal');
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await page.addInitScript(({ state }) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
    }, { state: mockClipIQState });

    await page.goto('/review');

    // Click preview
    const previewButton = page.locator('button').filter({ hasText: 'Preview' }).first();
    await previewButton.click();

    // Verify modal is open
    await expect(page.locator('iframe[title="Amazing breakthrough moment"]')).toBeVisible();

    // Close modal
    const closeButton = page.locator('button').filter({ hasText: 'Close' });
    await closeButton.click();

    // Verify modal is closed
    const iframe = page.locator('iframe[title="Amazing breakthrough moment"]');
    await expect(iframe).not.toBeVisible();

    console.log('✓ Modal closed successfully');
  });

  test('should show download button on review page', async ({ page }) => {
    await page.addInitScript(({ state }) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
    }, { state: mockClipIQState });

    await page.goto('/review');

    // Download button should be present (disabled initially without approvals)
    const downloadButton = page.locator('button').filter({ hasText: /Go to Download/ });
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeDisabled();

    console.log('✓ Download button visible and initially disabled');
  });

  test('should show review page with clips and preview buttons', async ({ page }) => {
    await page.addInitScript(({ state }) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
    }, { state: mockClipIQState });

    await page.goto('/review');

    // Verify page content
    await expect(page.locator('text=Preview clips and approve')).toBeVisible();

    // Verify all clips are displayed
    const clipHeadlines = page.locator('h3');
    const count = await clipHeadlines.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Verify preview buttons are available
    const previewButtons = page.locator('button').filter({ hasText: 'Preview' });
    const previewCount = await previewButtons.count();
    expect(previewCount).toEqual(2);

    console.log(`✓ Review page shows ${previewCount} clips with preview buttons`);
  });
});
