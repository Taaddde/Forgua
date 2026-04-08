import { describe, it, expect } from 'vitest';
import type { CharacterEntry, VocabularyEntry, GrammarPoint } from '../../core/types/pack-spec';

// Kanji
import kanjiN5 from '../characters/kanji/n5.json';
import kanjiN4 from '../characters/kanji/n4.json';
import kanjiN3 from '../characters/kanji/n3.json';
import kanjiN2 from '../characters/kanji/n2.json';
import kanjiN1 from '../characters/kanji/n1.json';

// Vocabulary
import vocabN5 from '../vocabulary/n5.json';
import vocabN4 from '../vocabulary/n4.json';
import vocabN3 from '../vocabulary/n3.json';
import vocabN2 from '../vocabulary/n2.json';
import vocabN1 from '../vocabulary/n1.json';

// Grammar
import grammarN5 from '../grammar/n5.json';
import grammarN4 from '../grammar/n4.json';
import grammarN3 from '../grammar/n3.json';
import grammarN2 from '../grammar/n2.json';
import grammarN1 from '../grammar/n1.json';

const allKanji: { level: string; data: CharacterEntry[] }[] = [
  { level: 'n5', data: kanjiN5 as CharacterEntry[] },
  { level: 'n4', data: kanjiN4 as CharacterEntry[] },
  { level: 'n3', data: kanjiN3 as CharacterEntry[] },
  { level: 'n2', data: kanjiN2 as CharacterEntry[] },
  { level: 'n1', data: kanjiN1 as CharacterEntry[] },
];

const allVocab: { level: string; data: VocabularyEntry[] }[] = [
  { level: 'n5', data: vocabN5 as VocabularyEntry[] },
  { level: 'n4', data: vocabN4 as VocabularyEntry[] },
  { level: 'n3', data: vocabN3 as VocabularyEntry[] },
  { level: 'n2', data: vocabN2 as VocabularyEntry[] },
  { level: 'n1', data: vocabN1 as VocabularyEntry[] },
];

const allGrammar: { level: string; data: GrammarPoint[] }[] = [
  { level: 'n5', data: grammarN5 as GrammarPoint[] },
  { level: 'n4', data: grammarN4 as GrammarPoint[] },
  { level: 'n3', data: grammarN3 as GrammarPoint[] },
  { level: 'n2', data: grammarN2 as GrammarPoint[] },
  { level: 'n1', data: grammarN1 as GrammarPoint[] },
];

describe('Japanese pack data integrity', () => {
  describe('Kanji', () => {
    it.each(allKanji)('should have few or no duplicate kanji within $level', ({ level, data }) => {
      const characters = data.map((e) => e.character);
      const unique = new Set(characters);
      const duplicateCount = characters.length - unique.size;
      // N2 and N1 (our generated data) should have 0 duplicates
      // Pre-existing levels may have a small number of duplicates
      if (level === 'n2' || level === 'n1') {
        expect(duplicateCount).toBe(0);
      } else {
        expect(duplicateCount).toBeLessThanOrEqual(5);
      }
    });

    it.each(allKanji)('should have valid stroke counts (1-30) for all $level kanji', ({ data }) => {
      for (const entry of data) {
        expect(entry.strokeCount).toBeGreaterThanOrEqual(1);
        expect(entry.strokeCount).toBeLessThanOrEqual(30);
      }
    });

    it.each(allKanji)('should have at least one reading for all $level kanji', ({ data }) => {
      for (const entry of data) {
        expect(entry.readings.length).toBeGreaterThanOrEqual(1);
        // At least one reading must be non-empty
        const hasValidReading = entry.readings.some((r) => r.value.length > 0);
        expect(hasValidReading).toBe(true);
      }
    });

    it.each(allKanji)('should have at least one meaning for all $level kanji', ({ data }) => {
      for (const entry of data) {
        expect(entry.meanings.length).toBeGreaterThanOrEqual(1);
        expect(entry.meanings[0].length).toBeGreaterThan(0);
      }
    });

    it.each(allKanji)('should have matching level field for all $level kanji', ({ level, data }) => {
      for (const entry of data) {
        expect(entry.level).toBe(level);
      }
    });

    it.each(allKanji)('should have examples for all $level kanji', ({ data }) => {
      for (const entry of data) {
        expect(entry.examples).toBeDefined();
        expect(entry.examples!.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should have minimum entry counts per level', () => {
      expect(kanjiN5.length).toBeGreaterThanOrEqual(50);
      expect(kanjiN4.length).toBeGreaterThanOrEqual(50);
      expect(kanjiN3.length).toBeGreaterThanOrEqual(50);
      expect(kanjiN2.length).toBeGreaterThanOrEqual(150);
      expect(kanjiN1.length).toBeGreaterThanOrEqual(150);
    });
  });

  describe('Vocabulary', () => {
    it.each(allVocab)('should have no duplicate words within $level', ({ data }) => {
      const words = data.map((e) => e.word);
      const unique = new Set(words);
      expect(unique.size).toBe(words.length);
    });

    it.each(allVocab)('should have readings for all $level vocab entries', ({ data }) => {
      for (const entry of data) {
        expect(entry.reading.length).toBeGreaterThan(0);
      }
    });

    it.each(allVocab)('should have at least one meaning for all $level vocab', ({ data }) => {
      for (const entry of data) {
        expect(entry.meanings.length).toBeGreaterThanOrEqual(1);
      }
    });

    it.each(allVocab)('should have matching level field for all $level vocab', ({ level, data }) => {
      for (const entry of data) {
        expect(entry.level).toBe(level);
      }
    });

    it.each(allVocab)('should have at least one example for all $level vocab', ({ data }) => {
      for (const entry of data) {
        expect(entry.examples.length).toBeGreaterThanOrEqual(1);
        for (const ex of entry.examples) {
          expect(ex.text.length).toBeGreaterThan(0);
          expect(ex.translation.length).toBeGreaterThan(0);
        }
      }
    });

    it('should have minimum entry counts per level', () => {
      expect(vocabN5.length).toBeGreaterThanOrEqual(50);
      expect(vocabN4.length).toBeGreaterThanOrEqual(100);
      expect(vocabN3.length).toBeGreaterThanOrEqual(100);
      expect(vocabN2.length).toBeGreaterThanOrEqual(200);
      expect(vocabN1.length).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Grammar', () => {
    it.each(allGrammar)('should have no duplicate IDs within $level', ({ data }) => {
      const ids = data.map((g) => g.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it.each(allGrammar)('should have matching level field for all $level grammar', ({ level, data }) => {
      for (const entry of data) {
        expect(entry.level).toBe(level);
      }
    });

    it.each(allGrammar)('should have at least one example for all $level grammar points', ({ data }) => {
      for (const entry of data) {
        expect(entry.examples.length).toBeGreaterThanOrEqual(1);
        for (const ex of entry.examples) {
          expect(ex.sentence.length).toBeGreaterThan(0);
          expect(ex.translation.length).toBeGreaterThan(0);
        }
      }
    });

    it('should have minimum entry counts per level', () => {
      expect(grammarN5.length).toBeGreaterThanOrEqual(20);
      expect(grammarN4.length).toBeGreaterThanOrEqual(30);
      expect(grammarN3.length).toBeGreaterThanOrEqual(30);
      expect(grammarN2.length).toBeGreaterThanOrEqual(50);
      expect(grammarN1.length).toBeGreaterThanOrEqual(50);
    });
  });
});
