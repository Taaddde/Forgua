/**
 * ImageAssociation exercise — see an image, pick the matching word/phrase.
 * The image URL is provided by the pack (stored in its images/ folder).
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { scoreMultipleChoice } from '../../engine/scoring';
import { ReviewGrade } from '../../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

interface ImageAssociationProps {
  imageUrl: string;
  imageAlt: string;
  options: string[];
  correctIndex: number;
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

const optionLetters = ['A', 'B', 'C', 'D'];

export function ImageAssociation({ imageUrl, imageAlt, options, correctIndex, onAnswer }: ImageAssociationProps) {
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
    const base = 'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors';
    if (!answered) {
      return `${base} bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer`;
    }
    if (index === correctIndex) {
      return `${base} bg-emerald-600/15 border-emerald-500/40 text-emerald-300`;
    }
    if (index === selected && index !== correctIndex) {
      return `${base} bg-red-600/15 border-red-500/40 text-red-300`;
    }
    return `${base} bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600`;
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-4">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
          {t('exercise.imageAssociation')}
        </span>
      </div>

      {/* Image */}
      <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-56 object-cover"
          data-testid="exercise-image"
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={answered}
            className={getOptionStyle(index)}
          >
            <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
              {optionLetters[index]}
            </span>
            <span className="text-base font-medium">{option}</span>
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
