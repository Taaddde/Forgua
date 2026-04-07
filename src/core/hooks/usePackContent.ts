/**
 * usePackContent — generic hook for loading pack content asynchronously.
 * Handles loading state, errors, and cleanup on packId change.
 * Uses derived loading state to avoid synchronous setState in effects.
 */

import { useState, useEffect } from 'react';

export function usePackContent<T>(
  loader: (packId: string) => Promise<T>,
  packId: string | null,
  defaultValue: T,
): { data: T; loading: boolean; error: string | null } {
  const [data, setData] = useState<T>(defaultValue);
  const [loadedForPack, setLoadedForPack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loading = packId !== null && packId !== loadedForPack;

  useEffect(() => {
    if (!packId) return;

    let cancelled = false;

    loader(packId)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoadedForPack(packId);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('Failed to load pack content:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setData(defaultValue);
          setLoadedForPack(packId);
        }
      });

    return () => { cancelled = true; };
  }, [packId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
}
