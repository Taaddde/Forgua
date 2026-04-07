/**
 * Audio playback hook — wraps TTS and audio file playback.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { speak as ttsSpeak, stopSpeaking, isTTSSupported } from '../engine/tts';

export function useAudio(defaultLang?: string, defaultRate?: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(defaultRate ?? 1.0);
  const [voicesAvailable, setVoicesAvailable] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isTTSSupported()) return;
    const checkVoices = () => setVoicesAvailable(speechSynthesis.getVoices().length > 0);
    checkVoices();
    speechSynthesis.addEventListener('voiceschanged', checkVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', checkVoices);
  }, []);

  const speak = useCallback(async (text: string, lang?: string, rate?: number) => {
    setIsPlaying(true);
    try {
      await ttsSpeak(text, lang ?? defaultLang ?? 'en-US', rate ?? speed);
    } finally {
      setIsPlaying(false);
    }
  }, [defaultLang, speed]);

  const playFile = useCallback(async (src: string) => {
    setIsPlaying(true);
    try {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(src);
      audio.playbackRate = speed;
      audioRef.current = audio;
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('Audio playback failed'));
        audio.play();
      });
    } finally {
      setIsPlaying(false);
    }
  }, [speed]);

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
    voicesAvailable,
    speak,
    playFile,
    stop,
    speed,
    setSpeed,
  };
}
