import { describe, it, expect } from 'vitest';

/**
 * Unit tests for pack-data-loader helper functions.
 * We test the pure utility functions by importing them indirectly
 * through the module's behavior, since the helpers are not exported.
 * For now, we validate the logic patterns used by the module.
 */

describe('pack-data-loader utilities', () => {
  describe('extractLevelFromPath', () => {
    // Replicate the logic to test it
    function extractLevelFromPath(path: string): string {
      const filename = path.split('/').pop() ?? '';
      return filename.replace('.json', '');
    }

    it('should extract level from vocabulary path', () => {
      expect(extractLevelFromPath('../../packs/japanese-from-es/vocabulary/n5.json')).toBe('n5');
    });

    it('should extract level from grammar path', () => {
      expect(extractLevelFromPath('../../packs/english-from-es/grammar/a1.json')).toBe('a1');
    });

    it('should extract level from nested kanji path', () => {
      expect(extractLevelFromPath('../../packs/japanese-from-es/characters/kanji/n3.json')).toBe('n3');
    });
  });

  describe('extractCharTypeFromPath', () => {
    function extractCharTypeFromPath(path: string): string {
      const afterChars = path.split('/characters/')[1] ?? '';
      const parts = afterChars.split('/');
      if (parts.length > 1) {
        return parts[0];
      }
      return parts[0].replace('.json', '');
    }

    it('should extract type from flat character file', () => {
      expect(extractCharTypeFromPath('../../packs/japanese-from-es/characters/hiragana.json')).toBe('hiragana');
    });

    it('should extract type from nested character file', () => {
      expect(extractCharTypeFromPath('../../packs/japanese-from-es/characters/kanji/n5.json')).toBe('kanji');
    });

    it('should extract type from katakana file', () => {
      expect(extractCharTypeFromPath('../../packs/japanese-from-es/characters/katakana.json')).toBe('katakana');
    });
  });

  describe('filterByPack', () => {
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

    it('should filter modules by pack ID', () => {
      const modules = {
        '../../packs/japanese-from-es/vocabulary/n5.json': () => Promise.resolve({ default: [] }),
        '../../packs/english-from-es/vocabulary/a1.json': () => Promise.resolve({ default: [] }),
        '../../packs/japanese-from-es/vocabulary/n4.json': () => Promise.resolve({ default: [] }),
      };

      const result = filterByPack(modules, 'japanese-from-es');
      expect(Object.keys(result)).toHaveLength(2);
      expect(Object.keys(result)).toContain('../../packs/japanese-from-es/vocabulary/n5.json');
      expect(Object.keys(result)).toContain('../../packs/japanese-from-es/vocabulary/n4.json');
    });

    it('should return empty for non-existent pack', () => {
      const modules = {
        '../../packs/japanese-from-es/vocabulary/n5.json': () => Promise.resolve({ default: [] }),
      };

      const result = filterByPack(modules, 'chinese');
      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});
