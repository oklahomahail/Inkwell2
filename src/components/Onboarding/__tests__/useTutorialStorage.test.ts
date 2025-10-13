import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import {
  getTourProgress,
  markTourLaunched,
  markTourStep,
  markTourCompleted,
  resetProgress,
  type TourProgress,
} from '../useTutorialStorage';

// Mock localStorage
const mockStorage: { [key: string]: string } = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Tutorial Storage', () => {
  const TEST_TOUR_ID = 'feature-tour';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Tour Progress Retrieval', () => {
    it('should return undefined for non-existent tour', () => {
      expect(getTourProgress(TEST_TOUR_ID)).toBeUndefined();
      expect(localStorageMock.getItem).toHaveBeenCalledWith(`tour:${TEST_TOUR_ID}:progress`);
    });

    it('should handle invalid stored JSON', () => {
      localStorageMock.setItem(`tour:${TEST_TOUR_ID}:progress`, 'invalid json');
      expect(getTourProgress(TEST_TOUR_ID)).toBeUndefined();
    });

    it('should return stored progress', () => {
      const progress: TourProgress = {
        id: TEST_TOUR_ID,
        launchedAt: Date.now(),
        completed: false,
        stepIndex: 1,
      };
      localStorageMock.setItem(`tour:${TEST_TOUR_ID}:progress`, JSON.stringify(progress));
      expect(getTourProgress(TEST_TOUR_ID)).toEqual(progress);
    });
  });

  describe('Tour Launch Management', () => {
    it('should mark tour as launched', () => {
      const now = Date.now();
      markTourLaunched(TEST_TOUR_ID);

      const stored = JSON.parse(mockStorage[`tour:${TEST_TOUR_ID}:progress`]);
      expect(stored).toEqual({
        id: TEST_TOUR_ID,
        launchedAt: now,
        completed: false,
      });
    });

    it('should preserve existing progress when marking as launched', () => {
      const existingProgress: TourProgress = {
        id: TEST_TOUR_ID,
        stepIndex: 2,
      };
      localStorageMock.setItem(`tour:${TEST_TOUR_ID}:progress`, JSON.stringify(existingProgress));

      const now = Date.now();
      markTourLaunched(TEST_TOUR_ID);

      const stored = JSON.parse(mockStorage[`tour:${TEST_TOUR_ID}:progress`]);
      expect(stored).toEqual({
        id: TEST_TOUR_ID,
        stepIndex: 2,
        launchedAt: now,
        completed: false,
      });
    });

    it('should handle storage errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(() => markTourLaunched(TEST_TOUR_ID)).not.toThrow();
    });
  });

  describe('Tour Step Tracking', () => {
    it('should track tour steps', () => {
      markTourStep(TEST_TOUR_ID, 1);

      const stored = JSON.parse(mockStorage[`tour:${TEST_TOUR_ID}:progress`]);
      expect(stored).toEqual({
        id: TEST_TOUR_ID,
        stepIndex: 1,
      });
    });

    it('should update step index on existing progress', () => {
      const existingProgress: TourProgress = {
        id: TEST_TOUR_ID,
        launchedAt: Date.now() - 1000,
        completed: false,
      };
      localStorageMock.setItem(`tour:${TEST_TOUR_ID}:progress`, JSON.stringify(existingProgress));

      markTourStep(TEST_TOUR_ID, 2);

      const stored = JSON.parse(mockStorage[`tour:${TEST_TOUR_ID}:progress`]);
      expect(stored).toEqual({
        ...existingProgress,
        stepIndex: 2,
      });
    });

    it('should handle storage errors when updating steps', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(() => markTourStep(TEST_TOUR_ID, 1)).not.toThrow();
    });
  });

  describe('Tour Completion', () => {
    it('should mark tour as completed', () => {
      const now = Date.now();
      markTourCompleted(TEST_TOUR_ID);

      const stored = JSON.parse(mockStorage[`tour:${TEST_TOUR_ID}:progress`]);
      expect(stored).toEqual({
        id: TEST_TOUR_ID,
        completed: true,
        completedAt: now,
      });
    });

    it('should preserve existing progress when marking as completed', () => {
      const existingProgress: TourProgress = {
        id: TEST_TOUR_ID,
        launchedAt: Date.now() - 1000,
        stepIndex: 3,
      };
      localStorageMock.setItem(`tour:${TEST_TOUR_ID}:progress`, JSON.stringify(existingProgress));

      const now = Date.now();
      markTourCompleted(TEST_TOUR_ID);

      const stored = JSON.parse(mockStorage[`tour:${TEST_TOUR_ID}:progress`]);
      expect(stored).toEqual({
        ...existingProgress,
        completed: true,
        completedAt: now,
      });
    });

    it('should handle storage errors when completing tour', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(() => markTourCompleted(TEST_TOUR_ID)).not.toThrow();
    });
  });

  describe('Progress Reset', () => {
    it('should reset progress', () => {
      const progress: TourProgress = {
        id: TEST_TOUR_ID,
        launchedAt: Date.now(),
        completed: true,
        completedAt: Date.now(),
        stepIndex: 3,
      };
      localStorageMock.setItem(`tour:${TEST_TOUR_ID}:progress`, JSON.stringify(progress));

      resetProgress(TEST_TOUR_ID);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(`tour:${TEST_TOUR_ID}:progress`);
      expect(getTourProgress(TEST_TOUR_ID)).toBeUndefined();
    });

    it('should handle storage errors when resetting', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(() => resetProgress(TEST_TOUR_ID)).not.toThrow();
    });
  });

  describe('SSR Compatibility', () => {
    it('should handle undefined window gracefully', () => {
      const originalWindow = global.window;
      // @ts-ignore - Testing SSR case
      delete global.window;

      expect(getTourProgress(TEST_TOUR_ID)).toBeUndefined();
      expect(() => markTourLaunched(TEST_TOUR_ID)).not.toThrow();
      expect(() => markTourStep(TEST_TOUR_ID, 1)).not.toThrow();
      expect(() => markTourCompleted(TEST_TOUR_ID)).not.toThrow();
      expect(() => resetProgress(TEST_TOUR_ID)).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('Edge Cases', () => {
    it('should handle quota exceeded errors', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      });

      expect(() => markTourLaunched(TEST_TOUR_ID)).not.toThrow();
    });

    it('should handle concurrent updates', () => {
      // Simulate concurrent updates to the same tour
      markTourLaunched(TEST_TOUR_ID);
      markTourStep(TEST_TOUR_ID, 1);
      markTourStep(TEST_TOUR_ID, 2);
      markTourCompleted(TEST_TOUR_ID);

      const finalProgress = getTourProgress(TEST_TOUR_ID);
      expect(finalProgress).toEqual({
        id: TEST_TOUR_ID,
        launchedAt: expect.any(Number),
        stepIndex: 2,
        completed: true,
        completedAt: expect.any(Number),
      });
    });

    it('should handle multiple tours independently', () => {
      const ANOTHER_TOUR_ID = 'another-tour';

      markTourLaunched(TEST_TOUR_ID);
      markTourStep(TEST_TOUR_ID, 1);
      markTourLaunched(ANOTHER_TOUR_ID);
      markTourStep(ANOTHER_TOUR_ID, 2);

      expect(getTourProgress(TEST_TOUR_ID)).toEqual({
        id: TEST_TOUR_ID,
        launchedAt: expect.any(Number),
        completed: false,
        stepIndex: 1,
      });

      expect(getTourProgress(ANOTHER_TOUR_ID)).toEqual({
        id: ANOTHER_TOUR_ID,
        launchedAt: expect.any(Number),
        completed: false,
        stepIndex: 2,
      });
    });
  });
});
