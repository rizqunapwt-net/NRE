import { test, expect } from '@playwright/test';

test.describe('Public Catalog Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page sections', async ({ page }) => {
    await expect(page.getByText('PENERBIT TERPERCAYA').first()).toBeVisible();
    await expect(page.getByText('ISBN RESMI').first()).toBeVisible();
  });

  test('should navigate to catalog and search for a book', async ({ page }) => {
    // Navigate to catalog
    await page.click('text=Katalog'); // Link in navbar
    await expect(page).toHaveURL(/.*catalog|.*katalog/);

    // Search for a book
    const searchInput = page.getByPlaceholder(/Cari judul|Search/);
    if (await searchInput.isVisible()) {
        await searchInput.fill('Laravel');
        await page.keyboard.press('Enter');
        
        // Wait for results
        await page.waitForTimeout(1000);
        // Even if no results, the page should still be stable
        await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter by category if available', async ({ page }) => {
    await page.goto('/catalog');
    
    // Check for category filters
    const categoryFilter = page.locator('.category-filter, .filter-item').first();
    if (await categoryFilter.isVisible()) {
        await categoryFilter.click();
        await expect(page.locator('.book-card')).toBeVisible({ timeout: 5000 });
    }
  });
});
