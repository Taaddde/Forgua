/**
 * Progress tracking hook — reads user progress for the active pack.
 * Uses Dexie's useLiveQuery for reactive data from IndexedDB.
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { startOfDay } from 'date-fns';
import type { UserProgress, StudySession } from '../types/models';

interface TotalStats {
  totalLearned: number;
  totalMature: number;
  overallAccuracy: number;
  currentStreak: number;
}

interface TodayStats {
  reviewed: number;
  newCards: number;
  accuracy: number;
}

export function useProgress(packId: string | null) {
  const progress = useLiveQuery(async (): Promise<UserProgress[]> => {
    if (!packId) return [];
    return db.progress.where('packId').equals(packId).toArray();
  }, [packId]);

  const studyHistory = useLiveQuery(async (): Promise<StudySession[]> => {
    if (!packId) return [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return db.sessions
      .where('[packId+date]')
      .between([packId, thirtyDaysAgo], [packId, new Date()], true, true)
      .toArray();
  }, [packId]);

  const isLoading = progress === undefined || studyHistory === undefined;

  const totalStats: TotalStats = (() => {
    if (!progress || progress.length === 0) {
      return { totalLearned: 0, totalMature: 0, overallAccuracy: 0, currentStreak: 0 };
    }

    const totalLearned = progress.reduce((sum, p) => sum + p.learned, 0);
    const totalMature = progress.reduce((sum, p) => sum + p.mature, 0);
    const overallAccuracy =
      totalLearned > 0
        ? progress.reduce((sum, p) => sum + p.accuracy * p.learned, 0) / totalLearned
        : 0;

    // Calculate streak: consecutive days backwards from today with at least 1 session
    let currentStreak = 0;
    if (studyHistory && studyHistory.length > 0) {
      const sessionDays = new Set(
        studyHistory.map((s) => startOfDay(s.date).getTime()),
      );
      const today = startOfDay(new Date());
      let checkDay = today;
      while (sessionDays.has(checkDay.getTime())) {
        currentStreak++;
        checkDay = new Date(checkDay);
        checkDay.setDate(checkDay.getDate() - 1);
      }
    }

    return { totalLearned, totalMature, overallAccuracy, currentStreak };
  })();

  const todayStats: TodayStats = (() => {
    if (!studyHistory) return { reviewed: 0, newCards: 0, accuracy: 0 };

    const todayStart = startOfDay(new Date());
    const todaySessions = studyHistory.filter(
      (s) => new Date(s.date) >= todayStart,
    );

    if (todaySessions.length === 0) return { reviewed: 0, newCards: 0, accuracy: 0 };

    const reviewed = todaySessions.reduce((sum, s) => sum + s.reviewed, 0);
    const newCards = todaySessions.reduce((sum, s) => sum + s.newCards, 0);
    const accuracy =
      reviewed > 0
        ? todaySessions.reduce((sum, s) => sum + s.accuracy * s.reviewed, 0) / reviewed
        : 0;

    return { reviewed, newCards, accuracy };
  })();

  return {
    progress: progress ?? [],
    totalStats,
    todayStats,
    studyHistory: studyHistory ?? [],
    isLoading,
  };
}
