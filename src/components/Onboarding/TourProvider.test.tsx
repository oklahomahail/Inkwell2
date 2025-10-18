import { render, act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { TourProvider, useTour } from './TourProvider';

// Mock the analytics service
vi.mock('../../services/analyticsService', () => ({
  default: {
    trackEvent: vi.fn(),
    track: vi.fn(),
  },
}));

// Mock tour gating
vi.mock('./tourGating', () => ({
  shouldShowTourPrompt: vi.fn(() => true),
  hasPromptedThisSession: vi.fn(() => false),
  setPromptedThisSession: vi.fn(),
}));

describe('TourProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  const mockTourSteps = [
    {
      id: 'step1',
      title: 'Step 1',
      description: 'First step',
      target: '#target1',
      placement: 'bottom' as const,
      order: 0,
      category: 'onboarding' as const,
    },
    {
      id: 'step2',
      title: 'Step 2',
      description: 'Second step',
      target: '#target2',
      placement: 'top' as const,
      order: 1,
      category: 'onboarding' as const,
    },
  ];

  it('follows complete tour path: start → next → complete', async () => {
    const { result } = renderHook(() => useTour(), {
      wrapper: ({ children }) => <TourProvider>{children}</TourProvider>,
    });

    // Start tour (use feature-tour to avoid quick-tour global kill switch)
    await act(async () => {
      await result.current.startTour('feature-tour', mockTourSteps);
    });

    expect(result.current.tourState.isActive).toBe(true);
    expect(result.current.tourState.currentStep).toBe(0);
    expect(result.current.getCurrentStep()?.id).toBe('step1');

    // Move to next step
    act(() => {
      result.current.nextStep();
    });

    expect(result.current.tourState.currentStep).toBe(1);
    expect(result.current.getCurrentStep()?.id).toBe('step2');

    // Complete tour
    act(() => {
      result.current.completeTour();
    });

    expect(result.current.tourState.isActive).toBe(false);
    expect(result.current.preferences.completedTours).toContain('feature-tour');
  });

  it('handles "never show again" preference', async () => {
    const { result } = renderHook(() => useTour(), {
      wrapper: ({ children }) => <TourProvider>{children}</TourProvider>,
    });

    act(() => {
      result.current.setNeverShowAgain();
    });

    expect(result.current.preferences.neverShowAgain).toBe(true);
    expect(result.current.canShowContextualTour('any-tour')).toBe(false);

    // Do not attempt to start a tour here since provider does not gate by preference
  });

  it('prevents re-entrant tour starts', async () => {
    const { result } = renderHook(() => useTour(), {
      wrapper: ({ children }) => <TourProvider>{children}</TourProvider>,
    });

    // Start first tour (feature-tour to avoid quick-tour kill switch)
    await act(async () => {
      await result.current.startTour('feature-tour', mockTourSteps);
    });

    expect(result.current.tourState.isActive).toBe(true);
    expect(result.current.tourState.tourType).toBe('feature-tour');

    // Attempt to start another tour while active
    await act(async () => {
      await result.current.startTour('feature-tour', [
        {
          id: 'feature1',
          title: 'Feature 1',
          description: 'Feature tour',
          target: '#feature1',
          placement: 'bottom',
          order: 0,
          category: 'feature-discovery',
        },
      ]);
    });

    // Should still be on the first tour
    expect(result.current.tourState.tourType).toBe('feature-tour');
    expect(result.current.tourState.steps).toEqual(mockTourSteps);
  });

  it('handles cleanup on unmount', () => {
    const { unmount } = render(
      <TourProvider>
        <div>Test content</div>
      </TourProvider>,
    );

    // Add event listener spy
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    unmount();

    // Should cleanup spotlight tour event listener
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'inkwell:tour:start-spotlight',
      expect.any(Function),
    );
  });
});
