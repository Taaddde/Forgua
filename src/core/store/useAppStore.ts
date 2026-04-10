/**
 * Global application state — Zustand store.
 * Manages the active pack, adapter, UI preferences, and sidebar state.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PackManifest } from '../types/pack-spec';
import type { AbstractAdapter } from '../types/adapter';
import { getAdapter } from '../adapters/registry';
import { installPack } from '../db/seeds';

export type UILanguage = 'es' | 'en' | 'pt';
export type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  // Pack & adapter
  activePack: PackManifest | null;
  activeAdapter: AbstractAdapter | null;
  adapterLoading: boolean;
  adapterError: string | null;
  adapterProgress: { phase: string; value: number } | null;

  // UI preferences
  uiLanguage: UILanguage;
  theme: ThemeMode;
  sidebarOpen: boolean;

  // Actions
  selectPack: (manifest: PackManifest) => Promise<void>;
  clearPack: () => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (lang: UILanguage) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      activePack: null,
      activeAdapter: null,
      adapterLoading: false,
      adapterError: null,
      adapterProgress: null,
      uiLanguage: 'es',
      theme: 'dark',
      sidebarOpen: true,

      selectPack: async (manifest: PackManifest) => {
        // Flip loading on synchronously so the install overlay shows
        // immediately — before any async work (pack data load, adapter init).
        set({
          adapterLoading: true,
          adapterError: null,
          adapterProgress: { phase: 'installing', value: 0 },
          activePack: manifest,
        });
        try {
          // Step 1: install pack data into IndexedDB (cards, progress rows).
          await installPack(manifest);
          // Step 2: load and initialize the family adapter, if any.
          const adapter = await getAdapter(manifest.family);
          if (adapter.requiresInit) {
            await adapter.init((phase, value) => {
              set({ adapterProgress: { phase, value } });
            });
          }
          set({ activeAdapter: adapter, adapterLoading: false, adapterProgress: null });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load adapter';
          set({ adapterError: message, adapterLoading: false, activeAdapter: null, adapterProgress: null });
        }
      },

      clearPack: () => {
        set({ activePack: null, activeAdapter: null, adapterError: null });
      },

      setTheme: (theme: ThemeMode) => {
        set({ theme });
      },

      setLanguage: (lang: UILanguage) => {
        set({ uiLanguage: lang });
      },

      toggleSidebar: () => {
        set({ sidebarOpen: !get().sidebarOpen });
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },
    }),
    {
      name: 'forgua-settings',
      partialize: (state) => ({
        activePack: state.activePack,
        uiLanguage: state.uiLanguage,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
