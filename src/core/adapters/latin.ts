/**
 * LatinAdapter — text processing for space-separated Latin-script languages.
 * Covers English, French, German, Spanish, Italian, Portuguese, etc.
 * No external dependencies needed.
 */

import { AbstractAdapter } from './base';
import type { Token, AnnotatedText, MatchResult, ConversionTarget } from './base';

export class LatinAdapter extends AbstractAdapter {
  readonly family = 'latin';
  readonly name = 'Latin Script';
  readonly requiresInit = false;

  private _ready = true;

  async init(): Promise<void> {
    // No initialization needed for Latin script
    this._ready = true;
  }

  isReady(): boolean {
    return this._ready;
  }

  async tokenize(text: string): Promise<Token[]> {
    const tokens: Token[] = [];
    let offset = 0;

    // Split by whitespace and punctuation boundaries
    const words = text.match(/\S+/g) || [];
    for (const word of words) {
      const start = text.indexOf(word, offset);
      tokens.push({
        surface: word,
        baseForm: word.toLowerCase(),
        start,
        end: start + word.length,
      });
      offset = start + word.length;
    }

    return tokens;
  }

  async annotate(text: string): Promise<AnnotatedText> {
    // Latin script doesn't need annotations (no furigana, no pinyin)
    const tokens = await this.tokenize(text);
    return {
      html: text,
      plain: text,
      tokens,
    };
  }

  async convert(_text: string, _from: ConversionTarget, _to: ConversionTarget): Promise<string> {
    // No script conversion for Latin languages
    return _text;
  }

  compareAnswer(input: string, expected: string): MatchResult {
    const normalizedInput = input.trim().toLowerCase();
    const normalizedExpected = expected.trim().toLowerCase();

    const isCorrect = normalizedInput === normalizedExpected;

    // Simple Levenshtein-based similarity for feedback
    const maxLen = Math.max(normalizedInput.length, normalizedExpected.length);
    const distance = levenshteinDistance(normalizedInput, normalizedExpected);
    const similarity = maxLen === 0 ? 1 : 1 - distance / maxLen;

    return {
      isCorrect,
      similarity,
      normalizedInput,
      normalizedExpected,
      feedback: isCorrect ? undefined : similarity > 0.7 ? 'Close! Check your spelling.' : undefined,
    };
  }

  bindInput(_element: HTMLInputElement | HTMLTextAreaElement): () => void {
    // No input conversion needed for Latin script
    return () => {};
  }
}

/** Simple Levenshtein distance for answer comparison */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}
