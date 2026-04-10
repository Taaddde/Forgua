/**
 * Audio playback hook — wraps TTS and audio file playback.
 *
 * Reads user-configured voice preferences + playback rate from Dexie so
 * components don't need to thread them manually. The active voice per language
 * is resolved using the quality heuristic in tts.ts; users can override it
 * globally from Settings or locally via the VoicePopover.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  speak as ttsSpeak,
  stopSpeaking,
  isTTSSupported,
  getVoicesForLang,
  getAllVoices,
  pickBestVoice,
  isLikelyLowQualityVoice,
  waitForVoices,
} from '../engine/tts';
import { useAudioPreferences } from './useAudioPreferences';

export function useAudio(defaultLang?: string, defaultRate?: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prefs = useAudioPreferences();

  // Effective rate: explicit prop overrides the global preference.
  const effectiveRate = defaultRate ?? prefs.speed;

  // Subscribe to voiceschanged so the voice list stays in sync.
  useEffect(() => {
    if (!isTTSSupported()) return;
    let cancelled = false;
    const update = () => {
      if (!cancelled) setVoices(getAllVoices());
    };
    // Initial fetch — voices may load asynchronously in Chrome.
    void waitForVoices().then(update);
    speechSynthesis.addEventListener('voiceschanged', update);
    return () => {
      cancelled = true;
      speechSynthesis.removeEventListener('voiceschanged', update);
    };
  }, []);

  const voicesForLang = useCallback(
    (lang: string) => voices.filter((v) => {
      const primary = lang.split('-')[0];
      return v.lang === lang || v.lang.startsWith(primary);
    }),
    [voices],
  );

  /** The voice that would actually be used right now for the given language. */
  const getActiveVoice = useCallback(
    (lang: string): SpeechSynthesisVoice | null => {
      return pickBestVoice(lang, prefs.voiceMap[lang]);
    },
    [prefs.voiceMap],
  );

  const activeVoice = useMemo(
    () => (defaultLang ? getActiveVoice(defaultLang) : null),
    [defaultLang, getActiveVoice],
  );

  /** True if the active voice is known to sound low-quality AND the user hasn't manually picked it. */
  const hasLowQualityActive = useMemo(() => {
    if (!defaultLang || !activeVoice) return false;
    const userPicked = !!prefs.voiceMap[defaultLang];
    if (userPicked) return false;
    return isLikelyLowQualityVoice(activeVoice);
  }, [defaultLang, activeVoice, prefs.voiceMap]);

  /** True if no voice exists for the requested language at all. */
  const hasNoVoiceForLang = useMemo(() => {
    if (!defaultLang) return false;
    return getVoicesForLang(defaultLang).length === 0 && voices.length > 0;
  }, [defaultLang, voices]);

  const speak = useCallback(
    async (text: string, lang?: string, rate?: number) => {
      setIsPlaying(true);
      try {
        const targetLang = lang ?? defaultLang ?? 'en-US';
        await ttsSpeak(text, {
          lang: targetLang,
          rate: rate ?? effectiveRate,
          voiceURI: prefs.voiceMap[targetLang],
        });
      } finally {
        setIsPlaying(false);
      }
    },
    [defaultLang, effectiveRate, prefs.voiceMap],
  );

  const playFile = useCallback(
    async (src: string) => {
      setIsPlaying(true);
      try {
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(src);
        audio.playbackRate = effectiveRate;
        audioRef.current = audio;
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error('Audio playback failed'));
          audio.play();
        });
      } finally {
        setIsPlaying(false);
      }
    },
    [effectiveRate],
  );

  const stop = useCallback(() => {
    stopSpeaking();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  return {
    isPlaying,
    isSupported: isTTSSupported(),
    voicesAvailable: voices.length > 0,
    speak,
    playFile,
    stop,
    speed: effectiveRate,
    setSpeed: prefs.setSpeed,

    // Voice selection surface
    voices,
    voicesForLang,
    activeVoice,
    getActiveVoice,
    setVoiceForLang: prefs.setVoiceForLang,
    voiceMap: prefs.voiceMap,

    // Quality signals
    hasLowQualityActive,
    hasNoVoiceForLang,
  };
}
