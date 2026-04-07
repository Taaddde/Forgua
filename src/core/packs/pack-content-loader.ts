/**
 * Pack Content Loader — loads non-card content (readings, roadmaps, resources)
 * directly from pack JSON files via dynamic import.
 * These are not stored in IndexedDB; they're used directly by page components.
 */

import type { ReadingText, Roadmap, ResourceEntry } from '../types/pack-spec';
import type { LessonIndex, Lesson } from '../types/lesson';

// Glob all content files from all packs (lazy)
const roadmapModules = import.meta.glob<{ default: Roadmap[] }>(
  '../../packs/*/roadmaps.json',
  { eager: false },
);

const readingModules = import.meta.glob<{ default: ReadingText[] }>(
  '../../packs/*/readings/*.json',
  { eager: false },
);

const resourceModules = import.meta.glob<{ default: ResourceEntry[] }>(
  '../../packs/*/resources.json',
  { eager: false },
);

const lessonIndexModules = import.meta.glob<{ default: LessonIndex }>(
  '../../packs/*/lessons/index.json',
  { eager: false },
);

const lessonModules = import.meta.glob<{ default: Lesson }>(
  '../../packs/*/lessons/*.json',
  { eager: false },
);

/**
 * Filter glob modules by pack ID.
 */
function filterByPack<T>(
  modules: Record<string, () => Promise<{ default: T }>>,
  packId: string,
): Record<string, () => Promise<{ default: T }>> {
  const filtered: Record<string, () => Promise<{ default: T }>> = {};
  for (const [path, loader] of Object.entries(modules)) {
    const match = path.match(/\/packs\/([^/]+)\//);
    if (match && match[1] === packId) {
      filtered[path] = loader;
    }
  }
  return filtered;
}

/**
 * Load roadmaps for a pack.
 */
export async function loadRoadmaps(packId: string): Promise<Roadmap[]> {
  const packRoadmaps = filterByPack(roadmapModules, packId);
  for (const [, loader] of Object.entries(packRoadmaps)) {
    const mod = await loader();
    return mod.default as unknown as Roadmap[];
  }
  return [];
}

/**
 * Load all reading texts for a pack, across all levels.
 */
export async function loadReadings(packId: string): Promise<ReadingText[]> {
  const packReadings = filterByPack(readingModules, packId);
  const allTexts: ReadingText[] = [];
  for (const [, loader] of Object.entries(packReadings)) {
    const mod = await loader();
    const texts = mod.default as unknown as ReadingText[];
    allTexts.push(...texts);
  }
  return allTexts;
}

/**
 * Load resources for a pack.
 */
export async function loadResources(packId: string): Promise<ResourceEntry[]> {
  const packResources = filterByPack(resourceModules, packId);
  for (const [, loader] of Object.entries(packResources)) {
    const mod = await loader();
    return mod.default as unknown as ResourceEntry[];
  }
  return [];
}

/**
 * Load the lesson index for a pack.
 */
export async function loadLessonIndex(packId: string): Promise<LessonIndex | null> {
  const packLessons = filterByPack(lessonIndexModules, packId);
  for (const [, loader] of Object.entries(packLessons)) {
    const mod = await loader();
    return mod.default as unknown as LessonIndex;
  }
  return null;
}

/**
 * Load a specific lesson by ID for a pack.
 */
export async function loadLesson(packId: string, lessonId: string): Promise<Lesson | null> {
  const packLessons = filterByPack(lessonModules, packId);
  for (const [path, loader] of Object.entries(packLessons)) {
    if (path.includes(`/${lessonId}.json`)) {
      const mod = await loader();
      return mod.default as unknown as Lesson;
    }
  }
  return null;
}
