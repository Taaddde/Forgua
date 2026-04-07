/**
 * Adapter Registry — maps family strings to adapter classes.
 * Uses dynamic imports for lazy loading: CJK adapters (with heavy
 * dictionaries) are only loaded when a pack of that family is selected.
 */

import type { AbstractAdapter } from './base';
import type { WritingFamily } from '../types/pack-spec';

type AdapterFactory = () => Promise<AbstractAdapter>;

const registry = new Map<WritingFamily, AdapterFactory>();

/**
 * Register built-in adapters.
 * Latin is imported eagerly (tiny, no deps).
 * CJK adapters use dynamic import() for lazy loading.
 */
function registerBuiltinAdapters(): void {
  // Latin — always available, no external deps
  registry.set('latin', async () => {
    const { LatinAdapter } = await import('./latin');
    return new LatinAdapter();
  });

  // Japanese — lazy loaded (kuromoji ~20MB dict)
  registry.set('cjk-japanese', async () => {
    const { JapaneseAdapter } = await import('./japanese');
    return new JapaneseAdapter();
  });

  // Chinese — stub, Fase 7+
  registry.set('cjk-chinese', async () => {
    throw new Error('ChineseAdapter not yet implemented — Fase 7+');
  });

  // Hangul — stub, Fase 7+
  registry.set('hangul', async () => {
    throw new Error('HangulAdapter not yet implemented — Fase 7+');
  });

  // Cyrillic — stub, Fase 7+
  registry.set('cyrillic', async () => {
    throw new Error('CyrillicAdapter not yet implemented — Fase 7+');
  });

  // Arabic — stub, Fase 7+
  registry.set('arabic', async () => {
    throw new Error('ArabicAdapter not yet implemented — Fase 7+');
  });

  // Devanagari — stub, Fase 7+
  registry.set('devanagari', async () => {
    throw new Error('DevanagariAdapter not yet implemented — Fase 7+');
  });
}

// Initialize on module load
registerBuiltinAdapters();

/**
 * Get an adapter instance for the given writing family.
 * Returns a new instance each time. The caller is responsible
 * for calling init() if adapter.requiresInit is true.
 */
export async function getAdapter(family: WritingFamily): Promise<AbstractAdapter> {
  const factory = registry.get(family);
  if (!factory) {
    throw new Error(`No adapter registered for family: ${family}`);
  }
  return factory();
}

/** Check if a family has a registered adapter */
export function hasAdapter(family: WritingFamily): boolean {
  return registry.has(family);
}

/** Get all registered family names */
export function getRegisteredFamilies(): WritingFamily[] {
  return Array.from(registry.keys());
}
