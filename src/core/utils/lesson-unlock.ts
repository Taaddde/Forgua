/**
 * Lesson unlock gating — centralized logic shared by pages that gate lesson
 * access behind prerequisites (Lessons, Dashboard).
 *
 * Includes a dev-only bypass (`devUnlockAll`) that is guarded by
 * `import.meta.env.DEV`, so the bypass branch is tree-shaken out of
 * production builds and cannot be triggered by end users even if they
 * tamper with persisted state.
 */

import type { LessonMeta } from '../types/lesson';

/**
 * Returns true if a lesson's prerequisites are satisfied.
 *
 * - In production, this is a plain prereq check.
 * - In dev, if `devUnlockAll` is true, returns true unconditionally.
 *
 * This function does NOT decide whether a lesson is already completed —
 * callers should check `completedIds.has(meta.id)` separately.
 */
export function isLessonUnlocked(
  meta: LessonMeta,
  completedIds: Set<string>,
  devUnlockAll: boolean,
): boolean {
  if (import.meta.env.DEV && devUnlockAll) return true;
  return meta.prerequisites.every((p) => completedIds.has(p));
}
