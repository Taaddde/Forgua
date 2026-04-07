/**
 * Lesson system types.
 * A Lesson is a guided learning sequence that introduces new content
 * and practices it before sending it to SRS for spaced review.
 */

/** Lesson metadata in the pack's lessons/index.json */
export interface LessonIndex {
  /** Ordered list of all lessons in this pack */
  lessons: LessonMeta[];
}

/** Metadata for a single lesson */
export interface LessonMeta {
  /** Unique ID (filename without .json) */
  id: string;
  /** Display title (localized) */
  title: string;
  /** Short description */
  description: string;
  /** Level this lesson belongs to (e.g. "n5", "a1") */
  level: string;
  /** Category: vocabulary, characters, grammar, mixed */
  category: 'vocabulary' | 'characters' | 'grammar' | 'mixed';
  /** Order within the level (1-based) */
  order: number;
  /** Prerequisite lesson IDs (must be completed first) */
  prerequisites: string[];
  /** Estimated duration in minutes */
  estimatedMinutes: number;
  /** Number of new items introduced */
  newItemCount: number;
}

/** A full lesson definition (loaded from lessons/[id].json) */
export interface Lesson {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  /** The items this lesson introduces (references to card data) */
  items: LessonItem[];
  /** The steps in this lesson, in order */
  steps: LessonStep[];
}

/** An item introduced in this lesson */
export interface LessonItem {
  /** What to show as the "front" */
  front: string;
  /** The answer/meaning */
  back: string;
  /** Phonetic reading (for CJK) */
  reading?: string;
  /** Explanation shown during introduction */
  explanation?: string;
  /** Mnemonic or memory aid */
  mnemonic?: string;
  /** Image URL (optional, for visual association) */
  imageUrl?: string;
  /** Audio hint (if available) */
  audio?: string;
  /** Extra context for display */
  extra?: Record<string, unknown>;
  /** Reference to the card in the database (category + front to match) */
  cardRef: {
    category: string;
    front: string;
  };
}

/** A step in the lesson sequence */
export interface LessonStep {
  /** Step type determines the UI component */
  type: LessonStepType;
  /** Title shown at the top */
  title?: string;
  /** Instructions for the user */
  instruction?: string;
  /** Which items this step uses (indices into lesson.items) */
  itemIndices: number[];
  /** Extra config for the step type */
  config?: Record<string, unknown>;
}

export type LessonStepType =
  | 'introduce'
  | 'recognize'
  | 'recall'
  | 'write'
  | 'sentence-build'
  | 'listen-identify'
  | 'summary';

/** Progress tracking for lessons */
export interface LessonProgress {
  lessonId: string;
  packId: string;
  /** 'locked' | 'available' | 'in_progress' | 'completed' */
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  /** When the lesson was completed */
  completedAt?: Date;
  /** Score 0-100 (based on exercise performance) */
  score?: number;
  /** How many times this lesson has been replayed */
  timesCompleted: number;
}
