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
    // Selector based on button type="submit" inside the first form (email login)
    await page.locator('form').first().locator('button[type="submit"]').click();

    // Expect redirection to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Expect session persistence/user info
    // Adjust selector based on actual dashboard implementation
    // await expect(page.locator('text=Admin User')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.locator('form').first().locator('button[type="submit"]').click();

    // Expect error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    // Ensure still on login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
