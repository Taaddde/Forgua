/**
 * Listening page — dictation exercises and free listening mode.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Target } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store/useAppStore';
import { db } from '../db/database';
import { Dictation } from '../components/exercises/Dictation';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { BrowserSupportBanner } from '../components/audio/BrowserSupportBanner';
import { Button } from '../components/common/Button';
import { isTTSSupported } from '../engine/tts';
import { ReviewGrade } from '../types/models';
import type { Card } from '../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];
type ListeningMode = 'dictation' | 'free-listen';

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function Listening() {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const activeAdapter = useAppStore((s) => s.activeAdapter);
  const packId = activePack?.id ?? null;

  const [mode, setMode] = useState<ListeningMode>('dictation');
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
    }, 1500);
  }, [currentIndex, sessionCards.length]);

  if (!activePack) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        {t('study.noPack')}
      </div>
    );
  }

  if (!isTTSSupported()) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">{t('listening.title')}</h1>
        <BrowserSupportBanner feature="tts" />
      </div>
    );
  }

  const ttsLang = activePack.speech.ttsLang;
  const ttsRate = activePack.speech.defaultRate;
  const currentCard = sessionCards[currentIndex];

  // Session complete
  if (score.total > 0 && !sessionStarted) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <Target className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-100 mb-2">{t('listening.sessionComplete')}</h2>
        <p className="text-lg text-slate-300 mb-6">
          {t('listening.score', { correct: score.correct, total: score.total })}
        </p>
        <Button onClick={startSession}>{t('study.studyMore')}</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">{t('listening.title')}</h1>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode('dictation'); setSessionStarted(false); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'dictation' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          {t('listening.dictation')}
        </button>
        <button
          onClick={() => { setMode('free-listen'); setSessionStarted(false); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'free-listen' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          {t('listening.freeListen')}
        </button>
      </div>

      {/* Dictation mode */}
      {mode === 'dictation' && !sessionStarted && (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-6">{t('audio.listenAndType')}</p>
          <Button onClick={startSession} disabled={!vocabCards || vocabCards.length === 0}>
            {t('study.startReview')}
          </Button>
        </div>
      )}

      {mode === 'dictation' && sessionStarted && currentCard && (
        <div>
          <div className="flex items-center justify-between mb-4 text-sm text-slate-400">
            <span>{currentIndex + 1} / {sessionCards.length}</span>
            <span className="text-emerald-400">{score.correct}/{score.total}</span>
          </div>
          <Dictation
            key={currentIndex}
            text={currentCard.front}
            expected={currentCard.front}
            lang={ttsLang}
            rate={ttsRate}
            adapter={activeAdapter}
            onAnswer={handleAnswer}
          />
        </div>
      )}

      {/* Free listen mode */}
      {mode === 'free-listen' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(vocabCards ?? []).slice(0, 60).map((card) => (
            <div key={card.id} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
              <AudioPlayer text={card.front} lang={ttsLang} rate={ttsRate} size="sm" />
              <div className="min-w-0">
                <span className="text-sm font-medium text-slate-100">{card.front}</span>
                {card.reading && <span className="text-xs text-slate-500 ml-2">{card.reading}</span>}
                <p className="text-xs text-slate-400 truncate">{card.back}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Listening;
