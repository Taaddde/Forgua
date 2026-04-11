/**
 * Exercise scoring engine
 *
 * Converts exercise-specific results into ReviewGrade values
 * for the SRS engine. Each function returns a ScoreResult
 * with a boolean and a suggested grade.
 */

import { ReviewGrade } from '../types/models';
import type { AbstractAdapter } from '../types/adapter';

/** Strip punctuation that STT engines inject into transcripts (capital first word, trailing period, etc.) */
function stripSttPunctuation(text: string): string {
  return text.trim().toLowerCase().replace(/[.,!?;:。、！？]/g, '').replace(/\s+/g, ' ').trim();
}

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

export interface ScoreResult {
  correct: boolean;
  grade: ReviewGradeValue;
  similarity?: number;
}

/**
 * Score a multiple-choice exercise.
 * Correct → Good, Incorrect → Again
 */
export function scoreMultipleChoice(selected: number, correctIndex: number): ScoreResult {
  const correct = selected === correctIndex;
  return {
    correct,
    grade: correct ? ReviewGrade.Good : ReviewGrade.Again,
  };
}

/**
 * Score a free-text answer.
 * Uses the adapter's compareAnswer for fuzzy matching if available,
 * otherwise falls back to simple normalized comparison.
 */
export function scoreWriteAnswer(
  input: string,
  expected: string,
  adapter: AbstractAdapter | null,
): ScoreResult {
  if (adapter) {
    const result = adapter.compareAnswer(input, expected);
    let grade: ReviewGradeValue;
    if (!result.isCorrect) {
      grade = ReviewGrade.Again;
    } else if (result.similarity >= 0.95) {
      grade = ReviewGrade.Easy;
    } else if (result.similarity >= 0.8) {
      grade = ReviewGrade.Good;
    } else {
      grade = ReviewGrade.Hard;
    }
    return { correct: result.isCorrect, grade, similarity: result.similarity };
  }

  // Fallback: simple comparison with STT punctuation stripped.
  const normalizedInput = stripSttPunctuation(input);
  const normalizedExpected = stripSttPunctuation(expected);
  const correct = normalizedInput === normalizedExpected;
  return {
    correct,
    grade: correct ? ReviewGrade.Good : ReviewGrade.Again,
    similarity: correct ? 1.0 : 0.0,
  };
}

/**
 * Score a fill-in-the-blank exercise.
 * Correct → Good, Incorrect → Again
 */
export function scoreFillBlank(selected: string, correct: string): ScoreResult {
  const isCorrect = selected === correct;
  return {
    correct: isCorrect,
    grade: isCorrect ? ReviewGrade.Good : ReviewGrade.Again,
  };
}

/**
 * Score a dictation exercise (reuses write-answer logic).
 */
export function scoreDictation(
  transcript: string,
  expected: string,
  adapter: AbstractAdapter | null,
): ScoreResult {
  return scoreWriteAnswer(transcript, expected, adapter);
}

/**
 * Score a speak exercise combining text match and STT confidence.
 */
export function scoreSpeech(
  transcript: string,
  expected: string,
  sttConfidence: number,
  adapter: AbstractAdapter | null,
): ScoreResult {
  const textResult = scoreWriteAnswer(transcript, expected, adapter);
  const combinedSimilarity = (textResult.similarity ?? 0) * 0.7 + sttConfidence * 0.3;

  let grade: ReviewGradeValue;
  if (combinedSimilarity >= 0.9) grade = ReviewGrade.Easy;
  else if (combinedSimilarity >= 0.75) grade = ReviewGrade.Good;
  else if (combinedSimilarity >= 0.5) grade = ReviewGrade.Hard;
  else grade = ReviewGrade.Again;

  return {
    correct: combinedSimilarity >= 0.5,
    grade,
    similarity: combinedSimilarity,
  };
}

/**
 * Score a drag-reorder exercise.
 */
export function scoreDragReorder(userOrder: number[], correctOrder: number[]): ScoreResult {
  const correctCount = userOrder.filter((v, i) => v === correctOrder[i]).length;
  const ratio = correctCount / correctOrder.length;

  let grade: ReviewGradeValue;
  if (ratio === 1) grade = ReviewGrade.Good;
  else if (ratio >= 0.5) grade = ReviewGrade.Hard;
  else grade = ReviewGrade.Again;

  return { correct: ratio === 1, grade, similarity: ratio };
}

/**
 * Score a matching exercise based on error count.
 */
export function scoreMatching(errors: number, totalPairs: number): ScoreResult {
  let grade: ReviewGradeValue;
  if (errors === 0) grade = ReviewGrade.Easy;
  else if (errors <= 2) grade = ReviewGrade.Good;
  else if (errors <= 4) grade = ReviewGrade.Hard;
  else grade = ReviewGrade.Again;

  return {
    correct: errors === 0,
    grade,
    similarity: Math.max(0, 1 - errors / (totalPairs * 2)),
  };
}

/**
 * Score a multi-blank cloze exercise.
 * All correct → Easy, partial → Hard, none → Again.
 */
export function scoreClozeMulti(
  correctCount: number,
  totalBlanks: number,
): ScoreResult {
  const ratio = totalBlanks > 0 ? correctCount / totalBlanks : 0;
  let grade: ReviewGradeValue;
  if (ratio === 1) grade = ReviewGrade.Easy;
  else if (ratio >= 0.5) grade = ReviewGrade.Hard;
  else grade = ReviewGrade.Again;

  return { correct: ratio === 1, grade, similarity: ratio };
}

/**
 * Score an error-correction exercise.
 * Correct identification → Good, wrong → Again.
 */
export function scoreErrorCorrection(userSaidCorrect: boolean, actuallyCorrect: boolean): ScoreResult {
  const isRight = userSaidCorrect === actuallyCorrect;
  return {
    correct: isRight,
    grade: isRight ? ReviewGrade.Good : ReviewGrade.Again,
  };
}

/**
 * Score a guided conversation based on correct turns out of total learner turns.
 */
export function scoreConversation(correctTurns: number, totalTurns: number): ScoreResult {
  const ratio = totalTurns > 0 ? correctTurns / totalTurns : 1;
  let grade: ReviewGradeValue;
  if (ratio === 1) grade = ReviewGrade.Easy;
  else if (ratio >= 0.6) grade = ReviewGrade.Good;
  else if (ratio >= 0.3) grade = ReviewGrade.Hard;
  else grade = ReviewGrade.Again;

  return { correct: ratio >= 0.6, grade, similarity: ratio };
}

/**
 * Score a story comprehension exercise.
 * Based on ratio of correct MC answers.
 */
export function scoreStoryComprehension(correct: number, total: number): ScoreResult {
  const ratio = total > 0 ? correct / total : 0;
  let grade: ReviewGradeValue;
  if (ratio === 1) grade = ReviewGrade.Easy;
  else if (ratio >= 0.7) grade = ReviewGrade.Good;
  else if (ratio >= 0.4) grade = ReviewGrade.Hard;
  else grade = ReviewGrade.Again;

  return { correct: ratio >= 0.7, grade, similarity: ratio };
}
