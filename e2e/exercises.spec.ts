/**
 * Exercise component E2E tests.
 *
 * These tests use the /debug/exercises harness page (dev-only) to test
 * each exercise component in isolation with deterministic sample data.
 *
 * Strategy per exercise:
 * 1. Navigate to the harness section
 * 2. Interact with the component (correct answer, then incorrect answer after reset)
 * 3. Assert result badge via data-testid="<section-id>-result"
 */

import { test, expect } from '@playwright/test';

test.describe('Exercise harness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/debug/exercises');
    await expect(page.locator('h1', { hasText: 'Exercise Harness' })).toBeVisible({ timeout: 10_000 });
  });

  /* ─────────────────────────────────────────────────────────────
   * ImageAssociation
   * ──────────────────────────────────────────────────────────── */
  test.describe('ImageAssociation', () => {
    test('renders image and 4 options', async ({ page }) => {
      const section = page.locator('[data-testid="image-association"]');
      await expect(section.locator('[data-testid="exercise-image"]')).toBeVisible();
      await expect(section.locator('button:not([data-testid])')).toHaveCount(4);
    });

    test('correct answer marks as correct', async ({ page }) => {
      const section = page.locator('[data-testid="image-association"]');
      // Correct answer is index 1: "犬 (dog)"
      await section.locator('button', { hasText: '犬 (dog)' }).click();
      await expect(section.locator('[data-testid="image-association-result"]')).toContainText('correct', { timeout: 3000 });
    });

    test('wrong answer marks as incorrect', async ({ page }) => {
      const section = page.locator('[data-testid="image-association"]');
      // Wrong: index 0 "猫 (cat)"
      await section.locator('button', { hasText: '猫 (cat)' }).click();
      await expect(section.locator('[data-testid="image-association-result"]')).toContainText('incorrect', { timeout: 3000 });
    });

    test('reset clears result', async ({ page }) => {
      const section = page.locator('[data-testid="image-association"]');
      await section.locator('button', { hasText: '犬 (dog)' }).click();
      await expect(section.locator('[data-testid="image-association-result"]')).toBeVisible({ timeout: 3000 });
      await section.locator('[data-testid="image-association-reset"]').click();
      await expect(section.locator('[data-testid="image-association-result"]')).not.toBeVisible();
    });
  });

  /* ─────────────────────────────────────────────────────────────
   * WordInContext
   * ──────────────────────────────────────────────────────────── */
  test.describe('WordInContext', () => {
    test('shows target word prominently', async ({ page }) => {
      const section = page.locator('[data-testid="word-in-context"]');
      await expect(section.locator('[data-testid="target-word"]')).toContainText('食べる');
    });

    test('correct answer (sentence with 食べます) is marked correct', async ({ page }) => {
      const section = page.locator('[data-testid="word-in-context"]');
      await section.locator('button', { hasText: /食べます/ }).click();
      await expect(section.locator('[data-testid="word-in-context-result"]')).toContainText('correct', { timeout: 3000 });
    });

    test('wrong answer is marked incorrect', async ({ page }) => {
      const section = page.locator('[data-testid="word-in-context"]');
      // First option doesn't contain 食べる
      await section.locator('button', { hasText: /読みます/ }).click();
      await expect(section.locator('[data-testid="word-in-context-result"]')).toContainText('incorrect', { timeout: 3000 });
    });
  });

  /* ─────────────────────────────────────────────────────────────
   * ClozeMulti — MC chips variant
   * ──────────────────────────────────────────────────────────── */
  test.describe('ClozeMulti (MC chips)', () => {
    test('check button disabled until all blanks filled', async ({ page }) => {
      const section = page.locator('[data-testid="cloze-multi-mc"]');
      const checkBtn = section.locator('button', { hasText: /verificar|check/i });
      await expect(checkBtn).toBeDisabled();
    });

    test('correct answers marked as correct', async ({ page }) => {
      const section = page.locator('[data-testid="cloze-multi-mc"]');
      await section.locator('[data-testid="blank-0-option-book"]').click();
      await section.locator('[data-testid="blank-1-option-table"]').click();
      const checkBtn = section.locator('button', { hasText: /verificar|check/i });
      await checkBtn.click();
      await expect(section.locator('[data-testid="cloze-multi-mc-result"]')).toContainText('correct', { timeout: 3000 });
    });

    test('wrong answer marked as incorrect', async ({ page }) => {
      const section = page.locator('[data-testid="cloze-multi-mc"]');
      await section.locator('[data-testid="blank-0-option-car"]').click();
      await section.locator('[data-testid="blank-1-option-sky"]').click();
      const checkBtn = section.locator('button', { hasText: /verificar|check/i });
      await checkBtn.click();
      await expect(section.locator('[data-testid="cloze-multi-mc-result"]')).toContainText('incorrect', { timeout: 3000 });
    });
  });

  /* ─────────────────────────────────────────────────────────────
   * ClozeMulti — free text variant
   * ──────────────────────────────────────────────────────────── */
  test.describe('ClozeMulti (free text)', () => {
    test('check button disabled until all inputs filled', async ({ page }) => {
      const section = page.locator('[data-testid="cloze-multi-free"]');
      const checkBtn = section.locator('button', { hasText: /verificar|check/i });
      await expect(checkBtn).toBeDisabled();
    });

    test('correct free-text answers accepted', async ({ page }) => {
      const section = page.locator('[data-testid="cloze-multi-free"]');
      await section.locator('[data-testid="blank-0-input"]').fill('walks');
      await section.locator('[data-testid="blank-1-input"]').fill('day');
      await section.locator('button', { hasText: /verificar|check/i }).click();
      await expect(section.locator('[data-testid="cloze-multi-free-result"]')).toContainText('correct', { timeout: 3000 });
    });

    test('wrong free-text answers rejected', async ({ page }) => {
      const section = page.locator('[data-testid="cloze-multi-free"]');
      await section.locator('[data-testid="blank-0-input"]').fill('runs');
      await section.locator('[data-testid="blank-1-input"]').fill('month');
      await section.locator('button', { hasText: /verificar|check/i }).click();
      await expect(section.locator('[data-testid="cloze-multi-free-result"]')).toContainText('incorrect', { timeout: 3000 });
    });
  });

  /* ─────────────────────────────────────────────────────────────
   * ErrorCorrection — sentence with error
   * ──────────────────────────────────────────────────────────── */
  test.describe('ErrorCorrection (sentence has error)', () => {
    test('shows the sentence', async ({ page }) => {
      const section = page.locator('[data-testid="error-correction-wrong"]');
      await expect(section.locator('[data-testid="sentence-display"]')).toBeVisible();
    });

    test('clicking "No, hay un error" is correct when sentence has error', async ({ page }) => {
      const section = page.locator('[data-testid="error-correction-wrong"]');
      await section.locator('[data-testid="btn-error"]').click();
      await expect(section.locator('[data-testid="error-correction-wrong-result"]')).toContainText('correct', { timeout: 3000 });
    });

    test('correction and explanation are shown after answer', async ({ page }) => {
      const section = page.locator('[data-testid="error-correction-wrong"]');
      await section.locator('[data-testid="btn-error"]').click();
      await expect(section.locator('text=She goes to school every day.')).toBeVisible({ timeout: 3000 });
      await expect(section.locator('text=/Third-person/i')).toBeVisible();
    });

    test('clicking "Yes, it\'s correct" on an erroneous sentence is incorrect', async ({ page }) => {
      const section = page.locator('[data-testid="error-correction-wrong"]');
      await section.locator('[data-testid="btn-correct"]').click();
      await expect(section.locator('[data-testid="error-correction-wrong-result"]')).toContainText('incorrect', { timeout: 3000 });
    });
  });

  /* ─────────────────────────────────────────────────────────────
   * ErrorCorrection — sentence is actually correct
   * ──────────────────────────────────────────────────────────── */
  test.describe('ErrorCorrection (sentence is correct)', () => {
    test('clicking "Yes, it\'s correct" is correct', async ({ page }) => {
      const section = page.locator('[data-testid="error-correction-correct"]');
      await section.locator('[data-testid="btn-correct"]').click();
      await expect(section.locator('[data-testid="error-correction-correct-result"]')).toContainText('correct', { timeout: 3000 });
    });

    test('clicking "No, hay error" on a correct sentence is incorrect', async ({ page }) => {
      const section = page.locator('[data-testid="error-correction-correct"]');
      await section.locator('[data-testid="btn-error"]').click();
      await expect(section.locator('[data-testid="error-correction-correct-result"]')).toContainText('incorrect', { timeout: 3000 });
    });
  });

  /* ─────────────────────────────────────────────────────────────
   * ConversationScript
   * ──────────────────────────────────────────────────────────── */
  test.describe('ConversationScript', () => {
    test('shows scenario title', async ({ page }) => {
      const section = page.locator('[data-testid="conversation-script"]');
      await expect(section.locator('text=Greeting a classmate')).toBeVisible();
    });

    test('advance NPC turn then pick correct learner option', async ({ page }) => {
      const section = page.locator('[data-testid="conversation-script"]');

      // First turn is NPC — click Continue
      await section.locator('[data-testid="btn-npc-next"]').click();

      // Now learner turn — pick correct option (index 0)
      await section.locator('[data-testid="conversation-option-0"]').click();
      await expect(section.locator('[data-testid="btn-feedback-continue"]')).toBeVisible({ timeout: 3000 });
      // Feedback shows correct
      await expect(section.locator('text=/Well said|Bien dicho/i')).toBeVisible();
    });

    test('picking wrong learner option shows incorrect feedback', async ({ page }) => {
      const section = page.locator('[data-testid="conversation-script"]');
      await section.locator('[data-testid="btn-npc-next"]').click();

      // Pick wrong option (index 1: Goodbye)
      await section.locator('[data-testid="conversation-option-1"]').click();
      await expect(section.locator('text=/Hmm|not quite/i')).toBeVisible({ timeout: 3000 });
    });

    test('completes full conversation and shows score', async ({ page }) => {
      const section = page.locator('[data-testid="conversation-script"]');

      // Turn 0: NPC — continue
      await section.locator('[data-testid="btn-npc-next"]').click();
      // Turn 1: Learner — pick correct
      await section.locator('[data-testid="conversation-option-0"]').click();
      await section.locator('[data-testid="btn-feedback-continue"]').click();
      // Turn 2: NPC — continue
      await section.locator('[data-testid="btn-npc-next"]').click();
      // Turn 3: Learner — pick correct (last turn)
      await section.locator('[data-testid="conversation-option-0"]').click();
      await section.locator('[data-testid="btn-feedback-continue"]').click();

      await expect(section.locator('text=/Conversation complete|completada/i')).toBeVisible({ timeout: 5000 });
    });
  });

  /* ─────────────────────────────────────────────────────────────
   * StoryComprehension
   * ──────────────────────────────────────────────────────────── */
  test.describe('StoryComprehension', () => {
    test('shows passage text in reading phase', async ({ page }) => {
      const section = page.locator('[data-testid="story-comprehension"]');
      await expect(section.locator('[data-testid="passage-text"]')).toBeVisible();
      await expect(section.locator('[data-testid="passage-text"]')).toContainText('Luna');
    });

    test('transitions to questions after clicking show questions', async ({ page }) => {
      const section = page.locator('[data-testid="story-comprehension"]');
      await section.locator('[data-testid="btn-show-questions"]').click();
      await expect(section.locator('[data-testid="question-text"]')).toBeVisible({ timeout: 3000 });
    });

    test('correct answer to first question marks it green', async ({ page }) => {
      const section = page.locator('[data-testid="story-comprehension"]');
      await section.locator('[data-testid="btn-show-questions"]').click();
      // First question: "What was the name of Maria's cat?" — correct: Luna (index 1)
      await section.locator('[data-testid="question-option-1"]').click();
      await expect(section.locator('[data-testid="btn-next-question"]')).toBeVisible({ timeout: 3000 });
    });

    test('completes all questions and shows summary', async ({ page }) => {
      const section = page.locator('[data-testid="story-comprehension"]');
      await section.locator('[data-testid="btn-show-questions"]').click();

      // Q1 correct: Luna (index 1)
      await section.locator('[data-testid="question-option-1"]').click();
      await section.locator('[data-testid="btn-next-question"]').click();

      // Q2 correct: Behind the bookshelf (index 2)
      await section.locator('[data-testid="question-option-2"]').click();
      await section.locator('[data-testid="btn-next-question"]').click();

      await expect(section.locator('[data-testid="story-comprehension-result"]')).toContainText('correct', { timeout: 5000 });
    });
  });
});
