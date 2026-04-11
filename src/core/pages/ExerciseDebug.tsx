/**
 * ExerciseDebug — development-only harness for testing exercise components.
 * Accessible at /debug/exercises in dev mode only.
 *
 * Each section uses a render prop so the Section wrapper can capture
 * the onAnswer callback and show a result badge for Playwright assertions.
 */

import { useState } from 'react';
import { ImageAssociation } from '../components/exercises/ImageAssociation';
import { WordInContext } from '../components/exercises/WordInContext';
import { ClozeMulti } from '../components/exercises/ClozeMulti';
import { ErrorCorrection } from '../components/exercises/ErrorCorrection';
import { ConversationScript } from '../components/exercises/ConversationScript';
import { StoryComprehension } from '../components/exercises/StoryComprehension';
import type { ConversationScript as ConversationScriptData } from '../types/pack-spec';
import type { ReadingText } from '../types/pack-spec';
import { ReviewGrade } from '../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

/* ── Sample data ─────────────────────────────────────────────── */

const IMAGE_SAMPLE = {
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Cute_dog.jpg/320px-Cute_dog.jpg',
  imageAlt: 'A dog',
  options: ['猫 (cat)', '犬 (dog)', '鳥 (bird)', '魚 (fish)'],
  correctIndex: 1,
};

const WORD_SAMPLE = {
  targetWord: '食べる',
  translation: 'to eat',
  options: [
    '私は毎日本を読みます。',
    '彼女は水を飲みます。',
    '私は朝ご飯を食べます。',
    '田中さんは走ります。',
  ],
  correctIndex: 2,
};

const CLOZE_MC_SAMPLE = {
  template: 'The {0} is on the {1}.',
  blanks: [
    { answer: 'book', options: ['book', 'car', 'tree'] },
    { answer: 'table', options: ['table', 'sky', 'river'] },
  ],
};

const CLOZE_FREE_SAMPLE = {
  template: 'She {0} to school every {1}.',
  blanks: [
    { answer: 'walks' },
    { answer: 'day' },
  ],
};

const ERROR_WRONG_SAMPLE = {
  sentence: 'She go to school every day.',
  isCorrect: false,
  correction: 'She goes to school every day.',
  explanation: 'Third-person singular present tense requires "goes", not "go".',
  errorType: 'conjugation',
};

const ERROR_CORRECT_SAMPLE = {
  sentence: 'They are studying for the exam.',
  isCorrect: true,
  explanation: 'Correct! Present continuous tense is used correctly here.',
};

const CONVERSATION_SAMPLE: ConversationScriptData = {
  id: 'debug-conversation-1',
  scenario: 'Greeting a classmate',
  level: 'n5',
  turns: [
    {
      speaker: 'npc',
      text: 'Hello! How are you today?',
      translation: '(NPC greets you)',
    },
    {
      speaker: 'learner',
      text: '',
      options: [
        { text: "I'm fine, thank you!", isCorrect: true, feedback: 'Polite and natural response.' },
        { text: 'Goodbye!', isCorrect: false, feedback: 'This ends the conversation, not a greeting reply.' },
        { text: 'I like pizza.', isCorrect: false, feedback: 'Not relevant to the question asked.' },
      ],
      correctOptionIndex: 0,
    },
    {
      speaker: 'npc',
      text: 'Great! Are you ready for class?',
      translation: '(NPC asks about class)',
    },
    {
      speaker: 'learner',
      text: '',
      options: [
        { text: 'Yes, I am!', isCorrect: true, feedback: 'Perfect answer.' },
        { text: 'I am a student.', isCorrect: false, feedback: 'True but not a direct answer.' },
        { text: 'The weather is nice.', isCorrect: false, feedback: 'Off-topic response.' },
      ],
      correctOptionIndex: 0,
    },
  ],
};

const STORY_SAMPLE: ReadingText = {
  id: 'debug-story-1',
  title: 'The Lost Cat',
  level: 'beginner',
  text: 'Maria had a cat named Luna. One day, Luna disappeared from the garden. Maria looked everywhere — under the bed, in the closet, even outside. Finally, she found Luna sleeping behind the bookshelf.',
  translation: 'A simple story about finding a lost pet.',
  questions: [
    {
      question: "What was the name of Maria's cat?",
      options: ['Stella', 'Luna', 'Mia', 'Cleo'],
      correctIndex: 1,
      explanation: 'The story says "Maria had a cat named Luna."',
    },
    {
      question: 'Where did Maria find Luna?',
      options: ['Under the bed', 'In the garden', 'Behind the bookshelf', 'In the closet'],
      correctIndex: 2,
      explanation: 'Luna was found "sleeping behind the bookshelf".',
    },
  ],
};

/* ── Section wrapper ──────────────────────────────────────────── */

interface SectionProps {
  id: string;
  title: string;
  render: (onAnswer: (correct: boolean, grade: ReviewGradeValue) => void) => React.ReactNode;
}

function Section({ id, title, render }: SectionProps) {
  const [result, setResult] = useState<{ correct: boolean; grade: ReviewGradeValue } | null>(null);
  const [key, setKey] = useState(0);

  function handleAnswer(correct: boolean, grade: ReviewGradeValue) {
    setResult({ correct, grade });
  }

  return (
    <div
      id={id}
      data-testid={id}
      className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        <div className="flex items-center gap-3">
          {result && (
            <span
              data-testid={`${id}-result`}
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                result.correct
                  ? 'bg-emerald-600/20 text-emerald-400'
                  : 'bg-red-600/20 text-red-400'
              }`}
            >
              {result.correct ? '✓ correct' : '✗ incorrect'} · grade {result.grade}
            </span>
          )}
          <button
            onClick={() => { setResult(null); setKey((k) => k + 1); }}
            data-testid={`${id}-reset`}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded border border-slate-600 hover:border-slate-400 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      <div key={key}>{render(handleAnswer)}</div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */

export default function ExerciseDebug() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          Exercise Harness
        </h1>
        <p className="text-sm text-slate-400">Development only — for Playwright testing</p>
      </div>

      <Section
        id="image-association"
        title="ImageAssociation"
        render={(onAnswer) => (
          <ImageAssociation {...IMAGE_SAMPLE} onAnswer={onAnswer} />
        )}
      />

      <Section
        id="word-in-context"
        title="WordInContext"
        render={(onAnswer) => (
          <WordInContext {...WORD_SAMPLE} onAnswer={onAnswer} />
        )}
      />

      <Section
        id="cloze-multi-mc"
        title="ClozeMulti (MC chips)"
        render={(onAnswer) => (
          <ClozeMulti
            template={CLOZE_MC_SAMPLE.template}
            blanks={CLOZE_MC_SAMPLE.blanks}
            onAnswer={onAnswer}
          />
        )}
      />

      <Section
        id="cloze-multi-free"
        title="ClozeMulti (free text)"
        render={(onAnswer) => (
          <ClozeMulti
            template={CLOZE_FREE_SAMPLE.template}
            blanks={CLOZE_FREE_SAMPLE.blanks}
            onAnswer={onAnswer}
          />
        )}
      />

      <Section
        id="error-correction-wrong"
        title="ErrorCorrection (sentence has error)"
        render={(onAnswer) => (
          <ErrorCorrection {...ERROR_WRONG_SAMPLE} onAnswer={onAnswer} />
        )}
      />

      <Section
        id="error-correction-correct"
        title="ErrorCorrection (sentence is correct)"
        render={(onAnswer) => (
          <ErrorCorrection {...ERROR_CORRECT_SAMPLE} onAnswer={onAnswer} />
        )}
      />

      <Section
        id="conversation-script"
        title="ConversationScript"
        render={(onAnswer) => (
          <ConversationScript
            script={CONVERSATION_SAMPLE}
            lang="en-US"
            onAnswer={onAnswer}
          />
        )}
      />

      <Section
        id="story-comprehension"
        title="StoryComprehension"
        render={(onAnswer) => (
          <StoryComprehension passage={STORY_SAMPLE} onAnswer={onAnswer} />
        )}
      />
    </div>
  );
}
