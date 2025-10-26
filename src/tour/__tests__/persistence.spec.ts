// src/tour/__tests__/persistence.spec.ts
import { describe, it, expect } from 'vitest';

import { isTourDone, markTourDone, resetTour, getCompletedTours } from '../persistence';

describe('tour persistence', () => {
  it('marks and reads tour completion', () => {
    const id = 'default-tour';
    resetTour(id);

    expect(isTourDone(id)).toBe(false);
    markTourDone(id);
    expect(isTourDone(id)).toBe(true);

    const list = getCompletedTours();
    expect(Array.isArray(list)).toBe(true);
    expect(list).toContain(id);

    resetTour(id);
    expect(isTourDone(id)).toBe(false);
  });
});
