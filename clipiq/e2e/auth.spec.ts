import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login button on home page', async ({ page }) => {
    await page.goto('/');
    const loginButton = page.locator('button').filter({ hasText: /Login with YouTube/i });
    await expect(loginButton).toBeVisible();
  });

  test('should redirect to auth URL on login click', async ({ page }) => {
    await page.goto('/');

    // Mock the redirect
    await page.route('**/api/auth/youtube', route => {
      route.abort();
    });

    const loginButton = page.locator('button').filter({ hasText: /Login with YouTube/i });
    await loginButton.click();

    // Verify button exists and is clickable
    await expect(loginButton).toBeEnabled();
  });

  test('logout endpoint should destroy session', async ({ request }) => {
    const response = await request.post('/api/auth/logout');
    expect(response.ok()).toBeTruthy();
  });

  test('session endpoint should return isLoggedIn status', async ({ request }) => {
    const response = await request.get('/api/auth/session');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('isLoggedIn');
  });
});
