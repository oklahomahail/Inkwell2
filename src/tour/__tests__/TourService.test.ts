import { describe, test, expect, beforeEach, vi } from 'vitest';

import { tourService } from '../TourService';

describe('TourService', () => {
  beforeEach(() => {
    // Reset tour service state
    if (tourService.isRunning()) {
      tourService.stop();
    }
    vi.clearAllMocks();
  });

  describe('configure', () => {
    test('sets skipMissingAnchors option', () => {
      tourService.configure({ skipMissingAnchors: true });

      const options = tourService.getOptions();
      expect(options.skipMissingAnchors).toBe(true);
    });

    test('sets spotlightPadding option', () => {
      tourService.configure({ spotlightPadding: 16 });

      const options = tourService.getOptions();
      expect(options.spotlightPadding).toBe(16);
    });

    test('merges multiple configure calls', () => {
      tourService.configure({ skipMissingAnchors: true });
      tourService.configure({ spotlightPadding: 12 });

      const options = tourService.getOptions();
      expect(options.skipMissingAnchors).toBe(true);
      expect(options.spotlightPadding).toBe(12);
    });
  });

  describe('getOptions', () => {
    test('returns persisted options', () => {
      tourService.configure({
        skipMissingAnchors: true,
        spotlightPadding: 20,
      });

      const options = tourService.getOptions();
      expect(options).toEqual({
        skipMissingAnchors: true,
        spotlightPadding: 20,
      });
    });

    test('returns empty object by default', () => {
      const service = new (tourService.constructor as any)();
      const options = service.getOptions();
      expect(options).toEqual({});
    });
  });

  describe('state management', () => {
    test('initial state is not running', () => {
      expect(tourService.isRunning()).toBe(false);
    });

    test('getState returns current state', () => {
      const state = tourService.getState();
      expect(state).toHaveProperty('isRunning');
      expect(state).toHaveProperty('currentStep');
      expect(state).toHaveProperty('totalSteps');
      expect(state).toHaveProperty('tourId');
    });
  });

  describe('start', () => {
    test('updates state when starting tour', async () => {
      const config = {
        id: 'test-tour',
        steps: [
          {
            target: '[data-test-id="test"]',
            title: 'Test Step',
            content: 'Test content',
            placement: 'bottom' as const,
          },
        ],
        showProgress: true,
        allowSkip: true,
      };

      await tourService.start(config);

      expect(tourService.isRunning()).toBe(true);
      const state = tourService.getState();
      expect(state.tourId).toBe('test-tour');
      expect(state.totalSteps).toBe(1);
    });
  });
});
