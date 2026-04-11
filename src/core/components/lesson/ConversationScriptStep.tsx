/**
 * ConversationScriptStep — wraps the ConversationScript exercise for lessons.
 *
 * Config shape:
 * {
 *   "script": { ConversationScript inline — id, scenario, level, turns: [...] }
 * }
 */

import { useCallback, useMemo } from 'react';
import { ConversationScript } from '../exercises/ConversationScript';
import { useAppStore } from '../../store/useAppStore';
import type { ConversationScript as ConversationScriptData } from '../../types/pack-spec';

interface ConversationScriptStepProps {
  config?: Record<string, unknown>;
  onComplete: (result: { correct: number; total: number }) => void;
}

export function ConversationScriptStep({ config, onComplete }: ConversationScriptStepProps) {
  const activePack = useAppStore((s) => s.activePack);
  const ttsLang = activePack?.speech.ttsLang ?? 'en-US';

  const script = useMemo(() => config?.script as ConversationScriptData | undefined, [config]);

  const handleAnswer = useCallback(
    (wasCorrect: boolean) => {
      onComplete({ correct: wasCorrect ? 1 : 0, total: 1 });
    },
    [onComplete],
  );

  if (!script) {
    onComplete({ correct: 0, total: 0 });
    return null;
  }

  return <ConversationScript script={script} lang={ttsLang} onAnswer={handleAnswer} />;
}
