/**
 * JapaneseAdapter — text processing for Japanese (CJK) using:
 * - @sglkc/kuromoji for morphological tokenization
 * - kuroshiro for furigana generation and script conversion
 * - wanakana for romaji↔kana conversion and input binding
 *
 * Lazy-loaded via the adapter registry only when a Japanese pack is selected.
 */

import { AbstractAdapter } from './base';
import type { Token, AnnotatedText, MatchResult, ConversionTarget } from './base';
import type { AdapterProgressCallback } from '../types/adapter';
import {
  toHiragana,
  toKatakana,
  toRomaji,
  isRomaji,
  isKana,
  isKatakana,
  bind,
  unbind,
} from 'wanakana';

/** Known total size of kuromoji dictionary files (~17 MB) */
const DICT_TOTAL_BYTES = 17_800_000;

export class JapaneseAdapter extends AbstractAdapter {
  readonly family = 'cjk-japanese';
  readonly name = 'Japanese (CJK)';
  readonly requiresInit = true;

  private kuroshiroInstance: InstanceType<typeof import('kuroshiro').default> | null = null;
  private kuromojiTokenizer: {
    tokenize(text: string): {
      surface_form: string;
      basic_form: string;
      reading?: string;
      pos: string;
      word_position: number;
    }[];
  } | null = null;
  private _ready = false;

  async init(onProgress?: AdapterProgressCallback): Promise<void> {
    onProgress?.('dictionaries', 0);

    // Resolve dict path relative to the app's base URL so it works both
    // in dev ('/') and under a subpath in production (e.g. '/Forgua/').
    // BASE_URL always ends with '/', so we strip the trailing slash from
    // the join to get a clean '<base>/dict' (or '/dict' in dev).
    const baseUrl = import.meta.env.BASE_URL;
    const dictPath = `${baseUrl.replace(/\/$/, '')}/dict`;

    // Intercept fetch to (a) validate dict responses and (b) track progress.
    // Validation matters because a 404 on GitHub Pages returns an HTML page
    // with 200-ish semantics for the body — kuromoji then tries to gunzip
    // HTML and hangs indefinitely. We want to fail loudly instead.
    let bytesLoaded = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const response = await originalFetch.call(globalThis, input, init);
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
      if (url.includes(`${dictPath}/`)) {
        if (!response.ok) {
          throw new Error(
            `Failed to fetch kuromoji dictionary: ${url} returned ${response.status}. ` +
            `Check that the /dict/ files are deployed under the app base path.`,
          );
        }
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('text/html')) {
          throw new Error(
            `Kuromoji dictionary URL returned HTML instead of binary: ${url}. ` +
            `This usually means the file is missing and the server is serving a 404 page.`,
          );
        }
        if (onProgress) {
          // Clone the response so we can read the body for progress
          // without interfering with the consumer (kuromoji).
          const body = response.clone().body;
          if (body) {
            const reader = body.getReader();
            // Read in the background — no need to block the return,
            // but we must not leave it as a dangling promise.
            void (async () => {
              try {
                for (;;) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  bytesLoaded += value.byteLength;
                  onProgress('dictionaries', Math.min(bytesLoaded / DICT_TOTAL_BYTES, 0.95));
                }
              } catch {
                // Clone body read failed — progress stops but init continues fine.
              }
            })();
          }
        }
      }
      return response;
    };

    try {
      const [KuroshiroModule] = await Promise.all([
        import('kuroshiro'),
        import('@sglkc/kuromoji'), // Pre-loaded so BrowserKuromojiAnalyzer has it ready
      ]);
      const { BrowserKuromojiAnalyzer } = await import('./kuromoji-analyzer');

      const Kuroshiro = KuroshiroModule.default;

      onProgress?.('dictionaries', 0.05);

      // Init kuroshiro with our browser-compatible analyzer.
      // The analyzer builds kuromoji internally — we reuse its tokenizer
      // to avoid downloading and parsing the ~17 MB dictionaries twice.
      this.kuroshiroInstance = new Kuroshiro();
      const analyzer = new BrowserKuromojiAnalyzer({ dictPath });
      await this.kuroshiroInstance.init(analyzer);

      onProgress?.('tokenizer', 0.97);

      // Reuse the tokenizer that was already built during kuroshiro init
      this.kuromojiTokenizer = analyzer.tokenizer;
    } finally {
      // Always restore original fetch
      globalThis.fetch = originalFetch;
    }

    onProgress?.('ready', 1);
    this._ready = true;
  }

  isReady(): boolean {
    return this._ready;
  }

  async tokenize(text: string): Promise<Token[]> {
    if (!this.kuromojiTokenizer) {
      throw new Error('JapaneseAdapter not initialized — call init() first');
    }

    const kuroTokens = this.kuromojiTokenizer.tokenize(text);
    return kuroTokens.map((kt) => ({
      surface: kt.surface_form,
      baseForm: kt.basic_form !== '*' ? kt.basic_form : kt.surface_form,
      reading: kt.reading ? toHiragana(kt.reading, { passRomaji: true }) : undefined,
      pos: kt.pos,
      start: kt.word_position,
      end: kt.word_position + kt.surface_form.length,
    }));
  }

  async annotate(text: string): Promise<AnnotatedText> {
    if (!this.kuroshiroInstance) {
      throw new Error('JapaneseAdapter not initialized — call init() first');
    }

    const html = await this.kuroshiroInstance.convert(text, {
      to: 'hiragana',
      mode: 'furigana',
    });
    const tokens = await this.tokenize(text);

    return { html, plain: text, tokens };
  }

  async convert(text: string, _from: ConversionTarget, to: ConversionTarget): Promise<string> {
    // Use wanakana for kana<->romaji conversions (no dict needed)
    if (to === 'hiragana') return toHiragana(text);
    if (to === 'katakana') return toKatakana(text);
    if (to === 'romaji') return toRomaji(text);

    // Fallback to kuroshiro for kanji->kana conversion
    if (this.kuroshiroInstance) {
      const target = to === 'hiragana' ? 'hiragana' : to === 'katakana' ? 'katakana' : 'romaji';
      return this.kuroshiroInstance.convert(text, {
        to: target as 'hiragana' | 'katakana' | 'romaji',
        mode: 'normal',
      });
    }

    return text;
  }

  compareAnswer(input: string, expected: string): MatchResult {
    // Normalize both sides
    let normalizedInput = input.trim().normalize('NFKC');
    let normalizedExpected = expected.trim().normalize('NFKC');

    // If input is romaji and expected is kana, convert input to hiragana
    if (isRomaji(normalizedInput) && (isKana(normalizedExpected) || !isRomaji(normalizedExpected))) {
      normalizedInput = toHiragana(normalizedInput);
    }

    // If input is katakana and expected is hiragana, convert to hiragana
    if (isKatakana(normalizedInput) && !isKatakana(normalizedExpected)) {
      normalizedInput = toHiragana(normalizedInput);
    }
    if (isKatakana(normalizedExpected) && !isKatakana(normalizedInput)) {
      normalizedExpected = toHiragana(normalizedExpected);
    }

    // Also try lowercase comparison for mixed content
    const inputLower = normalizedInput.toLowerCase();
    const expectedLower = normalizedExpected.toLowerCase();

    const isCorrect = normalizedInput === normalizedExpected || inputLower === expectedLower;

    const maxLen = Math.max(normalizedInput.length, normalizedExpected.length);
    const distance = levenshteinDistance(normalizedInput, normalizedExpected);
    const similarity = maxLen === 0 ? 1 : 1 - distance / maxLen;

    let feedback: string | undefined;
    if (!isCorrect && isRomaji(input.trim()) && isKana(expected.trim())) {
      feedback = 'Intentá escribir en hiragana';
    } else if (!isCorrect && similarity > 0.7) {
      feedback = 'Casi — revisá los caracteres';
    }

    return {
      isCorrect,
      similarity: isCorrect ? 1.0 : similarity,
      feedback,
      normalizedInput,
      normalizedExpected,
    };
  }

  bindInput(element: HTMLInputElement | HTMLTextAreaElement): () => void {
    bind(element, { IMEMode: true });
    return () => unbind(element);
  }
}

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
