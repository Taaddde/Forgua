/**
 * Hook for managing lesson state and progress.
 * Handles lesson progress queries and SRS activation on completion.
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { createInitialSRSState } from '../engine/srs';
import type { LessonProgress, LessonItem } from '../types/lesson';

export function useLessonProgress(packId: string | null) {
  const progress = useLiveQuery(async () => {
    if (!packId) return [];
    return db.lessonProgress.where('packId').equals(packId).toArray();
  }, [packId]);

  return progress ?? [];
}

export async function completeLesson(
  packId: string,
  lessonId: string,
  score: number,
  items: LessonItem[],
): Promise<void> {
  await db.transaction('rw', [db.lessonProgress, db.srsState, db.cards], async () => {
    // 1. Update lesson progress
    const existing = await db.lessonProgress
      .where('[packId+lessonId]')
      .equals([packId, lessonId])
      .first();

    const progressRecord: LessonProgress = {
      lessonId,
      packId,
      status: 'completed',
      completedAt: new Date(),
      score,
      timesCompleted: (existing?.timesCompleted ?? 0) + 1,
    };
    await db.lessonProgress.put(progressRecord);

    // 2. Activate cards for SRS
    for (const item of items) {
      const card = await db.cards
        .where('[packId+category]')
        .equals([packId, item.cardRef.category])
        .filter((c) => c.front === item.cardRef.front)
        .first();

      if (card?.id) {
        const existingState = await db.srsState.get(card.id);
        if (!existingState) {
          await db.srsState.put(createInitialSRSState(card.id, packId));
        }
      }
    }
  });
}
