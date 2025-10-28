/**
 * Unit tests for waitForRoot utility
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { isRootReady, waitForRoot } from '../waitForRoot';

describe('waitForRoot', () => {
  beforeEach(() => {
    // Clean up any existing root
    const existing = document.getElementById('root');
    if (existing) {
      existing.remove();
    }
  });

  afterEach(() => {
    // Clean up after tests
    const existing = document.getElementById('root');
    if (existing) {
      existing.remove();
    }
  });

  it('resolves immediately when root already exists', async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    const result = await waitForRoot('root');
    expect(result).toBe(root);
  });

  it('resolves when root is added after DOMContentLoaded', async () => {
    // Simulate adding root after a delay
    setTimeout(() => {
      const root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    }, 10);

    const result = await waitForRoot('root');
    expect(result).toBeInstanceOf(HTMLElement);
    expect(result.id).toBe('root');
  });

  it('works with custom element ID', async () => {
    const custom = document.createElement('div');
    custom.id = 'custom-root';
    document.body.appendChild(custom);

    const result = await waitForRoot('custom-root');
    expect(result).toBe(custom);
  });

  it('isRootReady returns false when root does not exist', () => {
    expect(isRootReady('root')).toBe(false);
  });

  it('isRootReady returns true when root exists', () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    expect(isRootReady('root')).toBe(true);
  });

  it('throws after timeout if root never appears', async () => {
    // This test will take longer - we're testing the failure case
    // To avoid waiting too long, we'll just verify the promise rejects
    const promise = waitForRoot('nonexistent-root');

    await expect(promise).rejects.toThrow('#nonexistent-root not present after DOMContentLoaded');
  }, 10000); // Give it enough time to fail
});
