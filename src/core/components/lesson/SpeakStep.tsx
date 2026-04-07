/**
 * SpeakStep — user says the word/character aloud.
 * Shows the item, plays audio example, captures speech via STT, scores similarity.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, SkipForward } from 'lucide-react';
import { Button } from '../common/Button';
import { Microphone } from '../audio/Microphone';
import { AudioPlayer } from '../audio/AudioPlayer';
import { BrowserSupportBanner } from '../audio/BrowserSupportBanner';
import { useAppStore } from '../../store/useAppStore';
import { isSpeechRecognitionSupported } from '../../engine/speech';
import { scoreWriteAnswer } from '../../engine/scoring';
import type { LessonItem } from '../../types/lesson';

interface SpeakStepProps {
  items: LessonItem[];
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

export function SpeakStep({ items, onComplete }: SpeakStepProps) {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const adapter = useAppStore((s) => s.activeAdapter);
  const ttsLang = activePack?.speech.ttsLang ?? 'ja-JP';
  const recognitionLang = activePack?.speech.recognitionLang ?? ttsLang;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [result, setResult] = useState<{ transcript: string; similarity: number; correct: boolean } | null>(null);
  const correctCountRef = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledItems = useMemo(() => shuffle([...items]), [items.length]);
  const item = shuffledItems[currentIdx];
  const isLast = currentIdx === shuffledItems.length - 1;

  const expected = item.reading ?? item.front;

  const handleTranscript = useCallback((transcript: string, confidence: number) => {
    if (showFeedback) return;

    const textResult = scoreWriteAnswer(transcript, expected, adapter);
    const similarity = (textResult.similarity ?? 0) * 0.7 + confidence * 0.3;
    const correct = similarity >= 0.5;

    setResult({ transcript, similarity, correct });
    setShowFeedback(true);
    if (correct) {
      correctCountRef.current += 1;
    }
  }, [showFeedback, expected, adapter]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete({ correct: correctCountRef.current, total: shuffledItems.length });
      return;
    }
    setCurrentIdx((prev) => prev + 1);
    setShowFeedback(false);
    setResult(null);
  }, [isLast, shuffledItems.length, onComplete]);

  const handleSkip = useCallback(() => {
    setShowFeedback(true);
    setResult({ transcript: '—', similarity: 0, correct: false });
  }, []);

  if (!isSpeechRecognitionSupported()) {
    return (
      <div className="flex flex-col items-center gap-4">
        <BrowserSupportBanner feature="speech" />
        <Button onClick={() => onComplete({ correct: 0, total: 0 })}>
          {t('common.next')}
        </Button>
      </div>
    );
  }

  const similarityPct = result ? Math.round(result.similarity * 100) : 0;

  return (
    <div className="flex flex-col items-center">
      {/* Character to pronounce */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center mb-4 w-full max-w-md">
        <span className="text-5xl font-bold text-slate-100 block mb-3">{item.front}</span>
        {item.reading && (
          <span className="text-lg text-slate-400">{item.reading}</span>
        )}
        <div className="mt-3">
          <AudioPlayer text={item.front} lang={ttsLang} size="sm" />
        </div>
      </div>

      <span className="text-xs text-slate-500 mb-4">{currentIdx + 1} / {shuffledItems.length}</span>

      {/* Microphone */}
      {!showFeedback && (
        <div className="flex flex-col items-center gap-3 mb-4">
          <Microphone lang={recognitionLang} onTranscript={handleTranscript} size="lg" />
          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            <SkipForward className="w-3 h-3" />
            {t('common.next')}
          </button>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && result && (
        <div className={`w-full max-w-md rounded-xl p-4 mb-4 flex items-center gap-3 ${
          result.correct
            ? 'bg-emerald-600/15 border border-emerald-500/30'
            : 'bg-red-600/15 border border-red-500/30'
        }`}>
          {result.correct ? (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <X className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{t('audio.yourSpeech')}</span>
              <span className="text-slate-200">{result.transcript}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{t('audio.similarity')}</span>
              <span className={`font-bold ${similarityPct >= 70 ? 'text-emerald-400' : similarityPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {similarityPct}%
              </span>
            </div>
          </div>
        </div>
      )}

      {showFeedback && (
        <Button onClick={handleNext}>
          {isLast ? t('lessons.next') : t('common.next')}
        </Button>
      )}
    </div>
  );
}
