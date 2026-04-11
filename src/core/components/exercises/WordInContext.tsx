/**
 * WordInContext exercise — given a target word, choose the sentence where it's used correctly.
 * Options are full sentences, not single words. Used for JLPT-style usage questions.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { scoreMultipleChoice } from '../../engine/scoring';
import { ReviewGrade } from '../../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

interface WordInContextProps {
  targetWord: string;
  translation?: string;
  options: string[];        // Full sentences
  correctIndex: number;
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

const optionNumbers = ['1', '2', '3', '4'];

export function WordInContext({ targetWord, translation, options, correctIndex, onAnswer }: WordInContextProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    setAnswered(true);

    const result = scoreMultipleChoice(index, correctIndex);
    setTimeout(() => onAnswer(result.correct, result.grade), 1000);
  }

  function getOptionStyle(index: number): string {
    const base = 'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors';
    if (!answered) {
      return `${base} bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer`;
    }
    if (index === correctIndex) {
      return `${base} bg-emerald-600/15 border-emerald-500/40`;
    }
    if (index === selected && index !== correctIndex) {
      return `${base} bg-red-600/15 border-red-500/40`;
    }
    return `${base} bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-50`;
  }

  function getTextStyle(index: number): string {
    if (!answered) return 'text-slate-800 dark:text-slate-200';
    if (index === correctIndex) return 'text-emerald-300';
    if (index === selected && index !== correctIndex) return 'text-red-300';
    return 'text-slate-500';
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-4">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
          {t('exercise.wordInContext')}
        </span>
      </div>

      {/* Target word */}
      <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-5 mb-6 text-center">
        <span data-testid="target-word" className="text-3xl font-bold text-slate-900 dark:text-slate-100 block">{targetWord}</span>
        {translation && (
          <span className="text-sm text-slate-500 mt-1 block">{translation}</span>
        )}
        <p className="text-xs text-indigo-400 mt-3">
          {t('exercise.wordInContextHint', { word: targetWord })}
        </p>
      </div>

      {/* Sentence options */}
      <div className="space-y-3">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={answered}
            className={getOptionStyle(index)}
          >
            <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">
              {optionNumbers[index]}
            </span>
            <span className={`text-sm leading-relaxed ${getTextStyle(index)}`}>{option}</span>
          </button>
        ))}
      </div>

      {answered && (
        <div className={`mt-4 text-center text-sm font-medium ${
          selected === correctIndex ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {selected === correctIndex ? t('exercise.correct') : t('exercise.incorrect')}
        </div>
      )}
    </div>
  );
}
