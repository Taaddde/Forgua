/**
 * Dictation exercise — listen to audio, type what you hear.
 */

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, CheckCircle, XCircle } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';
import { scoreWriteAnswer } from '../../engine/scoring';
import { Button } from '../common/Button';
import type { AbstractAdapter } from '../../types/adapter';
import { ReviewGrade } from '../../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

interface DictationProps {
  text: string;
  expected: string;
  lang: string;
  rate?: number;
  adapter: AbstractAdapter | null;
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

const MAX_REPLAYS = 3;

export function Dictation({ text, expected, lang, rate = 0.8, adapter, onAnswer }: DictationProps) {
  const { t } = useTranslation();
  const { speak, isPlaying } = useAudio(lang, rate);
  const [input, setInput] = useState('');
  const [replays, setReplays] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; grade: ReviewGradeValue } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePlay = async () => {
    if (replays >= MAX_REPLAYS || isPlaying) return;
    setReplays((r) => r + 1);
    await speak(text, lang, rate).catch(() => {});
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (answered || input.trim().length === 0) return;
    const scoreResult = scoreWriteAnswer(input, expected, adapter);
    setResult(scoreResult);
    setAnswered(true);
    setTimeout(() => onAnswer(scoreResult.correct, scoreResult.grade), 1500);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
          {t('audio.listenAndType')}
        </span>
      </div>

      {/* Play button */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <button
          onClick={handlePlay}
          disabled={replays >= MAX_REPLAYS || isPlaying}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-indigo-600 text-white animate-pulse'
              : replays >= MAX_REPLAYS
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 text-slate-600 dark:text-slate-300 hover:text-white'
          }`}
        >
          <Volume2 className="w-8 h-8" />
        </button>
        <span className="text-xs text-slate-500">
          {t('audio.replaysLeft', { current: replays, max: MAX_REPLAYS })}
        </span>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={answered}
          placeholder={t('exercise.typeAnswer')}
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          autoFocus={replays > 0}
        />

        {!answered && (
          <Button onClick={handleSubmit} disabled={input.trim().length === 0} className="w-full">
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
              <span className={`text-sm font-medium ${result.correct ? 'text-emerald-300' : 'text-red-300'}`}>
                {result.correct ? t('exercise.correct') : t('exercise.incorrect')}
              </span>
              {!result.correct && (
                <p className="text-xs text-slate-400 mt-1">
                  {t('exercise.expected')}: <span className="text-slate-800 dark:text-slate-200">{expected}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
