/**
 * Global application state — Zustand store.
 * Manages the active pack, adapter, UI preferences, and sidebar state.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PackManifest } from '../types/pack-spec';
import type { AbstractAdapter } from '../types/adapter';
import { getAdapter } from '../adapters/registry';

export type UILanguage = 'es' | 'en' | 'pt';
export type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  // Pack & adapter
  activePack: PackManifest | null;
  activeAdapter: AbstractAdapter | null;
  adapterLoading: boolean;
  adapterError: string | null;

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
      uiLanguage: 'es',
      theme: 'dark',
      sidebarOpen: true,

      selectPack: async (manifest: PackManifest) => {
        set({ adapterLoading: true, adapterError: null, activePack: manifest });
        try {
          const adapter = await getAdapter(manifest.family);
          if (adapter.requiresInit) {
            await adapter.init();
          }
          set({ activeAdapter: adapter, adapterLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load adapter';
          set({ adapterError: message, adapterLoading: false, activeAdapter: null });
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
