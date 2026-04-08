/**
 * Platform detection utilities.
 */

export type Platform = 'tauri' | 'pwa' | 'browser';

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function getPlatform(): Platform {
  if (isTauri()) return 'tauri';
  if (isPWA()) return 'pwa';
  return 'browser';
}

export function getPlatformLabel(): string {
  switch (getPlatform()) {
    case 'tauri': return 'Desktop';
    case 'pwa': return 'PWA';
    case 'browser': return 'Web';
  }
}

export const APP_VERSION = '0.1.0';

export function getOS(): 'macos' | 'windows' | 'linux' | 'unknown' {
  const ua = navigator.userAgent;
  if (ua.includes('Mac')) return 'macos';
  if (ua.includes('Win')) return 'windows';
  if (ua.includes('Linux')) return 'linux';
  return 'unknown';
}

/**
 * Open the OS microphone permission settings panel.
 * Only works inside Tauri — calls a custom Rust command.
 */
export async function openMicrophoneSettings(): Promise<boolean> {
  if (!isTauri()) return false;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('open_mic_settings');
    return true;
  } catch {
    return false;
  }
}
