/**
 * SentenceBuildStep — user builds sentences from fragments.
 * Shows translation as objective, fragments as clickable chips.
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, RotateCcw } from 'lucide-react';
import { Button } from '../common/Button';
import type { LessonItem } from '../../types/lesson';

interface SentenceData {
  fragments: string[];
  correctOrder: number[];
  translation: string;
}

interface SentenceBuildStepProps {
  items: LessonItem[];
  config?: Record<string, unknown>;
  onComplete: (result: { correct: number; total: number }) => void;
}

export function SentenceBuildStep({ config, onComplete }: SentenceBuildStepProps) {
  const { t } = useTranslation();
  const sentences = (config?.sentences as SentenceData[]) ?? [];

  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correct, setCorrect] = useState(0);

  // Handle empty sentences case
  useEffect(() => {
    if (sentences.length === 0) {
      onComplete({ correct: 0, total: 0 });
    }
  }, [sentences.length, onComplete]);

  const sentence = sentences[sentenceIdx] as SentenceData | undefined;
  const isLast = sentenceIdx === sentences.length - 1;

  const handleCheck = useCallback(() => {
    if (!sentence) return;
    const match = selectedOrder.length === sentence.correctOrder.length &&
      selectedOrder.every((val, idx) => val === sentence.correctOrder[idx]);
    setIsCorrect(match);
    setShowFeedback(true);
    if (match) {
      setCorrect((prev) => prev + 1);
    }
  }, [selectedOrder, sentence]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete({ correct, total: sentences.length });
      return;
    }
    setSentenceIdx((prev) => prev + 1);
    setSelectedOrder([]);
    setShowFeedback(false);
    setIsCorrect(false);
  }, [isLast, correct, sentences.length, onComplete]);

  const handleFinalNext = useCallback(() => {
    onComplete({ correct, total: sentences.length });
  }, [correct, sentences.length, onComplete]);

  if (!sentence) return null;

  const availableIndices = sentence.fragments
    .map((_, i) => i)
    .filter((i) => !selectedOrder.includes(i));

  const correctSentence = sentence.correctOrder.map((i) => sentence.fragments[i]).join('');

  return (
    <div className="flex flex-col items-center">
      {/* Translation target */}
      <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-4 mb-6 w-full max-w-md text-center">
        <span className="text-xs text-indigo-400 block mb-1">{t('exercise.sentenceBuild.hint')}</span>
        <span className="text-lg font-medium text-indigo-200">{sentence.translation}</span>
      </div>

      <span className="text-xs text-slate-500 mb-4">{sentenceIdx + 1} / {sentences.length}</span>

      {/* Build zone */}
      <div className="w-full max-w-md min-h-[56px] bg-slate-900 border border-slate-700 rounded-xl p-3 mb-4 flex flex-wrap gap-2">
        {selectedOrder.length === 0 && (
          <span className="text-sm text-slate-600">{t('exercise.sentenceBuild.instruction')}</span>
        )}
        {selectedOrder.map((fragIdx, pos) => (
          <button
            key={pos}
            onClick={() => {
              if (!showFeedback) {
                setSelectedOrder((prev) => prev.filter((_, i) => i !== pos));
              }
            }}
            disabled={showFeedback}
            className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-sm font-medium text-indigo-200 hover:bg-indigo-600/30 transition-colors"
          >
            {sentence.fragments[fragIdx]}
          </button>
        ))}
      </div>

      {/* Available fragments */}
      <div className="w-full max-w-md flex flex-wrap gap-2 justify-center mb-6">
        {availableIndices.map((fragIdx) => (
          <button
            key={fragIdx}
            onClick={() => {
              if (!showFeedback) {
                setSelectedOrder((prev) => [...prev, fragIdx]);
              }
            }}
            disabled={showFeedback}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:border-slate-600 hover:bg-slate-700 transition-colors"
          >
            {sentence.fragments[fragIdx]}
          </button>
        ))}
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
              {isCorrect ? t('exercise.sentenceBuild.correct') : t('exercise.sentenceBuild.incorrect')}
            </span>
            {!isCorrect && (
              <span className="text-lg text-slate-100 block mt-1">{correctSentence}</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!showFeedback && selectedOrder.length > 0 && (
          <Button variant="ghost" onClick={() => setSelectedOrder([])}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
        {!showFeedback ? (
          <Button
            onClick={handleCheck}
            disabled={selectedOrder.length !== sentence.fragments.length}
          >
            {t('exercise.sentenceBuild.check')}
          </Button>
        ) : (
          <Button onClick={isLast ? handleFinalNext : handleNext}>
            {isLast ? t('lessons.next') : t('common.next')}
          </Button>
        )}
      </div>
    </div>
  );
}
