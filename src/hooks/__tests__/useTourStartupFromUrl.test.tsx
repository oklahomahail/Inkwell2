// src/hooks/__tests__/useTourStartupFromUrl.test.tsx
import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { useTourStartupFromUrl } from '../useTourStartupFromUrl';

// Mock dependencies
vi.mock('../../../utils/tourTriggers', () => ({
  triggerDashboardView: vi.fn(),
}));

// Removed invalid relative-module augmentation; the runtime mock (vi.mock) provides the mocked implementation.
// If you need TypeScript types for this module, add an ambient declaration file (e.g. src/types/tourTriggers.d.ts)
// with a non-relative module name or ensure the real module exports proper types.

// Use require and ignore TS check since the module doesn't have type declarations
// @ts-ignore
const { triggerDashboardView } = require('../../../utils/tourTriggers');
describe('useTourStartupFromUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const TestComponent = () => {
    useTourStartupFromUrl();
    return <div data-testid="test-component">Test Component</div>;
  };

  it('does not trigger tour if no tour parameter present', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <TestComponent />
      </MemoryRouter>,
    );

    vi.runAllTimers();

    expect(triggerDashboardView).not.toHaveBeenCalled();
  });

  it('triggers tour when tour=start parameter is present', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard?tour=start']}>
        <TestComponent />
      </MemoryRouter>,
    );

    vi.runAllTimers();

    expect(triggerDashboardView).toHaveBeenCalledTimes(1);
  });

  it('handles other values for tour parameter', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard?tour=other']}>
        <TestComponent />
      </MemoryRouter>,
    );

    vi.runAllTimers();

    expect(triggerDashboardView).not.toHaveBeenCalled();
  });

  it('cleans up timer when component unmounts', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount } = render(
      <MemoryRouter initialEntries={['/dashboard?tour=start']}>
        <TestComponent />
      </MemoryRouter>,
    );

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('triggers tour on route change with tour parameter', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <TestComponent />
      </MemoryRouter>,
    );

    vi.runAllTimers();
    expect(triggerDashboardView).not.toHaveBeenCalled();

    // Update route to include tour parameter
    rerender(
      <MemoryRouter initialEntries={['/dashboard?tour=start']}>
        <TestComponent />
      </MemoryRouter>,
    );

    vi.runAllTimers();
    expect(triggerDashboardView).toHaveBeenCalledTimes(1);
  });
});
