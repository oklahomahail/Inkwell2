import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import snapshotService from '../snapshotService';

import type { Project } from '../../validation/projectSchema';

// Mock validation module
vi.mock('../../validation/projectSchema', () => ({
  validateProject: vi.fn((project) => ({
    success: true,
    data: project,
  })),
  validateSnapshot: vi.fn((snapshot) => ({
    success: true,
    data: snapshot,
  })),
}));

function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: overrides.id || 'project-1',
    name: 'Test Project',
    version: '1.0.0',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    currentWordCount: 1500,
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1',
        content: 'Content here',
        order: 0,
        wordCount: 1500,
      },
    ],
    characters: [],
    ...overrides,
  } as Project;
}

describe('SnapshotService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    snapshotService.stopAutoSnapshots();
    vi.restoreAllMocks();
  });

  describe('createSnapshot', () => {
    it('creates a snapshot with metadata', async () => {
      const project = createMockProject();
      const metadata = await snapshotService.createSnapshot(project);

      expect(metadata.id).toContain(project.id);
      expect(metadata.projectId).toBe(project.id);
      expect(metadata.wordCount).toBe(project.currentWordCount);
      expect(metadata.chaptersCount).toBe(project.chapters.length);
      expect(metadata.checksum).toBeDefined();
    });

    it('stores snapshot in localStorage', async () => {
      const project = createMockProject();
      const metadata = await snapshotService.createSnapshot(project);

      const snapshotKey = `inkwell_snapshot_${metadata.id}`;
      const stored = localStorage.getItem(snapshotKey);

      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.project.id).toBe(project.id);
    });

    it('accepts custom description', async () => {
      const project = createMockProject();
      const metadata = await snapshotService.createSnapshot(project, {
        description: 'Custom snapshot description',
      });

      expect(metadata.description).toBe('Custom snapshot description');
    });

    it('marks automatic snapshots correctly', async () => {
      const project = createMockProject();
      const metadata = await snapshotService.createSnapshot(project, {
        isAutomatic: true,
      });

      expect(metadata.isAutomatic).toBe(true);
      expect(metadata.description).toContain('Automatic');
    });

    it('adds custom tags to snapshot', async () => {
      const project = createMockProject();
      const metadata = await snapshotService.createSnapshot(project, {
        tags: ['milestone', 'draft-complete'],
      });

      expect(metadata.tags).toEqual(['milestone', 'draft-complete']);
    });

    it('updates snapshot index', async () => {
      const project = createMockProject();
      await snapshotService.createSnapshot(project);

      const index = JSON.parse(localStorage.getItem('inkwell_snapshot_index') || '[]');
      expect(index.length).toBe(1);
    });
  });

  describe('getSnapshots', () => {
    it('returns empty array for project with no snapshots', async () => {
      const snapshots = await snapshotService.getSnapshots('nonexistent-project');
      expect(snapshots).toEqual([]);
    });

    it('returns snapshots for specific project', async () => {
      const project1 = createMockProject({ id: 'proj-1' });
      const project2 = createMockProject({ id: 'proj-2' });

      await snapshotService.createSnapshot(project1);
      await snapshotService.createSnapshot(project1);
      await snapshotService.createSnapshot(project2);

      const snapshots = await snapshotService.getSnapshots('proj-1');
      expect(snapshots.length).toBe(2);
      expect(snapshots.every((s) => s.projectId === 'proj-1')).toBe(true);
    });

    it('sorts snapshots by timestamp descending', async () => {
      const project = createMockProject();

      vi.useFakeTimers();

      await snapshotService.createSnapshot(project);
      vi.advanceTimersByTime(1000);
      await snapshotService.createSnapshot(project);
      vi.advanceTimersByTime(1000);
      await snapshotService.createSnapshot(project);

      const snapshots = await snapshotService.getSnapshots(project.id);
      expect(new Date(snapshots[0].timestamp).getTime()).toBeGreaterThan(
        new Date(snapshots[1].timestamp).getTime(),
      );

      vi.useRealTimers();
    });
  });

  describe('restoreSnapshot', () => {
    it('restores project from snapshot', async () => {
      const originalProject = createMockProject({ name: 'Original' });
      const metadata = await snapshotService.createSnapshot(originalProject);

      const restored = await snapshotService.restoreSnapshot(metadata.id);
      expect(restored.name).toBe('Original');
      expect(restored.id).toBe(originalProject.id);
    });

    it('throws error for missing snapshot', async () => {
      await expect(snapshotService.restoreSnapshot('nonexistent-id')).rejects.toThrow('not found');
    });

    it('verifies checksum when available', async () => {
      const project = createMockProject();
      const metadata = await snapshotService.createSnapshot(project);

      // Snapshot should restore successfully with valid checksum
      const restored = await snapshotService.restoreSnapshot(metadata.id);
      expect(restored).toBeDefined();
    });

    it('logs warning on checksum mismatch', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const project = createMockProject();
      const metadata = await snapshotService.createSnapshot(project);

      // Corrupt the snapshot data
      const snapshotKey = `inkwell_snapshot_${metadata.id}`;
      const snapshotData = JSON.parse(localStorage.getItem(snapshotKey)!);
      snapshotData.project.name = 'Corrupted';
      localStorage.setItem(snapshotKey, JSON.stringify(snapshotData));

      await snapshotService.restoreSnapshot(metadata.id);

      // Should log warning but still return data
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Checksum mismatch'));

      consoleSpy.mockRestore();
    });
  });

  describe('deleteSnapshot', () => {
    it('removes snapshot from storage', async () => {
      const project = createMockProject();
      const metadata = await snapshotService.createSnapshot(project);

      await snapshotService.deleteSnapshot(metadata.id);

      const snapshotKey = `inkwell_snapshot_${metadata.id}`;
      expect(localStorage.getItem(snapshotKey)).toBeNull();
    });

    it('removes snapshot from index', async () => {
      const project = createMockProject();
      const metadata = await snapshotService.createSnapshot(project);

      await snapshotService.deleteSnapshot(metadata.id);

      const index = JSON.parse(localStorage.getItem('inkwell_snapshot_index') || '[]');
      expect(index.find((s: any) => s.id === metadata.id)).toBeUndefined();
    });

    it('handles deletion of nonexistent snapshot gracefully', async () => {
      // Should not throw
      await expect(snapshotService.deleteSnapshot('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('cleanupOldSnapshots', () => {
    it('keeps only MAX_SNAPSHOTS per project', async () => {
      const project = createMockProject();

      // Create more than MAX_SNAPSHOTS (15) - mark as automatic for cleanup
      for (let i = 0; i < 18; i++) {
        await snapshotService.createSnapshot(project, {
          description: `Snapshot ${i}`,
          isAutomatic: true,
        });
      }

      const snapshots = await snapshotService.getSnapshots(project.id);
      // After automatic cleanup during creation, should have <= 15
      expect(snapshots.length).toBeLessThanOrEqual(15);
    });

    it('preserves snapshots from different projects', async () => {
      const project1 = createMockProject({ id: 'proj-1' });
      const project2 = createMockProject({ id: 'proj-2' });

      for (let i = 0; i < 10; i++) {
        await snapshotService.createSnapshot(project1);
      }
      for (let i = 0; i < 10; i++) {
        await snapshotService.createSnapshot(project2);
      }

      const snapshots1 = await snapshotService.getSnapshots('proj-1');
      const snapshots2 = await snapshotService.getSnapshots('proj-2');

      expect(snapshots1.length).toBeGreaterThan(0);
      expect(snapshots2.length).toBeGreaterThan(0);
    });
  });

  describe('Auto-snapshots', () => {
    it('starts auto-snapshot timer', () => {
      const project = createMockProject();

      snapshotService.startAutoSnapshots(project);

      // Timer should be set
      expect((snapshotService as any)['autoSnapshotTimer']).toBeDefined();
    });

    it('stops auto-snapshot timer', () => {
      const project = createMockProject();

      snapshotService.startAutoSnapshots(project);
      snapshotService.stopAutoSnapshots();

      expect((snapshotService as any)['autoSnapshotTimer']).toBeNull();
    });

    it('clears existing timer when starting new one', () => {
      const project1 = createMockProject({ id: 'proj-1' });
      const project2 = createMockProject({ id: 'proj-2' });

      snapshotService.startAutoSnapshots(project1);
      const firstTimer = (snapshotService as any)['autoSnapshotTimer'];

      snapshotService.startAutoSnapshots(project2);
      const secondTimer = (snapshotService as any)['autoSnapshotTimer'];

      expect(firstTimer).not.toBe(secondTimer);
    });

    it('creates snapshots at regular intervals', async () => {
      vi.useFakeTimers();
      const project = createMockProject();

      snapshotService.startAutoSnapshots(project);

      // Advance to first interval only (avoid infinite loop)
      vi.advanceTimersToNextTimer();
      await Promise.resolve();

      const snapshots = await snapshotService.getSnapshots(project.id);
      expect(snapshots.length).toBeGreaterThan(0);

      snapshotService.stopAutoSnapshots();
      vi.useRealTimers();
    });
  });

  describe('Storage Usage', () => {
    it('calculates total storage size', async () => {
      const project = createMockProject();

      await snapshotService.createSnapshot(project);
      await snapshotService.createSnapshot(project);

      const usage = snapshotService.getSnapshotStorageUsage();

      expect(usage.snapshotCount).toBe(2);
      expect(usage.totalSize).toBeGreaterThan(0);
      expect(usage.details.length).toBe(2);
    });

    it('returns zero when no snapshots exist', () => {
      const usage = snapshotService.getSnapshotStorageUsage();

      expect(usage.snapshotCount).toBe(0);
      expect(usage.totalSize).toBe(0);
      expect(usage.details).toEqual([]);
    });

    it('includes size for each snapshot', async () => {
      const project = createMockProject();
      await snapshotService.createSnapshot(project);

      const usage = snapshotService.getSnapshotStorageUsage();

      expect(usage.details[0].id).toBeDefined();
      expect(usage.details[0].size).toBeGreaterThan(0);
    });
  });

  describe('Emergency Cleanup', () => {
    it('removes oldest snapshots keeping specified count', async () => {
      const project = createMockProject();

      // Create 10 snapshots
      for (let i = 0; i < 10; i++) {
        await snapshotService.createSnapshot(project);
      }

      // Keep only 5
      const deletedCount = await snapshotService.emergencyCleanup(project.id, 5);

      expect(deletedCount).toBeGreaterThan(0);

      const remaining = await snapshotService.getSnapshots(project.id);
      expect(remaining.length).toBeLessThanOrEqual(5);
    });

    it('returns 0 when no cleanup needed', async () => {
      const project = createMockProject();

      await snapshotService.createSnapshot(project);
      await snapshotService.createSnapshot(project);

      const deletedCount = await snapshotService.emergencyCleanup(project.id, 5);

      expect(deletedCount).toBe(0);
    });

    it('uses default keepCount of 5', async () => {
      const project = createMockProject();

      for (let i = 0; i < 8; i++) {
        await snapshotService.createSnapshot(project);
      }

      await snapshotService.emergencyCleanup(project.id);

      const remaining = await snapshotService.getSnapshots(project.id);
      expect(remaining.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Error Handling', () => {
    it('handles invalid project data gracefully', async () => {
      const { validateProject } = await import('../../validation/projectSchema');
      vi.mocked(validateProject).mockReturnValueOnce({
        success: false,
        error: 'Invalid project data',
      });

      const project = createMockProject();

      await expect(snapshotService.createSnapshot(project)).rejects.toThrow('invalid project');
    });

    it('handles localStorage quota exceeded', async () => {
      const project = createMockProject();

      // Mock localStorage to throw QuotaExceededError
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn().mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      await expect(snapshotService.createSnapshot(project)).rejects.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });

    it('logs errors when snapshot creation fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { validateProject } = await import('../../validation/projectSchema');
      vi.mocked(validateProject).mockReturnValueOnce({
        success: false,
        error: 'Test error',
      });

      const project = createMockProject();

      try {
        await snapshotService.createSnapshot(project);
      } catch {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles corrupted snapshot index gracefully', async () => {
      localStorage.setItem('inkwell_snapshot_index', 'not valid json');

      const snapshots = await snapshotService.getSnapshots('any-project');
      expect(snapshots).toEqual([]);
    });
  });

  describe('Checksum Verification', () => {
    it('generates consistent checksum for same data', async () => {
      const project = createMockProject();

      const snapshot1 = await snapshotService.createSnapshot(project);
      const snapshot2 = await snapshotService.createSnapshot(project);

      expect(snapshot1.checksum).toBe(snapshot2.checksum);
    });

    it('generates different checksum for different data', async () => {
      const project1 = createMockProject({ name: 'Project 1' });
      const project2 = createMockProject({ name: 'Project 2' });

      const snapshot1 = await snapshotService.createSnapshot(project1);
      const snapshot2 = await snapshotService.createSnapshot(project2);

      expect(snapshot1.checksum).not.toBe(snapshot2.checksum);
    });
  });
});
