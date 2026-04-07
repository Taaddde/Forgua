/**
 * ListenTranscribeStep — TTS plays the word, user types what they hear.
 * Adapted from the standalone Dictation exercise for the lesson step interface.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, Check, X } from 'lucide-react';
import { Button } from '../common/Button';
import { useAudio } from '../../hooks/useAudio';
import { useAppStore } from '../../store/useAppStore';
import type { LessonItem } from '../../types/lesson';

interface ListenTranscribeStepProps {
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

const MAX_REPLAYS = 3;

export function ListenTranscribeStep({ items, onComplete }: ListenTranscribeStepProps) {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const ttsLang = activePack?.speech.ttsLang ?? 'ja-JP';
  const ttsRate = activePack?.speech.defaultRate ?? 0.8;

  const { speak, isPlaying } = useAudio(ttsLang, ttsRate);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [replays, setReplays] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const correctCountRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledItems = useMemo(() => shuffle([...items]), [items.length]);
  const item = shuffledItems[currentIdx];
  const isLast = currentIdx === shuffledItems.length - 1;

  // For hiragana items (back ≈ reading), accept the reading/back as answer.
  // For vocabulary, accept front or reading.
  const isHiraganaLike = item.reading !== undefined && normalize(item.back) === normalize(item.reading);

  const handlePlay = useCallback(async () => {
    if (replays >= MAX_REPLAYS || isPlaying) return;
    setReplays((r) => r + 1);
    await speak(item.front, ttsLang, ttsRate).catch(() => {});
    inputRef.current?.focus();
  }, [replays, isPlaying, speak, item.front, ttsLang, ttsRate]);

  const handleCheck = useCallback(() => {
    if (showFeedback || !input.trim()) return;
    const normalizedInput = normalize(input);

    let match: boolean;
    if (isHiraganaLike) {
      // For hiragana: TTS says "あ", user should type "a" (the romaji)
      match =
        normalizedInput === normalize(item.back) ||
        normalizedInput === normalize(item.reading ?? '') ||
        normalizedInput === normalize(item.front);
    } else {
      // For vocabulary: TTS says "たべる", user types "taberu" or "食べる"
      match =
        normalizedInput === normalize(item.front) ||
        normalizedInput === normalize(item.reading ?? '');
    }

    setIsCorrect(match);
    setShowFeedback(true);
    if (match) {
      correctCountRef.current += 1;
    }
  }, [showFeedback, input, item, isHiraganaLike]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete({ correct: correctCountRef.current, total: shuffledItems.length });
      return;
    }
    setCurrentIdx((prev) => prev + 1);
    setInput('');
    setReplays(0);
    setShowFeedback(false);
    setIsCorrect(false);
  }, [isLast, shuffledItems.length, onComplete]);

  const correctAnswer = isHiraganaLike
    ? `${item.front} (${item.reading})`
    : `${item.front}${item.reading ? ` (${item.reading})` : ''}`;

  return (
    <div className="flex flex-col items-center">
      {/* Play audio button */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center mb-4 w-full max-w-md">
        <button
          onClick={handlePlay}
          disabled={replays >= MAX_REPLAYS || isPlaying}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
            isPlaying
              ? 'bg-indigo-600 text-white animate-pulse'
              : replays >= MAX_REPLAYS
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white cursor-pointer'
          }`}
        >
          <Volume2 className="w-8 h-8" />
        </button>
        <span className="text-xs text-slate-500 block mt-3">
          {t('audio.replaysLeft', { current: replays, max: MAX_REPLAYS })}
        </span>
      </div>

      <span className="text-xs text-slate-500 mb-4">{currentIdx + 1} / {shuffledItems.length}</span>

      {/* Input */}
      <div className="w-full max-w-md mb-4">
        <input
          ref={inputRef}
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
          autoFocus={replays > 0}
        />
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
              <span className="text-sm text-slate-400 block mt-1">{correctAnswer}</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
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
