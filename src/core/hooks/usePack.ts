/**
 * Pack access hook — provides the active pack manifest and adapter.
 * Reads from the Zustand store and handles adapter initialization state.
 */

import { useAppStore } from '../store/useAppStore';

export function usePack() {
  const activePack = useAppStore((s) => s.activePack);
  const activeAdapter = useAppStore((s) => s.activeAdapter);
  const adapterLoading = useAppStore((s) => s.adapterLoading);
  const adapterError = useAppStore((s) => s.adapterError);
  const selectPack = useAppStore((s) => s.selectPack);
  const clearPack = useAppStore((s) => s.clearPack);

  return {
    pack: activePack,
    adapter: activeAdapter,
    isLoading: adapterLoading,
    error: adapterError,
    selectPack,
    clearPack,
    hasPack: activePack !== null,
  };
}
