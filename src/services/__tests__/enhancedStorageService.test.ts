import { describe, it, expect, vi, beforeEach } from 'vitest';

import connectivityService from '../connectivityService';
import { enhancedStorageService } from '../enhancedStorageService';

describe('EnhancedStorageService', () => {
  beforeEach(() => {
    // initialize service explicitly for tests
    try {
      enhancedStorageService.cleanup();
    } catch {}
    try {
      enhancedStorageService.init();
    } catch {}
    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });

    // Reset storage
    localStorage.clear();
    sessionStorage.clear();

    // Mock storage methods
    vi.spyOn(localStorage, 'getItem').mockReturnValue(null);
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {});

    // Mock window.dispatchEvent to simulate connectivity changes
    vi.spyOn(window, 'dispatchEvent').mockImplementation((event) => {
      if (event.type === 'online' || event.type === 'offline') {
        connectivityService.onStatusChange((status) => {
          console.log('Status changed:', status);
        });
      }
      return true;
    });

    vi.clearAllMocks();
  });

  describe('Connectivity Integration', () => {
    it('should initialize connectivity monitoring', () => {
      // Re-initialize with spy before init
      vi.spyOn(connectivityService, 'onStatusChange');
      enhancedStorageService.cleanup();
      enhancedStorageService.init();
      const onStatusChangeSpy = vi.spyOn(connectivityService, 'onStatusChange');

      // Re-initialize service
      enhancedStorageService.cleanup();
      enhancedStorageService.init();

      const mockProject = {
        id: 'test-1',
        name: 'Test Project',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save project to trigger connectivity check
      enhancedStorageService.saveProject(mockProject);

      expect(onStatusChangeSpy).toHaveBeenCalled();
    });

    it('should handle connectivity status errors', () => {
      const mockError = new Error('Connectivity error');
      vi.spyOn(connectivityService, 'onStatusChange').mockImplementation(() => {
        throw mockError;
      });

      const consoleErrorSpy = vi.spyOn(console, 'error');

      const mockProject = {
        id: 'test-2',
        name: 'Test Project 2',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Should not throw when saving
      expect(() => enhancedStorageService.saveProject(mockProject)).not.toThrow();
    });

    it('should handle undefined status gracefully', () => {
      vi.spyOn(connectivityService, 'onStatusChange').mockImplementation((cb) => {
        // @ts-ignore - Testing invalid case
        cb(undefined);
        return () => {};
      });

      const mockProject = {
        id: 'test-3',
        name: 'Test Project 3',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Should not throw
      expect(() => enhancedStorageService.saveProject(mockProject)).not.toThrow();
    });

    it('should handle invalid status properties', () => {
      vi.spyOn(connectivityService, 'onStatusChange').mockImplementation((cb) => {
        // @ts-ignore - Testing invalid case
        cb({
          isOnline: 'not a boolean',
          queuedWrites: 'not a number',
        });
        return () => {};
      });

      const mockProject = {
        id: 'test-4',
        name: 'Test Project 4',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Should not throw
      expect(() => enhancedStorageService.saveProject(mockProject)).not.toThrow();
    });
  });

  describe('Storage Safety', () => {
    it('should handle storage errors gracefully', async () => {
      const mockError = new Error('Storage error');
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw mockError;
      });
      vi.spyOn(connectivityService, 'queueWrite').mockImplementation(() => {
        throw mockError;
      });

      const mockProject = {
        id: 'test-5',
        name: 'Test Project 5',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await enhancedStorageService.saveProjectSafe(mockProject);
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Storage error');
    });

    it('should queue writes when offline', async () => {
      // Force offline
      Object.defineProperty(window.navigator, 'onLine', { value: false });
      // Trigger connectivity check
      window.dispatchEvent(new Event('offline'));

      const mockProject = {
        id: 'test-6',
        name: 'Test Project 6',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const queueWriteSpy = vi.spyOn(connectivityService, 'queueWrite').mockResolvedValue();
      const result = await enhancedStorageService.saveProjectSafe(mockProject);

      // Allow any microtasks to complete
      await Promise.resolve();

      expect(queueWriteSpy).toHaveBeenCalledWith('save', expect.any(String), expect.any(String));
      expect(result.success).toBe(true);
      expect(result.message).toBe('queued');
    });
  });
});
