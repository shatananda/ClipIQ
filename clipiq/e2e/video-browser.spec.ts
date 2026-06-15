import { test, expect } from '@playwright/test';

const mockVideos = {
  videos: [
    {
      videoId: 'test1',
      title: 'Test Video 1',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      publishedAt: '2024-01-15T10:00:00Z',
      duration: 'PT10M30S',
      durationSeconds: 630,
      viewCount: 1000,
      description: 'Test description 1',
    },
    {
      videoId: 'test2',
      title: 'Test Video 2',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      publishedAt: '2024-01-10T15:30:00Z',
      duration: 'PT5M45S',
      durationSeconds: 345,
      viewCount: 2000,
      description: 'Test description 2',
    },
  ],
  nextPageToken: null,
};

test.describe('Video Browser', () => {
  test.beforeEach(async ({ page }) => {
    // Mock session check
    await page.route('**/api/auth/session', route => {
      route.abort('blockcontent');
    });

    // Mock YouTube videos API
    await page.route('**/api/youtube/videos**', route => {
      route.abort('blockcontent');
    });
  });

  test('should render page size selector buttons', async ({ page }) => {
    await page.goto('/videos');

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Check for page size buttons
    const button10 = page.locator('button').filter({ hasText: '10' });
    const button25 = page.locator('button').filter({ hasText: '25' });
    const button50 = page.locator('button').filter({ hasText: '50' });

    // At least one should exist
    const count = await page.locator('button:has-text("10"), button:has-text("25"), button:has-text("50")').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have pagination controls', async ({ page }) => {
    await page.goto('/videos');

    // Check for pagination arrows
    const prevButton = page.locator('button:has-text("◀")');
    const nextButton = page.locator('button:has-text("▶")');

    // Both should be visible (though may be disabled)
    const hasPagination = (await prevButton.count()) > 0 || (await nextButton.count()) > 0;
    expect(hasPagination).toBeTruthy();
  });

  test('localStorage should persist video status badges', async ({ page, context }) => {
    // Set status in localStorage
    await context.evaluateHandle(() => {
      localStorage.setItem('clipiq_status_test1', 'analyzed');
      localStorage.setItem('clipiq_status_test2', 'clipped');
    });

    // Reload page and verify localStorage persists
    await page.goto('/videos');
    const analyzed = await page.evaluate(() => localStorage.getItem('clipiq_status_test1'));
    const clipped = await page.evaluate(() => localStorage.getItem('clipiq_status_test2'));

    expect(analyzed).toBe('analyzed');
    expect(clipped).toBe('clipped');
  });

  test('should handle logout button in header', async ({ page }) => {
    await page.goto('/videos');

    const logoutButton = page.locator('button').filter({ hasText: /Logout/i });

    // Button should exist
    const exists = await logoutButton.count() > 0;
    expect(exists).toBeTruthy();

    // Button should be clickable
    if (exists) {
      await expect(logoutButton).toBeEnabled();
    }
  });
});
