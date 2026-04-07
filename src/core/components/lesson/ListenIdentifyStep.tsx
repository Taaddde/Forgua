/**
 * ListenIdentifyStep — plays audio (TTS) for an item,
 * user picks which item they heard from 4 visual options.
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, Check, X } from 'lucide-react';
import { Button } from '../common/Button';
import { AudioPlayer } from '../audio/AudioPlayer';
import { useAppStore } from '../../store/useAppStore';
import type { LessonItem } from '../../types/lesson';

interface ListenIdentifyStepProps {
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

export function ListenIdentifyStep({ items, allItems, onComplete }: ListenIdentifyStepProps) {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const ttsLang = activePack?.speech.ttsLang;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const correctCountRef = useRef(0);

  // Shuffle item order so the sequence isn't predictable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledItems = useMemo(() => shuffle([...items]), [items.length]);
  const item = shuffledItems[currentIdx];
  const isLast = currentIdx === shuffledItems.length - 1;

  // Generate visual options: correct item front + 3 distractors
  const options = useMemo(() => {
    const distractors = allItems
      .filter((i) => i.front !== item.front)
      .map((i) => i.front);
    const picked = shuffle(distractors).slice(0, 3);
    while (picked.length < 3) {
      picked.push('—');
    }
    return shuffle([...picked, item.front]);
  }, [item, allItems]);

  const correctIndex = options.indexOf(item.front);

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
      onComplete({ correct: correctCountRef.current, total: shuffledItems.length });
      return;
    }
    setCurrentIdx((prev) => prev + 1);
    setSelectedOption(null);
    setShowFeedback(false);
  }, [isLast, shuffledItems.length, onComplete]);

  return (
    <div className="flex flex-col items-center">
      {/* Audio prompt */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center mb-6 w-full max-w-md">
        <Volume2 className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
        <AudioPlayer
          text={item.front}
          lang={ttsLang}
          size="lg"
        />
      </div>

      <span className="text-xs text-slate-500 mb-4">{currentIdx + 1} / {shuffledItems.length}</span>

      {/* Visual options */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3 mb-6">
        {options.map((opt, idx) => {
          let style = 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600 cursor-pointer';
          if (showFeedback) {
            if (idx === correctIndex) {
              style = 'bg-emerald-600/15 border-emerald-500/40 text-emerald-300';
            } else if (idx === selectedOption && idx !== correctIndex) {
              style = 'bg-red-600/15 border-red-500/40 text-red-300';
            } else {
              style = 'bg-slate-900/50 border-slate-800 text-slate-600';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={showFeedback}
              className={`p-4 rounded-xl border text-xl font-bold text-center transition-colors flex items-center justify-center gap-2 ${style}`}
            >
              {opt}
              {showFeedback && idx === correctIndex && <Check className="w-4 h-4 text-emerald-400" />}
              {showFeedback && idx === selectedOption && idx !== correctIndex && <X className="w-4 h-4 text-red-400" />}
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <Button onClick={handleNext}>
          {isLast ? t('lessons.next') : t('common.next')}
        </Button>
      )}
    </div>
  );
}
