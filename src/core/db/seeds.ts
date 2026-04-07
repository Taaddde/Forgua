/**
 * Pack installer — installs/uninstalls Language Packs in IndexedDB.
 * Data loading is delegated to pack-data-loader.ts which discovers
 * files dynamically. This file has ZERO pack-specific imports.
 */

import { db } from './database';
import type { InstalledPack } from '../types/models';
import type { PackManifest } from '../types/pack-spec';
import { loadPackData } from '../packs/pack-data-loader';
import { invalidatePackCache } from '../packs/pack-registry';

/**
 * Install a pack into the database.
 */
export async function installPack(manifest: PackManifest): Promise<void> {
  const record: InstalledPack = {
    id: manifest.id,
    name: manifest.name,
    family: manifest.family,
    version: manifest.version,
    installedAt: new Date(),
  };

  await db.packs.put(record);
  await loadPackData(manifest);
}

/**
 * Remove a pack and all its associated data.
 */
export async function uninstallPack(packId: string): Promise<void> {
  await db.transaction('rw', [db.packs, db.cards, db.srsState, db.progress, db.sessions, db.notes, db.mediaCache, db.lessonProgress], async () => {
    await db.packs.delete(packId);
    await db.cards.where('packId').equals(packId).delete();
    await db.srsState.where('packId').equals(packId).delete();
    await db.progress.where('packId').equals(packId).delete();
    await db.sessions.where('packId').equals(packId).delete();
    await db.mediaCache.where('packId').equals(packId).delete();
    await db.lessonProgress.where('packId').equals(packId).delete();
  });
  invalidatePackCache();
}
