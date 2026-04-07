/**
 * Database export/import for backup & restore.
 */

import { db } from './database';

export async function exportUserData(): Promise<string> {
  const [packs, srsState, progress, sessions, settings, notes] = await Promise.all([
    db.packs.toArray(),
    db.srsState.toArray(),
    db.progress.toArray(),
    db.sessions.toArray(),
    db.settings.toArray(),
    db.notes.toArray(),
  ]);

  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { packs, srsState, progress, sessions, settings, notes },
  }, null, 2);
}

export async function importUserData(jsonString: string): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  let parsed: { version?: number; data?: Record<string, unknown[]> };
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { imported: 0, errors: ['Invalid JSON'] };
  }

  if (!parsed.version || !parsed.data) {
    return { imported: 0, errors: ['Invalid backup format'] };
  }

  const data = parsed.data;

  await db.transaction('rw', [db.srsState, db.progress, db.sessions, db.settings, db.notes], async () => {
    if (Array.isArray(data.srsState)) {
      for (const item of data.srsState) {
        try {
          await db.srsState.put(item as Parameters<typeof db.srsState.put>[0]);
          imported++;
        } catch { errors.push('Failed to import SRS state entry'); }
      }
    }
    if (Array.isArray(data.progress)) {
      for (const item of data.progress) {
        try {
          await db.progress.put(item as Parameters<typeof db.progress.put>[0]);
          imported++;
        } catch { errors.push('Failed to import progress entry'); }
      }
    }
    if (Array.isArray(data.sessions)) {
      for (const item of data.sessions) {
        try {
          await db.sessions.add(item as Parameters<typeof db.sessions.add>[0]);
          imported++;
        } catch { /* skip duplicates */ }
      }
    }
    if (Array.isArray(data.settings)) {
      for (const item of data.settings) {
        try {
          await db.settings.put(item as Parameters<typeof db.settings.put>[0]);
          imported++;
        } catch { errors.push('Failed to import setting'); }
      }
    }
    if (Array.isArray(data.notes)) {
      for (const item of data.notes) {
        try {
          await db.notes.add(item as Parameters<typeof db.notes.add>[0]);
          imported++;
        } catch { /* skip duplicates */ }
      }
    }
  });

  return { imported, errors };
}

export function downloadBackup(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
