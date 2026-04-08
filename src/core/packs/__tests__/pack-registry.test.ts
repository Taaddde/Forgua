import { describe, it, expect, beforeEach } from 'vitest';
import { getAvailablePacks, invalidatePackCache } from '../pack-registry';

const LONG_TIMEOUT = 15000;

describe('pack-registry', () => {
  beforeEach(() => {
    invalidatePackCache();
  });

  it('should discover at least the japanese and english packs', async () => {
    const packs = await getAvailablePacks();
    expect(packs.length).toBeGreaterThanOrEqual(2);

    const ids = packs.map((p) => p.id);
    expect(ids).toContain('japanese-from-es');
    expect(ids).toContain('english-from-es');
  }, LONG_TIMEOUT);

  it('should return manifests with required fields', async () => {
    const packs = await getAvailablePacks();
    for (const pack of packs) {
      expect(pack.id).toBeDefined();
      expect(pack.name).toBeDefined();
      expect(pack.family).toBeDefined();
      expect(pack.levels).toBeDefined();
      expect(Array.isArray(pack.levels)).toBe(true);
      expect(pack.levels.length).toBeGreaterThan(0);
    }
  }, LONG_TIMEOUT);

  it('should return cached results on second call', async () => {
    const first = await getAvailablePacks();
    const second = await getAvailablePacks();
    // Same reference = cached
    expect(first).toBe(second);
  }, LONG_TIMEOUT);

  it('should return fresh results after invalidation', async () => {
    const first = await getAvailablePacks();
    invalidatePackCache();
    const second = await getAvailablePacks();
    expect(first).not.toBe(second);
    expect(first.length).toBe(second.length);
  }, LONG_TIMEOUT);

  it('should sort packs by name', async () => {
    const packs = await getAvailablePacks();
    for (let i = 1; i < packs.length; i++) {
      expect(packs[i].name.localeCompare(packs[i - 1].name)).toBeGreaterThanOrEqual(0);
    }
  }, LONG_TIMEOUT);
});
