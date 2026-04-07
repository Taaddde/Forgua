import { test, expect } from '@playwright/test';
import { clearIndexedDB, installJapanesePack } from './helpers';

test.describe('RecognizeStep answer visibility', () => {
  test.beforeEach(async ({ page }) => {
    await clearIndexedDB(page);
    await installJapanesePack(page);
  });

  test('reading is NOT shown alongside the character in recognize step', async ({ page }) => {
    await page.goto('/lessons');
    await page.waitForTimeout(2000);

    const lesson = page.locator('button', { hasText: 'あ行' });
    await expect(lesson).toBeVisible({ timeout: 5000 });
    await lesson.click();
    await page.waitForTimeout(1000);

    // Advance past Introduce step (5 items)
    for (let i = 0; i < 5; i++) {
      const nextBtn = page.getByRole('button', { name: /next|siguiente|continuar/i });
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Now in RecognizeStep — the prompt card should show "あ" but NOT "a" as a hint
    await page.waitForTimeout(500);
    const card = page.locator('.rounded-2xl.p-8');
    await expect(card).toBeVisible({ timeout: 3000 });

    // Check that there's no small reading hint text inside the card
    const readingHint = card.locator('span.text-sm.text-slate-500');
    await expect(readingHint).toHaveCount(0);
  });
});
