import { describe, it, expect } from 'vitest';
import { loadRoadmaps, loadReadings, loadResources } from '../pack-content-loader';

const LONG_TIMEOUT = 15000;

describe('pack-content-loader', () => {
  it('should load roadmaps for japanese pack', async () => {
    const roadmaps = await loadRoadmaps('japanese-from-es');
    expect(roadmaps.length).toBeGreaterThan(0);
    expect(roadmaps[0]).toHaveProperty('id');
    expect(roadmaps[0]).toHaveProperty('name');
    expect(roadmaps[0]).toHaveProperty('phases');
  }, LONG_TIMEOUT);

  it('should load roadmaps for english pack', async () => {
    const roadmaps = await loadRoadmaps('english-from-es');
    expect(roadmaps.length).toBeGreaterThan(0);
  }, LONG_TIMEOUT);

  it('should return empty array for nonexistent pack roadmaps', async () => {
    const roadmaps = await loadRoadmaps('nonexistent');
    expect(roadmaps).toEqual([]);
  });

  it('should load readings for japanese pack', async () => {
    const readings = await loadReadings('japanese-from-es');
    expect(readings.length).toBeGreaterThan(0);
    expect(readings[0]).toHaveProperty('id');
    expect(readings[0]).toHaveProperty('title');
    expect(readings[0]).toHaveProperty('text');
  }, LONG_TIMEOUT);

  it('should load readings for english pack', async () => {
    const readings = await loadReadings('english-from-es');
    expect(readings.length).toBeGreaterThan(0);
  }, LONG_TIMEOUT);

  it('should return empty array for nonexistent pack readings', async () => {
    const readings = await loadReadings('nonexistent');
    expect(readings).toEqual([]);
  });

  it('should load resources for japanese pack', async () => {
    const resources = await loadResources('japanese-from-es');
    expect(resources.length).toBeGreaterThan(0);
    expect(resources[0]).toHaveProperty('name');
    expect(resources[0]).toHaveProperty('type');
  }, LONG_TIMEOUT);

  it('should return empty array for nonexistent pack resources', async () => {
    const resources = await loadResources('nonexistent');
    expect(resources).toEqual([]);
  });
});
