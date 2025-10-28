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
      localStorage.setItem('inkwell-theme', 'dark');
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
      localStorage.setItem('inkwell-theme', 'light');

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
  });

  describe('setTheme', () => {
    it('persists theme to localStorage', () => {
      setTheme('dark');
      expect(localStorage.getItem('inkwell-theme')).toBe('dark');
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
