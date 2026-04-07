/**
 * Pack Data Loader — loads JSON data files from a Language Pack dynamically.
 * Discovers files via import.meta.glob, organized by category and level.
 * No pack-specific logic — everything is driven by the manifest and file structure.
 */

import type { PackManifest, VocabularyEntry, CharacterEntry, GrammarPoint } from '../types/pack-spec';
import type { Card, UserProgress } from '../types/models';
import { db } from '../db/database';

// Glob all JSON data files from all packs (lazy)
const vocabModules = import.meta.glob<{ default: VocabularyEntry[] }>(
  '../../packs/*/vocabulary/*.json',
  { eager: false },
);

const grammarModules = import.meta.glob<{ default: GrammarPoint[] }>(
  '../../packs/*/grammar/*.json',
  { eager: false },
);

const characterModules = import.meta.glob<{ default: CharacterEntry[] }>(
  '../../packs/*/characters/**/*.json',
  { eager: false },
);

// --- Card conversion functions ---

function vocabToCards(entries: VocabularyEntry[], packId: string): Omit<Card, 'id'>[] {
  return entries.map((e) => ({
    packId,
    level: e.level,
    category: 'vocabulary',
    front: e.word,
    back: e.meanings[0],
    reading: e.reading,
    tags: e.tags,
    audio: e.audio,
    imageUrl: e.imageUrl,
    extra: {
      meanings: e.meanings,
      pos: e.pos,
      examples: e.examples,
      ...(e.extra ?? {}),
    },
  }));
}

function charToCards(entries: CharacterEntry[], packId: string, charType: string): Omit<Card, 'id'>[] {
  return entries.map((e) => ({
    packId,
    level: e.level,
    category: 'characters',
    front: e.character,
    back: e.meanings[0],
    reading: e.readings.map((r) => r.value).join(', '),
    tags: [...(e.tags ?? []), charType],
    extra: {
      readings: e.readings,
      meanings: e.meanings,
      strokeCount: e.strokeCount,
      strokeOrder: e.strokeOrder,
      radical: e.radical,
      radicalMeaning: e.radicalMeaning,
      examples: e.examples,
    },
  }));
}

function grammarToCards(points: GrammarPoint[], packId: string): Omit<Card, 'id'>[] {
  return points.map((g) => ({
    packId,
    level: g.level,
    category: 'grammar',
    front: `${g.title} (${g.pattern})`,
    back: g.meaning,
    tags: g.tags ?? [],
    extra: {
      grammarId: g.id,
      explanation: g.explanation,
      examples: g.examples,
      notes: g.notes,
      related: g.related,
    },
  }));
}

// --- Level card loading ---

async function loadLevelCards(
  packId: string,
  level: string,
  category: string,
  cards: Omit<Card, 'id'>[],
): Promise<void> {
  const existing = await db.cards
    .where('[packId+level+category]')
    .equals([packId, level, category])
    .count();

  if (existing > 0 || cards.length === 0) return;

  await db.transaction('rw', [db.cards, db.progress], async () => {
    await db.cards.bulkAdd(cards as Card[]);

    const progressExists = await db.progress
      .where('[packId+level+category]')
      .equals([packId, level, category])
      .count();

    if (progressExists === 0) {
      await db.progress.add({
        packId,
        level,
        category,
        learned: 0,
        mature: 0,
        accuracy: 0,
        streak: 0,
      } as UserProgress);
    }
  });
}

// --- Dynamic helpers ---

/**
 * Match glob results that belong to a specific pack.
 * Glob keys look like: '../../packs/japanese/vocabulary/n5.json'
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
 * Extract level name from a file path.
 * '../../packs/japanese/vocabulary/n5.json' -> 'n5'
 */
function extractLevelFromPath(path: string): string {
  const filename = path.split('/').pop() ?? '';
  return filename.replace('.json', '');
}

/**
 * Extract character type from a file path.
 * '../../packs/japanese/characters/hiragana.json' -> 'hiragana'
 * '../../packs/japanese/characters/kanji/n5.json' -> 'kanji'
 */
function extractCharTypeFromPath(path: string): string {
  const afterChars = path.split('/characters/')[1] ?? '';
  const parts = afterChars.split('/');
  if (parts.length > 1) {
    // Subdirectory: characters/kanji/n5.json -> type is 'kanji'
    return parts[0];
  }
  // Direct file: characters/hiragana.json -> type is filename without ext
  return parts[0].replace('.json', '');
}

/**
 * Load all data for a pack dynamically.
 * No switch statements, no pack-specific logic.
 */
export async function loadPackData(manifest: PackManifest): Promise<void> {
  const packId = manifest.id;

  // Load vocabulary
  const packVocab = filterByPack(vocabModules, packId);
  for (const [path, loader] of Object.entries(packVocab)) {
    const level = extractLevelFromPath(path);
    const mod = await loader();
    const entries = mod.default as unknown as VocabularyEntry[];
    await loadLevelCards(packId, level, 'vocabulary', vocabToCards(entries, packId));
  }

  // Load grammar
  const packGrammar = filterByPack(grammarModules, packId);
  for (const [path, loader] of Object.entries(packGrammar)) {
    const level = extractLevelFromPath(path);
    const mod = await loader();
    const entries = mod.default as unknown as GrammarPoint[];
    await loadLevelCards(packId, level, 'grammar', grammarToCards(entries, packId));
  }

  // Load characters (only if pack declares writing systems)
  if (manifest.writingSystems.length > 0) {
    const packChars = filterByPack(characterModules, packId);
    for (const [path, loader] of Object.entries(packChars)) {
      const charType = extractCharTypeFromPath(path);
      const level = extractLevelFromPath(path);
      const mod = await loader();
      const entries = mod.default as unknown as CharacterEntry[];
      // For flat files like hiragana.json, level = charType (the filename)
      // We use the entries' own .level field if available, otherwise the filename
      const effectiveLevel = entries[0]?.level ?? level;
      await loadLevelCards(packId, effectiveLevel, 'characters', charToCards(entries, packId, charType));
    }
  }
}
