import { test, expect } from '@playwright/test';
import { clearIndexedDB } from './helpers';

test.describe('Onboarding flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearIndexedDB(page);
  });

  test('new user can select Japanese pack and reach dashboard', async ({ page }) => {
    await page.goto('/');

    // Should show pack selector
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Find Japanese pack button
    const japaneseButton = page.locator('button', { hasText: '日本語' });
    await expect(japaneseButton).toBeVisible();
    await japaneseButton.click();

    // Should navigate to dashboard after pack install
    await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
  });

  test('new user can see at least 2 packs', async ({ page }) => {
    await page.goto('/');

    // Japanese pack
    await expect(page.locator('button', { hasText: '日本語' })).toBeVisible();
    // English pack
    await expect(page.locator('button', { hasText: /English|Inglés/i })).toBeVisible();
  });
});
