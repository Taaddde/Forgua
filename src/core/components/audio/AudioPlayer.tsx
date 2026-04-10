/**
 * AudioPlayer — reusable TTS/audio-file play button.
 *
 * When rendering TTS (no `src`), shows an optional gear that opens the
 * VoicePopover so the user can switch voice/speed without leaving the flow.
 * If the active voice is heuristically low-quality, the gear is highlighted
 * to nudge the user to upgrade.
 */

import { useTranslation } from 'react-i18next';
import { Volume2, Square } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';
import { VoicePopover } from './VoicePopover';

interface AudioPlayerProps {
  text?: string;
  src?: string;
  lang?: string;
  rate?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Hide the voice settings gear even for TTS playback. Defaults to false. */
  hideVoicePicker?: boolean;
}

const sizeClasses = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
} as const;

const iconSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
} as const;

export function AudioPlayer({
  text,
  src,
  lang,
  rate,
  size = 'md',
  className = '',
  hideVoicePicker = false,
}: AudioPlayerProps) {
  const { t } = useTranslation();
  const { isPlaying, isSupported, speak, playFile, stop, hasLowQualityActive } =
    useAudio(lang, rate);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      stop();
      return;
    }
    if (src) {
      await playFile(src).catch(() => {});
    } else if (text) {
      await speak(text, lang, rate).catch(() => {});
    }
  };

  if (!isSupported) return null;

  // Voice picker only applies to TTS (no pre-recorded src) and when we have a lang.
  const showVoicePicker = !hideVoicePicker && !src && !!lang;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <button
        onClick={handleClick}
        disabled={!isSupported}
        title={isPlaying ? t('audio.stop') : t('audio.play')}
        className={`rounded-full flex items-center justify-center transition-colors ${sizeClasses[size]} ${
          isPlaying
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        {isPlaying ? (
          <Square className={iconSizes[size]} />
        ) : (
          <Volume2 className={iconSizes[size]} />
        )}
      </button>

      {showVoicePicker && (
        <VoicePopover lang={lang} size={size} emphasize={hasLowQualityActive} />
      )}
    </div>
  );
}
