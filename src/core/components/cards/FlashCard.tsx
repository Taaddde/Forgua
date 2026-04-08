/**
 * FlashCard component — the core study card with flip animation.
 * Shows front (question) and back (answer) with 4 grading buttons.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Eye } from 'lucide-react';
import { ReviewGrade } from '../../types/models';
import type { Card } from '../../types/models';
import { AudioPlayer } from '../audio/AudioPlayer';
import { ProsodyDiagram } from '../audio/ProsodyDiagram';
import { useAppStore } from '../../store/useAppStore';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

interface FlashCardProps {
  card: Card;
  onGrade: (grade: ReviewGradeValue) => void;
}

const gradeButtons = [
  { grade: ReviewGrade.Again, labelKey: 'study.buttons.again', color: 'bg-red-600 hover:bg-red-700', shortcut: '1' },
  { grade: ReviewGrade.Good, labelKey: 'study.buttons.good', color: 'bg-emerald-600 hover:bg-emerald-700', shortcut: '2' },
  { grade: ReviewGrade.Easy, labelKey: 'study.buttons.easy', color: 'bg-blue-600 hover:bg-blue-700', shortcut: '3' },
] as const;

export function FlashCard({ card, onGrade }: FlashCardProps) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);
  const activePack = useAppStore((s) => s.activePack);
  const ttsLang = activePack?.speech.ttsLang;
  const ttsText = card.reading ?? card.front;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!flipped) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setFlipped(true);
        }
        return;
      }
      const btn = gradeButtons.find((b) => b.shortcut === e.key);
      if (btn) {
        e.preventDefault();
        onGrade(btn.grade);
      }
    },
    [flipped, onGrade],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Card container with perspective */}
      <div
        className="relative w-full aspect-[3/2] cursor-pointer [perspective:1000px] mb-6"
        onClick={() => !flipped && setFlipped(true)}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
            flipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* Front face */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 [backface-visibility:hidden]">
            <div className="absolute top-4 right-4">
              <AudioPlayer text={ttsText} lang={ttsLang} size="sm" />
            </div>
            {card.imageUrl && (
              <img
                src={card.imageUrl}
                alt={card.front}
                className="w-32 h-32 object-cover rounded-lg mx-auto mb-4"
                loading="lazy"
              />
            )}
            <span className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3 text-center">
              {card.front}
            </span>
            {card.reading && (
              <span className="text-lg text-slate-400">{card.reading}</span>
            )}
            <div className="absolute bottom-4 flex items-center gap-1.5 text-xs text-slate-600">
              <Eye className="w-3.5 h-3.5" />
              <span>{t('study.tapToReveal')}</span>
            </div>
          </div>

          {/* Back face */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="text-sm text-slate-500 mb-2">{card.front}</span>
            {card.reading && (
              <span className="text-xs text-slate-600 mb-3">{card.reading}</span>
            )}
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 text-center">
              {card.back}
            </span>
            {(() => {
              const props = getProsodyProps(card);
              return props ? <ProsodyDiagram {...props} size="sm" className="mt-3" /> : null;
            })()}
          </div>
        </div>
      </div>

      {/* Grade buttons — only visible after flip */}
      {flipped ? (
        <div className="grid grid-cols-3 gap-2">
          {gradeButtons.map(({ grade, labelKey, color, shortcut }) => (
            <button
              key={grade}
              onClick={() => onGrade(grade)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-white font-medium transition-colors ${color}`}
            >
              <span className="text-sm">{t(labelKey)}</span>
              <span className="text-[10px] opacity-60">{shortcut}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {t('study.showAnswer')}
        </button>
      )}
    </div>
  );
}

function getProsodyProps(card: Card): { type: 'pitch-accent' | 'tone' | 'stress'; pattern: number[]; morae: string[]; label?: string } | null {
  const extra = card.extra;
  if (!extra) return null;

  if (extra.pitchAccent) {
    const pa = extra.pitchAccent as { pattern: number[]; type: string };
    const morae = (card.reading ?? card.front).split('');
    return { type: 'pitch-accent', pattern: pa.pattern, morae, label: pa.type };
  }

  if (extra.toneNumber != null) {
    return {
      type: 'tone',
      pattern: [extra.toneNumber as number],
      morae: (card.reading ?? card.front).split(''),
      label: `Tone ${extra.toneNumber}`,
    };
  }

  if (extra.stressPattern) {
    return {
      type: 'stress',
      pattern: extra.stressPattern as number[],
      morae: (card.reading ?? card.front).split(/\s+/),
    };
  }

  return null;
}
