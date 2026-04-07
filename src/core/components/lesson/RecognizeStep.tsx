/**
 * RecognizeStep — multiple choice: match item front to its meaning.
 * Shows the front, user picks from 4 options. Cycles through all items.
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { Button } from '../common/Button';
import type { LessonItem } from '../../types/lesson';

interface RecognizeStepProps {
  items: LessonItem[];
  allItems: LessonItem[];
  onComplete: (result: { correct: number; total: number }) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function RecognizeStep({ items, allItems, onComplete }: RecognizeStepProps) {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const correctCountRef = useRef(0);

  const item = items[currentIdx];
  const isLast = currentIdx === items.length - 1;

  // Generate options: 1 correct + 3 distractors from allItems
  const options = useMemo(() => {
    const distractors = allItems
      .filter((i) => i.back !== item.back)
      .map((i) => i.back);
    const picked = shuffle(distractors).slice(0, 3);
    while (picked.length < 3) {
      picked.push('—');
    }
    return shuffle([...picked, item.back]);
  }, [item, allItems]);

  const correctIndex = options.indexOf(item.back);

  const handleSelect = useCallback(
    (idx: number) => {
      if (showFeedback) return;
      setSelectedOption(idx);
      setShowFeedback(true);
      if (idx === correctIndex) {
        correctCountRef.current += 1;
      }
    },
    [showFeedback, correctIndex],
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete({ correct: correctCountRef.current, total: items.length });
      return;
    }
    setCurrentIdx((prev) => prev + 1);
    setSelectedOption(null);
    setShowFeedback(false);
  }, [isLast, items.length, onComplete]);

  return (
    <div className="flex flex-col items-center">
      {/* The item to identify */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center mb-6 w-full max-w-md">
        <span className="text-5xl font-bold text-slate-100">{item.front}</span>
      </div>

      {/* Progress */}
      <span className="text-xs text-slate-500 mb-4">
        {currentIdx + 1} / {items.length}
      </span>

      {/* Options */}
      <div className="w-full max-w-md space-y-2 mb-6">
        {options.map((opt, idx) => {
          let style = 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600 cursor-pointer';
          if (showFeedback) {
            if (idx === correctIndex) {
              style = 'bg-emerald-600/15 border-emerald-500/40 text-emerald-300';
            } else if (idx === selectedOption && idx !== correctIndex) {
              style = 'bg-red-600/15 border-red-500/40 text-red-300';
            } else {
              style = 'bg-slate-900/50 border-slate-800 text-slate-600';
            }
          } else if (idx === selectedOption) {
            style = 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300';
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={showFeedback}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-between ${style}`}
            >
              <span>{opt}</span>
              {showFeedback && idx === correctIndex && <Check className="w-4 h-4 text-emerald-400" />}
              {showFeedback && idx === selectedOption && idx !== correctIndex && <X className="w-4 h-4 text-red-400" />}
            </button>
          );
        })}
      </div>

      {/* Next button after feedback */}
      {showFeedback && (
        <Button onClick={handleNext}>
          {isLast ? t('lessons.next') : t('common.next')}
        </Button>
      )}
    </div>
  );
}
