import { test, expect } from '@playwright/test';
import { clearIndexedDB, goToPackSelector } from './helpers';

test.describe('Full learner journey', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await clearIndexedDB(page);
  });

  test('complete Japanese learning journey', async ({ page }) => {
    // === ONBOARDING ===
    await goToPackSelector(page);

    const jpBtn = page.locator('button', { hasText: 'Japonés' });
    await expect(jpBtn).toBeVisible({ timeout: 5000 });
    await jpBtn.click();
    await page.waitForTimeout(5000);

    // === DASHBOARD ===
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'e2e/screenshots/01-dashboard.png' });

    // === LESSONS PAGE ===
    await page.goto('/lessons');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/02-lessons-list.png' });

    // First lesson should be visible (title contains "あ行")
    const firstLesson = page.locator('button').filter({ hasText: /あ行/i }).first();
    await expect(firstLesson).toBeVisible();

    // === START HIRAGANA-01 ===
    await firstLesson.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/03-lesson-introduce.png' });

    // Navigate through introduce items
    for (let i = 0; i < 5; i++) {
      await page.screenshot({ path: `e2e/screenshots/04-introduce-item-${i}.png` });
      const nextBtn = page.getByRole('button', { name: /next|siguiente|continuar/i });
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // === RECOGNIZE STEP ===
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/05-recognize-step.png' });

    for (let i = 0; i < 5; i++) {
      const options = page.locator('.max-w-md button:not([disabled])');
      const count = await options.count();
      if (count > 0) {
        await options.first().click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: `e2e/screenshots/06-recognize-feedback-${i}.png` });

        const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // === RECALL STEP ===
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/07-recall-step.png' });

    const romajiAnswers = ['a', 'i', 'u', 'e', 'o'];
    for (let i = 0; i < 5; i++) {
      const input = page.locator('input[type="text"]');
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        await input.fill(romajiAnswers[i] ?? 'test');
        await page.screenshot({ path: `e2e/screenshots/08-recall-input-${i}.png` });

        const checkBtn = page.getByRole('button', { name: /check|verificar/i });
        if (await checkBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await checkBtn.click();
          await page.waitForTimeout(500);
        }
        await page.screenshot({ path: `e2e/screenshots/09-recall-feedback-${i}.png` });

        const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // === WRITE STEP ===
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/10-write-step.png' });

    for (let i = 0; i < 5; i++) {
      const input = page.locator('input[type="text"]');
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        await input.fill(romajiAnswers[i] ?? 'test');
        const checkBtn = page.getByRole('button', { name: /check|verificar/i });
        if (await checkBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await checkBtn.click();
          await page.waitForTimeout(500);
        }
        await page.screenshot({ path: `e2e/screenshots/11-write-feedback-${i}.png` });

        const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // === SUMMARY STEP ===
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/12-summary.png' });

    const scoreText = page.locator('text=/\\d+%/');
    await expect(scoreText).toBeVisible({ timeout: 5000 });

    // Complete the lesson
    const completeBtn = page.getByRole('button', { name: /complete|terminar|continuar|volver|siguiente|finish|finalizar/i });
    if (await completeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await completeBtn.click();
      await page.waitForTimeout(1000);
    }

    // === BACK TO LESSONS ===
    await page.goto('/lessons');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/13-lessons-after-complete.png' });

    // === STUDY PAGE ===
    await page.goto('/study');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/14-study-after-lesson.png' });

    // === BROWSE PAGE ===
    await page.goto('/browse');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/15-browse.png' });

    // === READING PAGE ===
    await page.goto('/reading');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/16-reading.png' });

    // === WRITING PAGE ===
    await page.goto('/writing');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/17-writing.png' });

    // === ROADMAP PAGE ===
    await page.goto('/roadmap');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/18-roadmap.png' });

    // === SETTINGS PAGE ===
    await page.goto('/settings');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/19-settings.png' });
  });
});
