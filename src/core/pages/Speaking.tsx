/**
 * Speaking page — pronunciation practice with speech recognition.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Target } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store/useAppStore';
import { db } from '../db/database';
import { SpeakExercise } from '../components/exercises/SpeakExercise';
import { BrowserSupportBanner } from '../components/audio/BrowserSupportBanner';
import { Button } from '../components/common/Button';
import { isSpeechRecognitionSupported } from '../engine/speech';
import { ReviewGrade } from '../types/models';
import type { Card } from '../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function Speaking() {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const activeAdapter = useAppStore((s) => s.activeAdapter);
  const packId = activePack?.id ?? null;

  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const vocabCards = useLiveQuery(async () => {
    if (!packId) return [];
    return db.cards.where('[packId+category]').equals([packId, 'vocabulary']).toArray();
  }, [packId]);

  const startSession = useCallback(() => {
    if (!vocabCards || vocabCards.length === 0) return;
    setSessionCards(shuffle(vocabCards).slice(0, 10));
    setCurrentIndex(0);
    setScore({ correct: 0, total: 0 });
    setSessionStarted(true);
  }, [vocabCards]);

  const handleAnswer = useCallback((_correct: boolean, _grade: ReviewGradeValue) => {
    setScore((s) => ({
      correct: s.correct + (_correct ? 1 : 0),
      total: s.total + 1,
    }));

    setTimeout(() => {
      if (currentIndex < sessionCards.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setSessionStarted(false);
      }
    }, 2000);
  }, [currentIndex, sessionCards.length]);

  if (!activePack) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        {t('study.noPack')}
      </div>
    );
  }

  if (!isSpeechRecognitionSupported()) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">{t('speaking.title')}</h1>
        <BrowserSupportBanner feature="speech" />
      </div>
    );
  }

  const sttLang = activePack.speech.recognitionLang;
  const currentCard = sessionCards[currentIndex];

  // Session complete
  if (score.total > 0 && !sessionStarted) {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <Target className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-100 mb-2">{t('speaking.sessionComplete')}</h2>
        <p className="text-lg text-slate-300 mb-6">{t('speaking.score', { score: pct })}</p>
        <Button onClick={startSession}>{t('speaking.tryAgain')}</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">{t('speaking.title')}</h1>

      {!sessionStarted && (
        <div className="text-center py-12">
          <Mic className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-6">{t('audio.readAloud')}</p>
          <Button onClick={startSession} disabled={!vocabCards || vocabCards.length === 0}>
            {t('study.startReview')}
          </Button>
        </div>
      )}

      {sessionStarted && currentCard && (
        <div>
          <div className="flex items-center justify-between mb-4 text-sm text-slate-400">
            <span>{currentIndex + 1} / {sessionCards.length}</span>
            <span className="text-emerald-400">{score.correct}/{score.total}</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full mb-6">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / sessionCards.length) * 100}%` }}
            />
          </div>
          <SpeakExercise
            key={currentIndex}
            targetText={currentCard.front}
            expectedReading={currentCard.reading}
            lang={sttLang}
            adapter={activeAdapter}
            onAnswer={handleAnswer}
          />
        </div>
      )}
    </div>
  );
}

export default Speaking;
