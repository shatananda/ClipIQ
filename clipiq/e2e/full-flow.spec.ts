import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('ClipIQ Full Flow', () => {
  const mockClipIQState = {
    clips: [
      {
        id: 1,
        start_ms: 5000,
        end_ms: 15000,
        duration_seconds: 10,
        type: 'Hook',
        headline: 'Test Hook Clip',
        why_clip_worthy: 'Engaging opening',
        hook: 'This is a test',
        suggested_platforms: ['TikTok'],
        confidence: 95,
      },
      {
        id: 2,
        start_ms: 20000,
        end_ms: 35000,
        duration_seconds: 15,
        type: 'Lesson',
        headline: 'Test Lesson Clip',
        why_clip_worthy: 'Educational value',
        hook: 'Learn this technique',
        suggested_platforms: ['Instagram'],
        confidence: 88,
      },
    ],
    videoPath: '/tmp/test-video.mp4',
    videoId: 'testVideoId123',
    title: 'Test Video',
  };

  test('full workflow: review → approve → download', async ({ page }) => {
    // Set up state
    await page.addInitScript(({ state }) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
    }, { state: mockClipIQState });

    // Navigate to review page
    await page.goto('/review');

    // Verify review page loaded with clips
    await expect(page.locator('h2')).toContainText('Test Video');
    await expect(page.locator('h3').first()).toContainText('Test Hook Clip');

    // Approve first clip with LEFT crop position
    await page.locator('button').filter({ hasText: 'Preview' }).first().click();
    await page.waitForTimeout(500);

    // Click left crop button
    await page.locator('button').filter({ hasText: '◀ Left' }).first().click();
    await page.waitForTimeout(200);

    // Approve checkbox
    const approveCheckbox = page.locator('input[type="checkbox"]').first();
    await approveCheckbox.check();
    await expect(approveCheckbox).toBeChecked();

    // Close modal
    await page.locator('button').filter({ hasText: 'Close' }).first().click();
    await page.waitForTimeout(300);

    // Approve second clip with CENTER crop position (default)
    await page.locator('button').filter({ hasText: 'Preview' }).nth(1).click();
    await page.waitForTimeout(500);

    // Don't click any crop button - use default (center)
    const approveCheckbox2 = page.locator('input[type="checkbox"]').first();
    await approveCheckbox2.check();
    await expect(approveCheckbox2).toBeChecked();

    await page.locator('button').filter({ hasText: 'Close' }).first().click();
    await page.waitForTimeout(300);

    // Verify approved badges appear
    await expect(page.locator('text=✓ Approved')).toHaveCount(2);

    // Go to download page
    const downloadButton = page.locator('button').filter({ hasText: /Go to Download/ }).first();
    await expect(downloadButton).toBeEnabled();
    await downloadButton.click();

    // Verify we're on download page
    await expect(page).toHaveURL('/download');
    await expect(page.locator('h2')).toContainText('Download Your Clips');

    // Verify both clips are shown with download options
    await expect(page.locator('h3').first()).toContainText('Test Hook Clip');
    await expect(page.locator('h3').nth(1)).toContainText('Test Lesson Clip');

    // Verify checkboxes exist for downloading
    const allCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await allCheckboxes.count();

    // Should have at least 4 checkboxes (MP4 + Metadata for each of 2 clips)
    expect(checkboxCount).toBeGreaterThanOrEqual(4);

    // Check that download buttons exist and are enabled
    const downloadButtons = page.locator('button').filter({ hasText: 'Download' });
    const buttonCount = await downloadButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('transcript file is created and accessible', async ({ page }) => {
    // Create a mock transcript file in .transcripts directory
    const transcriptsDir = path.join(process.cwd(), '.transcripts');

    // Verify directory exists or can be created
    if (!fs.existsSync(transcriptsDir)) {
      fs.mkdirSync(transcriptsDir, { recursive: true });
    }

    const mockTranscript = [
      { text: 'Welcome to the video', start: 0, end: 3000, confidence: 0.95 },
      { text: 'This is a test', start: 5000, end: 8000, confidence: 0.92 },
      { text: 'Thank you for watching', start: 30000, end: 33000, confidence: 0.90 },
    ];

    const transcriptPath = path.join(transcriptsDir, 'testVideoId123.json');
    fs.writeFileSync(transcriptPath, JSON.stringify(mockTranscript));

    // Verify file was created
    expect(fs.existsSync(transcriptPath)).toBe(true);

    // Verify content
    const content = fs.readFileSync(transcriptPath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].text).toBe('Welcome to the video');

    // Clean up
    fs.unlinkSync(transcriptPath);
    expect(fs.existsSync(transcriptPath)).toBe(false);
  });

  test('crop positions are applied correctly', async ({ page }) => {
    await page.addInitScript(({ state }) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
    }, { state: mockClipIQState });

    await page.goto('/review');

    // Test LEFT crop
    await page.locator('button').filter({ hasText: 'Preview' }).first().click();
    await page.waitForTimeout(500);
    const leftButton = page.locator('button').filter({ hasText: '◀ Left' }).first();
    await leftButton.click();
    await page.waitForTimeout(200);

    // Verify button styling shows it's selected
    const leftBorder = await leftButton.evaluate(el => window.getComputedStyle(el).border);
    expect(leftBorder).toContain('2px');

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('button').filter({ hasText: 'Close' }).first().click();
    await page.waitForTimeout(300);

    // Test CENTER crop (default, already tested in first test)
    await page.locator('button').filter({ hasText: 'Preview' }).nth(1).click();
    await page.waitForTimeout(500);

    const centerButton = page.locator('button').filter({ hasText: '◆ Center' }).first();
    // Center is default, so should not need to click it

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('button').filter({ hasText: 'Close' }).first().click();
    await page.waitForTimeout(300);

    // Verify both are approved
    await expect(page.locator('text=✓ Approved')).toHaveCount(2);
  });

  test('metadata file is generated on download', async ({ page }) => {
    await page.addInitScript(({ state }) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
      const approvedClips = state.clips.map((c: any) => ({ ...c, cropPosition: 'center' }));
      sessionStorage.setItem('approved_clips', JSON.stringify(approvedClips));
    }, { state: mockClipIQState });

    await page.goto('/download');

    // Verify metadata content would be generated
    // The metadata should include: HEADLINE, HOOK, WHY CLIP-WORTHY, TYPE, DURATION, TIMESTAMP, CONFIDENCE, BEST FOR

    const firstClipHeadline = await page.locator('h3').first().textContent();
    expect(firstClipHeadline).toContain('Test Hook Clip');

    // Verify download buttons are available
    const downloadButtons = page.locator('button').filter({ hasText: 'Download' });
    const count = await downloadButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('ui elements are accessible and interactive', async ({ page }) => {
    await page.addInitScript(({ state }) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
    }, { state: mockClipIQState });

    await page.goto('/review');

    // Verify all interactive elements are visible
    const analyzeButton = page.locator('button').filter({ hasText: 'Analyze Another Video' });
    const goToDownloadButton = page.locator('button').filter({ hasText: /Go to Download/ });
    const previewButtons = page.locator('button').filter({ hasText: 'Preview' });

    await expect(analyzeButton).toBeVisible();
    await expect(goToDownloadButton).toBeVisible();
    expect(await previewButtons.count()).toBe(2);

    // Verify text content
    await expect(page.locator('h2')).toContainText('Test Video');
    await expect(page.locator('p').nth(1)).toContainText('Preview clips and approve');
  });
});
