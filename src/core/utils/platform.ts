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
