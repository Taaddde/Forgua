/**
 * Speaking page — pronunciation practice with speech recognition.
 *
 * Two modes:
 * - "words": say individual vocabulary words (existing behavior)
 * - "read-aloud": read a full passage from the pack's readings
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Target, BookOpen, ArrowLeft } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store/useAppStore';
import { db } from '../db/database';
import { SpeakExercise } from '../components/exercises/SpeakExercise';
import { ReadAloudExercise } from '../components/exercises/ReadAloudExercise';
import { BrowserSupportBanner } from '../components/audio/BrowserSupportBanner';
import { Button } from '../components/common/Button';
import { isSpeechRecognitionSupported } from '../engine/speech';
import { loadReadings } from '../packs';
import { ReviewGrade } from '../types/models';
import type { Card } from '../types/models';
import type { ReadingText } from '../types/pack-spec';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];
type SpeakingMode = 'words' | 'read-aloud';

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

  const [mode, setMode] = useState<SpeakingMode>('words');

  // --- Words mode state ---
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

  // --- Read-aloud mode state ---
  const [readings, setReadings] = useState<ReadingText[]>([]);
  const [selectedReading, setSelectedReading] = useState<ReadingText | null>(null);

  useEffect(() => {
    if (!packId) return;
    let cancelled = false;
    loadReadings(packId).then((result) => {
      if (!cancelled) setReadings(result);
    });
    return () => { cancelled = true; };
  }, [packId]);

  // --- Guards ---
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">{t('speaking.title')}</h1>
        <BrowserSupportBanner feature="speech" />
      </div>
    );
  }

  const sttLang = activePack.speech.recognitionLang;
  const ttsRate = activePack.speech.defaultRate;
  const currentCard = sessionCards[currentIndex];

  // --- Words mode: session complete ---
  if (mode === 'words' && score.total > 0 && !sessionStarted) {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <Target className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('speaking.sessionComplete')}</h2>
        <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">{t('speaking.score', { score: pct })}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={startSession}>{t('speaking.tryAgain')}</Button>
          <Button variant="secondary" onClick={() => { setScore({ correct: 0, total: 0 }); setMode('read-aloud'); }}>
            <BookOpen className="w-4 h-4" />
            {t('speaking.readAloud')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">{t('speaking.title')}</h1>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode('words'); setSessionStarted(false); setSelectedReading(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'words' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Mic className="w-4 h-4 inline mr-1.5" />
          {t('speaking.words')}
        </button>
        <button
          onClick={() => { setMode('read-aloud'); setSessionStarted(false); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'read-aloud' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-1.5" />
          {t('speaking.readAloud')}
        </button>
      </div>

      {/* ===== WORDS MODE ===== */}
      {mode === 'words' && !sessionStarted && (
        <div className="text-center py-12">
          <Mic className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-6">{t('audio.readAloud')}</p>
          <Button onClick={startSession} disabled={!vocabCards || vocabCards.length === 0}>
            {t('study.startReview')}
          </Button>
        </div>
      )}

      {mode === 'words' && sessionStarted && currentCard && (
        <div>
          <div className="flex items-center justify-between mb-4 text-sm text-slate-400">
            <span>{currentIndex + 1} / {sessionCards.length}</span>
            <span className="text-emerald-400">{score.correct}/{score.total}</span>
          </div>
          <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mb-6">
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

      {/* ===== READ-ALOUD MODE ===== */}
      {mode === 'read-aloud' && !selectedReading && (
        <div>
          <p className="text-slate-400 mb-4">{t('speaking.chooseText')}</p>
          {readings.length === 0 ? (
            <p className="text-slate-500 text-center py-8">{t('speaking.noReadings')}</p>
          ) : (
            <div className="space-y-2">
              {readings.map((reading) => (
                <button
                  key={reading.id}
                  onClick={() => setSelectedReading(reading)}
                  className="w-full text-left bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">{reading.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 uppercase">
                      {reading.level}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 ml-7">
                    {reading.text.slice(0, 120)}...
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'read-aloud' && selectedReading && (
        <div>
          <button
            onClick={() => setSelectedReading(null)}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('speaking.backToList')}
          </button>
          <ReadAloudExercise
            key={selectedReading.id}
            text={selectedReading.text}
            title={selectedReading.title}
            lang={sttLang}
            rate={ttsRate}
          />
        </div>
      )}
    </div>
  );
}

export default Speaking;
