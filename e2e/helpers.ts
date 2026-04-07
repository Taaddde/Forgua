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
 * Install the Japanese pack and wait for it to complete.
 */
export async function installJapanesePack(page: Page): Promise<void> {
  await page.goto('/');
  const japaneseButton = page.locator('button', { hasText: '日本語' });
  if (await japaneseButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await japaneseButton.click();
    await page.waitForTimeout(5000);
  }
}
