/**
 * Matching exercise — pair left items with right items.
 * Tap left, then tap right to match.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { scoreMatching } from '../../engine/scoring';
import { ReviewGrade } from '../../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

interface MatchingProps {
  pairs: { left: string; right: string }[];
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function Matching({ pairs, onAnswer }: MatchingProps) {
  const { t } = useTranslation();

  const pairsKey = JSON.stringify(pairs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledRight = useMemo(() => shuffle(pairs.map((_, i) => i)), [pairsKey]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState(0);
  const [flash, setFlash] = useState<{ left: number; right: number; correct: boolean } | null>(null);

  const handleLeftClick = (index: number) => {
    if (matched.has(index)) return;
    setSelectedLeft(index);
  };

  const handleRightClick = (pairIndex: number) => {
    if (selectedLeft === null || matched.has(pairIndex)) return;

    const isCorrect = selectedLeft === pairIndex;
    setFlash({ left: selectedLeft, right: pairIndex, correct: isCorrect });

    if (isCorrect) {
      const newMatched = new Set(matched);
      newMatched.add(pairIndex);
      setMatched(newMatched);

      if (newMatched.size === pairs.length) {
        const result = scoreMatching(errors, pairs.length);
        setTimeout(() => onAnswer(result.correct, result.grade), 800);
      }
    } else {
      setErrors(errors + 1);
    }

    setTimeout(() => {
      setFlash(null);
      setSelectedLeft(null);
    }, 600);
  };

  const allDone = matched.size === pairs.length;

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
          {t('exercise.matching.instruction')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {pairs.map((pair, i) => {
            const isMatched = matched.has(i);
            const isSelected = selectedLeft === i;
            const isFlash = flash?.left === i;

            return (
              <button
                key={`l-${i}`}
                onClick={() => handleLeftClick(i)}
                disabled={isMatched}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                  isMatched
                    ? 'bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 opacity-60'
                    : isFlash
                      ? flash?.correct
                        ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-red-600/20 border border-red-500/40 text-red-300'
                      : isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-900 border border-slate-700 text-slate-200 hover:border-slate-600'
                }`}
              >
                {pair.left}
              </button>
            );
          })}
        </div>

        {/* Right column (shuffled) */}
        <div className="space-y-2">
          {shuffledRight.map((pairIdx) => {
            const isMatched = matched.has(pairIdx);
            const isFlash = flash?.right === pairIdx;

            return (
              <button
                key={`r-${pairIdx}`}
                onClick={() => handleRightClick(pairIdx)}
                disabled={isMatched || selectedLeft === null}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                  isMatched
                    ? 'bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 opacity-60'
                    : isFlash
                      ? flash?.correct
                        ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-red-600/20 border border-red-500/40 text-red-300'
                      : 'bg-slate-900 border border-slate-700 text-slate-200 hover:border-slate-600'
                }`}
              >
                {pairs[pairIdx].right}
              </button>
            );
          })}
        </div>
      </div>

      {allDone && (
        <p className={`text-center text-sm font-medium mt-4 ${errors === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {errors === 0 ? t('exercise.matching.perfect') : t('exercise.matching.errors', { count: errors })}
        </p>
      )}
    </div>
  );
}
