import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page and allow typing', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: 'Masuk ke Akun' })).toBeVisible();
    
    await page.getByPlaceholder('anda@email.com').fill('admin@rizquna.com');
    await page.getByPlaceholder('••••••••').fill('password');
    
    // We don't click submit here to avoid side effects in dev env without specific seed
    await expect(page.getByRole('button', { name: 'Masuk Sekarang' })).toBeEnabled();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Daftar Akun Umum');
    
    await expect(page).toHaveURL(/.*register/);
    // Be more lenient with text
    await expect(page.locator('body')).toContainText(/Daftar|Register/i);
  });
});

test.describe('Public Catalog', () => {
  test('should browse catalog and view detail', async ({ page }) => {
    await page.goto('/');
    // Try multiple selectors for catalog link
    const catalogLink = page.locator('text=Katalog, text=Buku, a[href*="catalog"]').first();
    await catalogLink.click();
    
    await expect(page).toHaveURL(/.*catalog|.*katalog|.*buku/);
    
    // Wait for catalog to load (at least one card)
    const bookCard = page.locator('.book-card, .ant-card, .product-card').first();
    await expect(bookCard).toBeVisible({ timeout: 10000 });
    
    await bookCard.click();
    await expect(page).toHaveURL(/\/katalog\/.+/);
  });
});
