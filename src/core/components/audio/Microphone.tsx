/**
 * Microphone — speech recognition button with recording state.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic } from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech';

interface MicrophoneProps {
  lang?: string;
  onTranscript: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
} as const;

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-9 h-9',
} as const;

export function Microphone({ lang, onTranscript, onError, size = 'md', className = '' }: MicrophoneProps) {
  const { t } = useTranslation();
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    confidence,
    startListening,
    stopListening,
  } = useSpeech(lang);

  // Emit transcript when finalized
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript, confidence);
    }
  }, [transcript, confidence, onTranscript]);

  // Emit errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(lang);
    }
  };

  if (!isSupported) {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <button
          disabled
          className={`rounded-full flex items-center justify-center bg-slate-800 text-slate-600 cursor-not-allowed ${sizeClasses[size]}`}
        >
          <Mic className={iconSizes[size]} />
        </button>
        <span className="text-xs text-slate-500">{t('audio.notSupported')}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        onClick={handleClick}
        className={`rounded-full flex items-center justify-center transition-all ${sizeClasses[size]} ${
          isListening
            ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
        }`}
      >
        <Mic className={iconSizes[size]} />
      </button>

      <span className="text-xs text-slate-400 h-4">
        {isListening
          ? interimTranscript || t('audio.listening')
          : t('audio.tapToSpeak')}
      </span>
    </div>
  );
}
