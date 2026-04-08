/**
 * Placement test system types.
 *
 * A placement test is an optional pack feature that assesses the user's
 * existing knowledge to recommend a starting level, allowing them to
 * skip content they already know.
 *
 * Pack file: placement.json (at pack root)
 * Feature flag: manifest.features.placement = true
 *
 * Flow:
 *   1. User selects estimated level via can-do statements (self-report)
 *   2. Core samples questions from that level's pool (validation quiz)
 *   3. If accuracy >= passThreshold → placement confirmed
 *   4. If accuracy < passThreshold → drop one level, repeat
 *   5. Cards below confirmed level get high SRS interval (skipped)
 */

import type { PackCategory } from './pack-spec';

// ---------------------------------------------------------------------------
// Pack-side types — defined in the pack's placement.json
// ---------------------------------------------------------------------------

/** Root structure of a pack's placement.json */
export interface PlacementConfig {
  /** Accuracy threshold to pass a level validation (0.0–1.0) */
  passThreshold: number;
  /** Number of questions to sample from each level's pool per attempt */
  questionsPerLevel: number;
  /** Configuration per level, ordered by PackLevel.order */
  levels: PlacementLevelConfig[];
}

/** Placement config for a single level */
export interface PlacementLevelConfig {
  /** References PackLevel.id (e.g. 'n5', 'a1') */
  levelId: string;
  /** Statements describing what a learner at this level can do */
  canDoStatements: string[];
  /** Pool of questions to sample from for validation */
  questions: PlacementQuestion[];
}

/** A single placement question — discriminated union on `type` */
export type PlacementQuestion =
  | PlacementMultipleChoice
  | PlacementWriteAnswer
  | PlacementTrueFalse;

interface PlacementQuestionBase {
  /** Which content category this question tests */
  category: PackCategory;
  /** The question prompt shown to the user */
  prompt: string;
  /** Optional additional context (e.g. a sentence to read) */
  context?: string;
}

export interface PlacementMultipleChoice extends PlacementQuestionBase {
  type: 'multiple-choice';
  /** Answer options (minimum 2) */
  options: string[];
  /** Index of the correct option */
  correctIndex: number;
}

export interface PlacementWriteAnswer extends PlacementQuestionBase {
  type: 'write-answer';
  /** All accepted answers (matched case-insensitively) */
  acceptedAnswers: string[];
}

export interface PlacementTrueFalse extends PlacementQuestionBase {
  type: 'true-false';
  /** The correct answer */
  correctAnswer: boolean;
}

// ---------------------------------------------------------------------------
// Runtime types — stored in IndexedDB
// ---------------------------------------------------------------------------

/** Result of a completed placement test */
export interface PlacementResult {
  id?: number;
  packId: string;
  /** Level the user selected during self-report */
  selfReportLevel: string;
  /** Level confirmed by the validation quiz */
  confirmedLevel: string;
  /** Accuracy achieved on the final validation quiz (0.0–1.0) */
  accuracy: number;
  /** All level IDs that were marked as skipped */
  skippedLevels: string[];
  /** When the placement was completed */
  completedAt: Date;
}
