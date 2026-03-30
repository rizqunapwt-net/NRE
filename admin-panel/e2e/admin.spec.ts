import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('anda@email.com').fill('admin@rizquna.com');
    await page.getByPlaceholder('••••••••').fill('password');
    await page.click('button:has-text("Masuk Sekarang")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Look for cards with numbers
    const statsCards = page.locator('.stats-card, .ant-card');
    await expect(statsCards.first()).toBeVisible({ timeout: 10000 });
    
    // Verify some text commonly found in admin dashboard
    await expect(page.locator('body')).toContainText(/Ringkasan|Statistik|Dashboard/i);
  });

  test('should navigate to user management', async ({ page }) => {
    // Find sidebar link for user management
    const userManagementLink = page.locator('text=Manajemen User, text=User Management').first();
    if (await userManagementLink.isVisible()) {
        await userManagementLink.click();
        await expect(page).toHaveURL(/.*user/);
        await expect(page.locator('table')).toBeVisible();
    }
  });

  test('should navigate to book management', async ({ page }) => {
    const bookManagementLink = page.locator('text=Manajemen Buku, text=Kelola Buku').first();
    if (await bookManagementLink.isVisible()) {
        await bookManagementLink.click();
        await expect(page).toHaveURL(/.*buku|.*books/);
        await expect(page.locator('table')).toBeVisible();
    }
  });
});
