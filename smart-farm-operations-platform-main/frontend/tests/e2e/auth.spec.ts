import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('login screen renders and toggles modes', async ({ page }) => {
    await page.goto('/login');

    // Verify initial OTP request form
    await expect(page.locator('text=Login to Smart Farm')).toBeVisible();
    await expect(page.locator('button:has-text("Send OTP")')).toBeVisible();

    // Toggle to password mode
    await page.click('text=Login with Password');
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();

    // Toggle back to OTP mode
    await page.click('text=Login with OTP');
    await expect(page.locator('button:has-text("Send OTP")')).toBeVisible();
  });
});
