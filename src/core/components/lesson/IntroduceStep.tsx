/**
 * IntroduceStep — shows items with explanations, mnemonics, audio.
 * No grading. User swipes/clicks through items.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { AudioPlayer } from '../audio/AudioPlayer';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import type { LessonItem } from '../../types/lesson';

interface IntroduceStepProps {
  items: LessonItem[];
  onComplete: () => void;
}

export function IntroduceStep({ items, onComplete }: IntroduceStepProps) {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const activePack = useAppStore((s) => s.activePack);
  const ttsLang = activePack?.speech.ttsLang;

  const item = items[currentIdx];
  const isLast = currentIdx === items.length - 1;

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center mb-6">
        <div className="flex justify-end mb-2">
          <AudioPlayer text={item.front} lang={ttsLang} size="sm" />
        </div>
        <span className="text-6xl font-bold text-slate-100 block mb-4">
          {item.front}
        </span>
        {item.reading && (
          <span className="text-lg text-slate-400 block mb-2">{item.reading}</span>
        )}
        <span className="text-xl text-indigo-300 font-medium block mb-4">{item.back}</span>

        {item.explanation && (
          <p className="text-sm text-slate-400 mb-4">{item.explanation}</p>
        )}

        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={`${item.front} — ${item.back}`}
            className="w-full max-w-xs mx-auto rounded-xl mb-4"
            loading="lazy"
          />
        )}

        {item.mnemonic && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-left">
            <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-200">{item.mnemonic}</p>
          </div>
        )}
      </div>

      {/* Item counter */}
      <div className="flex items-center gap-2 mb-4">
        {items.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIdx ? 'bg-emerald-400' : i < currentIdx ? 'bg-emerald-700' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {currentIdx > 0 && (
          <Button variant="ghost" onClick={() => setCurrentIdx(currentIdx - 1)}>
            <ChevronLeft className="w-4 h-4" />
            {t('common.previous')}
          </Button>
        )}
        {isLast ? (
          <Button onClick={onComplete}>
            {t('lessons.next')}
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={() => setCurrentIdx(currentIdx + 1)}>
            {t('common.next')}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
