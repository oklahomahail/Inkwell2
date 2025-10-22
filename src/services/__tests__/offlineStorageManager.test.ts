// src/services/__tests__/offlineStorageManager.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { OfflineStorageManager } from '../pwaService';

describe('OfflineStorageManager', () => {
  // Mock localStorage
  const mockLocalStorage = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  // Mock navigator.storage
  const mockStorageEstimate = vi.fn().mockResolvedValue({
    quota: 100000000,
    usage: 25000000,
  });

  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });

    // Setup navigator.storage mock
    Object.defineProperty(global.navigator, 'storage', {
      value: {
        estimate: mockStorageEstimate,
      },
      configurable: true,
    });

    // Clear mock calls between tests
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('Draft Management', () => {
    it('should save drafts to localStorage', () => {
      const projectId = 'test-project-123';
      const content = 'This is a test draft content';

      OfflineStorageManager.saveDraft(projectId, content);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'inkwell_draft_test-project-123',
        expect.any(String),
      );

      // Verify setItem was called with the expected data
      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const savedValue = JSON.parse(setItemCall[1]);
      expect(savedValue).toMatchObject({
        content,
        projectId,
        timestamp: expect.any(Number),
      });
    });

    it('should retrieve drafts from localStorage', () => {
      // Setup mock data
      const projectId = 'test-project-123';
      const content = 'This is a test draft content';
      const mockDraft = {
        content,
        timestamp: Date.now(),
        projectId,
      };

      // Mock the localStorage response
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(mockDraft));

      const result = OfflineStorageManager.getDraft(projectId);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('inkwell_draft_test-project-123');
      expect(result).toMatchObject({
        content,
        timestamp: expect.any(Number),
      });
    });

    it('should handle errors when getting a draft', () => {
      // Mock localStorage to throw an error
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Mock localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = OfflineStorageManager.getDraft('non-existent-project');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get draft:', expect.any(Error));
      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should remove drafts from localStorage', () => {
      const projectId = 'test-project-123';

      OfflineStorageManager.removeDraft(projectId);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('inkwell_draft_test-project-123');
    });

    it('should handle errors when removing a draft', () => {
      // Mock localStorage to throw an error
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Mock localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      OfflineStorageManager.removeDraft('test-project');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to remove draft:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Sync Queue Management', () => {
    it('should add operations to sync queue', () => {
      // Initial empty queue
      mockLocalStorage.getItem.mockReturnValueOnce('[]');

      const operation = {
        type: 'save' as const,
        projectId: 'test-project-123',
        data: { title: 'Test Project' },
        timestamp: Date.now(),
      };

      OfflineStorageManager.addToSyncQueue(operation);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('inkwell_sync_queue');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'inkwell_sync_queue',
        expect.stringContaining('test-project-123'),
      );

      // Verify the stored queue
      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const savedQueue = JSON.parse(setItemCall[1]);
      expect(savedQueue).toEqual([operation]);
    });

    it('should retrieve the sync queue', () => {
      // Setup mock queue
      const mockQueue = [
        {
          type: 'save',
          projectId: 'test-project-1',
          data: { title: 'Project 1' },
          timestamp: Date.now(),
        },
        {
          type: 'delete',
          projectId: 'test-project-2',
          data: null,
          timestamp: Date.now(),
        },
      ];

      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(mockQueue));

      const queue = OfflineStorageManager.getSyncQueue();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('inkwell_sync_queue');
      expect(queue).toEqual(mockQueue);
    });

    it('should return an empty array when no queue exists', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(null);

      const queue = OfflineStorageManager.getSyncQueue();

      expect(queue).toEqual([]);
    });

    it('should clear the sync queue', () => {
      OfflineStorageManager.clearSyncQueue();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('inkwell_sync_queue');
    });

    it('should handle errors when adding to sync queue', () => {
      // Mock localStorage to throw an error during setItem
      mockLocalStorage.getItem.mockReturnValueOnce('[]');
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Mock localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      OfflineStorageManager.addToSyncQueue({
        type: 'save',
        projectId: 'test',
        data: {},
        timestamp: Date.now(),
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to add to sync queue:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Storage Info', () => {
    it('should retrieve storage quota information', async () => {
      const info = await OfflineStorageManager.getStorageInfo();

      expect(mockStorageEstimate).toHaveBeenCalled();
      expect(info).toEqual({
        quota: 100000000,
        usage: 25000000,
        percentUsed: 25,
      });
    });

    it('should handle errors when getting storage info', async () => {
      // Mock navigator.storage to throw an error
      mockStorageEstimate.mockRejectedValueOnce(new Error('Storage estimate error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const info = await OfflineStorageManager.getStorageInfo();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get storage info:', expect.any(Error));
      expect(info).toEqual({
        quota: 0,
        usage: 0,
        percentUsed: 0,
      });

      consoleSpy.mockRestore();
    });

    it('should handle browsers without storage estimate API', async () => {
      // Create a mock storage object without estimate method
      const mockStorage = {};

      // Replace storage
      Object.defineProperty(global.navigator, 'storage', {
        value: mockStorage,
        configurable: true,
      });

      const info = await OfflineStorageManager.getStorageInfo();

      // Restore original navigator.storage with estimate method
      Object.defineProperty(global.navigator, 'storage', {
        value: { estimate: mockStorageEstimate },
        configurable: true,
      });

      expect(info).toEqual({
        quota: 0,
        usage: 0,
        percentUsed: 0,
      });
    });

    it('should handle browsers without storage API entirely', async () => {
      // Remove storage property
      const originalStorage = global.navigator.storage;
      delete (global.navigator as any).storage;

      const info = await OfflineStorageManager.getStorageInfo();

      // Restore original navigator.storage
      Object.defineProperty(global.navigator, 'storage', {
        value: originalStorage,
        configurable: true,
      });

      expect(info).toEqual({
        quota: 0,
        usage: 0,
        percentUsed: 0,
      });
    });
  });

  describe('Error handling - edge cases', () => {
    it('should handle errors when saving a draft', () => {
      // Mock localStorage to throw an error during setItem
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Mock localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      OfflineStorageManager.saveDraft('test-project', 'draft content');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save draft:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in drafts', () => {
      // Setup invalid JSON in localStorage
      mockLocalStorage.getItem.mockReturnValueOnce('{"invalid json":}');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = OfflineStorageManager.getDraft('test-project');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get draft:', expect.any(Error));
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in sync queue', () => {
      // Setup invalid JSON in localStorage
      mockLocalStorage.getItem.mockReturnValueOnce('{"invalid json":}');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = OfflineStorageManager.getSyncQueue();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get sync queue:', expect.any(Error));
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should handle errors when clearing sync queue', () => {
      // Mock localStorage to throw an error
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Mock localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      OfflineStorageManager.clearSyncQueue();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear sync queue:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle quota exceeded error when saving draft', () => {
      // Mock localStorage to throw a specific quota exceeded error
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      OfflineStorageManager.saveDraft('test-project', 'large content');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save draft:',
        expect.objectContaining({
          name: 'QuotaExceededError',
        }),
      );
      consoleSpy.mockRestore();
    });
  });
});
