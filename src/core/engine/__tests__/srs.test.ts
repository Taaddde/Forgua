import { describe, it, expect } from 'vitest';
import { calculateNextReview, createInitialSRSState } from '../srs';
import { ReviewGrade } from '../../types/models';
import type { SRSState } from '../../types/models';

function makeState(overrides: Partial<SRSState> = {}): SRSState {
  return {
    cardId: 1,
    packId: 'test',
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date(),
    ...overrides,
  };
}

describe('SM-2 Algorithm', () => {
  it('creates initial state with ease 2.5 and interval 0', () => {
    const state = createInitialSRSState(42, 'japanese-from-es');
    expect(state.cardId).toBe(42);
    expect(state.packId).toBe('japanese-from-es');
    expect(state.easeFactor).toBe(2.5);
    expect(state.interval).toBe(0);
    expect(state.repetitions).toBe(0);
    expect(state.nextReview).toBeInstanceOf(Date);
  });

  it('sets interval to 1 day on first Good review', () => {
    const state = makeState({ repetitions: 0 });
    const next = calculateNextReview(state, ReviewGrade.Good);
    expect(next.interval).toBe(1);
    expect(next.repetitions).toBe(1);
  });

  it('sets interval to 6 days on second Good review', () => {
    const state = makeState({ repetitions: 1, interval: 1 });
    const next = calculateNextReview(state, ReviewGrade.Good);
    expect(next.interval).toBe(6);
    expect(next.repetitions).toBe(2);
  });

  it('multiplies interval by ease on third+ Good review', () => {
    const state = makeState({ repetitions: 2, interval: 6, easeFactor: 2.5 });
    const next = calculateNextReview(state, ReviewGrade.Good);
    // EF after Good (q=4): EF + (0.1 - (5-4)*(0.08 + (5-4)*0.02)) = 2.5 + 0.0 = 2.5
    // interval = round(6 * 2.5) = 15
    expect(next.interval).toBe(15);
    expect(next.repetitions).toBe(3);
  });

  it('resets to interval 1 on Again', () => {
    const state = makeState({ repetitions: 5, interval: 30, easeFactor: 2.5 });
    const next = calculateNextReview(state, ReviewGrade.Again);
    expect(next.interval).toBe(1);
    expect(next.repetitions).toBe(0);
  });

  it('never drops ease below 1.3', () => {
    // Start with minimum ease and review Again repeatedly
    let state = makeState({ easeFactor: 1.3 });
    const next = calculateNextReview(state, ReviewGrade.Again);
    expect(next.easeFactor).toBeGreaterThanOrEqual(1.3);

    // Even Hard should not drop below 1.3
    state = makeState({ easeFactor: 1.3 });
    const nextHard = calculateNextReview(state, ReviewGrade.Hard);
    expect(nextHard.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('increases ease on Easy', () => {
    const state = makeState({ easeFactor: 2.5 });
    const next = calculateNextReview(state, ReviewGrade.Easy);
    // EF after Easy (q=5): EF + (0.1 - 0*(...)) = 2.5 + 0.1 = 2.6
    expect(next.easeFactor).toBeCloseTo(2.6);
  });

  it('decreases ease on Hard', () => {
    const state = makeState({ easeFactor: 2.5 });
    const next = calculateNextReview(state, ReviewGrade.Hard);
    // EF after Hard (q=3): EF + (0.1 - 2*(0.08 + 2*0.02)) = 2.5 + (0.1 - 0.24) = 2.36
    expect(next.easeFactor).toBeCloseTo(2.36);
  });

  it('does not change ease on Good (q=4)', () => {
    const state = makeState({ easeFactor: 2.5 });
    const next = calculateNextReview(state, ReviewGrade.Good);
    // EF after Good (q=4): EF + (0.1 - 1*(0.08 + 1*0.02)) = 2.5 + 0.0 = 2.5
    expect(next.easeFactor).toBeCloseTo(2.5);
  });

  it('sets nextReview to today + interval days', () => {
    const state = makeState({ repetitions: 0 });
    const before = new Date();
    const next = calculateNextReview(state, ReviewGrade.Good);
    const after = new Date();

    // nextReview should be ~1 day from now
    const expectedMin = new Date(before);
    expectedMin.setDate(expectedMin.getDate() + 1);
    const expectedMax = new Date(after);
    expectedMax.setDate(expectedMax.getDate() + 1);

    expect(next.nextReview.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime() - 1000);
    expect(next.nextReview.getTime()).toBeLessThanOrEqual(expectedMax.getTime() + 1000);
  });

  it('sets lastReview to now', () => {
    const state = makeState();
    const before = Date.now();
    const next = calculateNextReview(state, ReviewGrade.Good);
    const after = Date.now();

    expect(next.lastReview).toBeInstanceOf(Date);
    expect(next.lastReview!.getTime()).toBeGreaterThanOrEqual(before);
    expect(next.lastReview!.getTime()).toBeLessThanOrEqual(after);
  });

  it('advances with Hard grade (q=3)', () => {
    const state = makeState({ repetitions: 0 });
    const next = calculateNextReview(state, ReviewGrade.Hard);
    expect(next.interval).toBe(1);
    expect(next.repetitions).toBe(1);
  });
});
