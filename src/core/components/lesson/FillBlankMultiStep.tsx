/**
 * FillBlankMultiStep — wraps the ClozeMulti exercise for use inside lessons.
 *
 * Config shape:
 * {
 *   "exercises": [
 *     { "template": "The {0} is on the {1}.", "blanks": [{"answer": "book", "options": ["book","car"]}, ...] },
 *     ...
 *   ]
 * }
 *
 * Cycles through exercises in order and reports the aggregated score.
 */

import { useState, useCallback, useMemo } from 'react';
import { ClozeMulti, type BlankSlot } from '../exercises/ClozeMulti';

interface ClozeExercise {
  template: string;
  blanks: BlankSlot[];
}

interface FillBlankMultiStepProps {
  config?: Record<string, unknown>;
  onComplete: (result: { correct: number; total: number }) => void;
}

export function FillBlankMultiStep({ config, onComplete }: FillBlankMultiStepProps) {
  const exercises = useMemo(() => (config?.exercises as ClozeExercise[] | undefined) ?? [], [config]);
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
    // Nothing to do — complete immediately with a perfect score so the lesson advances.
    onComplete({ correct: 0, total: 0 });
    return null;
  }

  const exercise = exercises[currentIdx];

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-slate-500 mb-4">
        {currentIdx + 1} / {exercises.length}
      </span>
      <ClozeMulti
        key={currentIdx}
        template={exercise.template}
        blanks={exercise.blanks}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
