/**
 * ReadAloudExercise — read a full passage aloud and get word-level feedback.
 *
 * The user sees a text passage, presses the mic, and reads it aloud.
 * STT runs in continuous mode capturing the full transcript.
 * On finish, each word is compared and colored green (correct) or red (missed).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, RotateCcw, CheckCircle } from 'lucide-react';
import { AudioPlayer } from '../audio/AudioPlayer';
import { useSpeech } from '../../hooks/useSpeech';
import { isSpeechRecognitionSupported } from '../../engine/speech';
import { BrowserSupportBanner } from '../audio/BrowserSupportBanner';
import { Button } from '../common/Button';

interface ReadAloudExerciseProps {
  text: string;
  title: string;
  lang: string;
  rate?: number;
}

/** Normalize a word for comparison: lowercase, strip punctuation */
function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

const IS_DIGITS = /^\d+$/;

/**
 * Language-agnostic word match.
 * STT in any language may convert spoken numbers to digits (e.g., "veinticinco" → "25",
 * "twenty-five" → "25", "二十五" → "25"). Rather than mapping number words per language,
 * we simply don't penalize when either side is purely digits — it's an STT artifact.
 */
function wordsMatch(expected: string, spoken: string): boolean {
  if (expected === spoken) return true;
  // If either side is digits, treat as match — STT digit conversion is not a user error
  if (IS_DIGITS.test(spoken) || IS_DIGITS.test(expected)) return true;
  return false;
}

/** Compare spoken words against expected words, returning per-word match status */
function compareWords(expected: string, spoken: string): { word: string; matched: boolean }[] {
  // Keep hyphenated words as single tokens ("twenty-five" stays as one unit)
  // so STT digit output ("25") can match the whole compound in one step.
  const expectedWords = expected.split(/\s+/).filter(Boolean);
  const spokenNormalized = spoken.split(/\s+/).filter(Boolean).map(normalizeWord);

  let spokenIdx = 0;
  return expectedWords.map((word) => {
    const norm = normalizeWord(word);
    if (!norm) return { word, matched: true }; // punctuation-only tokens

    // Greedy forward match: look ahead a few positions for tolerance
    const lookAhead = Math.min(spokenIdx + 4, spokenNormalized.length);
    for (let i = spokenIdx; i < lookAhead; i++) {
      if (wordsMatch(norm, spokenNormalized[i])) {
        spokenIdx = i + 1;
        return { word, matched: true };
      }
    }

    // Not found within look-ahead window
    return { word, matched: false };
  });
}

export function ReadAloudExercise({ text, title, lang, rate = 0.85 }: ReadAloudExerciseProps) {
  const { t } = useTranslation();
  const {
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeech(lang, true);

  const [phase, setPhase] = useState<'ready' | 'recording' | 'done'>('ready');
  const [wordResults, setWordResults] = useState<{ word: string; matched: boolean }[]>([]);
  const [fullTranscript, setFullTranscript] = useState('');
  const fullTranscriptRef = useRef('');

  // Accumulate transcript chunks (continuous mode sends multiple final results)
  useEffect(() => {
    if (transcript) {
      const updated = (fullTranscriptRef.current + ' ' + transcript).trim();
      fullTranscriptRef.current = updated;
      setFullTranscript(updated);
    }
  }, [transcript]);

  const handleStart = useCallback(() => {
    fullTranscriptRef.current = '';
    setFullTranscript('');
    resetTranscript();
    setWordResults([]);
    setPhase('recording');
    startListening(lang);
  }, [lang, resetTranscript, startListening]);

  const handleStop = useCallback(() => {
    stopListening();
    // Small delay to let the last transcript finalize
    setTimeout(() => {
      const results = compareWords(text, fullTranscriptRef.current);
      setWordResults(results);
      setPhase('done');
    }, 500);
  }, [stopListening, text]);

  const handleRetry = useCallback(() => {
    fullTranscriptRef.current = '';
    setFullTranscript('');
    resetTranscript();
    setWordResults([]);
    setPhase('ready');
  }, [resetTranscript]);

  if (!isSupported || !isSpeechRecognitionSupported()) {
    return <BrowserSupportBanner feature="speech" />;
  }

  const matchedCount = wordResults.filter((w) => w.matched).length;
  const totalWords = wordResults.length;
  const accuracy = totalWords > 0 ? Math.round((matchedCount / totalWords) * 100) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Title + listen */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        <AudioPlayer text={text} lang={lang} rate={rate} size="sm" />
      </div>

      {/* Text body with word highlighting */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 leading-relaxed text-lg">
        {phase === 'done' ? (
          <p className="whitespace-pre-wrap">
            {wordResults.map((wr, i) => (
              <span
                key={i}
                className={wr.matched ? 'text-emerald-400' : 'text-red-400 underline decoration-red-500/50'}
              >
                {wr.word}{' '}
              </span>
            ))}
          </p>
        ) : (
          <p className="text-slate-300 whitespace-pre-wrap">{text}</p>
        )}
      </div>

      {/* Live transcript while recording */}
      {phase === 'recording' && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 mb-4 min-h-[3rem]">
          <p className="text-sm text-slate-500 mb-1">{t('speaking.youSaid')}</p>
          <p className="text-slate-300 text-sm">
            {fullTranscript}
            {interimTranscript && (
              <span className="text-slate-500 italic"> {interimTranscript}</span>
            )}
            {!fullTranscript && !interimTranscript && (
              <span className="text-slate-600 italic">{t('audio.listening')}...</span>
            )}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        {phase === 'ready' && (
          <>
            <button
              onClick={handleStart}
              className="w-20 h-20 rounded-full flex items-center justify-center bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Mic className="w-8 h-8" />
            </button>
            <span className="text-sm text-slate-400">{t('speaking.tapToRead')}</span>
          </>
        )}

        {phase === 'recording' && (
          <>
            <button
              onClick={handleStop}
              className="w-20 h-20 rounded-full flex items-center justify-center bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30 cursor-pointer"
            >
              <MicOff className="w-8 h-8" />
            </button>
            <span className="text-sm text-red-400">{t('speaking.tapToStop')}</span>
          </>
        )}

        {phase === 'done' && (
          <div className="text-center space-y-4">
            {/* Score */}
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className={`w-8 h-8 ${accuracy >= 70 ? 'text-emerald-400' : accuracy >= 40 ? 'text-amber-400' : 'text-red-400'}`} />
              <div>
                <p className="text-2xl font-bold text-slate-100">{accuracy}%</p>
                <p className="text-sm text-slate-400">
                  {matchedCount}/{totalWords} {t('speaking.wordsCorrect')}
                </p>
              </div>
            </div>

            {/* Spoken text */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-left">
              <p className="text-xs text-slate-500 mb-1">{t('speaking.youSaid')}</p>
              <p className="text-sm text-slate-300">{fullTranscriptRef.current || '(nada detectado)'}</p>
            </div>

            <Button onClick={handleRetry} variant="secondary">
              <RotateCcw className="w-4 h-4" />
              {t('speaking.tryAgain')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
