/**
 * Study page — the main review session flow.
 * Only shows cards that have SRS state (introduced via Lessons).
 * New cards are introduced through Lessons, not Study.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Clock, Target, ChevronRight, Lightbulb } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useSRS } from '../hooks/useSRS';
import { FlashCard } from '../components/cards/FlashCard';
import { MultipleChoice } from '../components/exercises/MultipleChoice';
import { WriteAnswer } from '../components/exercises/WriteAnswer';
import { FillBlank } from '../components/exercises/FillBlank';
import { Dictation } from '../components/exercises/Dictation';
import { SpeakExercise } from '../components/exercises/SpeakExercise';
import { DragReorder } from '../components/exercises/DragReorder';
import { Matching } from '../components/exercises/Matching';
import { Button } from '../components/common/Button';
import { db } from '../db/database';
import { isSpeechRecognitionSupported } from '../engine/speech';
import { ReviewGrade } from '../types/models';
import type { Card, ExerciseType } from '../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

/** Shuffle array in place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Pick a random exercise type for variety */
function pickExerciseType(hasSpeechSupport: boolean = false): ExerciseType {
  const rand = Math.random();
  if (hasSpeechSupport) {
    if (rand < 0.28) return 'flashcard';
    if (rand < 0.40) return 'multiple-choice';
    if (rand < 0.52) return 'write-answer';
    if (rand < 0.60) return 'fill-blank';
    if (rand < 0.68) return 'dictation';
    if (rand < 0.76) return 'speak';
    if (rand < 0.88) return 'drag-reorder';
    return 'matching';
  }
  if (rand < 0.30) return 'flashcard';
  if (rand < 0.45) return 'multiple-choice';
  if (rand < 0.58) return 'write-answer';
  if (rand < 0.68) return 'fill-blank';
  if (rand < 0.84) return 'drag-reorder';
  return 'matching';
}

/** Generate wrong options from other cards in the queue */
function generateOptions(correctBack: string, allCards: Card[]): string[] {
  const wrong = allCards
    .map((c) => c.back)
    .filter((b) => b !== correctBack);
  const shuffled = shuffle(wrong).slice(0, 3);
  // Ensure we have 3 wrong + 1 correct, pad if needed
  while (shuffled.length < 3) {
    shuffled.push(`—`);
  }
  const options = shuffle([...shuffled, correctBack]);
  return options;
}

export function Study() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const activePack = useAppStore((s) => s.activePack);
  const activeAdapter = useAppStore((s) => s.activeAdapter);
  const packId = activePack?.id ?? null;

  const { reviewQueue, isLoading, submitReview, sessionStats, resetSession } = useSRS(packId);

  // Build session queue once when data is ready
  const [sessionQueue, setSessionQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('flashcard');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const sessionStartTime = useRef<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Build queue when data arrives — only review cards (no newCards)
  useEffect(() => {
    if (isLoading || sessionStarted) return;
    const combined = shuffle([...reviewQueue]);
    if (combined.length > 0) {
      setSessionQueue(combined);
    }
  }, [isLoading, reviewQueue, sessionStarted]);

  const startSession = useCallback(() => {
    setSessionStarted(true);
    setCurrentIndex(0);
    setSessionComplete(false);
    resetSession();
    sessionStartTime.current = Date.now();
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime.current) / 1000));
    }, 1000);
    setExerciseType(pickExerciseType(isSpeechRecognitionSupported()));
  }, [resetSession]);

  // Auto-start if there are cards
  useEffect(() => {
    if (!isLoading && sessionQueue.length > 0 && !sessionStarted && !sessionComplete) {
      startSession();
    }
  }, [isLoading, sessionQueue.length, sessionStarted, sessionComplete, startSession]);

  const currentCard = sessionQueue[currentIndex];

  const handleGrade = useCallback(
    async (grade: ReviewGradeValue) => {
      if (!currentCard?.id) return;
      await submitReview(currentCard.id, grade);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= sessionQueue.length) {
        // Session complete — save session record
        setSessionComplete(true);
        setSessionStarted(false);
        if (timerRef.current) clearInterval(timerRef.current);

        const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        if (packId) {
          await db.sessions.add({
            packId,
            date: new Date(),
            duration,
            reviewed: sessionStats.reviewed + 1,
            newCards: 0,
            accuracy: sessionStats.reviewed > 0
              ? (sessionStats.correct + (grade >= ReviewGrade.Hard ? 1 : 0)) / (sessionStats.reviewed + 1)
              : grade >= ReviewGrade.Hard ? 1 : 0,
          });
        }
      } else {
        setCurrentIndex(nextIndex);
        setExerciseType(pickExerciseType(isSpeechRecognitionSupported()));
      }
    },
    [currentCard, currentIndex, sessionQueue.length, submitReview, packId, sessionStats],
  );

  const handleExerciseAnswer = useCallback(
    (_correct: boolean, grade: ReviewGradeValue) => {
      handleGrade(grade);
    },
    [handleGrade],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // All options for multiple choice and fill blank
  const allOptions = useMemo(
    () => (currentCard ? generateOptions(currentCard.back, sessionQueue) : []),
    [currentCard, sessionQueue],
  );

  // No pack selected
  if (!activePack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <GraduationCap className="w-12 h-12 text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-100 mb-2">{t('study.noPack')}</h2>
        <Button onClick={() => navigate('/pack-selector')} className="mt-4">
          {t('pack.selector.title')}
        </Button>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-slate-400">{t('common.loading')}</span>
      </div>
    );
  }

  // No cards available — suggest lessons
  if (sessionQueue.length === 0 && !sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <GraduationCap className="w-12 h-12 text-emerald-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-100 mb-2">{t('study.noReviewCards')}</h2>
        <p className="text-slate-400 mb-6">{t('study.goToLessons')}</p>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/lessons')}>
            <Lightbulb className="w-4 h-4" />
            {t('nav.lessons')}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/')}>
            {t('nav.dashboard')}
          </Button>
        </div>
      </div>
    );
  }

  // Session complete — summary
  if (sessionComplete) {
    const accuracy = sessionStats.reviewed > 0
      ? Math.round(sessionStats.accuracy * 100)
      : 0;

    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
          <Target className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          {t('study.sessionComplete')}
        </h2>
        <p className="text-slate-400 mb-8">{t('study.sessionSummary')}</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <GraduationCap className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <span className="text-2xl font-bold text-slate-100 block">{sessionStats.reviewed}</span>
            <span className="text-xs text-slate-500">{t('study.cardsReviewed')}</span>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <span className="text-2xl font-bold text-slate-100 block">{accuracy}%</span>
            <span className="text-xs text-slate-500">{t('study.correctRate')}</span>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <span className="text-2xl font-bold text-slate-100 block">{formatTime(elapsedSeconds)}</span>
            <span className="text-xs text-slate-500">{t('study.timeSpent')}</span>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/')}>
            {t('nav.dashboard')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSessionComplete(false);
              setSessionQueue([]);
              setCurrentIndex(0);
            }}
          >
            <ChevronRight className="w-4 h-4" />
            {t('study.studyMore')}
          </Button>
        </div>
      </div>
    );
  }

  // Active session
  if (!currentCard) return null;

  const correctIndex = allOptions.indexOf(currentCard.back);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar & stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span>{currentIndex + 1} / {sessionQueue.length}</span>
          <span className="text-slate-700">|</span>
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(elapsedSeconds)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-emerald-400">{sessionStats.correct}</span>
          <span className="text-slate-700">/</span>
          <span className="text-slate-400">{sessionStats.reviewed}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-slate-800 rounded-full mb-8">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex) / sessionQueue.length) * 100}%` }}
        />
      </div>

      {/* Exercise — key forces remount on card change */}
      {exerciseType === 'flashcard' && (
        <FlashCard key={currentIndex} card={currentCard} onGrade={handleGrade} />
      )}
      {exerciseType === 'multiple-choice' && (
        <MultipleChoice
          key={currentIndex}
          question={currentCard.front}
          options={allOptions}
          correctIndex={correctIndex}
          onAnswer={handleExerciseAnswer}
        />
      )}
      {exerciseType === 'write-answer' && (
        <WriteAnswer
          key={currentIndex}
          prompt={currentCard.front}
          expectedAnswer={currentCard.back}
          adapter={activeAdapter}
          onAnswer={handleExerciseAnswer}
        />
      )}
      {exerciseType === 'fill-blank' && (
        <FillBlank
          key={currentIndex}
          sentence={`___ = ${currentCard.front}`}
          options={allOptions}
          correctAnswer={currentCard.back}
          onAnswer={handleExerciseAnswer}
        />
      )}
      {exerciseType === 'dictation' && (
        <Dictation
          key={currentIndex}
          text={currentCard.front}
          expected={currentCard.reading ?? currentCard.front}
          lang={activePack?.speech.ttsLang}
          rate={activePack?.speech.defaultRate ?? 0.8}
          adapter={activeAdapter}
          onAnswer={handleExerciseAnswer}
        />
      )}
      {exerciseType === 'speak' && (
        <SpeakExercise
          key={currentIndex}
          targetText={currentCard.front}
          expectedReading={currentCard.reading}
          lang={activePack?.speech.recognitionLang}
          adapter={activeAdapter}
          onAnswer={handleExerciseAnswer}
        />
      )}
      {exerciseType === 'drag-reorder' && (() => {
        const text = currentCard.back;
        const words = text.split(/\s+/).filter(Boolean);
        if (words.length < 2) {
          // Fallback to flashcard if not enough words
          return <FlashCard key={currentIndex} card={currentCard} onGrade={handleGrade} />;
        }
        const correctOrder = words.map((_, i) => i);
        const shuffled = [...correctOrder].sort(() => Math.random() - 0.5);
        const fragments = shuffled.map((i) => words[i]);
        const newCorrect = correctOrder.map((origIdx) => shuffled.indexOf(origIdx));
        return (
          <DragReorder
            key={currentIndex}
            fragments={fragments}
            correctOrder={newCorrect}
            prompt={currentCard.front}
            onAnswer={handleExerciseAnswer}
          />
        );
      })()}
      {exerciseType === 'matching' && (() => {
        const matchCards = sessionQueue.slice(
          Math.max(0, currentIndex - 2),
          Math.min(sessionQueue.length, currentIndex + 3),
        ).slice(0, 4);
        if (matchCards.length < 2) {
          return <FlashCard key={currentIndex} card={currentCard} onGrade={handleGrade} />;
        }
        const pairs = matchCards.map((c) => ({ left: c.front, right: c.back }));
        return (
          <Matching
            key={currentIndex}
            pairs={pairs}
            onAnswer={handleExerciseAnswer}
          />
        );
      })()}
    </div>
  );
}

export default Study;
