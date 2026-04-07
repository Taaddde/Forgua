/**
 * Pack Registry — discovers and loads Language Packs dynamically.
 * Uses Vite's import.meta.glob to find all manifest.json files in src/packs/.
 * No pack is imported statically — adding a new pack folder is enough.
 */

import type { PackManifest } from '../types/pack-spec';

// Lazy-load all manifest.json files from packs/
const manifestModules = import.meta.glob<{ default: PackManifest }>(
  '../../packs/*/manifest.json',
  { eager: false },
);

let cachedManifests: PackManifest[] | null = null;

/**
 * Get all available pack manifests.
 * Results are cached after first call.
 */
export async function getAvailablePacks(): Promise<PackManifest[]> {
  if (cachedManifests) return cachedManifests;

  const manifests: PackManifest[] = [];
  for (const [path, loader] of Object.entries(manifestModules)) {
    try {
      const mod = await loader();
      manifests.push(mod.default);
    } catch (err) {
      console.warn(`Failed to load manifest from ${path}:`, err);
    }
  }

  // Sort by name for consistent display
  manifests.sort((a, b) => a.name.localeCompare(b.name));
  cachedManifests = manifests;
  return manifests;
}

/**
 * Invalidate the manifest cache (e.g. after installing/uninstalling a pack).
 */
export function invalidatePackCache(): void {
  cachedManifests = null;
}
