/**
 * useMicDevices — enumerates audio input devices and probes the currently active one.
 *
 * Works on Chrome/Edge/Safari/Firefox across macOS/Windows/Linux, and inside Tauri.
 *
 * Important platform limitation:
 *   Web Speech API `SpeechRecognition` does NOT accept a deviceId. It always uses
 *   the OS/browser default input. This hook surfaces the *actual* device the
 *   browser would pick, but switching devices here only affects components that
 *   use getUserMedia directly (MediaRecorder-based pronunciation feedback).
 *
 * Device labels are only populated after the user has granted microphone permission
 * at least once — before that, `enumerateDevices()` returns devices with empty labels.
 */

import { useCallback, useEffect, useState } from 'react';

export interface MicDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export interface MicProbeResult {
  deviceId: string | null;
  label: string | null;
}

export function isDeviceEnumerationSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.enumerateDevices &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

async function probeActiveInput(): Promise<MicProbeResult> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { deviceId: null, label: null };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const track = stream.getAudioTracks()[0];
    const settings = track?.getSettings() ?? {};
    const result: MicProbeResult = {
      deviceId: (settings.deviceId as string | undefined) ?? null,
      label: track?.label ?? null,
    };
    stream.getTracks().forEach((t) => t.stop());
    return result;
  } catch {
    return { deviceId: null, label: null };
  }
}

async function readAllInputs(): Promise<MicDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const all = await navigator.mediaDevices.enumerateDevices();
  return all
    .filter((d) => d.kind === 'audioinput')
    .map((d) => ({ deviceId: d.deviceId, label: d.label, groupId: d.groupId }));
}

export function useMicDevices(autoProbe = false) {
  const [devices, setDevices] = useState<MicDevice[]>([]);
  const [active, setActive] = useState<MicProbeResult>({ deviceId: null, label: null });
  const [labelsGranted, setLabelsGranted] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isDeviceEnumerationSupported()) {
      setError('not-supported');
      return;
    }
    try {
      const list = await readAllInputs();
      setDevices(list);
      setLabelsGranted(list.length > 0 && list.every((d) => !!d.label));
    } catch {
      setError('enumerate-failed');
    }
  }, []);

  const probe = useCallback(async () => {
    if (!isDeviceEnumerationSupported()) return;
    setIsProbing(true);
    setError(null);
    try {
      const result = await probeActiveInput();
      setActive(result);
      // Re-read devices now that labels should be populated.
      await refresh();
    } catch {
      setError('probe-failed');
    } finally {
      setIsProbing(false);
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
    if (autoProbe) void probe();

    if (!navigator.mediaDevices) return;
    const onChange = () => void refresh();
    navigator.mediaDevices.addEventListener('devicechange', onChange);
    return () => navigator.mediaDevices.removeEventListener('devicechange', onChange);
  }, [refresh, probe, autoProbe]);

  return {
    devices,
    active,
    labelsGranted,
    isProbing,
    error,
    isSupported: isDeviceEnumerationSupported(),
    refresh,
    probe,
  };
}
