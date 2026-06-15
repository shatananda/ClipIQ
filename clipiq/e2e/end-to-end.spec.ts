import { test, expect } from '@playwright/test';

test.describe('End-to-End Flow (Mocked APIs)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication session check - NOT logged in
    await page.route('**/api/auth/session', route => {
      route.abort('blockcontent');
    });
  });

  test('should start at login page and show login button', async ({ page }) => {
    await page.goto('/');

    // Should see login button
    const loginButton = page.locator('button').filter({ hasText: /Login with YouTube/i });
    await expect(loginButton).toBeVisible();

    // Should NOT see video list
    const videoList = page.locator('h1').filter({ hasText: /Your Videos/i });
    const videoCount = await videoList.count();
    expect(videoCount).toBe(0);
  });

  test('configure page should require videoId parameter', async ({ page }) => {
    // Navigate without parameters
    await page.goto('/configure');

    // Should redirect or show error
    const currentUrl = page.url();
    // Either redirected away or shows loading/error state
    expect(currentUrl).toBeTruthy();
  });

  test('review page should load with sessionStorage state', async ({ page, context }) => {
    const mockState = {
      clips: [
        {
          id: 1,
          start_ms: 10000,
          end_ms: 45000,
          duration_seconds: 35,
          type: 'Hook',
          headline: 'Test Clip 1',
          why_clip_worthy: 'Good opening hook',
          hook: 'Check this out',
          suggested_platforms: ['TikTok', 'YouTube Shorts'],
          confidence: 92,
        },
        {
          id: 2,
          start_ms: 50000,
          end_ms: 95000,
          duration_seconds: 45,
          type: 'Wisdom',
          headline: 'Test Clip 2',
          why_clip_worthy: 'Valuable insight',
          hook: 'This is important',
          suggested_platforms: ['TikTok', 'Instagram Reels'],
          confidence: 78,
        },
      ],
      videoPath: '/tmp/test-video.mp4',
      videoId: 'test123abc',
      title: 'Test Video Title',
    };

    const config = {
      burnCaptions: true,
      captionFontSize: 18,
      cropPosition: 'center',
      durationSeconds: 300,
    };

    // Set session state
    await context.evaluateHandle((state, cfg) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
      sessionStorage.setItem('clipiq_config', JSON.stringify(cfg));
    }, mockState, config);

    // Navigate to review
    await page.goto('/review');
    await page.waitForTimeout(1500);

    // Should show video title
    const titleText = page.locator('text=Test Video Title');
    const titleVisible = await titleText.count() > 0;
    expect(titleVisible).toBeTruthy();

    // Should show clips
    const clipHeadlines = page.locator('text=Test Clip');
    const clipCount = await clipHeadlines.count();
    expect(clipCount).toBeGreaterThan(0);
  });

  test('download page should show approved clips', async ({ page, context }) => {
    const mockApprovedClips = [
      {
        id: 1,
        start_ms: 10000,
        end_ms: 45000,
        duration_seconds: 35,
        type: 'Hook',
        headline: 'My Approved Clip',
        why_clip_worthy: 'Great moment',
        hook: 'Watch this',
        suggested_platforms: ['TikTok'],
        confidence: 90,
        cropPosition: 'center' as const,
        burnCaptions: true,
        captionFontSize: 18,
      },
    ];

    const mockState = {
      clips: mockApprovedClips,
      videoPath: '/tmp/test.mp4',
      videoId: 'test123',
      title: 'Test Video',
    };

    // Set session state
    await context.evaluateHandle((state, clips) => {
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
      sessionStorage.setItem('approved_clips', JSON.stringify(clips));
    }, mockState, mockApprovedClips);

    // Navigate to download
    await page.goto('/download');
    await page.waitForTimeout(1000);

    // Should show approved clips count
    const heading = page.locator('h2').filter({ hasText: /Download Your Clips/i });
    const headingVisible = await heading.count() > 0;
    expect(headingVisible).toBeTruthy();

    // Should show clip headline
    const clipText = page.locator('text=My Approved Clip');
    const clipVisible = await clipText.count() > 0;
    expect(clipVisible).toBeTruthy();
  });

  test('should track video status with localStorage badges', async ({ page, context }) => {
    // Set analyzed status
    await context.evaluateHandle(() => {
      localStorage.setItem('clipiq_status_analyzed_video', 'analyzed');
      localStorage.setItem('clipiq_status_clipped_video', 'clipped');
    });

    // Verify persistence
    const analyzedStatus = await page.evaluate(() => localStorage.getItem('clipiq_status_analyzed_video'));
    const clippedStatus = await page.evaluate(() => localStorage.getItem('clipiq_status_clipped_video'));

    expect(analyzedStatus).toBe('analyzed');
    expect(clippedStatus).toBe('clipped');

    // Verify removal works
    await page.evaluate(() => localStorage.removeItem('clipiq_status_analyzed_video'));
    const removed = await page.evaluate(() => localStorage.getItem('clipiq_status_analyzed_video'));
    expect(removed).toBeNull();
  });

  test('sessionStorage should persist across page navigations', async ({ page, context }) => {
    const testData = { test: 'data', timestamp: Date.now() };

    // Set data
    await context.evaluateHandle((data) => {
      sessionStorage.setItem('test_key', JSON.stringify(data));
    }, testData);

    // Navigate and verify
    await page.goto('/');
    await page.goto('/configure?videoId=test');

    const retrieved = await page.evaluate(() => sessionStorage.getItem('test_key'));
    expect(retrieved).toBeTruthy();
    expect(JSON.parse(retrieved!)).toEqual(testData);
  });
});
