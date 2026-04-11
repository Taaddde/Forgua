/**
 * ConversationScript exercise — guided scripted dialogue.
 *
 * NPC turns auto-display (with optional TTS). Learner turns present
 * 2-4 multiple-choice options. No free-text matching — zero false negatives.
 *
 * The script is defined entirely in the pack JSON. The core is 100% agnostic.
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, User, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { AudioPlayer } from '../audio/AudioPlayer';
import { scoreConversation } from '../../engine/scoring';
import { Button } from '../common/Button';
import { ReviewGrade } from '../../types/models';
import type { ConversationScript as ConversationScriptData } from '../../types/pack-spec';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

interface ConversationScriptProps {
  script: ConversationScriptData;
  lang: string;
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

interface TurnState {
  selectedOption: number | null;
  wasCorrect: boolean | null;
}

export function ConversationScript({ script, lang, onAnswer }: ConversationScriptProps) {
  const { t } = useTranslation();

  // Only learner turns have options — track state for each
  const learnerTurnIndices = script.turns
    .map((turn, i) => ({ turn, i }))
    .filter(({ turn }) => turn.speaker === 'learner');

  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [turnStates, setTurnStates] = useState<Map<number, TurnState>>(new Map());
  const [completed, setCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentTurn = script.turns[currentTurnIndex];
  const isLastTurn = currentTurnIndex >= script.turns.length - 1;

  // Auto-scroll to bottom when new turns appear
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [currentTurnIndex, showFeedback]);

  function handleOptionSelect(optionIndex: number) {
    if (showFeedback || currentTurn?.speaker !== 'learner') return;

    const isCorrect = currentTurn.options?.[optionIndex]?.isCorrect ?? false;
    const newState: TurnState = { selectedOption: optionIndex, wasCorrect: isCorrect };

    setTurnStates((prev) => new Map(prev).set(currentTurnIndex, newState));
    setShowFeedback(true);
  }

  function handleContinue() {
    setShowFeedback(false);

    if (isLastTurn) {
      setCompleted(true);
      // turnStates already has the current turn set (from handleOptionSelect)
      const correctCount = Array.from(turnStates.values()).filter((s) => s.wasCorrect).length;
      const result = scoreConversation(correctCount, learnerTurnIndices.length);
      setTimeout(() => onAnswer(result.correct, result.grade), 500);
    } else {
      setCurrentTurnIndex((i) => i + 1);
    }
  }

  // NPC turns: auto-advance on button click
  function handleNpcNext() {
    if (isLastTurn) {
      setCompleted(true);
      const correctCount = Array.from(turnStates.values()).filter((s) => s.wasCorrect).length;
      const result = scoreConversation(correctCount, learnerTurnIndices.length);
      setTimeout(() => onAnswer(result.correct, result.grade), 500);
    } else {
      setCurrentTurnIndex((i) => i + 1);
    }
  }

  if (completed) {
    const correctCount = Array.from(turnStates.values()).filter((s) => s.wasCorrect).length;
    const total = learnerTurnIndices.length;

    return (
      <div className="w-full max-w-lg mx-auto text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t('exercise.conversation.complete')}
        </h3>
        <p className="text-slate-400">
          {t('exercise.conversation.score', { correct: correctCount, total })}
        </p>
      </div>
    );
  }

  const currentState = turnStates.get(currentTurnIndex);
  const selectedOption = currentState?.selectedOption ?? null;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
          {t('exercise.conversation.scenario')}
        </span>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-1">
          {script.scenario}
        </h3>
      </div>

      {/* Optional scene image */}
      {script.imageUrl && (
        <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <img src={script.imageUrl} alt={script.scenario} className="w-full h-32 object-cover" />
        </div>
      )}

      {/* Conversation thread — shows all revealed turns so far */}
      <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
        {script.turns.slice(0, currentTurnIndex + 1).map((turn, i) => {
          const state = turnStates.get(i);
          const isNpc = turn.speaker === 'npc';
          const isCurrentLearnerPending = i === currentTurnIndex && turn.speaker === 'learner' && !showFeedback;

          return (
            <div
              key={i}
              className={`flex gap-3 ${isNpc ? '' : 'flex-row-reverse'}`}
              data-testid={`turn-${i}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isNpc
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                {isNpc ? <MessageCircle className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] ${isNpc ? '' : 'items-end flex flex-col'}`}>
                {isNpc ? (
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm text-slate-800 dark:text-slate-200">{turn.text}</p>
                    {turn.translation && (
                      <p className="text-xs text-slate-400 mt-1">{turn.translation}</p>
                    )}
                    {turn.audio && (
                      <div className="mt-2">
                        <AudioPlayer text={turn.text} lang={lang} size="sm" />
                      </div>
                    )}
                  </div>
                ) : state ? (
                  // Learner turn already answered
                  <div className={`rounded-2xl rounded-tr-sm px-4 py-3 ${
                    state.wasCorrect
                      ? 'bg-emerald-600/20 border border-emerald-500/30'
                      : 'bg-red-600/20 border border-red-500/30'
                  }`}>
                    <p className={`text-sm ${state.wasCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                      {turn.options?.[state.selectedOption!]?.text ?? ''}
                    </p>
                  </div>
                ) : isCurrentLearnerPending ? null : null}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Current turn controls */}
      {currentTurn.speaker === 'npc' && (
        <Button onClick={handleNpcNext} className="w-full" data-testid="btn-npc-next">
          {t('exercise.conversation.continue')} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}

      {currentTurn.speaker === 'learner' && !showFeedback && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 text-center mb-2">
            {t('exercise.conversation.chooseResponse')}
          </p>
          {currentTurn.options?.map((option, i) => (
            <button
              key={i}
              onClick={() => handleOptionSelect(i)}
              data-testid={`conversation-option-${i}`}
              className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {option.text}
            </button>
          ))}
        </div>
      )}

      {/* Feedback overlay after learner picks */}
      {currentTurn.speaker === 'learner' && showFeedback && currentState && (
        <div className="space-y-3">
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${
            currentState.wasCorrect
              ? 'bg-emerald-600/15 border-emerald-500/30'
              : 'bg-red-600/15 border-red-500/30'
          }`}>
            {currentState.wasCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <div>
              <p className={`text-sm font-medium ${currentState.wasCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                {currentState.wasCorrect
                  ? t('exercise.conversation.correct')
                  : t('exercise.conversation.incorrect')}
              </p>
              {currentTurn.options?.[selectedOption!]?.feedback && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentTurn.options[selectedOption!].feedback}
                </p>
              )}
            </div>
          </div>

          <Button onClick={handleContinue} className="w-full" data-testid="btn-feedback-continue">
            {isLastTurn ? t('exercise.conversation.complete') : t('exercise.conversation.continue')}
          </Button>
        </div>
      )}
    </div>
  );
}
