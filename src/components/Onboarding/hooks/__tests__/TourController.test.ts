import { vi, describe, test, expect, beforeEach } from 'vitest';

import { TourController } from '../TourController';

describe('TourController', () => {
  let controller: TourController;
  const _mockEvent = { detail: expect.any(Object) };
  const id = 'test-tour';

  beforeEach(() => {
    // Create localStorage mock
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      getItem: vi.fn((key: string) => store[key]),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
    });

    controller = new TourController();
    vi.spyOn(window, 'dispatchEvent');
  });

  test('startTour sets running flag and fires event', () => {
    expect(controller.startTour(id, 'test', { steps: 3 })).toBe(true);
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tour:start',
        detail: expect.objectContaining({
          tourId: id,
          variant: 'test',
          stepsCount: 3,
        }),
      }),
    );
    expect(localStorage.setItem).toHaveBeenCalledWith(
      `tour:${id}:progress`,
      expect.stringContaining('"stepIndex":0'),
    );
  });

  test('isTourRunning reflects active tour state', () => {
    expect(controller.isTourRunning()).toBe(false);
    expect(controller.isTourRunning(id)).toBe(false);

    controller.startTour(id);
    expect(controller.isTourRunning()).toBe(true);
    expect(controller.isTourRunning(id)).toBe(true);
    expect(controller.isTourRunning('other')).toBe(false);
  });

  test('prevents duplicate tour starts', () => {
    expect(controller.startTour(id)).toBe(true);
    expect(controller.startTour(id)).toBe(false);
    expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
  });

  test('allows force restart of running tour', () => {
    expect(controller.startTour(id)).toBe(true);
    expect(controller.startTour(id, undefined, { forceRestart: true })).toBe(true);
    expect(window.dispatchEvent).toHaveBeenCalledTimes(2);
  });
});
