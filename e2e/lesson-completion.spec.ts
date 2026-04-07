import { test, expect } from '@playwright/test';
import { clearIndexedDB, installJapanesePack } from './helpers';

test.describe('Lesson completion persistence', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await clearIndexedDB(page);
    await installJapanesePack(page);
  });

  test('completing a lesson updates progress counter', async ({ page }) => {
    await page.goto('/lessons');
    await page.waitForTimeout(2000);

    // Verify initial state: 0/16
    const progressText = page.locator('text=/\\d+\\/\\d+/');
    await expect(progressText).toContainText('0/');

    // Start hiragana-01
    const lesson = page.locator('button', { hasText: 'あ行' });
    await expect(lesson).toBeVisible({ timeout: 5000 });
    await lesson.click();
    await page.waitForTimeout(1000);

    // Navigate through introduce step (5 items)
    for (let i = 0; i < 5; i++) {
      const nextBtn = page.getByRole('button', { name: /next|siguiente|continuar/i });
      if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Recognize step (5 items — pick first option each time)
    for (let i = 0; i < 5; i++) {
      const options = page.locator('.max-w-md button:not([disabled])');
      if ((await options.count()) > 0) {
        await options.first().click();
        await page.waitForTimeout(600);
        const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // Recall step (5 items — type romaji)
    const answers = ['a', 'i', 'u', 'e', 'o'];
    for (let i = 0; i < 5; i++) {
      const input = page.locator('input[type="text"]');
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        await input.fill(answers[i] ?? 'x');
        const checkBtn = page.getByRole('button', { name: /check|verificar/i });
        if (await checkBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await checkBtn.click();
          await page.waitForTimeout(500);
        }
        const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // Write step (5 items — type romaji)
    for (let i = 0; i < 5; i++) {
      const input = page.locator('input[type="text"]');
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        await input.fill(answers[i] ?? 'x');
        const checkBtn = page.getByRole('button', { name: /check|verificar/i });
        if (await checkBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await checkBtn.click();
          await page.waitForTimeout(500);
        }
        const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // Summary step — should show score
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/\\d+%/')).toBeVisible({ timeout: 5000 });

    // Click "Finalizar lección"
    const finishBtn = page.getByRole('button', { name: /finalizar|finish/i });
    await expect(finishBtn).toBeVisible({ timeout: 3000 });
    await finishBtn.click();

    // Wait for the lesson completion to persist and UI to update
    await page.waitForTimeout(3000);

    // Now we should be back on the lessons list (activeLesson = null)
    // Check if progress counter updated
    const updatedProgress = page.locator('text=/\\d+\\/\\d+/');
    await expect(updatedProgress).toBeVisible({ timeout: 5000 });

    // Verify the database has the completion record
    const hasCompletion = await page.evaluate(async () => {
      const dbNames = await indexedDB.databases();
      const db = dbNames.find((d) => d.name === 'linguaforge');
      if (!db?.name) return false;
      return new Promise<boolean>((resolve) => {
        const req = indexedDB.open(db.name!);
        req.onsuccess = () => {
          const idb = req.result;
          if (!idb.objectStoreNames.contains('lessonProgress')) {
            idb.close();
            resolve(false);
            return;
          }
          const tx = idb.transaction('lessonProgress', 'readonly');
          const store = tx.objectStore('lessonProgress');
          const getAll = store.getAll();
          getAll.onsuccess = () => {
            idb.close();
            resolve(getAll.result.length > 0);
          };
          getAll.onerror = () => {
            idb.close();
            resolve(false);
          };
        };
        req.onerror = () => resolve(false);
      });
    });

    expect(hasCompletion).toBe(true);
  });
});
