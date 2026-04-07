/**
 * WriteStep — shows the reading/romaji, user writes the character/word.
 * Similar to RecallStep but reference is reading, not meaning.
 */

import { useState, useCallback, useRef } from 'react';
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

export function WriteStep({ items, onComplete }: WriteStepProps) {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const correctCountRef = useRef(0);

  const item = items[currentIdx];
  const isLast = currentIdx === items.length - 1;

  const handleCheck = useCallback(() => {
    const normalizedInput = normalize(input);
    const normalizedFront = normalize(item.front);
    const normalizedReading = item.reading ? normalize(item.reading) : '';

    // Accept either the native character OR the romaji reading
    const match =
      normalizedInput === normalizedFront ||
      (normalizedReading !== '' && normalizedInput === normalizedReading);

    setIsCorrect(match);
    setShowFeedback(true);
    if (match) {
      correctCountRef.current += 1;
    }
  }, [input, item]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete({ correct: correctCountRef.current, total: items.length });
      return;
    }
    setCurrentIdx((prev) => prev + 1);
    setInput('');
    setShowFeedback(false);
    setIsCorrect(false);
  }, [isLast, items.length, onComplete]);

  return (
    <div className="flex flex-col items-center">
      {/* Show reading as prompt */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center mb-6 w-full max-w-md">
        <span className="text-sm text-slate-500 mb-2 block">{item.reading ?? item.back}</span>
        <span className="text-3xl font-bold text-amber-300">{item.reading ?? item.back}</span>
      </div>

      <span className="text-xs text-slate-500 mb-4">{currentIdx + 1} / {items.length}</span>

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
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-lg text-center"
          autoFocus
        />
        {item.reading && (
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
              <span className="text-2xl text-slate-100 block mt-1">{item.front}</span>
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
