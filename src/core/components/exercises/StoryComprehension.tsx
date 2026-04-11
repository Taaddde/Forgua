/**
 * StoryComprehension exercise — read a passage, answer MC questions.
 *
 * Two phases:
 * 1. Reading phase: passage displayed, optional furigana/translation toggle
 * 2. Questions phase: one MC question at a time
 *
 * Uses ReadingText from pack-spec (already has questions?: ReadingQuestion[]).
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { scoreStoryComprehension } from '../../engine/scoring';
import { Button } from '../common/Button';
import { ReviewGrade } from '../../types/models';
import type { ReadingText } from '../../types/pack-spec';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

interface StoryComprehensionProps {
  passage: ReadingText;
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

type Phase = 'reading' | 'questions' | 'summary';

export function StoryComprehension({ passage, onAnswer }: StoryComprehensionProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('reading');
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    (passage.questions ?? []).map(() => null),
  );
  const [revealed, setRevealed] = useState(false);

  const questions = passage.questions ?? [];
  const currentQ = questions[currentQIndex];
  const selectedAnswer = answers[currentQIndex] ?? null;

  function handleOptionSelect(optionIndex: number) {
    if (revealed) return;
    setAnswers((prev) => prev.map((v, i) => (i === currentQIndex ? optionIndex : v)));
    setRevealed(true);
  }

  function handleNextQuestion() {
    setRevealed(false);
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((i) => i + 1);
    } else {
      setPhase('summary');
      // answers state is already updated (setAnswers ran before this click handler)
      const total = questions.length;
      const correct = answers.filter((a, i) => questions[i] && a === questions[i].correctIndex).length;
      const result = scoreStoryComprehension(correct, total);
      setTimeout(() => onAnswer(result.correct, result.grade), 500);
    }
  }

  // Reading phase
  if (phase === 'reading') {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-4">
          <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
            {t('exercise.story.reading')}
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{passage.title}</h3>
        </div>

        {/* Passage */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-4 max-h-72 overflow-y-auto">
          <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap" data-testid="passage-text">
            {passage.text}
          </p>
          {passage.reading && (
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{passage.reading}</p>
          )}
          {showTranslation && passage.translation && (
            <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 leading-relaxed italic">
              {passage.translation}
            </p>
          )}
        </div>

        {/* Toggles */}
        <div className="flex gap-2 mb-6">
          {passage.translation && (
            <button
              onClick={() => setShowTranslation((v) => !v)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                showTranslation
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
              }`}
            >
              {t('reading.showTranslation')}
            </button>
          )}
        </div>

        {questions.length > 0 ? (
          <Button onClick={() => setPhase('questions')} className="w-full" data-testid="btn-show-questions">
            <BookOpen className="w-4 h-4 mr-2" />
            {t('exercise.story.showQuestions')}
          </Button>
        ) : (
          <Button onClick={() => onAnswer(true, ReviewGrade.Good)} className="w-full">
            {t('common.next')}
          </Button>
        )}
      </div>
    );
  }

  // Questions phase
  if (phase === 'questions') {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-4">
          <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
            {t('exercise.story.comprehension')}
          </span>
          <p className="text-xs text-slate-400 mt-1">
            {t('exercise.story.question', { current: currentQIndex + 1, total: questions.length })}
          </p>
        </div>

        {/* Question */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-5">
          <p className="text-base font-medium text-slate-800 dark:text-slate-200" data-testid="question-text">
            {currentQ.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2 mb-4">
          {currentQ.options.map((option, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === currentQ.correctIndex;

            let style = 'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors';
            if (!revealed) {
              style += ' bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer';
            } else if (isCorrect) {
              style += ' bg-emerald-600/15 border-emerald-500/40';
            } else if (isSelected) {
              style += ' bg-red-600/15 border-red-500/40';
            } else {
              style += ' bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-50';
            }

            return (
              <button
                key={i}
                onClick={() => handleOptionSelect(i)}
                disabled={revealed}
                className={style}
                data-testid={`question-option-${i}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  !revealed
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    : isCorrect
                      ? 'bg-emerald-600/20 text-emerald-400'
                      : isSelected
                        ? 'bg-red-600/20 text-red-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className={`text-sm leading-relaxed ${
                  !revealed
                    ? 'text-slate-800 dark:text-slate-200'
                    : isCorrect
                      ? 'text-emerald-300'
                      : isSelected
                        ? 'text-red-300'
                        : 'text-slate-500'
                }`}>
                  {option}
                </span>
                {revealed && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0 self-center" />
                )}
                {revealed && isSelected && !isCorrect && (
                  <XCircle className="w-4 h-4 text-red-400 ml-auto shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {revealed && currentQ.explanation && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 mb-4">
            <p className="text-xs text-slate-500 leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}

        {revealed && (
          <Button onClick={handleNextQuestion} className="w-full" data-testid="btn-next-question">
            {currentQIndex < questions.length - 1
              ? <>{t('common.next')} <ChevronRight className="w-4 h-4 ml-1" /></>
              : t('exercise.story.complete')}
          </Button>
        )}
      </div>
    );
  }

  // Summary phase
  const correctCount = answers.filter((a, i) => questions[i] && a === questions[i].correctIndex).length;

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        {t('exercise.story.complete')}
      </h3>
      <p className="text-slate-400">
        {t('exercise.story.score', { correct: correctCount, total: questions.length })}
      </p>
    </div>
  );
}
