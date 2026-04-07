/**
 * LinguaForge Pack Spec — TypeScript interfaces
 * These types define the contract between the core engine and any Language Pack.
 * A pack is a folder of JSON files that conforms to these types.
 */

/** Supported writing system families — maps to an adapter in the core */
export type WritingFamily =
  | 'cjk-japanese'
  | 'cjk-chinese'
  | 'hangul'
  | 'latin'
  | 'cyrillic'
  | 'arabic'
  | 'devanagari';

/** Text direction */
export type TextDirection = 'ltr' | 'rtl';

/** Speech configuration for STT/TTS */
export interface SpeechConfig {
  recognitionLang: string; // BCP-47 e.g. 'ja-JP'
  ttsLang: string;         // BCP-47 e.g. 'ja-JP'
  defaultRate: number;     // 0.1–2.0, default 0.8
}

/** Writing system declared by a pack */
export interface WritingSystem {
  id: string;
  name: string;
  hasDrawing?: boolean;
  hasStrokeOrder?: boolean;
}

/** Feature flags controlled by the pack */
export interface PackFeatures {
  pitchAccent: boolean;
  toneMarks: boolean;
  furigana: boolean;
  inputConversion: string | null; // 'wanakana' | null
  tokenization: boolean;
}

/** Level definition inside a pack */
export interface PackLevel {
  id: string;
  name: string;
  order: number;
  description?: string;
}

/** Content categories supported by the pack */
export type PackCategory =
  | 'vocabulary'
  | 'grammar'
  | 'characters'
  | 'reading'
  | 'listening';

/** The manifest.json — the heart of every Language Pack */
export interface PackManifest {
  id: string;
  name: string;
  nativeName: string;
  icon: string;
  version: string;
  authors: string[];
  license: string;
  aiGenerated: boolean;
  family: WritingFamily;
  speech: SpeechConfig;
  direction: TextDirection;
  writingSystems: WritingSystem[];
  features: PackFeatures;
  levels: PackLevel[];
  categories: PackCategory[];
}

/** Vocabulary entry in vocabulary/[level].json */
export interface VocabularyEntry {
  word: string;
  reading: string;
  meanings: string[];
  pos: string; // part-of-speech tag, e.g. 'verb-ichidan', 'noun', 'adjective-i'
  level: string;
  tags: string[];
  examples: VocabularyExample[];
  audio?: string;
  imageUrl?: string;
  extra?: Record<string, unknown>;
}

export interface VocabularyExample {
  text: string;      // original text in the target language
  reading: string;   // reading/pronunciation aid (furigana, pinyin, etc.)
  translation: string;
}

/** Grammar point in grammar/[level].json */
export interface GrammarPoint {
  id: string;
  title: string;
  pattern: string;
  meaning: string;
  level: string;
  explanation: string;
  examples: GrammarExample[];
  notes?: string;
  related?: string[];
  tags?: string[];
}

export interface GrammarExample {
  sentence: string;
  reading?: string;
  translation: string;
  breakdown?: string[];
}

/** Character entry in characters/[system].json */
export interface CharacterEntry {
  character: string;
  readings: CharacterReading[];
  meanings: string[];
  strokeCount: number;
  strokeOrder?: string;           // SVG path data or reference
  strokeOrderSvg?: string[];     // Array of SVG path strings, one per stroke (for animation)
  radical?: string;
  radicalMeaning?: string;
  components?: CharacterComponent[];  // Decomposition into sub-components
  level: string;
  tags?: string[];
  examples?: CharacterExample[];
  mnemonic?: string;              // Mnemonic for memorization
  extra?: Record<string, unknown>;
}

/** Sub-component of a character (radical, jamo, etc.) */
export interface CharacterComponent {
  component: string;       // The visual component (e.g. '氵', 'ㄱ')
  meaning: string;         // Meaning of the component
  position?: string;       // 'left' | 'right' | 'top' | 'bottom' | 'enclosure' | etc.
  type?: string;           // 'radical' | 'jamo' | 'phonetic' | 'semantic'
}

export interface CharacterReading {
  type: string; // 'on' | 'kun' | 'nanori' for kanji; 'romaji' for kana; 'pinyin' for CN; etc.
  value: string;
  isPrimary?: boolean;  // Marks the most common reading
}

export interface CharacterExample {
  word: string;
  reading: string;
  meaning: string;
}

/** Reading passage in readings/[level].json */
export interface ReadingText {
  id: string;
  title: string;
  level: string;
  text: string;
  reading?: string;
  translation?: string;
  vocabulary?: string[];
  questions?: ReadingQuestion[];
}

export interface ReadingQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

/** Pronunciation data in pronunciation/[type].json */
export interface PronunciationEntry {
  word: string;
  reading: string;
  pitchPattern?: number[];
  pitchType?: string; // 'heiban' | 'atamadaka' | 'nakadaka' | 'odaka'
  toneNumber?: number;
  audio?: string;
}

/** Roadmap entry in roadmaps.json */
export interface Roadmap {
  id: string;
  name: string;
  type: 'intensive' | 'standard' | 'casual';
  description: string;
  phases: RoadmapPhase[];
}

export interface RoadmapPhase {
  name: string;
  duration: string;
  level: string;
  content: string;
  dailyGoal: string;
  milestones: string[];
}

/** Resource entry in resources.json */
export interface ResourceEntry {
  name: string;
  author: string;
  type: 'book' | 'video' | 'audio' | 'app' | 'website' | 'method';
  level: string;
  areas: string[];
  instructionLanguage: string;
  url?: string;
  price: 'free' | 'paid' | 'freemium';
  priceApprox?: string;
  communityRating?: string;
  description: string;
  pros?: string[];
  cons?: string[];
  recommendedOrder?: number;
  complementaryResources?: string[];
}
