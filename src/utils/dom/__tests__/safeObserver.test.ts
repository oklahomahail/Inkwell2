/**
 * Unit tests for hardened utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { safeDisconnect, safeObserve, waitForElement, getPortalTarget } from '../safeObserver';

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

  it('returns false for non-Node target (string)', () => {
    const observer = new MutationObserver(() => {});
    const result = safeObserve(observer, 'not a node', { childList: true });
    expect(result).toBe(false);
  });

  it('returns false for non-Node target (window)', () => {
    const observer = new MutationObserver(() => {});
    const result = safeObserve(observer, window, { childList: true });
    expect(result).toBe(false);
  });

  it('returns true for document (which IS a Node)', () => {
    const observer = new MutationObserver(() => {});
    // document is actually a Node, so this should succeed
    const result = safeObserve(observer, document, { childList: true });
    expect(result).toBe(true);
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

describe('waitForElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns element if it already exists', async () => {
    document.body.innerHTML = '<div id="existing"></div>';
    const result = await waitForElement('#existing', 1000);
    expect(result).toBeTruthy();
    expect(result?.id).toBe('existing');
  });

  it('returns null if element does not appear within timeout', async () => {
    const result = await waitForElement('#nonexistent', 100);
    expect(result).toBeNull();
  });

  it('waits for element to appear', async () => {
    // Add element after a delay
    setTimeout(() => {
      const el = document.createElement('div');
      el.id = 'delayed';
      document.body.appendChild(el);
    }, 50);

    const result = await waitForElement('#delayed', 200);
    expect(result).toBeTruthy();
    expect(result?.id).toBe('delayed');
  });
});

describe('getPortalTarget', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns document.body when no preferredId is provided', () => {
    const result = getPortalTarget();
    expect(result).toBe(document.body);
  });

  it('returns preferred element when it exists', () => {
    const portal = document.createElement('div');
    portal.id = 'my-portal';
    document.body.appendChild(portal);

    const result = getPortalTarget('my-portal');
    expect(result).toBe(portal);
  });

  it('falls back to document.body when preferred element does not exist', () => {
    const result = getPortalTarget('nonexistent-portal');
    expect(result).toBe(document.body);
  });
});
