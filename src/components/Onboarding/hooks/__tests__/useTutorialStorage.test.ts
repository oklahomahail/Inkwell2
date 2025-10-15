import { describe, test, expect, beforeEach } from 'vitest';

import {
  getTourProgress,
  markTourLaunched,
  markTourCompleted,
  resetProgress,
} from '../useTutorialStorage';

describe('useTutorialStorage', () => {
  const id = 'test-tour';

  beforeEach(() => {
    localStorage.clear();
  });

  test('handles missing progress data', () => {
    expect(getTourProgress(id)).toBeNull();
  });

  test('getTourProgress returns stored progress', () => {
    const data = { stepIndex: 2, variant: 'test' };
    localStorage.setItem(`tour:${id}:progress`, JSON.stringify(data));
    expect(getTourProgress(id)).toEqual(data);
  });

  test('markTourLaunched sets initial progress', () => {
    markTourLaunched(id);
    const progress = getTourProgress(id);
    expect(progress).toMatchObject({
      stepIndex: 0,
      startedAt: expect.any(Number),
    });
  });

  test('markTourCompleted sets completion flag', () => {
    markTourCompleted(id);
    const storedData = localStorage.getItem(`tour:${id}:completed`);
    expect(JSON.parse(storedData || '')).toEqual({
      completed: true,
      stepIndex: -1,
    });
  });

  test('resetProgress clears stored data', () => {
    markTourLaunched(id);
    expect(getTourProgress(id)).toBeTruthy();

    resetProgress(id);
    expect(getTourProgress(id)).toBeNull();
  });
});
