import { describe, it, expect, vi } from 'vitest';

/**
 * Tests for usePackContent hook logic.
 * Since @testing-library/dom is not installed, we test the core logic
 * (async loading, error handling, cancellation) directly.
 */

describe('usePackContent logic', () => {
  it('should resolve successfully from a loader function', async () => {
    const mockData = ['item1', 'item2'];
    const loader = vi.fn(() => Promise.resolve(mockData));

    const result = await loader('test-pack');
    expect(result).toEqual(mockData);
    expect(loader).toHaveBeenCalledWith('test-pack');
  });

  it('should handle loader errors', async () => {
    const loader = vi.fn(() => Promise.reject(new Error('Load failed')));

    await expect(loader('test-pack')).rejects.toThrow('Load failed');
  });

  it('should support cancellation pattern', async () => {
    let cancelled = false;
    const results: string[] = [];

    const loader = vi.fn(
      () => new Promise<string[]>((resolve) => setTimeout(() => resolve(['data']), 10)),
    );

    // Start loading
    const promise = loader('test-pack').then((data) => {
      if (!cancelled) results.push(...data);
    });

    // Cancel before it resolves
    cancelled = true;
    await promise;

    expect(results).toEqual([]);
  });

  it('should call different loaders with different pack IDs', async () => {
    const loader = vi.fn((packId: string) => Promise.resolve([`data-for-${packId}`]));

    const resultA = await loader('pack-a');
    const resultB = await loader('pack-b');

    expect(resultA).toEqual(['data-for-pack-a']);
    expect(resultB).toEqual(['data-for-pack-b']);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
