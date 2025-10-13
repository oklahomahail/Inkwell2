import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockConnectivityService, resetMocks } from '../../test/mocks/mockConnectivityService';
import { snapshotService } from '../snapshotService';

// Mock services and storage
vi.mock('../connectivityService', async () => ({
  connectivityService: mockConnectivityService,
}));

beforeEach(() => {
  resetMocks(); // Reset mock connectivity service
  vi.clearAllMocks();
  localStorageMock.clear();

  console.log = vi.fn();
  console.error = vi.fn();
  console.warn = vi.fn();

  // Reset Date.now to return a fixed timestamp
  vi.setSystemTime(new Date('2025-01-01'));
});

// Mock localStorage
const mockStorage: { [key: string]: string } = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
  length: 0,
  key: vi.fn((index: number) => Object.keys(mockStorage)[index]),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

afterEach(() => {
  vi.useRealTimers();
});

describe('SnapshotService', () => {
  const mockProject = {
    id: 'test-project',
    title: 'Test Project',
    name: 'Test Project',
    description: 'Test Description',
    chapters: [],
    characters: [],
    beatSheet: [],
    version: '1.0.0',
    currentWordCount: 1000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    // Reset Date.now to return a fixed timestamp
    vi.setSystemTime(new Date('2025-01-01'));
  });

  describe('Snapshot Creation', () => {
    it('should create a snapshot with default options', async () => {
      const metadata = await snapshotService.createSnapshot(mockProject);

      expect(metadata).toMatchObject({
        projectId: mockProject.id,
        version: mockProject.version,
        wordCount: mockProject.currentWordCount,
        isAutomatic: false,
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Snapshot created:'),
        expect.any(Object),
      );
    });

    it('should create a snapshot with custom options', async () => {
      const options = {
        description: 'Custom snapshot',
        isAutomatic: true,
        tags: ['test'],
      };

      const metadata = await snapshotService.createSnapshot(mockProject, options);

      expect(metadata).toMatchObject({
        description: options.description,
        isAutomatic: options.isAutomatic,
        tags: options.tags,
      });
    });

    it('should handle invalid project data', async () => {
      const invalidProject = { ...mockProject, id: undefined };

      await expect(
        // @ts-expect-error Testing invalid data
        snapshotService.createSnapshot(invalidProject),
      ).rejects.toThrow('Cannot snapshot invalid project');
    });

    it('should handle storage errors', async () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      await expect(snapshotService.createSnapshot(mockProject)).rejects.toThrow(
        'Snapshot creation failed',
      );
    });
  });

  describe('Snapshot Retrieval', () => {
    it('should get all snapshots for a project', async () => {
      await snapshotService.createSnapshot(mockProject);
      await snapshotService.createSnapshot(mockProject, { description: 'Second snapshot' });

      const snapshots = await snapshotService.getSnapshots(mockProject.id);
      expect(snapshots).toHaveLength(2);
      expect(snapshots[0].projectId).toBe(mockProject.id);
    });

    it('should sort snapshots by timestamp descending', async () => {
      // Create snapshots with different timestamps
      vi.setSystemTime(new Date('2025-01-01'));
      await snapshotService.createSnapshot(mockProject);

      vi.setSystemTime(new Date('2025-01-02'));
      await snapshotService.createSnapshot(mockProject);

      const snapshots = await snapshotService.getSnapshots(mockProject.id);
      expect(new Date(snapshots[0].timestamp).getTime()).toBeGreaterThan(
        new Date(snapshots[1].timestamp).getTime(),
      );
    });

    it('should handle storage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const snapshots = await snapshotService.getSnapshots(mockProject.id);
      expect(snapshots).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load snapshot index:',
        expect.any(Error),
      );
    });
  });

  describe('Snapshot Restoration', () => {
    it('should restore a project from snapshot', async () => {
      const metadata = await snapshotService.createSnapshot(mockProject);
      const restored = await snapshotService.restoreSnapshot(metadata.id);

      expect(restored).toEqual(mockProject);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Snapshot restored:'));
    });

    it('should handle non-existent snapshots', async () => {
      await expect(snapshotService.restoreSnapshot('non-existent')).rejects.toThrow(
        'Snapshot non-existent not found',
      );
    });

    it('should validate restored data', async () => {
      const metadata = await snapshotService.createSnapshot(mockProject);

      // Corrupt the snapshot data
      const snapshotKey = `inkwell_snapshot_${metadata.id}`;
      const corruptData = { metadata, project: { ...mockProject, id: undefined } };
      localStorageMock.setItem(snapshotKey, JSON.stringify(corruptData));

      await expect(snapshotService.restoreSnapshot(metadata.id)).rejects.toThrow(
        'Invalid project data in snapshot',
      );
    });

    it('should warn on checksum mismatch', async () => {
      const metadata = await snapshotService.createSnapshot(mockProject);

      // Modify the project data but keep the original checksum
      const snapshotKey = `inkwell_snapshot_${metadata.id}`;
      const snapshotData = JSON.parse(localStorageMock.getItem(snapshotKey)!);
      snapshotData.project = { ...mockProject, name: 'Modified Project' };
      localStorageMock.setItem(snapshotKey, JSON.stringify(snapshotData));

      await snapshotService.restoreSnapshot(metadata.id);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Checksum mismatch'));
    });
  });

  describe('Snapshot Deletion', () => {
    it('should delete a snapshot', async () => {
      const metadata = await snapshotService.createSnapshot(mockProject);
      await snapshotService.deleteSnapshot(metadata.id);

      const snapshots = await snapshotService.getSnapshots(mockProject.id);
      expect(snapshots).toHaveLength(0);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Snapshot deleted:'));
    });

    it('should update snapshot index after deletion', async () => {
      const metadata = await snapshotService.createSnapshot(mockProject);
      await snapshotService.deleteSnapshot(metadata.id);

      const indexStr = localStorageMock.getItem('inkwell_snapshot_index');
      const index = indexStr ? JSON.parse(indexStr) : [];
      expect(index).toHaveLength(0);
    });

    it('should handle deletion errors', async () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      await expect(snapshotService.deleteSnapshot('test-id')).rejects.toThrow(
        'Snapshot deletion failed',
      );
    });
  });

  describe('Automatic Snapshots', () => {
    beforeEach(() => {
      // Ensure a clean timer state before faking timers
      vi.useRealTimers();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      snapshotService.stopAutoSnapshots();
    });

    it('should start and stop auto snapshots', () => {
      snapshotService.startAutoSnapshots(mockProject);
      expect(console.log).toHaveBeenCalledWith('Auto-snapshots started');

      snapshotService.stopAutoSnapshots();
      expect(console.log).toHaveBeenCalledWith('Auto-snapshots stopped');
    });

    it('should create auto snapshots at intervals', async () => {
      snapshotService.startAutoSnapshots(mockProject);

      // Fast-forward 10 minutes
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

      const snapshots = await snapshotService.getSnapshots(mockProject.id);
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].isAutomatic).toBe(true);
      expect(snapshots[0].tags).toContain('auto');
    });

    it('should handle errors in auto snapshot creation', async () => {
      // Mock an error in createSnapshot
      const createSnapshotSpy = vi.spyOn(snapshotService, 'createSnapshot');
      createSnapshotSpy.mockRejectedValueOnce(new Error('Auto-snapshot error'));

      snapshotService.startAutoSnapshots(mockProject);
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

      expect(console.error).toHaveBeenCalledWith('Auto-snapshot failed:', expect.any(Error));

      createSnapshotSpy.mockRestore();
    });
  });

  describe('Storage Management', () => {
    it('should calculate storage usage', async () => {
      await snapshotService.createSnapshot(mockProject);
      await snapshotService.createSnapshot(mockProject);

      const usage = snapshotService.getSnapshotStorageUsage();
      expect(usage.snapshotCount).toBe(2);
      expect(usage.totalSize).toBeGreaterThan(0);
      expect(usage.details).toHaveLength(2);
    });

    it('should handle storage errors in usage calculation', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const usage = snapshotService.getSnapshotStorageUsage();
      expect(usage).toEqual({
        totalSize: 0,
        snapshotCount: 0,
        details: [],
      });
    });

    it('should perform emergency cleanup', async () => {
      // Create multiple snapshots
      for (let i = 0; i < 10; i++) {
        await snapshotService.createSnapshot(mockProject);
      }

      const deletedCount = await snapshotService.emergencyCleanup(mockProject.id, 5);
      expect(deletedCount).toBe(5);

      const remainingSnapshots = await snapshotService.getSnapshots(mockProject.id);
      expect(remainingSnapshots).toHaveLength(5);
    });

    it('should handle errors in emergency cleanup', async () => {
      const getSnapshotsSpy = vi.spyOn(snapshotService, 'getSnapshots');
      getSnapshotsSpy.mockRejectedValueOnce(new Error('Cleanup error'));

      const deletedCount = await snapshotService.emergencyCleanup(mockProject.id);
      expect(deletedCount).toBe(0);
      expect(console.error).toHaveBeenCalledWith('Emergency cleanup failed:', expect.any(Error));

      getSnapshotsSpy.mockRestore();
    });

    it('should automatically cleanup old snapshots', async () => {
      // Create more than MAX_SNAPSHOTS automatic snapshots
      for (let i = 0; i < 20; i++) {
        await snapshotService.createSnapshot(mockProject, {
          isAutomatic: true,
          tags: ['auto'],
        });
      }

      const snapshots = await snapshotService.getSnapshots(mockProject.id);
      expect(snapshots.filter((s) => s.isAutomatic)).toHaveLength(15); // MAX_SNAPSHOTS
    });
  });
});
