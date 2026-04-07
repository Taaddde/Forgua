/**
 * SummaryStep — shows all items learned as mini-cards,
 * total score, and a finish button.
 */

import { useTranslation } from 'react-i18next';
import { Trophy, Star } from 'lucide-react';
import { Button } from '../common/Button';
import type { LessonItem } from '../../types/lesson';

interface SummaryStepProps {
  items: LessonItem[];
  stepResults: Map<number, { correct: number; total: number }>;
  onComplete: () => void;
}

export function SummaryStep({ items, stepResults, onComplete }: SummaryStepProps) {
  const { t } = useTranslation();

  // Calculate overall score
  let totalCorrect = 0;
  let totalQuestions = 0;
  stepResults.forEach((r) => {
    totalCorrect += r.correct;
    totalQuestions += r.total;
  });
  const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 100;

  return (
    <div className="flex flex-col items-center">
      {/* Score */}
      <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
        {score >= 80 ? (
          <Trophy className="w-10 h-10 text-emerald-400" />
        ) : (
          <Star className="w-10 h-10 text-amber-400" />
        )}
      </div>

      {totalQuestions > 0 && (
        <div className="text-center mb-6">
          <span className="text-3xl font-bold text-slate-100">{score}%</span>
          <span className="text-sm text-slate-400 block mt-1">
            {totalCorrect}/{totalQuestions}
          </span>
        </div>
      )}

      <p className="text-slate-400 text-sm text-center mb-8">
        {t('lessons.completeMessage', { count: items.length })}
      </p>

      {/* Mini-cards of learned items */}
      <div className="w-full max-w-md grid grid-cols-2 gap-2 mb-8">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center"
          >
            <span className="text-lg font-bold text-slate-100 block">{item.front}</span>
            <span className="text-xs text-slate-500">{item.back}</span>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={onComplete}>
        {t('lessons.finish')}
      </Button>
    </div>
  );
}
