import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { quotaAwareStorage } from '../../utils/quotaAwareStorage';
import { connectivityService } from '../connectivityService';
import { enhancedStorageService } from '../enhancedStorageService';
import { snapshotService } from '../snapshotService';

// Mock dependencies
vi.mock('../connectivityService', () => ({
  connectivityService: {
    getStatus: vi.fn(() => ({ isOnline: true })),
    onStatusChange: vi.fn(() => () => {}),
    queueWrite: vi.fn(async () => {}),
  },
}));

vi.mock('../../utils/quotaAwareStorage', () => ({
  quotaAwareStorage: {
    safeGetItem: vi.fn(),
    safeSetItem: vi.fn(),
    getQuotaInfo: vi.fn(),
    needsMaintenance: vi.fn(),
    emergencyCleanup: vi.fn(),
  },
}));

vi.mock('../snapshotService', () => ({
  snapshotService: {
    createSnapshot: vi.fn(),
    getSnapshotStorageUsage: vi.fn(),
    emergencyCleanup: vi.fn(),
  },
}));

describe('EnhancedStorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Default mock implementations
    (quotaAwareStorage.safeGetItem as any).mockImplementation((key: string) => {
      const v = localStorage.getItem(key);
      return { success: true, data: v ?? '[]' };
    });
    (quotaAwareStorage.safeSetItem as any).mockImplementation(
      async (key: string, value: string) => {
        // Persist to localStorage so subsequent reads work in tests
        localStorage.setItem(key, value);
        return { success: true };
      },
    );
    (quotaAwareStorage.getQuotaInfo as any).mockResolvedValue({ usage: 1000, quota: 5000 });
    (snapshotService.getSnapshotStorageUsage as any).mockReturnValue({
      snapshotCount: 0,
      totalSize: 0,
    });
    (connectivityService.getStatus as any).mockReturnValue({ isOnline: true });

    // Initialize service
    enhancedStorageService.init();
  });

  afterEach(() => {
    enhancedStorageService.cleanup();
    vi.useRealTimers();
  });

  describe('Project Management', () => {
    it('should save and load projects', () => {
      const mockProject = {
        id: 'test-1',
        name: 'Test Project',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      enhancedStorageService.saveProject(mockProject);
      const loaded = enhancedStorageService.loadProject(mockProject.id);
      expect(loaded).toEqual(
        expect.objectContaining({
          id: mockProject.id,
          name: mockProject.name,
        }),
      );
    });

    it('should update project content', () => {
      const mockProject = {
        id: 'test-1',
        name: 'Test Project',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      enhancedStorageService.saveProject(mockProject);
      enhancedStorageService.updateProjectContent(mockProject.id, 'Hello world');
      const updated = enhancedStorageService.loadProject(mockProject.id);
      expect(updated?.currentWordCount).toBe(2);
      expect(updated?.recentContent).toBe('Hello world');
    });

    it('should handle safe project save with validation', async () => {
      const mockProject = {
        id: 'test-1',
        name: 'Test Project',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await enhancedStorageService.saveProjectSafe(mockProject);
      expect(result.success).toBe(true);
      expect(quotaAwareStorage.safeSetItem).toHaveBeenCalled();
    });

    it('should handle project backup before deletion', async () => {
      const mockProject = {
        id: 'test-1',
        name: 'Test Project',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      enhancedStorageService.saveProject(mockProject);
      const result = await enhancedStorageService.deleteProjectSafe(mockProject.id);
      expect(result.success).toBe(true);
      expect(snapshotService.createSnapshot).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          description: 'Backup before deletion',
          tags: ['deletion-backup'],
        }),
      );
    });
  });

  describe('Storage Statistics', () => {
    it('should calculate storage statistics', async () => {
      const mockProject = {
        id: 'test-1',
        name: 'Test Project',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        currentWordCount: 1000,
      };

      enhancedStorageService.saveProject(mockProject);
      const stats = await enhancedStorageService.getStorageStats();
      expect(stats).toMatchObject({
        totalProjects: 1,
        totalWordCount: 1000,
        storageUsed: 1000,
        snapshotCount: 0,
      });
    });

    it('should handle maintenance requests', async () => {
      (quotaAwareStorage.needsMaintenance as any).mockResolvedValue(true);
      (snapshotService.emergencyCleanup as any).mockResolvedValue(5);

      const result = await enhancedStorageService.performMaintenance();
      expect(result.success).toBe(true);
      expect(result.actions).toContain(expect.stringContaining('No maintenance needed'));
    });

    it('should handle auto-snapshots', async () => {
      vi.useFakeTimers();
      enhancedStorageService.setAutoSnapshotEnabled(true);

      const mockProject = {
        id: 'test-1',
        name: 'Test Project',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      enhancedStorageService.saveProject(mockProject);
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000); // 10 minutes

      expect(snapshotService.createSnapshot).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isAutomatic: true,
        }),
      );
    });
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

  describe('Storage Safety and Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      const mockError = new Error('Storage error');
      // Simulate storage layer throwing but service remains resilient
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw mockError;
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockProject = {
        id: 'test-5',
        name: 'Test Project 5',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await enhancedStorageService.saveProjectSafe(mockProject);
      // Current implementation is resilient; should not throw and typically returns success
      expect(result.success).toBe(true);
      // Ensure warnings/errors were logged somewhere in the path
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle quota exceeded errors', async () => {
      (quotaAwareStorage.safeSetItem as any).mockResolvedValueOnce({
        success: false,
        error: { type: 'quota', message: 'Storage quota exceeded' },
      });
      (quotaAwareStorage.emergencyCleanup as any).mockResolvedValueOnce({ freedBytes: 1000 });

      const mockProject = {
        id: 'test-5',
        name: 'Test Project',
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await enhancedStorageService.saveProjectSafe(mockProject);
      expect(quotaAwareStorage.emergencyCleanup).toHaveBeenCalled();
      expect(quotaAwareStorage.safeSetItem).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    it('should queue writes when offline', async () => {
      // Mock connectivity to offline via service API and navigator fallback
      vi.spyOn(connectivityService, 'getStatus').mockReturnValue({
        isOnline: false,
        lastOnline: null,
        lastOffline: new Date(),
        queuedWrites: 0,
        connectionType: 'wifi',
      });
      Object.defineProperty(window.navigator, 'onLine', { value: false });

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
