/**
 * Zod validation schemas for Language Pack files.
 * Used by the validate-pack script and CI pipeline.
 */

import { z } from 'zod/v4';

export const WritingFamilySchema = z.enum([
  'cjk-japanese',
  'cjk-chinese',
  'hangul',
  'latin',
  'cyrillic',
  'arabic',
  'devanagari',
]);

export const SpeechConfigSchema = z.object({
  recognitionLang: z.string(),
  ttsLang: z.string(),
  defaultRate: z.number().min(0.1).max(2.0),
});

export const WritingSystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  hasDrawing: z.boolean().optional(),
  hasStrokeOrder: z.boolean().optional(),
});

export const PackFeaturesSchema = z.object({
  pitchAccent: z.boolean(),
  toneMarks: z.boolean(),
  furigana: z.boolean(),
  inputConversion: z.string().nullable(),
  tokenization: z.boolean(),
  placement: z.boolean(),
});

export const PackLevelSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number().int().positive(),
  description: z.string().optional(),
});

export const PackCategorySchema = z.enum([
  'vocabulary',
  'grammar',
  'characters',
  'reading',
  'listening',
]);

export const PackManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nativeName: z.string().min(1),
  sourceLanguage: z.string().min(2),
  icon: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  authors: z.array(z.string()).min(1),
  license: z.string(),
  aiGenerated: z.boolean(),
  family: WritingFamilySchema,
  speech: SpeechConfigSchema,
  direction: z.enum(['ltr', 'rtl']),
  writingSystems: z.array(WritingSystemSchema).min(1),
  features: PackFeaturesSchema,
  levels: z.array(PackLevelSchema).min(1),
  categories: z.array(PackCategorySchema).min(1),
});

export const VocabularyExampleSchema = z.object({
  text: z.string(),
  reading: z.string(),
  translation: z.string(),
});

export const VocabularyEntrySchema = z.object({
  word: z.string().min(1),
  reading: z.string().min(1),
  meanings: z.array(z.string()).min(1),
  pos: z.string(),
  level: z.string(),
  tags: z.array(z.string()),
  examples: z.array(VocabularyExampleSchema),
  audio: z.string().optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
});

export const GrammarExampleSchema = z.object({
  sentence: z.string(),
  reading: z.string().optional(),
  translation: z.string(),
  breakdown: z.array(z.string()).optional(),
});

export const GrammarPointSchema = z.object({
  id: z.string(),
  title: z.string(),
  pattern: z.string(),
  meaning: z.string(),
  level: z.string(),
  explanation: z.string(),
  examples: z.array(GrammarExampleSchema).min(1),
  notes: z.string().optional(),
  related: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const CharacterReadingSchema = z.object({
  type: z.string(),
  value: z.string(),
});

export const CharacterExampleSchema = z.object({
  word: z.string(),
  reading: z.string(),
  meaning: z.string(),
});

export const CharacterEntrySchema = z.object({
  character: z.string().min(1),
  readings: z.array(CharacterReadingSchema).min(1),
  meanings: z.array(z.string()).min(1),
  strokeCount: z.number().int().positive(),
  strokeOrder: z.string().optional(),
  radical: z.string().optional(),
  radicalMeaning: z.string().optional(),
  level: z.string(),
  tags: z.array(z.string()).optional(),
  examples: z.array(CharacterExampleSchema).optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
});

export const ReadingQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
  explanation: z.string().optional(),
});

export const ReadingTextSchema = z.object({
  id: z.string(),
  title: z.string(),
  level: z.string(),
  text: z.string().min(1),
  reading: z.string().optional(),
  translation: z.string().optional(),
  vocabulary: z.array(z.string()).optional(),
  questions: z.array(ReadingQuestionSchema).optional(),
});

/** Validate a pack manifest JSON object */
export function validateManifest(data: unknown) {
  return PackManifestSchema.safeParse(data);
}

/** Validate a vocabulary array */
export function validateVocabulary(data: unknown) {
  return z.array(VocabularyEntrySchema).safeParse(data);
}

/** Validate a grammar array */
export function validateGrammar(data: unknown) {
  return z.array(GrammarPointSchema).safeParse(data);
}

/** Validate character entries */
export function validateCharacters(data: unknown) {
  return z.array(CharacterEntrySchema).safeParse(data);
}

/** Validate reading texts */
export function validateReadings(data: unknown) {
  return z.array(ReadingTextSchema).safeParse(data);
}

export const RoadmapMilestoneSchema = z.object({
  text: z.string(),
  type: z.enum(['manual', 'srs_learned', 'srs_mature', 'lessons_completed']).optional(),
  target: z.number().optional(),
  level: z.string().optional(),
  category: z.string().optional(),
  lessonPrefix: z.string().optional(),
  lessonPrefixes: z.array(z.string()).optional(),
  total: z.number().optional(),
});

export const RoadmapPhaseActionSchema = z.object({
  label: z.string(),
  route: z.string(),
  variant: z.enum(['primary', 'secondary']).optional(),
});

export const RoadmapPhaseSchema = z.object({
  name: z.string(),
  duration: z.string(),
  level: z.string(),
  content: z.string(),
  dailyGoal: z.string(),
  milestones: z.array(z.union([z.string(), RoadmapMilestoneSchema])).min(1),
  actions: z.array(RoadmapPhaseActionSchema).optional(),
});

export const RoadmapSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['intensive', 'standard', 'casual']),
  description: z.string(),
  phases: z.array(RoadmapPhaseSchema).min(1),
});

export const ResourceEntrySchema = z.object({
  name: z.string(),
  author: z.string(),
  type: z.enum(['book', 'video', 'audio', 'app', 'website', 'method']),
  level: z.string(),
  areas: z.array(z.string()).min(1),
  instructionLanguage: z.string(),
  url: z.string().optional(),
  price: z.enum(['free', 'paid', 'freemium']),
  priceApprox: z.string().optional(),
  communityRating: z.string().optional(),
  description: z.string(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  recommendedOrder: z.number().optional(),
  complementaryResources: z.array(z.string()).optional(),
});

/** Validate roadmaps */
export function validateRoadmaps(data: unknown) {
  return z.array(RoadmapSchema).safeParse(data);
}

/** Validate resources */
export function validateResources(data: unknown) {
  return z.array(ResourceEntrySchema).safeParse(data);
}

// --- Placement schemas ---

const PlacementQuestionBaseFields = {
  category: PackCategorySchema,
  prompt: z.string().min(1),
  context: z.string().optional(),
};

export const PlacementMultipleChoiceSchema = z.object({
  type: z.literal('multiple-choice'),
  ...PlacementQuestionBaseFields,
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
});

export const PlacementWriteAnswerSchema = z.object({
  type: z.literal('write-answer'),
  ...PlacementQuestionBaseFields,
  acceptedAnswers: z.array(z.string()).min(1),
});

export const PlacementTrueFalseSchema = z.object({
  type: z.literal('true-false'),
  ...PlacementQuestionBaseFields,
  correctAnswer: z.boolean(),
});

export const PlacementQuestionSchema = z.union([
  PlacementMultipleChoiceSchema,
  PlacementWriteAnswerSchema,
  PlacementTrueFalseSchema,
]);

export const PlacementLevelConfigSchema = z.object({
  levelId: z.string().min(1),
  canDoStatements: z.array(z.string()).min(1),
  questions: z.array(PlacementQuestionSchema).min(1),
});

export const PlacementConfigSchema = z.object({
  passThreshold: z.number().min(0).max(1),
  questionsPerLevel: z.number().int().positive(),
  levels: z.array(PlacementLevelConfigSchema).min(1),
});

/** Validate placement config */
export function validatePlacement(data: unknown) {
  return PlacementConfigSchema.safeParse(data);
}

// --- Lesson schemas ---

export const LessonItemSchema = z.object({
  front: z.string(),
  back: z.string(),
  reading: z.string().optional(),
  explanation: z.string().optional(),
  mnemonic: z.string().optional(),
  imageUrl: z.string().optional(),
  audio: z.string().optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
  cardRef: z
    .object({
      category: z.string(),
      front: z.string(),
    })
    .optional(),
});

export const LessonStepSchema = z.object({
  type: z.enum([
    'introduce',
    'recognize',
    'recall',
    'write',
    'sentence-build',
    'listen-identify',
    'listen-transcribe',
    'speak',
    'fill-blank-multi',
    'word-in-context',
    'error-correction',
    'image-association',
    'story-comprehension',
    'conversation-script',
    'summary',
  ]),
  title: z.string().optional(),
  instruction: z.string().optional(),
  itemIndices: z.array(z.number()),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  level: z.string(),
  category: z.string(),
  items: z.array(LessonItemSchema).min(1),
  steps: z.array(LessonStepSchema).min(2),
});

export const LessonMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  level: z.string(),
  category: z.enum(['vocabulary', 'characters', 'grammar', 'mixed']),
  order: z.number().positive(),
  prerequisites: z.array(z.string()),
  estimatedMinutes: z.number().positive(),
  newItemCount: z.number().positive(),
});

export const LessonIndexSchema = z.object({
  lessons: z.array(LessonMetaSchema).min(1),
});

/** Validate a lesson index file */
export function validateLessonIndex(data: unknown) {
  return LessonIndexSchema.safeParse(data);
}

/** Validate a single lesson file */
export function validateLesson(data: unknown) {
  return LessonSchema.safeParse(data);
}
