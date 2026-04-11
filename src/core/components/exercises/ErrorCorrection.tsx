/**
 * ErrorCorrection exercise — decide if a sentence has an error.
 * Two-step flow: (1) binary Yes/No, (2) reveal explanation + correction.
 *
 * Great for intermediate grammar practice and JLPT-style questions.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { scoreErrorCorrection } from '../../engine/scoring';
import { ReviewGrade } from '../../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

interface ErrorCorrectionProps {
  sentence: string;
  isCorrect: boolean;          // Whether the sentence is actually correct
  correction?: string;         // The corrected sentence (only shown if isCorrect === false)
  explanation: string;         // Why it's right or wrong
  errorType?: string;          // e.g. 'particle', 'conjugation', 'word-order' — optional label
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

export function ErrorCorrection({
  sentence,
  isCorrect,
  correction,
  explanation,
  errorType,
  onAnswer,
}: ErrorCorrectionProps) {
  const { t } = useTranslation();
  const [userChoice, setUserChoice] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);

  function handleChoice(choice: boolean) {
    if (revealed) return;
    setUserChoice(choice);
    setRevealed(true);

    const result = scoreErrorCorrection(choice, isCorrect);
    setTimeout(() => onAnswer(result.correct, result.grade), 2000);
  }

  const userWasRight = userChoice !== null && userChoice === isCorrect;

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
          {t('exercise.errorCorrection.instruction')}
        </span>
        {errorType && (
          <span className="ml-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {errorType}
          </span>
        )}
      </div>

      {/* The sentence under scrutiny */}
      <div className={`p-5 rounded-2xl border-2 mb-6 text-center transition-colors ${
        !revealed
          ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
          : isCorrect
            ? 'bg-emerald-600/10 border-emerald-500/30'
            : 'bg-red-600/10 border-red-500/30'
      }`}>
        <p className={`text-xl font-medium leading-relaxed ${
          revealed
            ? isCorrect ? 'text-emerald-300' : 'text-red-300'
            : 'text-slate-900 dark:text-slate-100'
        }`} data-testid="sentence-display">
          {sentence}
        </p>
      </div>

      {/* Binary choice buttons */}
      {!revealed && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleChoice(true)}
            data-testid="btn-correct"
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 transition-colors font-medium"
          >
            <Check className="w-5 h-5" />
            {t('exercise.errorCorrection.yes')}
          </button>
          <button
            onClick={() => handleChoice(false)}
            data-testid="btn-error"
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-red-500/40 bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors font-medium"
          >
            <X className="w-5 h-5" />
            {t('exercise.errorCorrection.no')}
          </button>
        </div>
      )}

      {/* Result + explanation */}
      {revealed && (
        <div className="space-y-3">
          {/* User result */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${
            userWasRight
              ? 'bg-emerald-600/15 border-emerald-500/30'
              : 'bg-red-600/15 border-red-500/30'
          }`}>
            {userWasRight ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className={`font-medium text-sm ${userWasRight ? 'text-emerald-300' : 'text-red-300'}`}>
              {userWasRight
                ? isCorrect
                  ? t('exercise.errorCorrection.correct')
                  : t('exercise.errorCorrection.wellSpotted')
                : isCorrect
                  ? t('exercise.errorCorrection.actuallyCorrect')
                  : t('exercise.errorCorrection.incorrect')}
            </span>
          </div>

          {/* Correction (only when sentence has an error) */}
          {!isCorrect && correction && (
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">{t('exercise.errorCorrection.correction')}</p>
              <p className="text-base font-medium text-emerald-300">{correction}</p>
            </div>
          )}

          {/* Explanation */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400 mb-1">{t('exercise.errorCorrection.explanation')}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
