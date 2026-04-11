/**
 * ImageAssociationStep — wraps the ImageAssociation exercise for lessons.
 *
 * Config shape:
 * {
 *   "exercises": [
 *     { "imageUrl": "...", "imageAlt": "...", "options": [...], "correctIndex": N },
 *     ...
 *   ]
 * }
 *
 * imageUrl can be an absolute URL, a data URI, or a path relative to the pack root.
 */

import { useState, useCallback, useMemo } from 'react';
import { ImageAssociation } from '../exercises/ImageAssociation';

interface ImageAssociationExercise {
  imageUrl: string;
  imageAlt: string;
  options: string[];
  correctIndex: number;
}

interface ImageAssociationStepProps {
  config?: Record<string, unknown>;
  onComplete: (result: { correct: number; total: number }) => void;
}

export function ImageAssociationStep({ config, onComplete }: ImageAssociationStepProps) {
  const exercises = useMemo(
    () => (config?.exercises as ImageAssociationExercise[] | undefined) ?? [],
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
      <ImageAssociation
        key={currentIdx}
        imageUrl={exercise.imageUrl}
        imageAlt={exercise.imageAlt}
        options={exercise.options}
        correctIndex={exercise.correctIndex}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
