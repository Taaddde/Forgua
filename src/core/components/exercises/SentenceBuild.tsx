/**
 * SentenceBuild exercise — standalone component for building sentences from fragments.
 * Used within lesson SentenceBuildStep and potentially standalone.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, RotateCcw } from 'lucide-react';
import { Button } from '../common/Button';
import { ReviewGrade } from '../../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

interface SentenceBuildProps {
  translation: string;
  fragments: string[];
  correctOrder: number[];
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

export function SentenceBuild({ translation, fragments, correctOrder, onAnswer }: SentenceBuildProps) {
  const { t } = useTranslation();
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const availableIndices = fragments
    .map((_, i) => i)
    .filter((i) => !selectedOrder.includes(i));

  const handleAddFragment = (idx: number) => {
    if (showFeedback) return;
    setSelectedOrder((prev) => [...prev, idx]);
  };

  const handleRemoveFragment = (position: number) => {
    if (showFeedback) return;
    setSelectedOrder((prev) => prev.filter((_, i) => i !== position));
  };

  const handleCheck = useCallback(() => {
    const match = selectedOrder.length === correctOrder.length &&
      selectedOrder.every((val, idx) => val === correctOrder[idx]);
    setIsCorrect(match);
    setShowFeedback(true);
  }, [selectedOrder, correctOrder]);

  const handleContinue = () => {
    onAnswer(isCorrect, isCorrect ? ReviewGrade.Good : ReviewGrade.Again);
  };

  const correctSentence = correctOrder.map((i) => fragments[i]).join('');

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Translation */}
      <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-4 mb-6 text-center">
        <span className="text-xs text-indigo-400 block mb-1">{t('exercise.sentenceBuild.hint')}</span>
        <span className="text-lg font-medium text-indigo-200">{translation}</span>
      </div>

      {/* Build zone */}
      <div className="min-h-[56px] bg-slate-900 border border-slate-700 rounded-xl p-3 mb-4 flex flex-wrap gap-2">
        {selectedOrder.length === 0 && (
          <span className="text-sm text-slate-600">{t('exercise.sentenceBuild.instruction')}</span>
        )}
        {selectedOrder.map((fragIdx, pos) => (
          <button
            key={pos}
            onClick={() => handleRemoveFragment(pos)}
            disabled={showFeedback}
            className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-sm font-medium text-indigo-200 hover:bg-indigo-600/30 transition-colors"
          >
            {fragments[fragIdx]}
          </button>
        ))}
      </div>

      {/* Available fragments */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {availableIndices.map((fragIdx) => (
          <button
            key={fragIdx}
            onClick={() => handleAddFragment(fragIdx)}
            disabled={showFeedback}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:border-slate-600 hover:bg-slate-700 transition-colors"
          >
            {fragments[fragIdx]}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`rounded-xl p-4 mb-4 flex items-center gap-3 ${
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
      <div className="flex justify-center gap-3">
        {!showFeedback && selectedOrder.length > 0 && (
          <Button variant="ghost" onClick={() => setSelectedOrder([])}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
        {!showFeedback ? (
          <Button
            onClick={handleCheck}
            disabled={selectedOrder.length !== fragments.length}
          >
            {t('exercise.sentenceBuild.check')}
          </Button>
        ) : (
          <Button onClick={handleContinue}>
            {t('common.next')}
          </Button>
        )}
      </div>
    </div>
  );
}
