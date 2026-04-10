/**
 * VoicePicker — shared UI for selecting a TTS voice for a given language.
 *
 * Used by:
 *  - Settings page (full section)
 *  - VoicePopover (compact, inline next to audio buttons)
 *
 * Shows all available voices ranked by quality, with visual markers for
 * premium/enhanced/compact/remote voices. If the active voice is low-quality,
 * surfaces a help block explaining how to install better ones per OS.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Wifi, AlertTriangle, RotateCcw } from 'lucide-react';
import {
  isLikelyLowQualityVoice,
  voiceQualityScore,
} from '../../engine/tts';
import { getOS } from '../../utils/platform';

interface VoicePickerProps {
  lang: string;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI?: string;
  activeVoiceURI?: string;
  onSelect: (voiceURI: string | null) => void;
  compact?: boolean;
}

function voiceLabel(v: SpeechSynthesisVoice): string {
  // Strip vendor noise from the display name but keep tier info.
  return v.name.replace(/^Microsoft\s+/, '').replace(/\s*-\s*.*$/, '').trim() || v.name;
}

function voiceTier(v: SpeechSynthesisVoice): 'premium' | 'enhanced' | 'neural' | 'compact' | 'standard' {
  const id = `${v.name} ${v.voiceURI}`.toLowerCase();
  if (id.includes('premium')) return 'premium';
  if (id.includes('neural') || id.includes('natural')) return 'neural';
  if (id.includes('enhanced')) return 'enhanced';
  if (id.includes('compact') || id.includes('espeak')) return 'compact';
  return 'standard';
}

const tierStyles: Record<ReturnType<typeof voiceTier>, string> = {
  premium: 'text-amber-600 dark:text-amber-400',
  neural: 'text-emerald-600 dark:text-emerald-400',
  enhanced: 'text-sky-600 dark:text-sky-400',
  standard: 'text-slate-500 dark:text-slate-400',
  compact: 'text-rose-600 dark:text-rose-400',
};

export function VoicePicker({
  lang,
  voices,
  selectedVoiceURI,
  activeVoiceURI,
  onSelect,
  compact = false,
}: VoicePickerProps) {
  const { t } = useTranslation();

  const ranked = useMemo(() => {
    return [...voices].sort(
      (a, b) => voiceQualityScore(b, lang) - voiceQualityScore(a, lang),
    );
  }, [voices, lang]);

  const activeVoice = useMemo(
    () => voices.find((v) => v.voiceURI === activeVoiceURI) ?? null,
    [voices, activeVoiceURI],
  );

  const showLowQualityHelp = !!activeVoice && isLikelyLowQualityVoice(activeVoice);
  const noBetterAvailable =
    showLowQualityHelp && !ranked.some((v) => !isLikelyLowQualityVoice(v));

  if (voices.length === 0) {
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        {t('audio.noVoices')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={compact ? 'max-h-64 overflow-y-auto space-y-1 pr-1' : 'space-y-1.5'}>
        {ranked.map((v) => {
          const tier = voiceTier(v);
          const isSelected = v.voiceURI === selectedVoiceURI;
          const isActive = v.voiceURI === activeVoiceURI;
          return (
            <button
              key={v.voiceURI}
              onClick={() => onSelect(v.voiceURI)}
              className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                isSelected
                  ? 'bg-indigo-600/10 border-indigo-500/60 dark:bg-indigo-500/15 dark:border-indigo-500/60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {voiceLabel(v)}
                  </span>
                  {tier === 'premium' && (
                    <Sparkles className={`w-3.5 h-3.5 shrink-0 ${tierStyles.premium}`} />
                  )}
                  {tier === 'neural' && (
                    <Sparkles className={`w-3.5 h-3.5 shrink-0 ${tierStyles.neural}`} />
                  )}
                  {!v.localService && (
                    <Wifi className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-label={t('audio.voicePicker.remote')} />
                  )}
                </div>
                {isActive && !isSelected && (
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0">
                    {t('audio.voicePicker.auto')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs ${tierStyles[tier]}`}>
                  {t(`audio.voicePicker.tier.${tier}`)}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">· {v.lang}</span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedVoiceURI && (
        <button
          onClick={() => onSelect(null)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          {t('audio.voicePicker.useAuto')}
        </button>
      )}

      {showLowQualityHelp && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 dark:text-amber-200 space-y-1">
            <p className="font-medium">
              {noBetterAvailable
                ? t('audio.voicePicker.lowQualityNoAlt')
                : t('audio.voicePicker.lowQualityHasAlt')}
            </p>
            {noBetterAvailable && <LowQualityHelp />}
          </div>
        </div>
      )}
    </div>
  );
}

function LowQualityHelp() {
  const { t } = useTranslation();
  const os = getOS();

  const instructionsKey = `audio.voicePicker.install.${os}` as const;
  return (
    <p className="text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-200/90">
      {t(instructionsKey, { defaultValue: t('audio.voicePicker.install.unknown') })}
    </p>
  );
}
