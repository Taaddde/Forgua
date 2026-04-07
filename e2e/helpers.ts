import type { Page } from '@playwright/test';

/**
 * Clear IndexedDB to ensure a fresh state for each test.
 */
export async function clearIndexedDB(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(async () => {
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
  });
  await page.reload();
  await page.waitForTimeout(1000);
}

/**
 * Navigate to the pack selector page.
 * The dashboard shows a welcome button when no pack is active.
 */
export async function goToPackSelector(page: Page): Promise<void> {
  await page.goto('/');
  // Dashboard shows "Elegí tu idioma" button when no pack is active
  const selectBtn = page.getByRole('button', { name: /eleg|choose/i });
  if (await selectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await selectBtn.click();
    await page.waitForTimeout(1000);
  } else {
    await page.goto('/pack-selector');
    await page.waitForTimeout(1000);
  }
}

/**
 * Install the Japanese pack and wait for it to complete.
 * Pack name is "Japonés" (Spanish UI), nativeName is "日本語".
 */
export async function installJapanesePack(page: Page): Promise<void> {
  await goToPackSelector(page);
  const japaneseButton = page.locator('button', { hasText: 'Japonés' });
  if (await japaneseButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await japaneseButton.click();
    await page.waitForTimeout(5000);
  }
}
