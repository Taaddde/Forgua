/**
 * SM-2 Spaced Repetition Engine
 *
 * Implements the SuperMemo 2 algorithm for scheduling card reviews.
 * All grade values follow the SM-2 quality scale:
 *   Again (1), Hard (3), Good (4), Easy (5)
 */

import type { SRSState } from '../types/models';
import { ReviewGrade } from '../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

/**
 * Calculate the new ease factor after a review.
 * EF' = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))
 * Minimum: 1.3
 */
function calculateEaseFactor(currentEF: number, grade: ReviewGradeValue): number {
  const q = grade;
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  return Math.max(1.3, currentEF + delta);
}

/**
 * Add days to a date, returning a new Date.
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculate the next SRS state after a review.
 *
 * SM-2 rules:
 * - If grade >= 3 (Hard/Good/Easy): advance schedule
 *     rep 0 → interval = 1 day
 *     rep 1 → interval = 6 days
 *     rep 2+ → interval = round(interval × easeFactor)
 * - If grade < 3 (Again): reset repetitions and interval
 * - Ease factor is always updated
 */
export function calculateNextReview(state: SRSState, grade: ReviewGradeValue): SRSState {
  const now = new Date();
  const newEase = calculateEaseFactor(state.easeFactor, grade);

  let newInterval: number;
  let newReps: number;

  if (grade >= ReviewGrade.Hard) {
    // Successful review — advance schedule
    if (state.repetitions === 0) {
      newInterval = 1;
    } else if (state.repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(state.interval * newEase);
    }
    newReps = state.repetitions + 1;
  } else {
    // Failed review — reset
    newInterval = 1;
    newReps = 0;
  }

  return {
    cardId: state.cardId,
    packId: state.packId,
    easeFactor: newEase,
    interval: newInterval,
    repetitions: newReps,
    nextReview: addDays(now, newInterval),
    lastReview: now,
  };
}

/**
 * Create the initial SRS state for a brand-new card.
 * Ease starts at 2.5, interval at 0, due immediately.
 */
export function createInitialSRSState(cardId: number, packId: string): SRSState {
  return {
    cardId,
    packId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date(),
  };
}
