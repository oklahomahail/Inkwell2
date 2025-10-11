import { describe, it, expect, vi, beforeEach } from 'vitest';

import connectivityService from '../connectivityService';
import { enhancedStorageService } from '../enhancedStorageService';

describe('EnhancedStorageService', () => {
  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });

    // Reset storage
    localStorage.clear();
    sessionStorage.clear();

    vi.clearAllMocks();
  });

  describe('Connectivity Integration', () => {
    it('should initialize connectivity monitoring', () => {
      const onStatusChangeSpy = vi.spyOn(connectivityService, 'onStatusChange');

      // Re-initialize service
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

      // Should log the error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize connectivity monitoring:',
        mockError,
      );
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
    it('should handle storage errors gracefully', () => {
      const mockError = new Error('Storage error');
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw mockError;
      });

      const mockProject = {
        id: 'test-5',
        name: 'Test Project 5',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = enhancedStorageService.saveProjectSafe(mockProject);
      expect(result).toEqual({
        success: false,
        error: mockError,
      });

      localStorage.setItem = originalSetItem;
    });

    it('should queue writes when offline', async () => {
      Object.defineProperty(window.navigator, 'onLine', { value: false });

      const mockProject = {
        id: 'test-6',
        name: 'Test Project 6',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const queueWriteSpy = vi.spyOn(connectivityService, 'queueWrite');
      await enhancedStorageService.saveProjectSafe(mockProject);

      expect(queueWriteSpy).toHaveBeenCalled();
    });
  });
});
