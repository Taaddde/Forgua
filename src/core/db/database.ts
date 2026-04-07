/**
 * LinguaForge IndexedDB schema — powered by Dexie.js
 * Agnostic: stores data for any language pack.
 * The `extra` field on cards holds language-specific data.
 */

import Dexie, { type Table } from 'dexie';
import type {
  Card,
  SRSState,
  UserProgress,
  StudySession,
  Setting,
  Note,
  MediaCacheEntry,
  InstalledPack,
} from '../types/models';
import type { LessonProgress } from '../types/lesson';

export class LinguaForgeDB extends Dexie {
  packs!: Table<InstalledPack, string>;
  cards!: Table<Card, number>;
  srsState!: Table<SRSState, number>;
  progress!: Table<UserProgress, number>;
  sessions!: Table<StudySession, number>;
  settings!: Table<Setting, string>;
  notes!: Table<Note, number>;
  mediaCache!: Table<MediaCacheEntry, number>;
  lessonProgress!: Table<LessonProgress, string>;

  constructor() {
    super('linguaforge');

    this.version(1).stores({
      // Primary key + indexed fields
      packs: 'id, family, name',
      cards: '++id, packId, level, category, [packId+level], [packId+category], [packId+level+category], *tags',
      srsState: 'cardId, packId, nextReview, [packId+nextReview]',
      progress: '++id, packId, level, category, [packId+level], [packId+level+category]',
      sessions: '++id, packId, date, [packId+date]',
      settings: 'key',
      notes: '++id, cardId, createdAt',
      mediaCache: '++id, packId, key, [packId+key]',
    });

    this.version(2).stores({
      packs: 'id, family, name',
      cards: '++id, packId, level, category, [packId+level], [packId+category], [packId+level+category], *tags',
      srsState: 'cardId, packId, nextReview, [packId+nextReview]',
      progress: '++id, packId, level, category, [packId+level], [packId+level+category]',
      sessions: '++id, packId, date, [packId+date]',
      settings: 'key',
      notes: '++id, cardId, createdAt',
      mediaCache: '++id, packId, key, [packId+key]',
      lessonProgress: '[packId+lessonId], packId, status, completedAt',
    });
  }
}

/** Singleton database instance */
export const db = new LinguaForgeDB();

/**
 * Reset the entire database. Use with caution.
 * Primarily for development and testing.
 */
export async function resetDatabase(): Promise<void> {
  await db.delete();
  await db.open();
}
