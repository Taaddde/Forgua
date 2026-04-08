/**
 * WriteAnswer exercise component.
 * User types an answer, which is scored against the expected answer
 * using the adapter's compareAnswer or simple string comparison.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle } from 'lucide-react';
import { scoreWriteAnswer } from '../../engine/scoring';
import { Button } from '../common/Button';
import type { AbstractAdapter } from '../../types/adapter';

type ReviewGradeValue = typeof import('../../types/models').ReviewGrade[keyof typeof import('../../types/models').ReviewGrade];

interface WriteAnswerProps {
  prompt: string;
  expectedAnswer: string;
  adapter: AbstractAdapter | null;
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

export function WriteAnswer({ prompt, expectedAnswer, adapter, onAnswer }: WriteAnswerProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; grade: ReviewGradeValue } | null>(null);

  function handleSubmit() {
    if (answered || input.trim().length === 0) return;

    const scoreResult = scoreWriteAnswer(input, expectedAnswer, adapter);
    setResult(scoreResult);
    setAnswered(true);

    setTimeout(() => {
      onAnswer(scoreResult.correct, scoreResult.grade);
    }, 1500);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
          {t('exercise.writeAnswer')}
        </span>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{prompt}</h2>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={answered}
          placeholder={t('exercise.typeAnswer')}
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-60"
          autoFocus
        />

        {!answered && (
          <Button
            onClick={handleSubmit}
            disabled={input.trim().length === 0}
            className="w-full"
          >
            {t('exercise.check')}
          </Button>
        )}

        {answered && result && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${
            result.correct
              ? 'bg-emerald-600/15 border-emerald-500/40'
              : 'bg-red-600/15 border-red-500/40'
          }`}>
            {result.correct ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <div>
              <span className={`text-sm font-medium ${
                result.correct ? 'text-emerald-300' : 'text-red-300'
              }`}>
                {result.correct ? t('exercise.correct') : t('exercise.incorrect')}
              </span>
              {!result.correct && (
                <p className="text-xs text-slate-400 mt-1">
                  {t('exercise.expected')}: <span className="text-slate-200">{expectedAnswer}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
