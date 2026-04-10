import { describe, it, expect } from 'vitest';
import { LatinAdapter } from '../latin';

describe('LatinAdapter', () => {
  const adapter = new LatinAdapter();

  it('should not require initialization', () => {
    expect(adapter.requiresInit).toBe(false);
    expect(adapter.isReady()).toBe(true);
  });

  it('should have correct family and name', () => {
    expect(adapter.family).toBe('latin');
    expect(adapter.name).toBe('Latin Script');
  });

  it('should tokenize English text into words', async () => {
    const tokens = await adapter.tokenize('Hello world');
    expect(tokens).toHaveLength(2);
    expect(tokens[0].surface).toBe('Hello');
    expect(tokens[0].baseForm).toBe('hello');
    expect(tokens[0].start).toBe(0);
    expect(tokens[0].end).toBe(5);
    expect(tokens[1].surface).toBe('world');
    expect(tokens[1].start).toBe(6);
    expect(tokens[1].end).toBe(11);
  });

  it('should tokenize multi-word sentences', async () => {
    const tokens = await adapter.tokenize('The quick brown fox');
    expect(tokens).toHaveLength(4);
    expect(tokens.map((t) => t.surface)).toEqual(['The', 'quick', 'brown', 'fox']);
  });

  it('should handle empty input', async () => {
    const tokens = await adapter.tokenize('');
    expect(tokens).toHaveLength(0);
  });

  it('should annotate without modifications (no furigana for Latin)', async () => {
    const result = await adapter.annotate('Hello world');
    expect(result.html).toBe('Hello world');
    expect(result.plain).toBe('Hello world');
    expect(result.tokens).toHaveLength(2);
  });

  it('should compare answers case-insensitively', () => {
    const result = adapter.compareAnswer('Hello', 'hello');
    expect(result.isCorrect).toBe(true);
    expect(result.similarity).toBe(1);
  });

  it('should detect exact matches', () => {
    const result = adapter.compareAnswer('hello', 'hello');
    expect(result.isCorrect).toBe(true);
    expect(result.similarity).toBe(1);
  });

  it('should detect incorrect answers', () => {
    const result = adapter.compareAnswer('goodbye', 'hello');
    expect(result.isCorrect).toBe(false);
    expect(result.similarity).toBeLessThan(0.5);
  });

  it('should detect close answers with similarity score', () => {
    const result = adapter.compareAnswer('helo', 'hello');
    expect(result.isCorrect).toBe(false);
    expect(result.similarity).toBeGreaterThan(0.7);
    expect(result.feedback).toBeDefined();
  });

  it('should handle empty input in compareAnswer', () => {
    const result = adapter.compareAnswer('', 'hello');
    expect(result.isCorrect).toBe(false);
    expect(result.similarity).toBe(0);
  });

  it('should trim whitespace in compareAnswer', () => {
    const result = adapter.compareAnswer('  hello  ', 'hello');
    expect(result.isCorrect).toBe(true);
  });

  it('should match STT transcript with trailing period', () => {
    // STT engines add punctuation: "Father." should match "father"
    const result = adapter.compareAnswer('Father.', 'father');
    expect(result.isCorrect).toBe(true);
    expect(result.similarity).toBe(1);
  });

  it('should match STT transcript with trailing question mark', () => {
    const result = adapter.compareAnswer('Good morning?', 'good morning');
    expect(result.isCorrect).toBe(true);
    expect(result.similarity).toBe(1);
  });

  it('should match STT transcript with comma', () => {
    const result = adapter.compareAnswer('Yes,', 'yes');
    expect(result.isCorrect).toBe(true);
    expect(result.similarity).toBe(1);
  });

  it('should return no-op from bindInput', () => {
    // Skip in non-DOM environments (Node/Vitest without jsdom)
    if (typeof document === 'undefined') {
      const unbind = adapter.bindInput({} as HTMLInputElement);
      expect(typeof unbind).toBe('function');
      unbind();
    } else {
      const unbind = adapter.bindInput(document.createElement('input'));
      expect(typeof unbind).toBe('function');
      unbind();
    }
  });

  it('should pass through convert without changes', async () => {
    const result = await adapter.convert('hello', 'hiragana', 'katakana');
    expect(result).toBe('hello');
  });
});
