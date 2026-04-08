/**
 * Placement engine — handles the logic for level assessment.
 *
 * Responsible for:
 * - Sampling questions from a level's pool
 * - Evaluating answers against the pass threshold
 * - Creating SRS states for cards in skipped levels
 */

import type { PlacementConfig, PlacementQuestion, PlacementLevelConfig } from '../types/placement';
import type { SRSState } from '../types/models';
import type { PackLevel } from '../types/pack-spec';

/** SRS values assigned to cards in skipped levels */
export const SKIP_DEFAULTS = {
  easeFactor: 2.5,
  interval: 180,
  repetitions: 5,
} as const;

/**
 * Sample N questions from a pool using Fisher-Yates shuffle.
 * Returns all questions if pool is smaller than requested count.
 */
export function sampleQuestions(
  questions: PlacementQuestion[],
  count: number,
): PlacementQuestion[] {
  if (questions.length <= count) return [...questions];
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/**
 * Check if a single answer is correct for a given question.
 */
export function checkAnswer(
  question: PlacementQuestion,
  answer: number | string | boolean,
): boolean {
  switch (question.type) {
    case 'multiple-choice':
      return answer === question.correctIndex;
    case 'write-answer':
      return question.acceptedAnswers.some(
        (a) => a.toLowerCase().trim() === String(answer).toLowerCase().trim(),
      );
    case 'true-false':
      return answer === question.correctAnswer;
  }
}

/**
 * Evaluate a set of answers and determine if the user passes the level.
 */
export function evaluateLevel(
  answers: boolean[],
  threshold: number,
): { passed: boolean; accuracy: number } {
  if (answers.length === 0) return { passed: false, accuracy: 0 };
  const correct = answers.filter(Boolean).length;
  const accuracy = correct / answers.length;
  return { passed: accuracy >= threshold, accuracy };
}

/**
 * Get the levels that would be skipped given a confirmed placement level.
 * Returns all pack levels with order < the confirmed level's order.
 */
export function getSkippedLevels(
  packLevels: PackLevel[],
  confirmedLevelId: string,
): string[] {
  const sorted = [...packLevels].sort((a, b) => a.order - b.order);
  const confirmedIndex = sorted.findIndex((l) => l.id === confirmedLevelId);
  if (confirmedIndex <= 0) return [];
  return sorted.slice(0, confirmedIndex).map((l) => l.id);
}

/**
 * Find the next lower level to test when the user fails the current one.
 * Returns null if already at the lowest level.
 */
export function getLowerLevel(
  config: PlacementConfig,
  currentLevelId: string,
  packLevels: PackLevel[],
): PlacementLevelConfig | null {
  const sorted = [...packLevels].sort((a, b) => a.order - b.order);
  const currentIndex = sorted.findIndex((l) => l.id === currentLevelId);
  if (currentIndex <= 0) return null;

  // Walk down until we find a level that has placement config
  for (let i = currentIndex - 1; i >= 0; i--) {
    const lowerConfig = config.levels.find((l) => l.levelId === sorted[i].id);
    if (lowerConfig) return lowerConfig;
  }
  return null;
}

/**
 * Create SRS states for all cards in skipped levels.
 * Cards get a high interval so they don't appear in the review queue.
 */
export function createSkippedSRSStates(
  cardIds: number[],
  packId: string,
): SRSState[] {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + SKIP_DEFAULTS.interval);

  return cardIds.map((cardId) => ({
    cardId,
    packId,
    easeFactor: SKIP_DEFAULTS.easeFactor,
    interval: SKIP_DEFAULTS.interval,
    repetitions: SKIP_DEFAULTS.repetitions,
    nextReview: futureDate,
    lastReview: now,
  }));
}
