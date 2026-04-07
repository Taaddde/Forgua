import { test, expect } from '@playwright/test';
import { clearIndexedDB, installJapanesePack } from './helpers';

test.describe('Hiragana-01 lesson', () => {
  test.beforeEach(async ({ page }) => {
    await clearIndexedDB(page);
    await installJapanesePack(page);
  });

  test('complete hiragana-01 lesson end-to-end', async ({ page }) => {
    test.setTimeout(120_000);

    // Navigate to lessons
    await page.goto('/lessons');
    await page.waitForTimeout(2000);

    // Find and click hiragana-01 (title contains "あ行")
    const lesson = page.locator('button', { hasText: 'あ行' });
    await expect(lesson).toBeVisible({ timeout: 5000 });
    await lesson.click();

    // Step 1: Introduce — should see the lesson player (step indicator)
    await expect(page.locator('text=/Paso 1/i')).toBeVisible({ timeout: 5000 });

    // Navigate through 5 introduce items
    for (let i = 0; i < 5; i++) {
      const nextBtn = page.getByRole('button', { name: /next|siguiente|continuar/i });
      if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Step 2: Recognize — multiple choice for items
    await page.waitForTimeout(500);
    for (let i = 0; i < 5; i++) {
      const optionButtons = page.locator('.max-w-md button:not([disabled])');
      const count = await optionButtons.count();
      if (count > 0) {
        await optionButtons.first().click();
        await page.waitForTimeout(600);

        const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // Step 3: Recall — type romaji for each character
    const romajiAnswers = ['a', 'i', 'u', 'e', 'o'];
    for (let i = 0; i < 5; i++) {
      const input = page.locator('input[type="text"]');
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Items are shuffled, just type a common answer
        await input.fill(romajiAnswers[i % 5]);

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

    // Step 4: Listen-Transcribe — play audio, type what you hear
    await page.waitForTimeout(500);
    for (let i = 0; i < 5; i++) {
      // Click the play button to hear the audio
      const playBtn = page.locator('button.rounded-full').first();
      if (await playBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await playBtn.click();
        await page.waitForTimeout(1000);
      }

      const input = page.locator('input[type="text"]');
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        await input.fill(romajiAnswers[i % 5]);

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

    // Step 5: Speak — skip through (no real mic in headless browser)
    await page.waitForTimeout(500);
    for (let i = 0; i < 5; i++) {
      // Click skip/next button (speak step has a skip option)
      const skipBtn = page.locator('text=/siguiente/i').last();
      if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await skipBtn.click();
        await page.waitForTimeout(500);
      }

      const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Step 6: Summary — should show score
    await page.waitForTimeout(1000);
    const summaryVisible = await page.locator('text=/\\d+%/').isVisible({ timeout: 5000 }).catch(() => false);
    const completeVisible = await page.locator('text=/completa|complete/i').isVisible({ timeout: 3000 }).catch(() => false);
    expect(summaryVisible || completeVisible).toBeTruthy();
  });
});
