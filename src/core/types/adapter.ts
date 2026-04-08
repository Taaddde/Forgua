/**
 * Forgua Adapter interfaces
 * Each writing-system family has an adapter in the core that implements
 * text processing operations. Packs never contain code; the adapter
 * is selected by the `family` field in the pack manifest.
 */

/** A single token produced by tokenize() */
export interface Token {
  surface: string;       // The original text segment
  baseForm?: string;     // Dictionary form (e.g. 食べる for 食べた)
  reading?: string;      // Phonetic reading (e.g. たべる)
  pos?: string;          // Part of speech tag
  start: number;         // Character offset in original text
  end: number;           // Character offset end
}

/** Annotated text produced by annotate() */
export interface AnnotatedText {
  html: string;          // HTML with <ruby> tags or other annotations
  plain: string;         // Plain text without annotations
  tokens: Token[];       // Token breakdown
}

/** Result of comparing a user answer with the expected answer */
export interface MatchResult {
  isCorrect: boolean;
  similarity: number;    // 0.0 – 1.0
  feedback?: string;     // Optional hint about what was wrong
  normalizedInput: string;
  normalizedExpected: string;
}

/** Conversion target for convert() */
export type ConversionTarget = string; // e.g. 'hiragana', 'katakana', 'romaji', 'pinyin'

/** Progress callback for adapter initialization (e.g. dictionary downloads) */
export type AdapterProgressCallback = (phase: string, progress: number) => void;

/**
 * Abstract base class for all writing-system adapters.
 * Each adapter implements language-family-specific text processing.
 * The core never imports language-specific logic directly —
 * everything goes through the adapter registry.
 */
export abstract class AbstractAdapter {
  /** Unique family identifier, matches PackManifest.family */
  abstract readonly family: string;

  /** Human-readable name */
  abstract readonly name: string;

  /** Whether this adapter requires async initialization (e.g. loading dictionaries) */
  abstract readonly requiresInit: boolean;

  /** Initialize the adapter (load dictionaries, WASM modules, etc.) */
  abstract init(onProgress?: AdapterProgressCallback): Promise<void>;

  /** Whether init() has been called successfully */
  abstract isReady(): boolean;

  /**
   * Segment text into tokens (words/morphemes).
   * For CJK: morphological analysis. For latin: split by spaces.
   */
  abstract tokenize(text: string): Promise<Token[]>;

  /**
   * Generate annotated text with reading aids.
   * For Japanese: furigana. For Chinese: pinyin. For Latin: no-op.
   */
  abstract annotate(text: string): Promise<AnnotatedText>;

  /**
   * Convert text between writing systems.
   * e.g. romaji → hiragana, simplified → traditional, etc.
   */
  abstract convert(text: string, from: ConversionTarget, to: ConversionTarget): Promise<string>;

  /**
   * Compare a user's answer with the expected answer using fuzzy matching.
   * Handles normalization, width variants, kana equivalence, etc.
   */
  abstract compareAnswer(input: string, expected: string): MatchResult;

  /**
   * Bind real-time input conversion to an HTML element.
   * e.g. WanaKana binding for romaji→kana in text fields.
   * Returns an unbind function.
   */
  abstract bindInput(element: HTMLInputElement | HTMLTextAreaElement): () => void;
}
