/**
 * Hook for managing the placement test flow.
 *
 * State machine: idle → self-report → quiz → result
 */

import { useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { loadPlacement } from '../packs';
import { db } from '../db/database';
import {
  sampleQuestions,
  checkAnswer,
  evaluateLevel,
  getSkippedLevels,
  getLowerLevel,
  createSkippedSRSStates,
} from '../engine/placement';
import type {
  PlacementConfig,
  PlacementLevelConfig,
  PlacementQuestion,
  PlacementResult,
} from '../types/placement';

/** Steps in the placement flow */
export type PlacementStep = 'idle' | 'self-report' | 'quiz' | 'result';

export interface UsePlacementReturn {
  step: PlacementStep;
  config: PlacementConfig | null;
  result: PlacementResult | null;
  isLoading: boolean;
  /** The questions currently being shown in the quiz */
  currentQuestions: PlacementQuestion[];
  /** Index of the current question being answered */
  currentQuestionIndex: number;
  /** The level currently being tested */
  currentLevelId: string | null;
  startPlacement: (packId: string) => Promise<void>;
  submitSelfReport: (levelId: string) => void;
  submitAnswer: (answer: number | string | boolean) => void;
  shouldOfferPlacement: (packId: string) => Promise<boolean>;
  reset: () => void;
}

export function usePlacement(): UsePlacementReturn {
  const activePack = useAppStore((s) => s.activePack);

  const [step, setStep] = useState<PlacementStep>('idle');
  const [config, setConfig] = useState<PlacementConfig | null>(null);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<PlacementQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);
  const [selfReportLevelId, setSelfReportLevelId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [packId, setPackId] = useState<string | null>(null);

  const startPlacement = useCallback(async (pid: string) => {
    setIsLoading(true);
    setPackId(pid);
    const placementConfig = await loadPlacement(pid);
    if (!placementConfig) {
      setIsLoading(false);
      return;
    }
    setConfig(placementConfig);
    setStep('self-report');
    setIsLoading(false);
  }, []);

  const startQuizForLevel = useCallback((levelConfig: PlacementLevelConfig, cfg: PlacementConfig) => {
    const questions = sampleQuestions(levelConfig.questions, cfg.questionsPerLevel);
    setCurrentQuestions(questions);
    setCurrentQuestionIndex(0);
    setCurrentLevelId(levelConfig.levelId);
    setAnswers([]);
    setStep('quiz');
  }, []);

  const submitSelfReport = useCallback((levelId: string) => {
    if (!config) return;
    setSelfReportLevelId(levelId);
    const levelConfig = config.levels.find((l) => l.levelId === levelId);
    if (!levelConfig) return;
    startQuizForLevel(levelConfig, config);
  }, [config, startQuizForLevel]);

  const finalizePlacement = useCallback(async (
    confirmedLevel: string,
    accuracy: number,
    pid: string,
    selfReport: string,
  ) => {
    if (!activePack) return;

    const skippedLevels = getSkippedLevels(activePack.levels, confirmedLevel);

    // Save result to IndexedDB
    const placementResult: PlacementResult = {
      packId: pid,
      selfReportLevel: selfReport,
      confirmedLevel,
      accuracy,
      skippedLevels,
      completedAt: new Date(),
    };
    await db.placementResults.add(placementResult);

    // Skip SRS for cards in lower levels
    if (skippedLevels.length > 0) {
      const cardsToSkip = await db.cards
        .where('packId').equals(pid)
        .filter((c) => skippedLevels.includes(c.level))
        .toArray();

      const cardIds = cardsToSkip
        .map((c) => c.id)
        .filter((id): id is number => id !== undefined);

      if (cardIds.length > 0) {
        const srsStates = createSkippedSRSStates(cardIds, pid);
        // Only add states for cards that don't already have one
        for (const state of srsStates) {
          const existing = await db.srsState.get(state.cardId);
          if (!existing) {
            await db.srsState.put(state);
          }
        }
      }

      // Lesson unlocking is handled via the existing prerequisite system.
      // Skipped cards are in SRS with high interval, which doesn't block lessons.
    }

    setResult(placementResult);
    setStep('result');
  }, [activePack]);

  const submitAnswer = useCallback((answer: number | string | boolean) => {
    if (!config || !currentLevelId || !packId || !selfReportLevelId) return;

    const question = currentQuestions[currentQuestionIndex];
    const isCorrect = checkAnswer(question, answer);
    const newAnswers = [...answers, isCorrect];
    setAnswers(newAnswers);

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < currentQuestions.length) {
      // More questions to go
      setCurrentQuestionIndex(nextIndex);
    } else {
      // All questions answered — evaluate
      const { passed, accuracy } = evaluateLevel(newAnswers, config.passThreshold);

      if (passed) {
        // User passed! Confirm this level
        finalizePlacement(currentLevelId, accuracy, packId, selfReportLevelId);
      } else {
        // Failed — try the next lower level
        const lowerLevel = activePack
          ? getLowerLevel(config, currentLevelId, activePack.levels)
          : null;

        if (lowerLevel) {
          startQuizForLevel(lowerLevel, config);
        } else {
          // Already at lowest level — place at the first level (no skipping)
          const lowestLevel = activePack
            ? [...activePack.levels].sort((a, b) => a.order - b.order)[0]
            : null;
          finalizePlacement(
            lowestLevel?.id ?? currentLevelId,
            accuracy,
            packId,
            selfReportLevelId,
          );
        }
      }
    }
  }, [config, currentLevelId, currentQuestions, currentQuestionIndex, answers, packId, selfReportLevelId, activePack, finalizePlacement, startQuizForLevel]);

  const shouldOfferPlacement = useCallback(async (pid: string): Promise<boolean> => {
    // 1. Check if pack has placement enabled
    const pack = activePack;
    if (!pack || !pack.features.placement) return false;

    // 2. Check if a PlacementResult already exists
    const existingResult = await db.placementResults
      .where('packId').equals(pid)
      .first();
    if (existingResult) return false;

    // 3. Check if user already has study progress
    const srsCount = await db.srsState
      .where('packId').equals(pid)
      .count();
    if (srsCount > 0) return false;

    const lessonCount = await db.lessonProgress
      .where('packId').equals(pid)
      .filter((lp) => lp.status === 'completed')
      .count();
    if (lessonCount > 0) return false;

    return true;
  }, [activePack]);

  const reset = useCallback(() => {
    setStep('idle');
    setConfig(null);
    setResult(null);
    setCurrentQuestions([]);
    setCurrentQuestionIndex(0);
    setCurrentLevelId(null);
    setSelfReportLevelId(null);
    setAnswers([]);
    setPackId(null);
  }, []);

  return {
    step,
    config,
    result,
    isLoading,
    currentQuestions,
    currentQuestionIndex,
    currentLevelId,
    startPlacement,
    submitSelfReport,
    submitAnswer,
    shouldOfferPlacement,
    reset,
  };
}
