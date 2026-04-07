declare module '@sglkc/kuromoji' {
  interface TokenizerBuilder {
    build(callback: (err: Error | null, tokenizer: KuromojiTokenizer) => void): void;
  }
  interface KuromojiToken {
    surface_form: string;
    word_type: string;
    word_position: number;
    basic_form: string;
    reading?: string;
    pronunciation?: string;
    pos: string;
    pos_detail_1: string;
    pos_detail_2: string;
    pos_detail_3: string;
    conjugated_type: string;
    conjugated_form: string;
  }
  interface KuromojiTokenizer {
    tokenize(text: string): KuromojiToken[];
  }
  interface Builder {
    builder(options: { dicPath: string }): TokenizerBuilder;
  }
  const kuromoji: Builder;
  export default kuromoji;
}

declare module 'kuroshiro' {
  export default class Kuroshiro {
    init(analyzer: unknown): Promise<void>;
    convert(text: string, options?: {
      to?: 'hiragana' | 'katakana' | 'romaji';
      mode?: 'normal' | 'spaced' | 'okurigana' | 'furigana';
      romajiSystem?: 'nippon' | 'passport' | 'hepburn';
    }): Promise<string>;
    static Util: {
      isHiragana(char: string): boolean;
      isKatakana(char: string): boolean;
      isKanji(char: string): boolean;
      isJapanese(char: string): boolean;
      hasHiragana(str: string): boolean;
      hasKatakana(str: string): boolean;
      hasKanji(str: string): boolean;
    };
  }
}

declare module 'kuroshiro-analyzer-kuromoji' {
  export default class KuromojiAnalyzer {
    constructor(options?: { dictPath?: string });
    init(): Promise<void>;
  }
}

declare module 'wanakana' {
  export function toHiragana(input: string, options?: Record<string, unknown>): string;
  export function toKatakana(input: string, options?: Record<string, unknown>): string;
  export function toRomaji(input: string, options?: Record<string, unknown>): string;
  export function isHiragana(input: string): boolean;
  export function isKatakana(input: string): boolean;
  export function isKana(input: string): boolean;
  export function isKanji(input: string): boolean;
  export function isJapanese(input: string): boolean;
  export function isMixed(input: string): boolean;
  export function isRomaji(input: string): boolean;
  export function toKana(input: string, options?: Record<string, unknown>): string;
  export function stripOkurigana(input: string, options?: Record<string, unknown>): string;
  export function tokenize(input: string): string[];
  export function bind(element: HTMLInputElement | HTMLTextAreaElement, options?: Record<string, unknown>): void;
  export function unbind(element: HTMLInputElement | HTMLTextAreaElement): void;
}
