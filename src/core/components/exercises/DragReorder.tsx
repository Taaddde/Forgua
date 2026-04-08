/**
 * DragReorder exercise — arrange fragments in correct order.
 * Uses click-to-add for mobile compatibility.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { scoreDragReorder } from '../../engine/scoring';
import { Button } from '../common/Button';
import { ReviewGrade } from '../../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

interface DragReorderProps {
  fragments: string[];
  correctOrder: number[];
  prompt?: string;
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

export function DragReorder({ fragments, correctOrder, prompt, onAnswer }: DragReorderProps) {
  const { t } = useTranslation();
  const [placed, setPlaced] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; grade: ReviewGradeValue } | null>(null);

  const available = fragments.map((_, i) => i).filter((i) => !placed.includes(i));

  const handleAdd = (index: number) => {
    if (answered) return;
    setPlaced([...placed, index]);
  };

  const handleRemove = (position: number) => {
    if (answered) return;
    setPlaced(placed.filter((_, i) => i !== position));
  };

  const handleCheck = () => {
    if (placed.length !== fragments.length || answered) return;
    const scoreResult = scoreDragReorder(placed, correctOrder);
    setResult(scoreResult);
    setAnswered(true);
    setTimeout(() => onAnswer(scoreResult.correct, scoreResult.grade), 1500);
  };

  const correctText = correctOrder.map((i) => fragments[i]).join(' ');

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
          {t('exercise.dragReorder.instruction')}
        </span>
        {prompt && <p className="text-lg text-slate-800 dark:text-slate-200 mt-2">{prompt}</p>}
      </div>

      {/* Answer zone */}
      <div className="min-h-[3rem] flex flex-wrap gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 mb-4">
        {placed.length === 0 && (
          <span className="text-sm text-slate-600">{t('exercise.dragReorder.instruction')}</span>
        )}
        {placed.map((fragIdx, pos) => (
          <button
            key={`placed-${pos}`}
            onClick={() => handleRemove(pos)}
            disabled={answered}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              answered
                ? fragIdx === correctOrder[pos]
                  ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
                  : 'bg-red-600/20 border border-red-500/40 text-red-300'
                : 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 cursor-pointer'
            }`}
          >
            {fragments[fragIdx]}
          </button>
        ))}
      </div>

      {/* Available fragments */}
      <div className="flex flex-wrap gap-2 mb-4">
        {available.map((fragIdx) => (
          <button
            key={`avail-${fragIdx}`}
            onClick={() => handleAdd(fragIdx)}
            disabled={answered}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
          >
            {fragments[fragIdx]}
          </button>
        ))}
      </div>

      {!answered && placed.length === fragments.length && (
        <Button onClick={handleCheck} className="w-full">
          {t('exercise.dragReorder.check')}
        </Button>
      )}

      {answered && result && (
        <div className={`text-center text-sm font-medium mt-2 ${
          result.correct ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {result.correct ? t('exercise.dragReorder.correct') : (
            <div>
              <p>{t('exercise.dragReorder.incorrect')}</p>
              <p className="text-slate-400 mt-1">{correctText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
