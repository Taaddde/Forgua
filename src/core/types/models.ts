/**
 * LinguaForge data models — maps to IndexedDB tables.
 * These are the runtime types used by the SRS engine,
 * progress tracking, and study session management.
 */

/** A study card — the atomic unit of review */
export interface Card {
  id?: number;          // Auto-incremented by Dexie
  packId: string;
  level: string;
  category: string;     // 'vocabulary' | 'grammar' | 'characters' | 'reading' | 'listening'
  front: string;        // Display text (question side)
  back: string;         // Answer text
  reading?: string;     // Phonetic reading
  tags: string[];
  audio?: string;       // Path to audio file relative to pack
  imageUrl?: string;    // Optional image for visual association
  extra?: Record<string, unknown>; // Language-specific data (pitch accent, tones, etc.)
}

/** SRS state for a single card — SM-2 algorithm variables */
export interface SRSState {
  cardId: number;
  packId: string;
  easeFactor: number;    // Float, init: 2.5, min: 1.3
  interval: number;      // Days until next review, init: 0
  repetitions: number;   // Consecutive successful reviews, init: 0
  nextReview: Date;      // When to show this card next
  lastReview?: Date;     // When it was last reviewed
}

/** SM-2 quality grades mapped to UI buttons */
export const ReviewGrade = {
  Again: 1,  // Red — reset
  Hard: 3,   // Orange — advance, ease drops
  Good: 4,   // Green — advance normally
  Easy: 5,   // Blue — advance, ease rises
} as const;

export type ReviewGrade = (typeof ReviewGrade)[keyof typeof ReviewGrade];

/** User progress per pack/level/category */
export interface UserProgress {
  id?: number;
  packId: string;
  level: string;
  category: string;
  learned: number;       // Cards seen at least once
  mature: number;        // Cards with interval >= 21 days
  accuracy: number;      // Rolling accuracy 0.0–1.0
  streak: number;        // Consecutive days studied
  lastStudied?: Date;
}

/** A single study session */
export interface StudySession {
  id?: number;
  packId: string;
  date: Date;
  duration: number;      // Seconds
  reviewed: number;      // Cards reviewed
  newCards: number;       // New cards introduced
  accuracy: number;      // Session accuracy 0.0–1.0
}

/** Global user settings (key-value) */
export interface Setting {
  key: string;
  value: string | number | boolean;
}

/** Personal note attached to a card */
export interface Note {
  id?: number;
  cardId: number;
  text: string;
  createdAt: Date;
}

/** Cached media blob (audio, images) */
export interface MediaCacheEntry {
  id?: number;
  packId: string;
  key: string;           // Original path or identifier
  blob: Blob;
}

/** Installed pack record in the database */
export interface InstalledPack {
  id: string;            // Same as PackManifest.id
  name: string;
  family: string;
  version: string;
  installedAt: Date;
}

/** Exercise types supported by the engine */
export type ExerciseType =
  | 'flashcard'
  | 'multiple-choice'
  | 'write-answer'
  | 'drag-reorder'
  | 'dictation'
  | 'speak'
  | 'character-draw'
  | 'fill-blank'
  | 'matching'
  | 'reading-quiz';

/** Generic exercise definition — the pack generates these from its JSON data */
export interface Exercise {
  type: ExerciseType;
  cardId?: number;
  data: Record<string, unknown>;
}
