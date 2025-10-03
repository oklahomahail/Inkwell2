// src/services/backupService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  getBackups,
  saveBackup,
  restoreBackup,
  deleteBackup,
  exportBackup,
  importBackup,
  clearAllBackups,
  getBackupStatus,
  createManualBackup,
  type Backup,
} from './backupService';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock URL.createObjectURL and related functions
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement
const mockAnchorElement = {
  href: '',
  download: '',
  click: vi.fn(),
};

Object.defineProperty(document, 'createElement', {
  value: vi.fn((tagName: string) => {
    if (tagName === 'a') {
      return mockAnchorElement;
    }
    return {};
  }),
  writable: true,
});

// Mock File API
global.File = class MockFile {
  constructor(
    public chunks: BlobPart[],
    public name: string,
    public options?: FilePropertyBag,
  ) {}

  async text(): Promise<string> {
    return this.chunks.join('');
  }
} as any;

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

// Sample backup data
const sampleBackup: Backup = {
  id: 'test-backup-1',
  type: 'manual',
  title: 'Test Backup',
  description: 'A test backup',
  data: {
    projects: [
      {
        id: 'project-1',
        name: 'Test Project',
        description: 'A test project',
        content: 'Some content',
      },
    ],
    writingChapters: {
      'project-1': [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          scenes: [
            {
              id: 'scene-1',
              title: 'Scene 1',
              content: 'Scene content',
            },
          ],
        },
      ],
    },
  },
  timestamp: Date.now(),
  size: 1024,
};

describe('BackupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic Backup Operations', () => {
    describe('getBackups', () => {
      it('should return empty array when no backups exist', async () => {
        const backups = await getBackups();
        expect(backups).toEqual([]);
      });

      it('should return existing backups', async () => {
        mockLocalStorage.setItem('app_backups', JSON.stringify([sampleBackup]));

        const backups = await getBackups();
        expect(backups).toHaveLength(1);
        expect(backups[0]).toEqual(sampleBackup);
      });

      it('should handle corrupted backup data gracefully', async () => {
        mockLocalStorage.setItem('app_backups', 'invalid-json');

        const backups = await getBackups();
        expect(backups).toEqual([]);
      });
    });

    describe('saveBackup', () => {
      it('should save a new backup', async () => {
        await saveBackup(sampleBackup);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'app_backups',
          JSON.stringify([sampleBackup]),
        );
      });

      it('should add to existing backups', async () => {
        const existingBackup = { ...sampleBackup, id: 'existing-backup' };
        mockLocalStorage.setItem('app_backups', JSON.stringify([existingBackup]));

        await saveBackup(sampleBackup);

        const savedData = vi.mocked(mockLocalStorage.setItem).mock.calls[1]?.[1];
        expect(savedData).toBeDefined();
        const parsedData = JSON.parse(savedData!);
        expect(parsedData).toHaveLength(2);
        expect(parsedData).toContain(existingBackup);
        expect(parsedData).toContain(sampleBackup);
      });
    });

    describe('deleteBackup', () => {
      beforeEach(async () => {
        await saveBackup(sampleBackup);
        await saveBackup({ ...sampleBackup, id: 'backup-2' });
      });

      it('should delete existing backup', async () => {
        const result = await deleteBackup('test-backup-1');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Backup deleted successfully');

        const backups = await getBackups();
        expect(backups).toHaveLength(1);
        expect(backups[0]?.id).toBe('backup-2');
      });

      it('should return error for non-existent backup', async () => {
        const result = await deleteBackup('non-existent');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Backup not found');
      });
    });
  });

  describe('Backup Import/Export', () => {
    beforeEach(async () => {
      await saveBackup(sampleBackup);
    });

    describe('exportBackup', () => {
      it('should export existing backup', async () => {
        const result = await exportBackup('test-backup-1');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Backup exported successfully');
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockAnchorElement.click).toHaveBeenCalled();
        expect(mockAnchorElement.download).toMatch(
          /^backup_test-backup-1_\d{4}-\d{2}-\d{2}\.json$/,
        );
      });

      it('should return error for non-existent backup', async () => {
        const result = await exportBackup('non-existent');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Backup not found');
      });
    });

    describe('importBackup', () => {
      it('should import valid backup file', async () => {
        const newBackup = { ...sampleBackup, id: 'imported-backup' };
        const file = new File([JSON.stringify(newBackup)], 'backup.json');

        const result = await importBackup(file);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Backup imported successfully');

        const backups = await getBackups();
        expect(backups).toHaveLength(2);
        expect(backups.some((b) => b.id === 'imported-backup')).toBe(true);
      });

      it('should reject invalid backup format', async () => {
        const invalidBackup = { invalid: 'data' };
        const file = new File([JSON.stringify(invalidBackup)], 'invalid.json');

        const result = await importBackup(file);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid backup file format');
      });

      it('should reject duplicate backup IDs', async () => {
        const duplicateBackup = { ...sampleBackup };
        const file = new File([JSON.stringify(duplicateBackup)], 'duplicate.json');

        const result = await importBackup(file);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Backup with this ID already exists');
      });

      it('should handle malformed JSON', async () => {
        const file = new File(['invalid json'], 'malformed.json');

        const result = await importBackup(file);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid file format');
      });
    });
  });

  describe('Backup Restoration', () => {
    beforeEach(async () => {
      // Setup existing data
      mockLocalStorage.setItem(
        'inkwell_enhanced_projects',
        JSON.stringify([{ id: 'existing-project', name: 'Existing Project' }]),
      );
      mockLocalStorage.setItem(
        'inkwell_writing_chapters_project-1',
        JSON.stringify([{ id: 'existing-chapter', title: 'Existing Chapter' }]),
      );

      await saveBackup(sampleBackup);
    });

    it('should restore backup successfully', async () => {
      vi.useFakeTimers();

      const result = await restoreBackup('test-backup-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Backup restored successfully');

      // Should create emergency backup
      const backups = await getBackups();
      const emergencyBackups = backups.filter((b) => b.type === 'emergency');
      expect(emergencyBackups.length).toBeGreaterThan(0);

      // Should restore project data
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'inkwell_enhanced_projects',
        JSON.stringify((sampleBackup.data as any).projects),
      );

      // Should schedule page reload
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);

      vi.useRealTimers();
    });

    it('should return error for non-existent backup', async () => {
      const result = await restoreBackup('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Backup not found');
    });

    it('should return error for invalid backup data', async () => {
      const invalidBackup = { ...sampleBackup, data: null };
      await saveBackup(invalidBackup);

      const result = await restoreBackup(invalidBackup.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid backup data format');
    });

    it('should handle restoration errors gracefully', async () => {
      // Mock localStorage.setItem to throw error
      vi.mocked(mockLocalStorage.setItem).mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      const result = await restoreBackup('test-backup-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to restore projects');
    });
  });

  describe('Manual Backup Creation', () => {
    beforeEach(() => {
      // Setup mock data in localStorage
      mockLocalStorage.setItem(
        'inkwell_enhanced_projects',
        JSON.stringify([{ id: 'project-1', name: 'Test Project' }]),
      );
      mockLocalStorage.setItem(
        'inkwell_writing_chapters_project-1',
        JSON.stringify([{ id: 'chapter-1', title: 'Chapter 1' }]),
      );
      mockLocalStorage.setItem('inkwell_theme', 'dark');
      mockLocalStorage.setItem('inkwell_settings', JSON.stringify({ autoSave: true }));
      mockLocalStorage.setItem('other_app_data', 'should not be included');
    });

    it('should create comprehensive backup when no data provided', async () => {
      const result = await createManualBackup();

      expect(result.success).toBe(true);
      expect(result.backup).toBeDefined();

      const backup = result.backup!;
      expect(backup.type).toBe('manual');
      expect(backup.title).toBe('Manual Backup');
      expect(backup.description).toBe('User-created comprehensive backup');

      const data = backup.data as any;
      expect(data.projects).toBeDefined();
      expect(data.writingChapters).toBeDefined();
      expect(data.appData).toBeDefined();
      expect(data.backupMetadata).toBeDefined();

      // Should include inkwell-specific localStorage data
      expect(data.appData['inkwell_theme']).toBe('dark');
      expect(data.appData['inkwell_settings']).toEqual({ autoSave: true });

      // Should not include non-inkwell data
      expect(data.appData['other_app_data']).toBeUndefined();
    });

    it('should create backup with custom data when provided', async () => {
      const customData = { custom: 'data' };

      const result = await createManualBackup(customData, 'Custom Title', 'Custom Description');

      expect(result.success).toBe(true);
      expect(result.backup!.title).toBe('Custom Title');
      expect(result.backup!.description).toBe('Custom Description');
      expect(result.backup!.data).toEqual(customData);
    });

    it('should calculate backup size correctly', async () => {
      const result = await createManualBackup();

      expect(result.success).toBe(true);
      expect(result.backup!.size).toBeGreaterThan(0);

      // Size should match JSON string length
      const expectedSize = new Blob([JSON.stringify(result.backup!.data)]).size;
      expect(result.backup!.size).toBe(expectedSize);
    });

    it('should handle localStorage errors during backup creation', async () => {
      // Mock localStorage.getItem to throw error
      vi.mocked(mockLocalStorage.getItem).mockImplementationOnce(() => {
        throw new Error('Storage access denied');
      });

      const result = await createManualBackup();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create backup');
    });
  });

  describe('Backup Statistics', () => {
    it('should return correct statistics for empty backup list', async () => {
      const stats = await getBackupStatus();

      expect(stats.totalBackups).toBe(0);
      expect(stats.totalSize).toBe('0 B');
      expect(stats.lastBackup).toBeNull();
      expect(stats.autoBackupEnabled).toBe(false);
      expect(stats.storageWarning).toBe(false);
    });

    it('should return correct statistics for existing backups', async () => {
      await saveBackup(sampleBackup);
      await saveBackup({ ...sampleBackup, id: 'backup-2' });

      const stats = await getBackupStatus();

      expect(stats.totalBackups).toBe(2);
      expect(stats.totalSize).toMatch(/\d+(\.\d+)? (B|KB|MB|GB)/);
      expect(stats.lastBackup).toBe(sampleBackup.timestamp);
      expect(stats.autoBackupEnabled).toBe(false);
    });

    it('should detect storage warning for large backups', async () => {
      // Create a large backup (over 4MB)
      const largeData = 'x'.repeat(5 * 1024 * 1024); // 5MB string
      const largeBackup = { ...sampleBackup, data: largeData };
      await saveBackup(largeBackup);

      const stats = await getBackupStatus();

      expect(stats.storageWarning).toBe(true);
    });

    it('should format file sizes correctly', async () => {
      // Test different size formats
      const testCases = [
        { size: 512, expected: /512 B/ },
        { size: 1536, expected: /1\.5 KB/ },
        { size: 2 * 1024 * 1024, expected: /2\.0 MB/ },
        { size: 1.5 * 1024 * 1024 * 1024, expected: /1\.5 GB/ },
      ];

      for (const testCase of testCases) {
        const data = 'x'.repeat(testCase.size);
        const backup = { ...sampleBackup, id: `test-${testCase.size}`, data };
        await saveBackup(backup);

        const stats = await getBackupStatus();
        expect(stats.totalSize).toMatch(testCase.expected);

        // Clean up for next test
        await deleteBackup(`test-${testCase.size}`);
      }
    });
  });

  describe('Utility Functions', () => {
    describe('clearAllBackups', () => {
      it('should clear all backups', async () => {
        await saveBackup(sampleBackup);
        await saveBackup({ ...sampleBackup, id: 'backup-2' });

        const result = await clearAllBackups();

        expect(result.success).toBe(true);
        expect(result.message).toBe('All backups cleared successfully');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('app_backups');

        const backups = await getBackups();
        expect(backups).toEqual([]);
      });

      it('should handle errors when clearing backups', async () => {
        vi.mocked(mockLocalStorage.removeItem).mockImplementationOnce(() => {
          throw new Error('Access denied');
        });

        const result = await clearAllBackups();

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to clear backups');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle corrupted localStorage gracefully', async () => {
      vi.mocked(mockLocalStorage.getItem).mockImplementationOnce(() => {
        throw new Error('localStorage corrupted');
      });

      const backups = await getBackups();
      expect(backups).toEqual([]);
    });

    it('should handle very large backup data', async () => {
      const largeData = { content: 'x'.repeat(10 * 1024 * 1024) }; // 10MB

      const result = await createManualBackup(largeData);

      expect(result.success).toBe(true);
      expect(result.backup!.size).toBeGreaterThan(10 * 1024 * 1024);
    });

    it('should handle backup with missing required fields', async () => {
      const incompleteBackup = {
        id: 'incomplete',
        // Missing timestamp and data
      } as Backup;

      await saveBackup(incompleteBackup);
      const backups = await getBackups();

      expect(backups).toHaveLength(1);
      expect(backups[0]?.id).toBe('incomplete');
    });

    it('should handle concurrent backup operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        createManualBackup({ index: i }, `Backup ${i}`),
      );

      const results = await Promise.all(promises);

      expect(results.every((r) => r.success)).toBe(true);

      const backups = await getBackups();
      expect(backups).toHaveLength(10);
    });
  });

  describe('Backup Data Integrity', () => {
    it('should preserve data types during backup/restore cycle', async () => {
      const complexData = {
        string: 'text',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: { value: 'deep' } },
        date: new Date().toISOString(),
        null: null,
      };

      const result = await createManualBackup(complexData);
      expect(result.success).toBe(true);

      const backups = await getBackups();
      const restoredData = backups[0]?.data;

      expect(restoredData).toEqual(complexData);
    });

    it('should handle Unicode characters correctly', async () => {
      const unicodeData = {
        emoji: '🚀✨💫',
        chinese: '你好世界',
        arabic: 'مرحبا بالعالم',
        special: 'åäöñüß',
      };

      const result = await createManualBackup(unicodeData);
      expect(result.success).toBe(true);

      const backups = await getBackups();
      expect(backups[0]?.data).toEqual(unicodeData);
    });
  });
});
