/**
 * Unit tests for hardened utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { safeDisconnect, safeObserve } from '../safeObserver';

describe('safeObserver', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test"></div>';
  });

  it('returns false for null target', () => {
    const observer = new MutationObserver(() => {});
    const result = safeObserve(observer, null, { childList: true });
    expect(result).toBe(false);
  });

  it('returns false for undefined target', () => {
    const observer = new MutationObserver(() => {});
    const result = safeObserve(observer, undefined, { childList: true });
    expect(result).toBe(false);
  });

  it('returns false for non-Node target', () => {
    const observer = new MutationObserver(() => {});
    // @ts-expect-error - testing invalid input
    const result = safeObserve(observer, 'not a node', { childList: true });
    expect(result).toBe(false);
  });

  it('returns true for valid target', () => {
    const observer = new MutationObserver(() => {});
    const target = document.getElementById('test');
    const result = safeObserve(observer, target, { childList: true });
    expect(result).toBe(true);
  });

  it('does not throw on null/undefined', () => {
    const observer = new MutationObserver(() => {});
    expect(() => safeObserve(observer, null, { childList: true })).not.toThrow();
    expect(() => safeObserve(observer, undefined, { childList: true })).not.toThrow();
  });

  it('safeDisconnect does not throw for null observer', () => {
    expect(() => safeDisconnect(null)).not.toThrow();
  });

  it('safeDisconnect does not throw for undefined observer', () => {
    expect(() => safeDisconnect(undefined)).not.toThrow();
  });

  it('safeDisconnect successfully disconnects valid observer', () => {
    const callback = vi.fn();
    const observer = new MutationObserver(callback);
    const target = document.getElementById('test');
    safeObserve(observer, target, { childList: true });

    // Trigger a mutation
    target!.innerHTML = '<span>changed</span>';

    // Disconnect
    safeDisconnect(observer);

    // Further mutations should not trigger callback
    const callCount = callback.mock.calls.length;
    target!.innerHTML = '<span>changed again</span>';

    // Give it a tick to potentially fire
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(callback.mock.calls.length).toBe(callCount);
        resolve(undefined);
      }, 50);
    });
  });
});
