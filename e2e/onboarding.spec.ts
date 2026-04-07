import { test, expect } from '@playwright/test';
import { clearIndexedDB, goToPackSelector } from './helpers';

test.describe('Onboarding flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearIndexedDB(page);
  });

  test('new user can select Japanese pack and reach dashboard', async ({ page }) => {
    await goToPackSelector(page);

    // Pack selector page shows packs with Spanish names
    const japaneseButton = page.locator('button', { hasText: 'Japonés' });
    await expect(japaneseButton).toBeVisible({ timeout: 5000 });
    await japaneseButton.click();

    // Should navigate to dashboard after pack install
    await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
  });

  test('new user can see at least 2 packs', async ({ page }) => {
    await goToPackSelector(page);

    // Japanese pack (name: "Japonés", nativeName: "日本語")
    await expect(page.locator('button', { hasText: 'Japonés' })).toBeVisible({ timeout: 5000 });
    // English pack (name: "Inglés", nativeName: "English")
    await expect(page.locator('button', { hasText: 'Inglés' })).toBeVisible({ timeout: 5000 });
  });
});
