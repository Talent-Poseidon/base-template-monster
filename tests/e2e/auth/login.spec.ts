import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  // Ensure we start with a fresh session (though config handles this, explicit is better)
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should login successfully with valid admin credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill credentials
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Click sign in button
    await page.locator('form').first().locator('button[type="submit"]').click();

    // Wait for redirect with explicit timeout (CI can be slow)
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.locator('form').first().locator('button[type="submit"]').click();

    // Expect error message (Indonesian locale)
    await expect(page.locator('text=Email atau password salah')).toBeVisible();
    // Ensure still on login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
