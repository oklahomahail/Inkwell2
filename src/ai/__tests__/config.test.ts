/**
 * Tests for AI Configuration - API Key Management
 *
 * Tests the user API key override system and priority logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  getApiKey,
  hasApiKey,
  getAvailableProviders,
  setUserApiKey,
  removeUserApiKey,
} from '../config';

describe('AI Config - API Key Management', () => {
  const USER_KEYS_STORAGE_KEY = 'inkwell_user_api_keys';
  let originalEnv: any;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...import.meta.env };

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    // Restore environment
    Object.keys(import.meta.env).forEach((key) => {
      delete (import.meta.env as any)[key];
    });
    Object.assign(import.meta.env, originalEnv);

    // Clear localStorage
    localStorage.clear();
  });

  describe('getApiKey', () => {
    it('should return environment variable when no user override exists', () => {
      import.meta.env.VITE_OPENAI_API_KEY = 'sk-env-key';

      const key = getApiKey('openai');

      expect(key).toBe('sk-env-key');
    });

    it('should prioritize user override over environment variable', () => {
      import.meta.env.VITE_OPENAI_API_KEY = 'sk-env-key';
      setUserApiKey('openai', 'sk-user-override');

      const key = getApiKey('openai');

      expect(key).toBe('sk-user-override');
    });

    it('should return undefined when no key is available', () => {
      const key = getApiKey('openai');

      expect(key).toBeUndefined();
    });

    it('should return user override even when environment is undefined', () => {
      setUserApiKey('openai', 'sk-user-only');

      const key = getApiKey('openai');

      expect(key).toBe('sk-user-only');
    });

    it('should work for all supported providers', () => {
      import.meta.env.VITE_OPENAI_API_KEY = 'sk-openai';
      import.meta.env.VITE_ANTHROPIC_API_KEY = 'sk-ant';
      import.meta.env.VITE_GOOGLE_API_KEY = 'AIza';

      expect(getApiKey('openai')).toBe('sk-openai');
      expect(getApiKey('anthropic')).toBe('sk-ant');
      expect(getApiKey('google')).toBe('AIza');
    });
  });

  describe('setUserApiKey', () => {
    it('should store user API key in localStorage', () => {
      setUserApiKey('openai', 'sk-user-key');

      const stored = localStorage.getItem(USER_KEYS_STORAGE_KEY);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.openai).toBe('sk-user-key');
    });

    it('should preserve other provider keys when setting one', () => {
      setUserApiKey('openai', 'sk-openai');
      setUserApiKey('anthropic', 'sk-ant');

      const stored = localStorage.getItem(USER_KEYS_STORAGE_KEY);
      const parsed = JSON.parse(stored!);

      expect(parsed.openai).toBe('sk-openai');
      expect(parsed.anthropic).toBe('sk-ant');
    });

    it('should overwrite existing user key for same provider', () => {
      setUserApiKey('openai', 'sk-old');
      setUserApiKey('openai', 'sk-new');

      const key = getApiKey('openai');
      expect(key).toBe('sk-new');
    });

    it('should handle special characters in API keys', () => {
      const specialKey = 'sk-proj_1234-ABCD+/=';
      setUserApiKey('openai', specialKey);

      const key = getApiKey('openai');
      expect(key).toBe(specialKey);
    });
  });

  describe('removeUserApiKey', () => {
    it('should remove user override and fall back to environment', () => {
      import.meta.env.VITE_OPENAI_API_KEY = 'sk-env';
      setUserApiKey('openai', 'sk-user');

      expect(getApiKey('openai')).toBe('sk-user');

      removeUserApiKey('openai');

      expect(getApiKey('openai')).toBe('sk-env');
    });

    it('should handle removing non-existent key gracefully', () => {
      expect(() => removeUserApiKey('openai')).not.toThrow();
    });

    it('should preserve other provider keys when removing one', () => {
      setUserApiKey('openai', 'sk-openai');
      setUserApiKey('anthropic', 'sk-ant');

      removeUserApiKey('openai');

      expect(getApiKey('openai')).toBeUndefined();
      expect(getApiKey('anthropic')).toBe('sk-ant');
    });

    it('should completely remove key from localStorage', () => {
      setUserApiKey('openai', 'sk-user');
      removeUserApiKey('openai');

      const stored = localStorage.getItem(USER_KEYS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};

      expect(parsed.openai).toBeUndefined();
    });
  });

  describe('hasApiKey', () => {
    it('should return true when environment key exists', () => {
      import.meta.env.VITE_OPENAI_API_KEY = 'sk-env';

      expect(hasApiKey('openai')).toBe(true);
    });

    it('should return true when user override exists', () => {
      setUserApiKey('openai', 'sk-user');

      expect(hasApiKey('openai')).toBe(true);
    });

    it('should return false when no key exists', () => {
      expect(hasApiKey('openai')).toBe(false);
    });

    it('should prioritize user override in check', () => {
      setUserApiKey('openai', 'sk-user');

      expect(hasApiKey('openai')).toBe(true);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return only providers with API keys', () => {
      import.meta.env.VITE_OPENAI_API_KEY = 'sk-openai';
      import.meta.env.VITE_GOOGLE_API_KEY = 'AIza';

      const available = getAvailableProviders();

      expect(available).toContain('openai');
      expect(available).toContain('google');
      expect(available).not.toContain('anthropic');
    });

    it('should include providers with user overrides', () => {
      setUserApiKey('anthropic', 'sk-ant');

      const available = getAvailableProviders();

      expect(available).toContain('anthropic');
    });

    it('should return empty array when no keys exist', () => {
      const available = getAvailableProviders();

      expect(available).toEqual([]);
    });

    it('should return all providers when all keys exist', () => {
      import.meta.env.VITE_OPENAI_API_KEY = 'sk-openai';
      import.meta.env.VITE_ANTHROPIC_API_KEY = 'sk-ant';
      import.meta.env.VITE_GOOGLE_API_KEY = 'AIza';

      const available = getAvailableProviders();

      expect(available).toHaveLength(3);
      expect(available).toContain('openai');
      expect(available).toContain('anthropic');
      expect(available).toContain('google');
    });
  });

  describe('localStorage Error Handling', () => {
    it('should handle localStorage errors gracefully when setting', () => {
      const mockSetItem = vi.fn(() => {
        throw new Error('localStorage is full');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(mockSetItem);

      expect(() => setUserApiKey('openai', 'sk-key')).not.toThrow();

      vi.restoreAllMocks();
    });

    it('should handle localStorage errors gracefully when getting', () => {
      const mockGetItem = vi.fn(() => {
        throw new Error('localStorage unavailable');
      });
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(mockGetItem);

      import.meta.env.VITE_OPENAI_API_KEY = 'sk-env';
      const key = getApiKey('openai');

      // Should fall back to environment variable
      expect(key).toBe('sk-env');

      vi.restoreAllMocks();
    });

    it('should handle corrupt localStorage data', () => {
      localStorage.setItem(USER_KEYS_STORAGE_KEY, 'invalid json {{{');

      import.meta.env.VITE_OPENAI_API_KEY = 'sk-env';
      const key = getApiKey('openai');

      // Should fall back to environment variable
      expect(key).toBe('sk-env');
    });
  });

  describe('Priority System Integration', () => {
    it('should demonstrate complete priority chain', () => {
      // Start with environment only
      import.meta.env.VITE_OPENAI_API_KEY = 'sk-env';
      expect(getApiKey('openai')).toBe('sk-env');

      // Add user override - should take priority
      setUserApiKey('openai', 'sk-user');
      expect(getApiKey('openai')).toBe('sk-user');

      // Remove user override - should fall back to environment
      removeUserApiKey('openai');
      expect(getApiKey('openai')).toBe('sk-env');
    });

    it('should handle switching between providers', () => {
      setUserApiKey('openai', 'sk-openai-user');
      setUserApiKey('anthropic', 'sk-ant-user');

      expect(getApiKey('openai')).toBe('sk-openai-user');
      expect(getApiKey('anthropic')).toBe('sk-ant-user');

      removeUserApiKey('openai');

      expect(getApiKey('openai')).toBeUndefined();
      expect(getApiKey('anthropic')).toBe('sk-ant-user');
    });
  });
});
