import { test, expect } from '@playwright/test';

test.describe('Registration and Auth Flow', () => {
  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Daftar Akun Umum');
    await expect(page).toHaveURL(/.*register/);

    const uniqueId = Math.floor(Math.random() * 10000);
    const testEmail = `testuser_${uniqueId}@example.com`;
    const testName = `Test User ${uniqueId}`;

    await page.getByPlaceholder(/Nama Lengkap|Full Name/).fill(testName);
    await page.getByPlaceholder(/anda@email.com/).fill(testEmail);
    await page.getByPlaceholder('••••••••').nth(0).fill('password123');
    await page.getByPlaceholder('••••••••').nth(1).fill('password123');
    
    // Fill phone if visible
    const phoneInput = page.getByPlaceholder(/Nomor HP|Phone/);
    if (await phoneInput.isVisible()) {
        await phoneInput.fill('08123456789');
    }

    // Click register
    await page.click('button:has-text("Daftar Akun")');

    // Should redirect to dashboard or login with success message
    await expect(page).toHaveURL(/.*dashboard|.*login/);
    
    // If it goes to login, try logging in
    if (page.url().includes('login')) {
        await page.getByPlaceholder('anda@email.com').fill(testEmail);
        await page.getByPlaceholder('••••••••').fill('password123');
        await page.click('button:has-text("Masuk Sekarang")');
        await expect(page).toHaveURL(/.*dashboard/);
    }
  });

  test('should prevent login with wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('anda@email.com').fill('admin@rizquna.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');
    await page.click('button:has-text("Masuk Sekarang")');
    
    // Should show error message
    await expect(page.locator('.ant-message, .alert, .error-message')).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });
});
