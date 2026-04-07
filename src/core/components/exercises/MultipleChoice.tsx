/**
 * MultipleChoice exercise component.
 * Shows a question with 4 options; highlights correct/incorrect after selection.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReviewGrade } from '../../types/models';
import { scoreMultipleChoice } from '../../engine/scoring';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

interface MultipleChoiceProps {
  question: string;
  options: string[];
  correctIndex: number;
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

const optionLetters = ['A', 'B', 'C', 'D'];

export function MultipleChoice({ question, options, correctIndex, onAnswer }: MultipleChoiceProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    setAnswered(true);

    const result = scoreMultipleChoice(index, correctIndex);

    setTimeout(() => {
      onAnswer(result.correct, result.grade);
    }, 1000);
  }

  function getOptionStyle(index: number): string {
    const base = 'w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-colors';
    if (!answered) {
      return `${base} bg-slate-900 border-slate-700 hover:border-slate-600 hover:bg-slate-800 cursor-pointer`;
    }
    if (index === correctIndex) {
      return `${base} bg-emerald-600/15 border-emerald-500/40 text-emerald-300`;
    }
    if (index === selected && index !== correctIndex) {
      return `${base} bg-red-600/15 border-red-500/40 text-red-300`;
    }
    return `${base} bg-slate-900/50 border-slate-800 text-slate-600`;
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
          {t('exercise.multipleChoice')}
        </span>
        <h2 className="text-2xl font-bold text-slate-100 mt-2">{question}</h2>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={answered}
            className={getOptionStyle(index)}
          >
            <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400 shrink-0">
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
