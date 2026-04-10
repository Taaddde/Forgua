/**
 * Audio preferences — user-configurable TTS voices, speed and mic input device.
 *
 * Persisted in the Dexie `settings` table so preferences survive across sessions.
 * Values are live-reactive via `useLiveQuery`.
 *
 * Keys used:
 *   - `audio-voice-map` → JSON string, map of lang tag → voiceURI
 *   - `audio-speed`     → number, playback rate (0.5 – 1.5)
 *   - `audio-warning-dismissed-{lang}` → '1' when the user dismissed the low-quality warning for that lang
 *   - `audio-mic-device-id` → string, preferred input deviceId for recording
 */

import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';

const KEY_VOICE_MAP = 'audio-voice-map';
const KEY_SPEED = 'audio-speed';
const KEY_MIC_DEVICE = 'audio-mic-device-id';
const KEY_WARNING_PREFIX = 'audio-warning-dismissed-';

export type VoiceMap = Record<string, string>; // lang (BCP-47) → voiceURI

async function readVoiceMap(): Promise<VoiceMap> {
  const entry = await db.settings.get(KEY_VOICE_MAP);
  if (!entry?.value) return {};
  try {
    const parsed = JSON.parse(entry.value as string);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

async function readSpeed(): Promise<number> {
  const entry = await db.settings.get(KEY_SPEED);
  const raw = entry?.value;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const parsed = parseFloat(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 1.0;
}

async function readMicDevice(): Promise<string | null> {
  const entry = await db.settings.get(KEY_MIC_DEVICE);
  return (entry?.value as string | undefined) ?? null;
}

async function readWarningDismissed(lang: string): Promise<boolean> {
  const entry = await db.settings.get(KEY_WARNING_PREFIX + lang);
  return entry?.value === '1';
}

/**
 * Live-reactive hook for audio preferences. Re-renders when the underlying
 * settings change (e.g. when another component updates the voice map).
 */
export function useAudioPreferences() {
  const voiceMap = useLiveQuery(readVoiceMap, [], {} as VoiceMap);
  const speed = useLiveQuery(readSpeed, [], 1.0);
  const micDeviceId = useLiveQuery(readMicDevice, [], null as string | null);

  const setVoiceForLang = useCallback(async (lang: string, voiceURI: string | null) => {
    const current = await readVoiceMap();
    if (voiceURI === null) {
      delete current[lang];
    } else {
      current[lang] = voiceURI;
    }
    await db.settings.put({ key: KEY_VOICE_MAP, value: JSON.stringify(current) });
  }, []);

  const setSpeed = useCallback(async (rate: number) => {
    const clamped = Math.max(0.5, Math.min(1.5, rate));
    await db.settings.put({ key: KEY_SPEED, value: clamped });
  }, []);

  const setMicDeviceId = useCallback(async (deviceId: string | null) => {
    if (deviceId === null) {
      await db.settings.delete(KEY_MIC_DEVICE);
    } else {
      await db.settings.put({ key: KEY_MIC_DEVICE, value: deviceId });
    }
  }, []);

  const dismissWarning = useCallback(async (lang: string) => {
    await db.settings.put({ key: KEY_WARNING_PREFIX + lang, value: '1' });
  }, []);

  const resetWarning = useCallback(async (lang: string) => {
    await db.settings.delete(KEY_WARNING_PREFIX + lang);
  }, []);

  return {
    voiceMap: voiceMap ?? {},
    speed: speed ?? 1.0,
    micDeviceId: micDeviceId ?? null,
    setVoiceForLang,
    setSpeed,
    setMicDeviceId,
    dismissWarning,
    resetWarning,
    isWarningDismissed: readWarningDismissed,
  };
}
