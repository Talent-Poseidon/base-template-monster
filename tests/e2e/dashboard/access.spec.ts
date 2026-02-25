import { test, expect } from '@playwright/test';

test.describe('Dashboard Access Control', () => {
  test('should redirect guest to login page', async ({ page }) => {
    await page.goto('/dashboard');
    // Expect redirect to login with callbackUrl or just login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('should allow authenticated admin to access dashboard', async ({ page }) => {
    // Perform login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.locator('form').first().locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/);

    // Verify dashboard access
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Optional: Check specific admin element if any
    // await expect(page.locator('h1')).toHaveText('Dashboard');
  });
});
