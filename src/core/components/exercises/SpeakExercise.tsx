/**
 * SpeakExercise — read text aloud, compare with STT result.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Microphone } from '../audio/Microphone';
import { AudioPlayer } from '../audio/AudioPlayer';
import { scoreWriteAnswer } from '../../engine/scoring';
import { ReviewGrade } from '../../types/models';
import type { AbstractAdapter } from '../../types/adapter';
import { isSpeechRecognitionSupported } from '../../engine/speech';
import { BrowserSupportBanner } from '../audio/BrowserSupportBanner';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

interface SpeakExerciseProps {
  targetText: string;
  expectedReading?: string;
  lang: string;
  adapter: AbstractAdapter | null;
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

export function SpeakExercise({ targetText, expectedReading, lang, adapter, onAnswer }: SpeakExerciseProps) {
  const { t } = useTranslation();
  const [result, setResult] = useState<{
    transcript: string;
    correct: boolean;
    similarity: number;
    grade: ReviewGradeValue;
  } | null>(null);
  const [answered, setAnswered] = useState(false);

  const expected = expectedReading ?? targetText;

  const handleTranscript = useCallback((transcript: string, confidence: number) => {
    if (answered) return;

    const textResult = scoreWriteAnswer(transcript, expected, adapter);
    const combinedSimilarity = (textResult.similarity ?? 0) * 0.7 + confidence * 0.3;

    let grade: ReviewGradeValue;
    if (combinedSimilarity >= 0.9) grade = ReviewGrade.Easy;
    else if (combinedSimilarity >= 0.75) grade = ReviewGrade.Good;
    else if (combinedSimilarity >= 0.5) grade = ReviewGrade.Hard;
    else grade = ReviewGrade.Again;

    setResult({
      transcript,
      correct: combinedSimilarity >= 0.5,
      similarity: combinedSimilarity,
      grade,
    });
    setAnswered(true);

    setTimeout(() => onAnswer(combinedSimilarity >= 0.5, grade), 2000);
  }, [expected, adapter, answered, onAnswer]);

  if (!isSpeechRecognitionSupported()) {
    return <BrowserSupportBanner feature="speech" />;
  }

  const similarityPct = result ? Math.round(result.similarity * 100) : 0;
  const similarityColor = similarityPct >= 80
    ? 'text-emerald-400'
    : similarityPct >= 50
      ? 'text-amber-400'
      : 'text-red-400';

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
          {t('audio.readAloud')}
        </span>
      </div>

      {/* Target text */}
      <div className="text-center mb-8">
        <span className="text-4xl font-bold text-slate-100">{targetText}</span>
        {expectedReading && (
          <p className="text-lg text-slate-400 mt-2">{expectedReading}</p>
        )}
        <div className="mt-3">
          <AudioPlayer text={targetText} lang={lang} size="sm" />
        </div>
      </div>

      {/* Microphone */}
      {!answered && (
        <Microphone lang={lang} onTranscript={handleTranscript} size="lg" className="mb-6" />
      )}

      {/* Result */}
      {result && (
        <div className={`p-4 rounded-xl border ${
          result.correct ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-red-600/10 border-red-500/30'
        }`}>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{t('audio.yourSpeech')}</span>
              <span className="text-slate-200">{result.transcript}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{t('audio.expected')}</span>
              <span className="text-slate-200">{expected}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{t('audio.similarity')}</span>
              <span className={`font-bold ${similarityColor}`}>{similarityPct}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
