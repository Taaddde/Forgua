/**
 * ErrorCorrectionStep — wraps the ErrorCorrection exercise for lessons.
 *
 * Config shape:
 * {
 *   "exercises": [
 *     { "sentence": "...", "isCorrect": bool, "correction": "...", "explanation": "...", "errorType": "..." },
 *     ...
 *   ]
 * }
 */

import { useState, useCallback, useMemo } from 'react';
import { ErrorCorrection } from '../exercises/ErrorCorrection';

interface ErrorCorrectionExercise {
  sentence: string;
  isCorrect: boolean;
  correction?: string;
  explanation: string;
  errorType?: string;
}

interface ErrorCorrectionStepProps {
  config?: Record<string, unknown>;
  onComplete: (result: { correct: number; total: number }) => void;
}

export function ErrorCorrectionStep({ config, onComplete }: ErrorCorrectionStepProps) {
  const exercises = useMemo(
    () => (config?.exercises as ErrorCorrectionExercise[] | undefined) ?? [],
    [config],
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correct, setCorrect] = useState(0);

  const handleAnswer = useCallback(
    (wasCorrect: boolean) => {
      const nextCorrect = wasCorrect ? correct + 1 : correct;
      const nextIdx = currentIdx + 1;
      if (nextIdx >= exercises.length) {
        onComplete({ correct: nextCorrect, total: exercises.length });
        return;
      }
      setCorrect(nextCorrect);
      setCurrentIdx(nextIdx);
    },
    [correct, currentIdx, exercises.length, onComplete],
  );

  if (exercises.length === 0) {
    onComplete({ correct: 0, total: 0 });
    return null;
  }

  const exercise = exercises[currentIdx];

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-slate-500 mb-4">
        {currentIdx + 1} / {exercises.length}
      </span>
      <ErrorCorrection
        key={currentIdx}
        sentence={exercise.sentence}
        isCorrect={exercise.isCorrect}
        correction={exercise.correction}
        explanation={exercise.explanation}
        errorType={exercise.errorType}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
