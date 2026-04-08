/**
 * FillBlank exercise component.
 * Shows a sentence with a blank (___) and options to fill it.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { scoreFillBlank } from '../../engine/scoring';

type ReviewGradeValue = typeof import('../../types/models').ReviewGrade[keyof typeof import('../../types/models').ReviewGrade];

interface FillBlankProps {
  sentence: string;
  options: string[];
  correctAnswer: string;
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

export function FillBlank({ sentence, options, correctAnswer, onAnswer }: FillBlankProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  function handleSelect(option: string) {
    if (answered) return;
    setSelected(option);
    setAnswered(true);

    const result = scoreFillBlank(option, correctAnswer);

    setTimeout(() => {
      onAnswer(result.correct, result.grade);
    }, 1000);
  }

  // Split sentence around the blank marker
  const parts = sentence.split('___');

  function getChipStyle(option: string): string {
    const base = 'px-4 py-2 rounded-lg font-medium text-sm transition-colors';
    if (!answered) {
      return `${base} bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer`;
    }
    if (option === correctAnswer) {
      return `${base} bg-emerald-600/20 border border-emerald-500/40 text-emerald-300`;
    }
    if (option === selected && option !== correctAnswer) {
      return `${base} bg-red-600/20 border border-red-500/40 text-red-300`;
    }
    return `${base} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600`;
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
          {t('exercise.fillBlank')}
        </span>
      </div>

      {/* Sentence with highlighted blank */}
      <div className="text-xl text-slate-900 dark:text-slate-100 text-center mb-8 leading-relaxed">
        {parts[0]}
        <span className={`inline-block min-w-[4rem] mx-1 px-3 py-1 rounded-lg border-b-2 text-center ${
          answered && selected
            ? selected === correctAnswer
              ? 'border-emerald-500 bg-emerald-600/10 text-emerald-300'
              : 'border-red-500 bg-red-600/10 text-red-300'
            : 'border-indigo-500 bg-indigo-600/10 text-indigo-300'
        }`}>
          {selected ?? '___'}
        </span>
        {parts[1] ?? ''}
      </div>

      {/* Option chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={answered}
            className={getChipStyle(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {answered && (
        <div className={`mt-6 text-center text-sm font-medium ${
          selected === correctAnswer ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {selected === correctAnswer ? t('exercise.correct') : t('exercise.incorrect')}
        </div>
      )}
    </div>
  );
}
