/**
 * Unit tests for theme utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { getTheme, isDarkMode, setTheme, toggleTheme } from '../theme';

describe('theme utilities', () => {
  beforeEach(() => {
    // Clean up localStorage and DOM state
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    delete document.documentElement.dataset.theme;
  });

  describe('Theme init respects localStorage over prefers-color-scheme', () => {
    it('uses localStorage value when present', () => {
      localStorage.setItem('theme', 'dark');
      const theme = getTheme();
      expect(theme).toBe('dark');
    });

    it('defaults to light when no localStorage and no system preference', () => {
      // Mock matchMedia to return false for dark mode
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const theme = getTheme();
      expect(theme).toBe('light');
    });

    it('uses system preference when no localStorage', () => {
      // Mock matchMedia to prefer dark mode
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const theme = getTheme();
      expect(theme).toBe('dark');
    });

    it('localStorage "light" overrides dark system preference', () => {
      localStorage.setItem('theme', 'light');

      // Mock matchMedia to prefer dark mode
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const theme = getTheme();
      expect(theme).toBe('light');
    });

    it('falls back to system preference when localStorage throws', () => {
      // Mock localStorage.getItem to throw
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('Storage access denied');
      });

      // Mock matchMedia to prefer dark mode
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const theme = getTheme();
      expect(theme).toBe('dark');

      // Restore
      Storage.prototype.getItem = originalGetItem;
    });

    it('defaults to light when both localStorage and system preference unavailable', () => {
      // Mock localStorage to throw
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      // Mock matchMedia to return false
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const theme = getTheme();
      expect(theme).toBe('light');

      // Restore
      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe('setTheme', () => {
    it('persists theme to localStorage', () => {
      setTheme('dark');
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('adds dark class when theme is dark', () => {
      setTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class when theme is light', () => {
      document.documentElement.classList.add('dark');
      setTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('never adds light class', () => {
      setTheme('light');
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('still applies theme class when localStorage fails', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      setTheme('dark');

      // Should still apply the class despite storage failure
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Restore
      Storage.prototype.setItem = originalSetItem;
    });

    it('dispatches themechange event', () => {
      const listener = vi.fn();
      window.addEventListener('themechange', listener);

      setTheme('dark');

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].detail).toBe('dark');

      window.removeEventListener('themechange', listener);
    });

    it('handles event dispatch failure gracefully', () => {
      // Mock localStorage to fail
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      // Mock dispatchEvent to fail on second call
      const originalDispatch = window.dispatchEvent;
      let callCount = 0;
      window.dispatchEvent = vi.fn(() => {
        callCount++;
        if (callCount > 0) throw new Error('Dispatch error');
        return true;
      });

      // Should not throw
      expect(() => setTheme('dark')).not.toThrow();

      // Restore
      Storage.prototype.setItem = originalSetItem;
      window.dispatchEvent = originalDispatch;
    });
  });

  describe('toggleTheme', () => {
    it('toggles from light to dark', () => {
      setTheme('light');
      const result = toggleTheme();
      expect(result).toBe('dark');
      expect(isDarkMode()).toBe(true);
    });

    it('toggles from dark to light', () => {
      setTheme('dark');
      const result = toggleTheme();
      expect(result).toBe('light');
      expect(isDarkMode()).toBe(false);
    });
  });

  describe('isDarkMode', () => {
    it('returns true when dark class is present', () => {
      document.documentElement.classList.add('dark');
      expect(isDarkMode()).toBe(true);
    });

    it('returns false when dark class is not present', () => {
      document.documentElement.classList.remove('dark');
      expect(isDarkMode()).toBe(false);
    });
  });
});
