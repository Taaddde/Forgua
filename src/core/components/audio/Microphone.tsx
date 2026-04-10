/**
 * Microphone — speech recognition button with recording state.
 *
 * Surfaces the currently active input device label inline so the user knows
 * which mic the browser is using. On error, also shows the active device to
 * make "wait, this isn't the mic I plugged in" instantly diagnosable, plus
 * a small picker trigger to switch devices / open OS sound settings.
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Settings, ChevronDown, X } from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech';
import { useMicDevices } from '../../hooks/useMicDevices';
import { isTauri, openMicrophoneSettings } from '../../utils/platform';
import { MicDevicePicker } from './MicDevicePicker';

interface MicrophoneProps {
  lang?: string;
  onTranscript: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Hides the active-device indicator under the button. Default: false. */
  hideDeviceIndicator?: boolean;
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

const isMicError = (error: string) =>
  error === 'mic-denied' || error === 'mic-unavailable' || error === 'not-allowed';

export function Microphone({
  lang,
  onTranscript,
  onError,
  size = 'md',
  className = '',
  hideDeviceIndicator = false,
}: MicrophoneProps) {
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

  const { active, labelsGranted, probe } = useMicDevices();
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

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

  // Probe the active input after each successful listening session so the
  // surfaced label stays fresh (e.g. user plugs in a new mic mid-session).
  useEffect(() => {
    if (labelsGranted && !isListening) {
      void probe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, labelsGranted]);

  // Close picker on outside click / escape
  useEffect(() => {
    if (!pickerOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPickerOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [pickerOpen]);

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
          className={`rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed ${sizeClasses[size]}`}
        >
          <Mic className={iconSizes[size]} />
        </button>
        <span className="text-xs text-slate-500">{t('audio.notSupported')}</span>
      </div>
    );
  }

  const activeLabel = active.label;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        onClick={handleClick}
        className={`rounded-full flex items-center justify-center transition-all ${sizeClasses[size]} ${
          isListening
            ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30'
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Mic className={iconSizes[size]} />
      </button>

      {error ? (
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs text-red-400 text-center max-w-56">
            {t(`audio.errors.${error}`, { defaultValue: error })}
          </span>
          {activeLabel && (
            <span className="text-[10px] text-slate-500 dark:text-slate-500 text-center max-w-56">
              {t('audio.micPicker.currentInputShort', { name: activeLabel })}
            </span>
          )}
          <div className="flex items-center gap-2">
            {isTauri() && isMicError(error) && (
              <button
                onClick={() => openMicrophoneSettings()}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Settings className="w-3 h-3" />
                {t('audio.openSettings')}
              </button>
            )}
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ChevronDown className="w-3 h-3" />
              {t('audio.micPicker.changeInput')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className="text-xs text-slate-400 h-4">
            {isListening
              ? interimTranscript || t('audio.listening')
              : t('audio.tapToSpeak')}
          </span>
          {!hideDeviceIndicator && activeLabel && (
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors max-w-56"
              title={t('audio.micPicker.clickToChange')}
            >
              <Mic className="w-3 h-3 shrink-0" />
              <span className="truncate">{activeLabel}</span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </button>
          )}
          {!hideDeviceIndicator && !activeLabel && !isListening && (
            <button
              onClick={() => setPickerOpen(true)}
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              {t('audio.micPicker.checkDevice')}
            </button>
          )}
        </>
      )}

      {pickerOpen && (
        <div
          ref={pickerRef}
          className="relative z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t('audio.micPicker.title')}
            </h3>
            <button
              onClick={() => setPickerOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <MicDevicePicker compact />
        </div>
      )}
    </div>
  );
}
