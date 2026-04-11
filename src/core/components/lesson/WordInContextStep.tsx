/**
 * WordInContextStep — wraps the WordInContext exercise for lessons.
 *
 * Config shape:
 * {
 *   "exercises": [
 *     { "targetWord": "...", "translation": "...", "options": [...], "correctIndex": N },
 *     ...
 *   ]
 * }
 */

import { useState, useCallback, useMemo } from 'react';
import { WordInContext } from '../exercises/WordInContext';

interface WordInContextExercise {
  targetWord: string;
  translation?: string;
  options: string[];
  correctIndex: number;
}

interface WordInContextStepProps {
  config?: Record<string, unknown>;
  onComplete: (result: { correct: number; total: number }) => void;
}

export function WordInContextStep({ config, onComplete }: WordInContextStepProps) {
  const exercises = useMemo(
    () => (config?.exercises as WordInContextExercise[] | undefined) ?? [],
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
      <WordInContext
        key={currentIdx}
        targetWord={exercise.targetWord}
        translation={exercise.translation}
        options={exercise.options}
        correctIndex={exercise.correctIndex}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
