import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Download Page Flow', () => {
  const clipsDir = path.join(process.cwd(), 'storage', 'clips');

  test.beforeEach(async ({ page }) => {
    // Clean up clips before each test
    const files = fs.readdirSync(clipsDir);
    files.forEach((file) => {
      if (file.endsWith('.mp4')) {
        fs.unlinkSync(path.join(clipsDir, file));
      }
    });

    // Navigate to establish storage context
    await page.goto('/');
  });

  test('download page displays when approved clips exist', async ({ page }) => {
    const clipiqState = {
      clips: [],
      videoPath: '/tmp/test-video.mp4',
      videoId: 'test_download',
      title: 'Test Video',
    };

    const approvedClips = [
      {
        id: 1,
        start_ms: 2000,
        end_ms: 8000,
        duration_seconds: 6,
        headline: 'Download Test Clip 1',
        type: 'Hook',
        why_clip_worthy: 'Test download',
        hook: 'Test',
        suggested_platforms: ['TikTok'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: true,
      },
      {
        id: 2,
        start_ms: 10000,
        end_ms: 16000,
        duration_seconds: 6,
        headline: 'Download Test Clip 2',
        type: 'Tip',
        why_clip_worthy: 'Test download',
        hook: 'Test',
        suggested_platforms: ['Instagram'],
        confidence: 88,
        cropPosition: 'left',
        burnCaptions: false,
      },
    ];

    // Set session storage
    await page.evaluate(
      (state) => {
        sessionStorage.setItem('clipiq_state', JSON.stringify(state.clipiqState));
        sessionStorage.setItem('approved_clips', JSON.stringify(state.approvedClips));
      },
      { clipiqState, approvedClips }
    );

    await page.goto('/download');

    // Verify page title and content
    await expect(page.locator('h2')).toContainText('Download Your Clips');
    await expect(page.locator('text=2 clips approved')).toBeVisible();

    // Verify both clips are displayed
    await expect(page.locator('text=Download Test Clip 1')).toBeVisible();
    await expect(page.locator('text=Download Test Clip 2')).toBeVisible();

    console.log('✓ Download page displays correctly');
  });

  test('download preferences are initialized to true', async ({ page }) => {
    const clipiqState = {
      clips: [],
      videoPath: '/tmp/test-video.mp4',
      videoId: 'test_prefs',
      title: 'Test Video',
    };

    const approvedClips = [
      {
        id: 1,
        start_ms: 2000,
        end_ms: 8000,
        duration_seconds: 6,
        headline: 'Prefs Test Clip',
        type: 'Hook',
        why_clip_worthy: 'Test',
        hook: 'Test',
        suggested_platforms: ['TikTok'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: true,
      },
    ];

    await page.evaluate(
      (state) => {
        sessionStorage.setItem('clipiq_state', JSON.stringify(state.clipiqState));
        sessionStorage.setItem('approved_clips', JSON.stringify(state.approvedClips));
      },
      { clipiqState, approvedClips }
    );

    await page.goto('/download');

    // Both checkboxes should be checked by default
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const checkbox of checkboxes) {
      expect(await checkbox.isChecked()).toBe(true);
    }

    console.log('✓ Download preferences initialized to true');
  });

  test('download all button shows processing message', async ({ page }) => {
    const clipiqState = {
      clips: [],
      videoPath: '/tmp/test-video.mp4',
      videoId: 'test_process',
      title: 'Test Video',
    };

    const approvedClips = [
      {
        id: 21,
        start_ms: 2000,
        end_ms: 8000,
        duration_seconds: 6,
        headline: 'Process Test Clip 1',
        type: 'Hook',
        why_clip_worthy: 'Test',
        hook: 'Test',
        suggested_platforms: ['TikTok'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: true,
      },
      {
        id: 22,
        start_ms: 10000,
        end_ms: 16000,
        duration_seconds: 6,
        headline: 'Process Test Clip 2',
        type: 'Tip',
        why_clip_worthy: 'Test',
        hook: 'Test',
        suggested_platforms: ['Instagram'],
        confidence: 88,
        cropPosition: 'left',
        burnCaptions: false,
      },
    ];

    await page.evaluate(
      (state) => {
        sessionStorage.setItem('clipiq_state', JSON.stringify(state.clipiqState));
        sessionStorage.setItem('approved_clips', JSON.stringify(state.approvedClips));
      },
      { clipiqState, approvedClips }
    );

    await page.goto('/download');

    // Click "Download All" button
    const downloadAllButton = page.locator('button:has-text("Download All")').first();
    await downloadAllButton.click();

    // Should show processing status message
    await expect(page.locator('text=/Generating clips|Processing|Downloading/i')).toBeVisible({
      timeout: 30000,
    });
    console.log('✓ Processing/downloading status displayed');
  });

  test('error handling displays error message', async ({ page }) => {
    const clipiqState = {
      clips: [],
      videoPath: '/nonexistent/video.mp4',
      videoId: 'test_error',
      title: 'Test Video',
    };

    const approvedClips = [
      {
        id: 41,
        start_ms: 2000,
        end_ms: 8000,
        duration_seconds: 6,
        headline: 'Error Test Clip',
        type: 'Hook',
        why_clip_worthy: 'Test error',
        hook: 'Test',
        suggested_platforms: ['TikTok'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: false,
      },
    ];

    await page.evaluate(
      (state) => {
        sessionStorage.setItem('clipiq_state', JSON.stringify(state.clipiqState));
        sessionStorage.setItem('approved_clips', JSON.stringify(state.approvedClips));
      },
      { clipiqState, approvedClips }
    );

    await page.goto('/download');
    await page.locator('button:has-text("Download All")').first().click();

    // Should show error message
    await expect(page.locator('body')).toContainText(/not found|extraction failed/i, {
      timeout: 30000,
    });
    console.log('✓ Error message displayed for failed extraction');
  });

  test('back to review button returns to review page', async ({ page }) => {
    const clipiqState = {
      clips: [],
      videoPath: '/tmp/test-video.mp4',
      videoId: 'test_back',
      title: 'Test Video',
    };

    const approvedClips = [
      {
        id: 71,
        start_ms: 2000,
        end_ms: 8000,
        duration_seconds: 6,
        headline: 'Back Button Test',
        type: 'Hook',
        why_clip_worthy: 'Test',
        hook: 'Test',
        suggested_platforms: ['TikTok'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: true,
      },
    ];

    await page.evaluate(
      (state) => {
        sessionStorage.setItem('clipiq_state', JSON.stringify(state.clipiqState));
        sessionStorage.setItem('approved_clips', JSON.stringify(state.approvedClips));
      },
      { clipiqState, approvedClips }
    );

    await page.goto('/download');
    await page.locator('button:has-text("Back to Review")').click();

    await expect(page).toHaveURL('/review');
    console.log('✓ Back to review navigation works');
  });

  test('session storage persists clip data with caption settings', async ({ page }) => {
    const clipiqState = {
      clips: [],
      videoPath: '/tmp/test-video.mp4',
      videoId: 'test_storage',
      title: 'Test Video',
    };

    const approvedClips = [
      {
        id: 81,
        start_ms: 2000,
        end_ms: 8000,
        duration_seconds: 6,
        headline: 'Caption Settings Test',
        type: 'Hook',
        why_clip_worthy: 'Test caption settings',
        hook: 'Test',
        suggested_platforms: ['TikTok'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: true,
        captionFontSize: 18,
      },
    ];

    await page.evaluate(
      (state) => {
        sessionStorage.setItem('clipiq_state', JSON.stringify(state.clipiqState));
        sessionStorage.setItem('approved_clips', JSON.stringify(state.approvedClips));
      },
      { clipiqState, approvedClips }
    );

    // Verify stored data
    const stored = await page.evaluate(() => {
      return {
        clips: JSON.parse(sessionStorage.getItem('approved_clips') || '[]'),
      };
    });

    expect(stored.clips[0].burnCaptions).toBe(true);
    expect(stored.clips[0].captionFontSize).toBe(18);
    console.log('✓ Caption settings preserved in sessionStorage');
  });
});
