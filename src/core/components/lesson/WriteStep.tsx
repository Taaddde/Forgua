/**
 * WriteStep — tests production in the meaningful direction.
 *
 * Normal mode (back ≠ reading): shows the reading, user types the native character or romaji.
 * Reversed mode (back ≈ reading, e.g. hiragana): shows the native character (front),
 * user types the romaji. Avoids the trivial "copy what you see" problem.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { Button } from '../common/Button';
import type { LessonItem } from '../../types/lesson';

interface WriteStepProps {
  items: LessonItem[];
  onComplete: (result: { correct: number; total: number }) => void;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '');
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function WriteStep({ items, onComplete }: WriteStepProps) {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const correctCountRef = useRef(0);

  // Shuffle item order so the sequence isn't predictable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledItems = useMemo(() => shuffle([...items]), [items.length]);
  const item = shuffledItems[currentIdx];
  const isLast = currentIdx === shuffledItems.length - 1;

  // When back ≈ reading (e.g. hiragana), showing the romaji and accepting
  // the romaji as answer is trivial. Reverse the direction.
  const isReversed =
    item.reading !== undefined &&
    normalize(item.back) === normalize(item.reading);

  const handleCheck = useCallback(() => {
    const normalizedInput = normalize(input);

    let match: boolean;
    if (isReversed) {
      // Reversed: prompt is front (character), accept back or reading
      match =
        normalizedInput === normalize(item.back) ||
        normalizedInput === normalize(item.reading ?? '');
    } else {
      // Normal: prompt is reading, accept front or reading
      const normalizedFront = normalize(item.front);
      const normalizedReading = item.reading ? normalize(item.reading) : '';
      match =
        normalizedInput === normalizedFront ||
        (normalizedReading !== '' && normalizedInput === normalizedReading);
    }

    setIsCorrect(match);
    setShowFeedback(true);
    if (match) {
      correctCountRef.current += 1;
    }
  }, [input, item, isReversed]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete({ correct: correctCountRef.current, total: shuffledItems.length });
      return;
    }
    setCurrentIdx((prev) => prev + 1);
    setInput('');
    setShowFeedback(false);
    setIsCorrect(false);
  }, [isLast, shuffledItems.length, onComplete]);

  // What to show as prompt and what to reveal on error
  const promptLabel = isReversed
    ? t('exercise.writeReading')
    : (item.reading ?? item.back);
  const promptText = isReversed ? item.front : (item.reading ?? item.back);
  const correctAnswer = isReversed ? item.back : item.front;

  return (
    <div className="flex flex-col items-center">
      {/* Prompt card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center mb-6 w-full max-w-md">
        <span className="text-sm text-slate-500 mb-2 block">{promptLabel}</span>
        <span className={`font-bold ${isReversed ? 'text-5xl text-slate-900 dark:text-slate-100' : 'text-3xl text-amber-700 dark:text-amber-300'}`}>
          {promptText}
        </span>
      </div>

      <span className="text-xs text-slate-500 mb-4">{currentIdx + 1} / {shuffledItems.length}</span>

      {/* Input */}
      <div className="w-full max-w-md mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !showFeedback && input.trim()) handleCheck();
            if (e.key === 'Enter' && showFeedback) handleNext();
          }}
          disabled={showFeedback}
          placeholder={t('exercise.typeAnswer')}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-lg text-center"
          autoFocus
        />
        {!isReversed && item.reading && (
          <p className="text-xs text-slate-600 mt-1 text-center">{t('exercise.romajiHint')}</p>
        )}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`w-full max-w-md rounded-xl p-4 mb-4 flex items-center gap-3 ${
          isCorrect
            ? 'bg-emerald-600/15 border border-emerald-500/30'
            : 'bg-red-600/15 border border-red-500/30'
        }`}>
          {isCorrect ? (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <X className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <div>
            <span className={`font-medium ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
              {isCorrect ? t('exercise.correct') : t('exercise.incorrect')}
            </span>
            {!isCorrect && (
              <span className="text-2xl text-slate-900 dark:text-slate-100 block mt-1">{correctAnswer}</span>
            )}
          </div>
        </div>
      )}

      {!showFeedback ? (
        <Button onClick={handleCheck} disabled={!input.trim()}>
          {t('exercise.check')}
        </Button>
      ) : (
        <Button onClick={handleNext}>
          {isLast ? t('lessons.next') : t('common.next')}
        </Button>
      )}
    </div>
  );
}
