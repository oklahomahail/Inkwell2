import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { debounce } from '../debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should debounce function calls', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    // Call multiple times in quick succession
    debouncedFn(1);
    debouncedFn(2);
    debouncedFn(3);

    // Function should not be called immediately
    expect(mockFn).not.toHaveBeenCalled();

    // Advance timer halfway - still shouldn't call
    vi.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();

    // Advance timer past debounce delay
    vi.advanceTimersByTime(100);

    // Function should be called with latest args
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(3);
  });

  it('should reset the timer when called again', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    // Initial call
    debouncedFn(1);

    // Advance timer partially
    vi.advanceTimersByTime(50);

    // Call again - should reset timer
    debouncedFn(2);

    // Advance to what would have been the end of the first timer
    vi.advanceTimersByTime(50);

    // Function still shouldn't be called
    expect(mockFn).not.toHaveBeenCalled();

    // Advance to the end of the second timer
    vi.advanceTimersByTime(50);

    // Now it should be called with the latest args
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(2);
  });

  it('should handle multiple debounced functions independently', () => {
    const mockFn1 = vi.fn();
    const mockFn2 = vi.fn();

    const debouncedFn1 = debounce(mockFn1, 100);
    const debouncedFn2 = debounce(mockFn2, 200);

    // Call both functions
    debouncedFn1('a');
    debouncedFn2('b');

    // Advance past first debounce delay
    vi.advanceTimersByTime(150);

    // Only first function should be called
    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn1).toHaveBeenCalledWith('a');
    expect(mockFn2).not.toHaveBeenCalled();

    // Advance past second debounce delay
    vi.advanceTimersByTime(100);

    // Now both should have been called
    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn2).toHaveBeenCalledTimes(1);
    expect(mockFn2).toHaveBeenCalledWith('b');
  });

  it('should pass all arguments to the original function', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    // Call with multiple args
    debouncedFn('test', 123, { key: 'value' });

    // Advance timer
    vi.advanceTimersByTime(100);

    // Function should be called with all args
    expect(mockFn).toHaveBeenCalledWith('test', 123, { key: 'value' });
  });
});
