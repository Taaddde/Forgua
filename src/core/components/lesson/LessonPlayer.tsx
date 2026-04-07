/**
 * LessonPlayer — orchestrates a lesson's steps in sequence.
 * Renders each step type and tracks progress/score.
 */

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import type { Lesson } from '../../types/lesson';
import { IntroduceStep } from './IntroduceStep';
import { RecognizeStep } from './RecognizeStep';
import { RecallStep } from './RecallStep';
import { WriteStep } from './WriteStep';
import { SentenceBuildStep } from './SentenceBuildStep';
import { ListenIdentifyStep } from './ListenIdentifyStep';
import { ListenTranscribeStep } from './ListenTranscribeStep';
import { SpeakStep } from './SpeakStep';
import { SummaryStep } from './SummaryStep';

interface LessonPlayerProps {
  lesson: Lesson;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export function LessonPlayer({ lesson, onComplete, onExit }: LessonPlayerProps) {
  const { t } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResults, setStepResults] = useState<Map<number, { correct: number; total: number }>>(new Map());
  const accumulatedScoreRef = useRef({ correct: 0, total: 0 });

  const currentStep = lesson.steps[currentStepIndex];
  const totalSteps = lesson.steps.length;
  const progressPercent = ((currentStepIndex) / totalSteps) * 100;

  const handleStepComplete = useCallback(
    (result?: { correct: number; total: number }) => {
      if (result) {
        accumulatedScoreRef.current.correct += result.correct;
        accumulatedScoreRef.current.total += result.total;

        setStepResults((prev) => {
          const next = new Map(prev);
          next.set(currentStepIndex, result);
          return next;
        });
      }

      const nextIndex = currentStepIndex + 1;
      if (nextIndex >= totalSteps) {
        const { correct, total } = accumulatedScoreRef.current;
        const score = total > 0 ? Math.round((correct / total) * 100) : 100;
        onComplete(score);
      } else {
        setCurrentStepIndex(nextIndex);
      }
    },
    [currentStepIndex, totalSteps, onComplete],
  );

  const stepItems = currentStep.itemIndices.map((i) => lesson.items[i]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </button>
        <span className="text-sm text-slate-400">
          {t('lessons.step', { current: currentStepIndex + 1, total: totalSteps })}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full mb-8">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step title */}
      {currentStep.title && (
        <h2 className="text-xl font-bold text-slate-100 mb-2">{currentStep.title}</h2>
      )}
      {currentStep.instruction && (
        <p className="text-sm text-slate-400 mb-6">{currentStep.instruction}</p>
      )}

      {/* Step content */}
      {currentStep.type === 'introduce' && (
        <IntroduceStep
          key={currentStepIndex}
          items={stepItems}
          onComplete={() => handleStepComplete()}
        />
      )}
      {currentStep.type === 'recognize' && (
        <RecognizeStep
          key={currentStepIndex}
          items={stepItems}
          allItems={lesson.items}
          onComplete={handleStepComplete}
        />
      )}
      {currentStep.type === 'recall' && (
        <RecallStep
          key={currentStepIndex}
          items={stepItems}
          onComplete={handleStepComplete}
        />
      )}
      {currentStep.type === 'write' && (
        <WriteStep
          key={currentStepIndex}
          items={stepItems}
          onComplete={handleStepComplete}
        />
      )}
      {currentStep.type === 'sentence-build' && (
        <SentenceBuildStep
          key={currentStepIndex}
          items={stepItems}
          config={currentStep.config}
          onComplete={handleStepComplete}
        />
      )}
      {currentStep.type === 'listen-identify' && (
        <ListenIdentifyStep
          key={currentStepIndex}
          items={stepItems}
          allItems={lesson.items}
          onComplete={handleStepComplete}
        />
      )}
      {currentStep.type === 'listen-transcribe' && (
        <ListenTranscribeStep
          key={currentStepIndex}
          items={stepItems}
          onComplete={handleStepComplete}
        />
      )}
      {currentStep.type === 'speak' && (
        <SpeakStep
          key={currentStepIndex}
          items={stepItems}
          onComplete={handleStepComplete}
        />
      )}
      {currentStep.type === 'summary' && (
        <SummaryStep
          key={currentStepIndex}
          items={stepItems}
          stepResults={stepResults}
          onComplete={() => handleStepComplete()}
        />
      )}
    </div>
  );
}
