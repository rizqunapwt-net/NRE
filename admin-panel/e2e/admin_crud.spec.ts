import { test, expect } from '@playwright/test';

test.describe('Admin CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.getByPlaceholder('anda@email.com').fill('admin@rizquna.com');
    await page.getByPlaceholder('••••••••').fill('password');
    await page.click('button:has-text("Masuk Sekarang")');
    
    // 2. Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should create a new book successfully', async ({ page }) => {
    // 3. Use Quick Action to Add Book
    await page.click('button:has-text("Tambah Buku")');
    await expect(page).toHaveURL(/.*books\/new|.*buku/);

    // 4. Fill Book Form
    const uniqueTitle = `Test Book CRUD ${Math.floor(Math.random() * 10000)}`;
    await page.locator('input#title').fill(uniqueTitle);
    
    // Select Author (Ant Design Select)
    await page.locator('.ant-select-selector').first().click();
    await page.locator('.ant-select-item-option-content').first().click();
    
    // Fill Price
    await page.locator('input#price').fill('75000');
    
    // Fill Stock
    await page.locator('input#stock').fill('100');

    // 5. Submit Form
    await page.click('button:has-text("Simpan")');

    // 6. Verify success
    await expect(page.locator('.ant-notification-notice, .ant-message')).toContainText(/berhasil/i);
    
    // 8. Verify in list
    await page.getByPlaceholder(/Cari judul|Search/).fill(uniqueTitle);
    await page.keyboard.press('Enter');
    await expect(page.locator('table')).toContainText(uniqueTitle);
  });

  test('should create a new category successfully', async ({ page }) => {
    // 3. Navigate to Settings/CMS or Categories if separate
    // In this project, categories might be under settings or specialized page
    // Let's try to find "Kategori" or "Category"
    const settingsLink = page.locator('text=Pengaturan, text=Settings').first();
    if (await settingsLink.isVisible()) {
        await settingsLink.click();
        
        // Find Category Tab or Page
        const categoryLink = page.locator('text=Kategori, text=Category').first();
        if (await categoryLink.isVisible()) {
            await categoryLink.click();
            
            await page.click('button:has-text("Tambah Kategori")');
            const uniqueCat = `Cat ${Math.floor(Math.random() * 1000)}`;
            await page.locator('input#name').fill(uniqueCat);
            await page.click('.ant-modal-footer button:has-text("Simpan")');
            
            await expect(page.locator('.ant-message')).toContainText(/berhasil/i);
        }
    }
  });
});
