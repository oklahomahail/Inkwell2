import { beforeEach, describe, expect, it, vi } from 'vitest';

import { quotaAwareStorage } from '../quotaAwareStorage';

describe('QuotaAwareStorage', () => {
  // Mock localStorage
  const mockLocalStorage = {
    data: new Map<string, string>(),
    length: 0,
    key(index: number): string | null {
      return Array.from(this.data.keys())[index] || null;
    },
    getItem(key: string): string | null {
      return this.data.get(key) || null;
    },
    setItem(key: string, value: string): void {
      this.data.set(key, value);
      this.length = this.data.size;
    },
    removeItem(key: string): void {
      this.data.delete(key);
      this.length = this.data.size;
    },
    clear(): void {
      this.data.clear();
      this.length = 0;
    },
  };

  // Mock Storage API
  const mockStorageManager = {
    estimate: vi.fn().mockResolvedValue({
      quota: 100 * 1024 * 1024, // 100MB
      usage: 10 * 1024 * 1024, // 10MB
    }),
  };

  beforeEach(() => {
    // Reset mocks and storage
    vi.restoreAllMocks();
    mockLocalStorage.clear();

    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });

    // Setup Storage API mock
    Object.defineProperty(navigator, 'storage', {
      value: mockStorageManager,
      configurable: true,
    });

    // Spy on console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('Safe Storage Operations', () => {
    describe('safeSetItem', () => {
      it('should write to storage when space is available', async () => {
        const result = await quotaAwareStorage.safeSetItem('test-key', 'test-value');
        expect(result.success).toBe(true);
        expect(localStorage.getItem('test-key')).toBe('test-value');
      });

      it('should handle quota exceeded errors', async () => {
        // Mock Storage API to report near full
        mockStorageManager.estimate.mockResolvedValueOnce({
          quota: 1000,
          usage: 990,
        });

        const result = await quotaAwareStorage.safeSetItem('test-key', 'test-value');
        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('quota');
      });

      it('should notify listeners when approaching quota limits', async () => {
        const listener = vi.fn();
        quotaAwareStorage.onQuotaUpdate(listener);

        // Simulate approaching quota
        mockStorageManager.estimate.mockResolvedValueOnce({
          quota: 1000,
          usage: 850, // 85%, above warning threshold
        });

        await quotaAwareStorage.safeSetItem('test-key', 'test-value');
        expect(listener).toHaveBeenCalled();
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            isNearLimit: true,
          }),
        );
      });

      it('should handle storage errors gracefully', async () => {
        // Mock localStorage to throw
        const mockError = new Error('Storage error');
        vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
          throw mockError;
        });

        const result = await quotaAwareStorage.safeSetItem('test-key', 'test-value');
        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('generic');
      });
    });

    describe('safeGetItem', () => {
      it('should read from storage successfully', () => {
        localStorage.setItem('test-key', 'test-value');
        const result = quotaAwareStorage.safeGetItem('test-key');
        expect(result.success).toBe(true);
        expect(result.data).toBe('test-value');
      });

      it('should handle missing keys gracefully', () => {
        const result = quotaAwareStorage.safeGetItem('nonexistent-key');
        expect(result.success).toBe(true);
        expect(result.data).toBeUndefined();
      });

      it('should handle storage errors', () => {
        vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
          throw new Error('Read error');
        });

        const result = quotaAwareStorage.safeGetItem('test-key');
        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('corruption');
      });
    });

    describe('safeRemoveItem', () => {
      it('should remove items from storage', () => {
        localStorage.setItem('test-key', 'test-value');
        const result = quotaAwareStorage.safeRemoveItem('test-key');
        expect(result.success).toBe(true);
        expect(localStorage.getItem('test-key')).toBeNull();
      });

      it('should handle removal errors gracefully', () => {
        vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
          throw new Error('Remove error');
        });

        const result = quotaAwareStorage.safeRemoveItem('test-key');
        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('generic');
      });
    });
  });

  describe('Quota Management', () => {
    it('should return accurate quota info when Storage API is available', async () => {
      const info = await quotaAwareStorage.getQuotaInfo();
      expect(info.quota).toBe(100 * 1024 * 1024);
      expect(info.usage).toBe(10 * 1024 * 1024);
      expect(info.available).toBe(90 * 1024 * 1024);
      expect(info.percentUsed).toBe(0.1);
    });

    it('should estimate quota from localStorage when Storage API fails', async () => {
      // Remove Storage API
      Object.defineProperty(navigator, 'storage', { value: undefined });

      // Add some data to localStorage
      localStorage.setItem('key1', 'a'.repeat(1000));
      localStorage.setItem('key2', 'b'.repeat(2000));

      const info = await quotaAwareStorage.getQuotaInfo();
      expect(info.usage).toBeGreaterThan(0);
      expect(info.quota).toBe(5 * 1024 * 1024); // 5MB default
    });

    it('should detect when maintenance is needed', async () => {
      mockStorageManager.estimate.mockResolvedValueOnce({
        quota: 1000,
        usage: 900, // 90%, above warning threshold
      });

      const needsMaintenance = await quotaAwareStorage.needsMaintenance();
      expect(needsMaintenance).toBe(true);
    });
  });

  describe('Emergency Cleanup', () => {
    it('should free space by cleaning temporary data', async () => {
      // Add some temp data
      localStorage.setItem('temp_data1', 'x'.repeat(1000));
      localStorage.setItem('cache_data1', 'y'.repeat(2000));
      localStorage.setItem('normal_data', 'z'.repeat(500));

      const result = await quotaAwareStorage.emergencyCleanup();
      expect(result.freedBytes).toBeGreaterThan(0);
      expect(result.actions).toContain(expect.stringContaining('Cleared temporary data'));
      expect(localStorage.getItem('temp_data1')).toBeNull();
      expect(localStorage.getItem('cache_data1')).toBeNull();
      expect(localStorage.getItem('normal_data')).toBe('z'.repeat(500));
    });

    it('should handle cleanup errors gracefully', async () => {
      vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Cleanup error');
      });

      const result = await quotaAwareStorage.emergencyCleanup();
      expect(result.freedBytes).toBe(0);
      expect(result.actions).toContain('Emergency cleanup failed');
    });
  });

  describe('Event Listeners', () => {
    it('should manage quota update listeners', async () => {
      const listener = vi.fn();
      const cleanup = quotaAwareStorage.onQuotaUpdate(listener);

      // Trigger a quota update
      mockStorageManager.estimate.mockResolvedValueOnce({
        quota: 1000,
        usage: 900,
      });

      await quotaAwareStorage.safeSetItem('test', 'value');
      expect(listener).toHaveBeenCalled();

      // Cleanup listener
      cleanup();

      // Should not call removed listener
      listener.mockClear();
      await quotaAwareStorage.safeSetItem('test2', 'value2');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should manage error listeners', async () => {
      const listener = vi.fn();
      const cleanup = quotaAwareStorage.onStorageError(listener);

      // Trigger a storage error
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Test error');
      });

      await quotaAwareStorage.safeSetItem('test', 'value');
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'generic',
        }),
      );

      // Cleanup listener
      cleanup();

      // Should not call removed listener
      listener.mockClear();
      await quotaAwareStorage.safeSetItem('test2', 'value2');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle errors in listeners gracefully', async () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      quotaAwareStorage.onQuotaUpdate(errorListener);
      quotaAwareStorage.onStorageError(errorListener);

      // These should not throw despite listener errors
      await expect(quotaAwareStorage.safeSetItem('test', 'value')).resolves.toBeDefined();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/listener error/i),
        expect.any(Error),
      );
    });
  });
});
