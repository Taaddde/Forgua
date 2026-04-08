/**
 * Reading page — graded texts with furigana, click-to-define, and comprehension questions.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BookText, ArrowLeft, Eye, EyeOff, Languages, Loader2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store/useAppStore';
import { db } from '../db/database';
import { Button } from '../components/common/Button';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { loadReadings } from '../packs';
import type { ReadingText, ReadingQuestion } from '../types/pack-spec';
import type { Token } from '../types/adapter';

export function Reading() {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const adapter = useAppStore((s) => s.activeAdapter);
  const packId = activePack?.id ?? null;

  const [readings, setReadings] = useState<ReadingText[]>([]);
  const [loadedForPack, setLoadedForPack] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<ReadingText | null>(null);
  const [showFurigana, setShowFurigana] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [annotatedHtml, setAnnotatedHtml] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Map<number, number>>(new Map());
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const loadingReadings = packId !== null && packId !== loadedForPack;

  // Dynamic reading loading
  useEffect(() => {
    if (!packId) return;
    let cancelled = false;
    loadReadings(packId)
      .then((result) => {
        if (!cancelled) {
          setReadings(result);
          setLoadedForPack(packId);
          setSelectedText(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('Failed to load readings:', err);
          setReadings([]);
          setLoadedForPack(packId);
        }
      });
    return () => { cancelled = true; };
  }, [packId]);

  // Annotate text when selected
  useEffect(() => {
    if (!selectedText || !adapter || !adapter.isReady()) return;
    let cancelled = false;
    adapter.annotate(selectedText.text).then((result) => {
      if (!cancelled) setAnnotatedHtml(result.html);
    }).catch(() => {
      if (!cancelled) setAnnotatedHtml(selectedText.text);
    });
    return () => { cancelled = true; setAnnotatedHtml(''); };
  }, [selectedText, adapter]);

  // Look up a token's definition in the pack cards
  const tokenCard = useLiveQuery(async () => {
    if (!selectedToken || !packId) return null;
    const surface = selectedToken.baseForm ?? selectedToken.surface;
    const cards = await db.cards.where('packId').equals(packId).toArray();
    return cards.find((c) =>
      c.front === surface ||
      c.front === selectedToken.surface ||
      c.reading === selectedToken.reading
    ) ?? null;
  }, [selectedToken, packId]);

  // TODO: Fase 3 — implement token click handler (tokenize text, show annotation popup)
  // const handleTokenClick = useCallback(async () => { ... }, [adapter, selectedText]);

  const handleQuizAnswer = (questionIdx: number, optionIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = new Map(quizAnswers);
    newAnswers.set(questionIdx, optionIdx);
    setQuizAnswers(newAnswers);
  };

  if (!activePack) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        {t('study.noPack')}
      </div>
    );
  }

  if (loadingReadings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  // Text list view
  if (!selectedText) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('reading.title')}</h1>
        <p className="text-slate-400 text-sm mb-6">{t('reading.selectText')}</p>

        <div className="space-y-3">
          {readings.map((text) => (
            <button
              key={text.id}
              onClick={() => {
                setSelectedText(text);
                setQuizAnswers(new Map());
                setQuizSubmitted(false);
                setSelectedToken(null);
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-left hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <BookText className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{text.title}</h3>
                <span className="text-xs px-1.5 py-0.5 bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 rounded">{text.level.toUpperCase()}</span>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">{text.text.slice(0, 100)}...</p>
            </button>
          ))}
        </div>

        {readings.length === 0 && (
          <p className="text-slate-500 text-center py-12">{t('learn.noContent')}</p>
        )}
      </div>
    );
  }

  // Text reader view
  const questions = selectedText.questions ?? [];
  const correctCount = quizSubmitted
    ? questions.filter((q, i) => quizAnswers.get(i) === q.correctIndex).length
    : 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setSelectedText(null)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('reading.backToList')}
        </button>
        <div className="flex gap-2">
          {activePack?.features.furigana && (
            <button
              onClick={() => setShowFurigana(!showFurigana)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showFurigana ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              {t('reading.showFurigana')}
            </button>
          )}
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showTranslation ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            {showTranslation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {t('reading.showTranslation')}
          </button>
        </div>
      </div>

      {/* Title + listen button */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedText.title}</h2>
        {activePack?.speech.ttsLang && (
          <AudioPlayer text={selectedText.text} lang={activePack.speech.ttsLang} rate={activePack.speech.defaultRate ?? 0.8} size="sm" />
        )}
      </div>

      {/* Text body */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-6">
        {showFurigana && annotatedHtml ? (
          <div
            className="text-lg text-slate-900 dark:text-slate-100 leading-loose reading-text"
            dangerouslySetInnerHTML={{ __html: annotatedHtml }}
          />
        ) : (
          <p className="text-lg text-slate-900 dark:text-slate-100 leading-loose">{selectedText.text}</p>
        )}

        {showTranslation && selectedText.translation && (
          <p className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-400 leading-relaxed">
            {selectedText.translation}
          </p>
        )}
      </div>

      {/* Token info tooltip */}
      {selectedToken && tokenCard && (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{tokenCard.front}</span>
              {tokenCard.reading && <span className="text-sm text-slate-500 ml-2">{tokenCard.reading}</span>}
            </div>
            <button onClick={() => setSelectedToken(null)}>
              <span className="text-xs text-slate-500">✕</span>
            </button>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{tokenCard.back}</p>
        </div>
      )}

      {/* Comprehension questions */}
      {questions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            {t('reading.comprehension')}
          </h3>
          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <QuestionCard
                key={qIdx}
                question={q}
                index={qIdx}
                selectedAnswer={quizAnswers.get(qIdx)}
                submitted={quizSubmitted}
                onSelect={(optIdx) => handleQuizAnswer(qIdx, optIdx)}
              />
            ))}
          </div>

          {!quizSubmitted && quizAnswers.size === questions.length && (
            <Button className="mt-4" onClick={() => setQuizSubmitted(true)}>
              {t('exercise.check')}
            </Button>
          )}

          {quizSubmitted && (
            <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('reading.score', { correct: correctCount, total: questions.length })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  question, index, selectedAnswer, submitted, onSelect,
}: {
  question: ReadingQuestion;
  index: number;
  selectedAnswer: number | undefined;
  submitted: boolean;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">{index + 1}. {question.question}</p>
      <div className="space-y-2">
        {question.options.map((opt, oIdx) => {
          let style = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer';
          if (submitted) {
            if (oIdx === question.correctIndex) {
              style = 'bg-emerald-600/15 border-emerald-500/40 text-emerald-300';
            } else if (oIdx === selectedAnswer && oIdx !== question.correctIndex) {
              style = 'bg-red-600/15 border-red-500/40 text-red-300';
            } else {
              style = 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600';
            }
          } else if (oIdx === selectedAnswer) {
            style = 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300';
          }

          return (
            <button
              key={oIdx}
              onClick={() => onSelect(oIdx)}
              disabled={submitted}
              className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {submitted && question.explanation && (
        <p className="text-xs text-slate-500 mt-2">{question.explanation}</p>
      )}
    </div>
  );
}

export default Reading;
