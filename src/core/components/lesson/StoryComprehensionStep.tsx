/**
 * StoryComprehensionStep — wraps the StoryComprehension exercise for lessons.
 *
 * Config shape:
 * {
 *   "passage": { ReadingText inline — id, title, level, text, translation?, questions: [...] }
 * }
 *
 * The passage is defined inline in the lesson config so the LessonPlayer
 * doesn't need to query the pack's readings file during play.
 */

import { useCallback, useMemo } from 'react';
import { StoryComprehension } from '../exercises/StoryComprehension';
import type { ReadingText } from '../../types/pack-spec';

interface StoryComprehensionStepProps {
  config?: Record<string, unknown>;
  onComplete: (result: { correct: number; total: number }) => void;
}

export function StoryComprehensionStep({ config, onComplete }: StoryComprehensionStepProps) {
  const passage = useMemo(() => config?.passage as ReadingText | undefined, [config]);

  const handleAnswer = useCallback(
    (wasCorrect: boolean) => {
      // StoryComprehension already iterates all questions internally and calls
      // onAnswer once at the end with an aggregated correctness. We convert that
      // into a 1-of-1 result so the lesson score includes the reading activity.
      onComplete({ correct: wasCorrect ? 1 : 0, total: 1 });
    },
    [onComplete],
  );

  if (!passage) {
    onComplete({ correct: 0, total: 0 });
    return null;
  }

  return <StoryComprehension passage={passage} onAnswer={handleAnswer} />;
}
