import { describe, it, expect } from 'vitest';
import { JapaneseAdapter } from '../japanese';

describe('JapaneseAdapter', () => {
  const adapter = new JapaneseAdapter();

  it('has correct family', () => {
    expect(adapter.family).toBe('cjk-japanese');
  });

  it('requires init', () => {
    expect(adapter.requiresInit).toBe(true);
  });

  it('is not ready before init', () => {
    expect(adapter.isReady()).toBe(false);
  });

  describe('compareAnswer (does not require init)', () => {
    it('matches identical hiragana', () => {
      const result = adapter.compareAnswer('たべる', 'たべる');
      expect(result.isCorrect).toBe(true);
      expect(result.similarity).toBe(1.0);
    });

    it('matches romaji input against hiragana expected', () => {
      const result = adapter.compareAnswer('taberu', 'たべる');
      expect(result.isCorrect).toBe(true);
    });

    it('matches katakana vs hiragana', () => {
      const result = adapter.compareAnswer('タベル', 'たべる');
      expect(result.isCorrect).toBe(true);
    });

    it('rejects wrong answer', () => {
      const result = adapter.compareAnswer('のむ', 'たべる');
      expect(result.isCorrect).toBe(false);
    });

    it('provides feedback for romaji input', () => {
      const result = adapter.compareAnswer('wrong', 'たべる');
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toBeDefined();
    });
  });

  describe('bindInput', () => {
    it.skipIf(typeof document === 'undefined')('returns an unbind function', () => {
      const input = document.createElement('input');
      const unbind = adapter.bindInput(input);
      expect(typeof unbind).toBe('function');
      unbind();
    });
  });
});
