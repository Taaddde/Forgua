/**
 * SRS hook — manages spaced repetition review sessions.
 * Uses Dexie's useLiveQuery for reactive data from IndexedDB.
 *
 * Cards enter SRS only after being introduced in a Lesson.
 * Study shows only cards with existing SRS state where nextReview <= now.
 */

import { useState, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { calculateNextReview, createInitialSRSState } from '../engine/srs';
import { ReviewGrade } from '../types/models';
import type { SRSState } from '../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

interface SessionStats {
  reviewed: number;
  correct: number;
  remaining: number;
  accuracy: number;
}

export function useSRS(packId: string | null) {
  const [sessionReviewed, setSessionReviewed] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);

  // Only cards with SRS state where nextReview <= now
  const reviewCards = useLiveQuery(async () => {
    if (!packId) return [];
    const now = new Date();
    const srsRecords = await db.srsState
      .where('[packId+nextReview]')
      .between([packId, new Date(0)], [packId, now], true, true)
      .toArray();
    if (srsRecords.length === 0) return [];

    const cardIds = srsRecords.map((s) => s.cardId);
    return db.cards.where('id').anyOf(cardIds).toArray();
  }, [packId]);

  const reviewQueue = reviewCards ?? [];
  const isLoading = reviewCards === undefined;

  const submitReview = useCallback(
    async (cardId: number, grade: ReviewGradeValue) => {
      if (!packId) return;

      // Get or create SRS state
      let state: SRSState | undefined = await db.srsState.get(cardId);
      const isNew = !state;
      if (!state) {
        state = createInitialSRSState(cardId, packId);
      }

      const newState = calculateNextReview(state, grade);

      await db.transaction('rw', [db.srsState, db.progress], async () => {
        // Upsert SRS state
        await db.srsState.put(newState);

        // Update progress
        const progressRecords = await db.progress
          .where('packId')
          .equals(packId)
          .toArray();

        if (progressRecords.length > 0) {
          const p = progressRecords[0];
          const newLearned = isNew ? p.learned + 1 : p.learned;
          const newMature = newState.interval >= 21
            ? (isNew ? p.mature : p.mature + (state!.interval < 21 ? 1 : 0))
            : p.mature;
          // Rolling accuracy: weighted average
          const totalReviews = p.learned > 0 ? p.learned : 1;
          const isCorrect = grade >= ReviewGrade.Hard;
          const newAccuracy =
            (p.accuracy * totalReviews + (isCorrect ? 1 : 0)) / (totalReviews + 1);

          await db.progress.update(p.id!, {
            learned: newLearned,
            mature: newMature,
            accuracy: newAccuracy,
            lastStudied: new Date(),
          });
        }
      });

      // Update session stats
      setSessionReviewed((prev) => prev + 1);
      if (grade >= ReviewGrade.Hard) {
        setSessionCorrect((prev) => prev + 1);
      }
    },
    [packId],
  );

  const sessionStats: SessionStats = useMemo(
    () => ({
      reviewed: sessionReviewed,
      correct: sessionCorrect,
      remaining: reviewQueue.length - sessionReviewed,
      accuracy: sessionReviewed > 0 ? sessionCorrect / sessionReviewed : 0,
    }),
    [sessionReviewed, sessionCorrect, reviewQueue.length],
  );

  const resetSession = useCallback(() => {
    setSessionReviewed(0);
    setSessionCorrect(0);
  }, []);

  return {
    reviewQueue,
    isLoading,
    submitReview,
    sessionStats,
    resetSession,
  };
}
