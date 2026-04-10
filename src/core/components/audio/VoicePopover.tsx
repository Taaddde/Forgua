/**
 * VoicePopover — compact dropdown for quickly switching voice + speed
 * from any audio playback context (flashcards, exercises, lessons).
 *
 * Closes on outside click or Escape. Lets the user preview the selection
 * instantly without navigating to Settings.
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2, X } from 'lucide-react';
import { VoicePicker } from './VoicePicker';
import { useAudio } from '../../hooks/useAudio';

interface VoicePopoverProps {
  lang: string;
  /** Optional trigger size; matches the AudioPlayer sizes. */
  size?: 'sm' | 'md' | 'lg';
  /** Visual emphasis — highlights the gear when the current voice is low-quality. */
  emphasize?: boolean;
}

const triggerSizes = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
} as const;

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
} as const;

export function VoicePopover({ lang, size = 'md', emphasize = false }: VoicePopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    voicesForLang,
    activeVoice,
    setVoiceForLang,
    voiceMap,
    speed,
    setSpeed,
    speak,
  } = useAudio(lang);

  const langVoices = voicesForLang(lang);

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = async (voiceURI: string | null) => {
    await setVoiceForLang(lang, voiceURI);
    // Preview the newly selected voice. Need a tiny delay so the engine
    // picks up the new preference on the next tick.
    setTimeout(() => {
      const sample = t('audio.voicePicker.sample', {
        defaultValue: 'Hello, this is a voice preview.',
      });
      void speak(sample, lang).catch(() => {});
    }, 50);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={t('audio.voicePicker.openTitle')}
        className={`rounded-full flex items-center justify-center transition-colors ${triggerSizes[size]} ${
          emphasize
            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30'
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        <Settings2 className={iconSizes[size]} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-2 z-50 w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t('audio.voicePicker.title')}
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {t('audio.voicePicker.langLabel', { lang })}
          </p>

          <VoicePicker
            lang={lang}
            voices={langVoices}
            selectedVoiceURI={voiceMap[lang]}
            activeVoiceURI={activeVoice?.voiceURI}
            onSelect={handleSelect}
            compact
          />

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span>{t('audio.speed')}</span>
              <span className="text-slate-500 tabular-nums">{speed.toFixed(2)}×</span>
            </label>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={speed}
              onChange={(e) => void setSpeed(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}
