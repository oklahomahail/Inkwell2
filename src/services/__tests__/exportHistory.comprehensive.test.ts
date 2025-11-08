/**
 * ExportHistory Service Comprehensive Tests
 *
 * Phase 2c: Service Layer Coverage (P2 Priority)
 * Target: 10% → 75% coverage
 *
 * Tests IndexedDB-based export history tracking:
 * - add: Create new export records
 * - list: Get export records for a project (sorted, limited)
 * - listAll: Get all export records across projects
 * - get: Retrieve single export record by ID
 * - getStats: Calculate statistics for a project
 * - clear: Delete all records for a project
 * - clearAll: Delete all records across all projects
 * - delete: Remove a specific export record
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexedDBHarness } from '@/test/serviceHarness';
import type { ExportRecord, CreateExportRecordParams } from '@/types/export';

// Setup IndexedDB harness
const indexedDB = new IndexedDBHarness();

// Mock devLog
vi.mock('@/utils/devLog', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock generateId
let idCounter = 0;
vi.mock('@/utils/id', () => ({
  generateId: vi.fn(() => `export-${++idCounter}`),
}));

// Import service AFTER mocking dependencies
import { exportHistory } from '../exportHistory';

describe('ExportHistory - Comprehensive', () => {
  const projectId = 'test-project-export';

  beforeEach(async () => {
    // Reset IndexedDB
    await indexedDB.clearAll();
    indexedDB.setup();

    // Reset the exportHistory service singleton state
    (exportHistory as any).db?.close?.();
    (exportHistory as any).db = null;
    (exportHistory as any).initPromise = null;

    // Reset ID counter
    idCounter = 0;

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    indexedDB.teardown();
  });

  describe('Initialization', () => {
    it('should initialize IndexedDB with export_records store', async () => {
      const params: CreateExportRecordParams = {
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 500,
        result: 'success',
      };

      await exportHistory.add(params);

      expect(globalThis.indexedDB).toBeDefined();
    });

    it('should handle concurrent initialization calls', async () => {
      const params: CreateExportRecordParams = {
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 500,
        result: 'success',
      };

      // Multiple concurrent calls should not cause issues
      const promises = [
        exportHistory.add(params),
        exportHistory.list(projectId),
        exportHistory.getStats(projectId),
      ];

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });

  describe('add()', () => {
    it('should add successful export record', async () => {
      const params: CreateExportRecordParams = {
        projectId,
        type: 'pdf',
        chaptersIncluded: 5,
        totalWordCount: 5000,
        durationMs: 1200,
        result: 'success',
      };

      const record = await exportHistory.add(params);

      expect(record).toMatchObject({
        id: 'export-1',
        projectId,
        type: 'pdf',
        chaptersIncluded: 5,
        totalWordCount: 5000,
        durationMs: 1200,
        result: 'success',
      });
      expect(record.createdAt).toBeDefined();
      expect(record.errorMessage).toBeUndefined();
    });

    it('should add failed export record with error message', async () => {
      const params: CreateExportRecordParams = {
        projectId,
        type: 'epub',
        chaptersIncluded: 3,
        totalWordCount: 3000,
        durationMs: 800,
        result: 'fail',
        errorMessage: 'Network timeout',
      };

      const record = await exportHistory.add(params);

      expect(record).toMatchObject({
        projectId,
        type: 'epub',
        result: 'fail',
        errorMessage: 'Network timeout',
      });
    });

    it('should handle different export types', async () => {
      const pdfParams: CreateExportRecordParams = {
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 200,
        result: 'success',
      };

      const epubParams: CreateExportRecordParams = {
        projectId,
        type: 'epub',
        chaptersIncluded: 2,
        totalWordCount: 200,
        durationMs: 300,
        result: 'success',
      };

      const docxParams: CreateExportRecordParams = {
        projectId,
        type: 'docx',
        chaptersIncluded: 3,
        totalWordCount: 300,
        durationMs: 400,
        result: 'success',
      };

      const pdf = await exportHistory.add(pdfParams);
      const epub = await exportHistory.add(epubParams);
      const docx = await exportHistory.add(docxParams);

      expect(pdf.type).toBe('pdf');
      expect(epub.type).toBe('epub');
      expect(docx.type).toBe('docx');
    });

    it('should generate unique IDs for each record', async () => {
      const params: CreateExportRecordParams = {
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 100,
        result: 'success',
      };

      const record1 = await exportHistory.add(params);
      const record2 = await exportHistory.add(params);
      const record3 = await exportHistory.add(params);

      expect(record1.id).toBe('export-1');
      expect(record2.id).toBe('export-2');
      expect(record3.id).toBe('export-3');
    });
  });

  describe('list()', () => {
    it('should return empty array for project with no exports', async () => {
      const records = await exportHistory.list(projectId);

      expect(records).toEqual([]);
    });

    it('should list all exports for a project', async () => {
      await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 100,
        result: 'success',
      });

      await exportHistory.add({
        projectId,
        type: 'epub',
        chaptersIncluded: 2,
        totalWordCount: 200,
        durationMs: 200,
        result: 'success',
      });

      const records = await exportHistory.list(projectId);

      expect(records).toHaveLength(2);
      const types = records.map((r) => r.type);
      expect(types).toContain('pdf');
      expect(types).toContain('epub');
    });

    it('should sort exports by newest first', async () => {
      // Add records with slight delays to ensure different timestamps
      const record1 = await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 100,
        result: 'success',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const record2 = await exportHistory.add({
        projectId,
        type: 'epub',
        chaptersIncluded: 2,
        totalWordCount: 200,
        durationMs: 200,
        result: 'success',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const record3 = await exportHistory.add({
        projectId,
        type: 'docx',
        chaptersIncluded: 3,
        totalWordCount: 300,
        durationMs: 300,
        result: 'success',
      });

      const records = await exportHistory.list(projectId);

      expect(records[0].id).toBe(record3.id); // Newest
      expect(records[1].id).toBe(record2.id);
      expect(records[2].id).toBe(record1.id); // Oldest
    });

    it('should limit results when limit parameter provided', async () => {
      // Add 5 records
      for (let i = 0; i < 5; i++) {
        await exportHistory.add({
          projectId,
          type: 'pdf',
          chaptersIncluded: 1,
          totalWordCount: 100,
          durationMs: 100,
          result: 'success',
        });
      }

      const records = await exportHistory.list(projectId, 3);

      expect(records).toHaveLength(3);
    });

    it('should only return records for specified project', async () => {
      const otherProject = 'other-project';

      await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 100,
        result: 'success',
      });

      await exportHistory.add({
        projectId: otherProject,
        type: 'epub',
        chaptersIncluded: 2,
        totalWordCount: 200,
        durationMs: 200,
        result: 'success',
      });

      const records = await exportHistory.list(projectId);

      expect(records).toHaveLength(1);
      expect(records[0].projectId).toBe(projectId);
    });
  });

  describe('listAll()', () => {
    it('should return empty array when no exports exist', async () => {
      const records = await exportHistory.listAll();

      expect(records).toEqual([]);
    });

    it('should list exports from all projects', async () => {
      await exportHistory.add({
        projectId: 'project-1',
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 100,
        result: 'success',
      });

      await exportHistory.add({
        projectId: 'project-2',
        type: 'epub',
        chaptersIncluded: 2,
        totalWordCount: 200,
        durationMs: 200,
        result: 'success',
      });

      const records = await exportHistory.listAll();

      expect(records).toHaveLength(2);
      expect(records.map((r) => r.projectId)).toContain('project-1');
      expect(records.map((r) => r.projectId)).toContain('project-2');
    });

    it('should sort all exports by newest first', async () => {
      const record1 = await exportHistory.add({
        projectId: 'project-1',
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 100,
        result: 'success',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const record2 = await exportHistory.add({
        projectId: 'project-2',
        type: 'epub',
        chaptersIncluded: 2,
        totalWordCount: 200,
        durationMs: 200,
        result: 'success',
      });

      const records = await exportHistory.listAll();

      expect(records[0].id).toBe(record2.id); // Newest
      expect(records[1].id).toBe(record1.id); // Oldest
    });

    it('should limit results when limit parameter provided', async () => {
      for (let i = 0; i < 5; i++) {
        await exportHistory.add({
          projectId: `project-${i}`,
          type: 'pdf',
          chaptersIncluded: 1,
          totalWordCount: 100,
          durationMs: 100,
          result: 'success',
        });
      }

      const records = await exportHistory.listAll(2);

      expect(records).toHaveLength(2);
    });
  });

  describe('get()', () => {
    it('should retrieve export record by ID', async () => {
      const added = await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 5,
        totalWordCount: 5000,
        durationMs: 1200,
        result: 'success',
      });

      const retrieved = await exportHistory.get(added.id);

      expect(retrieved).toEqual(added);
    });

    it('should return null for non-existent ID', async () => {
      const result = await exportHistory.get('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getStats()', () => {
    it('should return zero stats for project with no exports', async () => {
      const stats = await exportHistory.getStats(projectId);

      expect(stats).toEqual({
        totalExports: 0,
        successfulExports: 0,
        failedExports: 0,
        lastExportTime: null,
        lastExportWordCount: 0,
        averageDurationMs: 0,
        totalWordsExported: 0,
      });
    });

    it('should calculate stats for successful exports', async () => {
      await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 5,
        totalWordCount: 1000,
        durationMs: 500,
        result: 'success',
      });

      // Delay to ensure second export has later timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      await exportHistory.add({
        projectId,
        type: 'epub',
        chaptersIncluded: 3,
        totalWordCount: 2000,
        durationMs: 700,
        result: 'success',
      });

      const stats = await exportHistory.getStats(projectId);

      expect(stats.totalExports).toBe(2);
      expect(stats.successfulExports).toBe(2);
      expect(stats.failedExports).toBe(0);
      expect(stats.totalWordsExported).toBe(3000);
      expect(stats.averageDurationMs).toBe(600); // (500 + 700) / 2
      expect(stats.lastExportWordCount).toBe(2000); // Last export
    });

    it('should count failed exports separately', async () => {
      await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 5,
        totalWordCount: 1000,
        durationMs: 500,
        result: 'success',
      });

      await exportHistory.add({
        projectId,
        type: 'epub',
        chaptersIncluded: 3,
        totalWordCount: 0,
        durationMs: 200,
        result: 'fail',
        errorMessage: 'Network error',
      });

      const stats = await exportHistory.getStats(projectId);

      expect(stats.totalExports).toBe(2);
      expect(stats.successfulExports).toBe(1);
      expect(stats.failedExports).toBe(1);
      expect(stats.totalWordsExported).toBe(1000); // Only successful exports
      expect(stats.averageDurationMs).toBe(500); // Only successful exports
    });

    it('should use last export for lastExportTime and lastExportWordCount', async () => {
      const first = await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 1000,
        durationMs: 100,
        result: 'success',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const second = await exportHistory.add({
        projectId,
        type: 'epub',
        chaptersIncluded: 2,
        totalWordCount: 2000,
        durationMs: 200,
        result: 'success',
      });

      const stats = await exportHistory.getStats(projectId);

      expect(stats.lastExportTime).toBe(second.createdAt);
      expect(stats.lastExportWordCount).toBe(2000);
    });

    it('should handle mixed success and failure exports', async () => {
      await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 1000,
        durationMs: 100,
        result: 'success',
      });

      await exportHistory.add({
        projectId,
        type: 'epub',
        chaptersIncluded: 2,
        totalWordCount: 0,
        durationMs: 50,
        result: 'fail',
      });

      await exportHistory.add({
        projectId,
        type: 'docx',
        chaptersIncluded: 3,
        totalWordCount: 3000,
        durationMs: 300,
        result: 'success',
      });

      const stats = await exportHistory.getStats(projectId);

      expect(stats.totalExports).toBe(3);
      expect(stats.successfulExports).toBe(2);
      expect(stats.failedExports).toBe(1);
      expect(stats.totalWordsExported).toBe(4000);
      expect(stats.averageDurationMs).toBe(200); // (100 + 300) / 2
    });
  });

  describe('clear()', () => {
    it('should clear all exports for a project', async () => {
      await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 100,
        result: 'success',
      });

      await exportHistory.add({
        projectId,
        type: 'epub',
        chaptersIncluded: 2,
        totalWordCount: 200,
        durationMs: 200,
        result: 'success',
      });

      await exportHistory.clear(projectId);

      const records = await exportHistory.list(projectId);
      expect(records).toHaveLength(0);
    });

    it('should only clear exports for specified project', async () => {
      const otherProject = 'other-project';

      await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 100,
        result: 'success',
      });

      await exportHistory.add({
        projectId: otherProject,
        type: 'epub',
        chaptersIncluded: 2,
        totalWordCount: 200,
        durationMs: 200,
        result: 'success',
      });

      await exportHistory.clear(projectId);

      const projectRecords = await exportHistory.list(projectId);
      const otherRecords = await exportHistory.list(otherProject);

      expect(projectRecords).toHaveLength(0);
      expect(otherRecords).toHaveLength(1);
    });

    it('should handle clearing when no exports exist', async () => {
      await expect(exportHistory.clear(projectId)).resolves.toBeUndefined();
    });
  });

  describe('clearAll()', () => {
    it('should clear all exports across all projects', async () => {
      await exportHistory.add({
        projectId: 'project-1',
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 100,
        result: 'success',
      });

      await exportHistory.add({
        projectId: 'project-2',
        type: 'epub',
        chaptersIncluded: 2,
        totalWordCount: 200,
        durationMs: 200,
        result: 'success',
      });

      await exportHistory.clearAll();

      const allRecords = await exportHistory.listAll();
      expect(allRecords).toHaveLength(0);
    });

    it('should handle clearing when no exports exist', async () => {
      await expect(exportHistory.clearAll()).resolves.toBeUndefined();
    });
  });

  describe('delete()', () => {
    it('should delete a specific export record', async () => {
      const record1 = await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 100,
        result: 'success',
      });

      const record2 = await exportHistory.add({
        projectId,
        type: 'epub',
        chaptersIncluded: 2,
        totalWordCount: 200,
        durationMs: 200,
        result: 'success',
      });

      await exportHistory.delete(record1.id);

      const retrieved1 = await exportHistory.get(record1.id);
      const retrieved2 = await exportHistory.get(record2.id);

      expect(retrieved1).toBeNull();
      expect(retrieved2).toEqual(record2);
    });

    it('should handle deleting non-existent record gracefully', async () => {
      await expect(exportHistory.delete('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large word counts', async () => {
      const record = await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 100,
        totalWordCount: 1000000,
        durationMs: 50000,
        result: 'success',
      });

      expect(record.totalWordCount).toBe(1000000);

      const stats = await exportHistory.getStats(projectId);
      expect(stats.totalWordsExported).toBe(1000000);
    });

    it('should handle zero word count exports', async () => {
      const record = await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 0,
        totalWordCount: 0,
        durationMs: 100,
        result: 'success',
      });

      expect(record.totalWordCount).toBe(0);

      const stats = await exportHistory.getStats(projectId);
      expect(stats.totalWordsExported).toBe(0);
    });

    it('should handle very fast exports (< 1ms)', async () => {
      const record = await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 100,
        durationMs: 0,
        result: 'success',
      });

      expect(record.durationMs).toBe(0);
    });

    it('should handle concurrent adds for same project', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        exportHistory.add({
          projectId,
          type: 'pdf',
          chaptersIncluded: i + 1,
          totalWordCount: (i + 1) * 100,
          durationMs: (i + 1) * 10,
          result: 'success',
        }),
      );

      await Promise.all(promises);

      const records = await exportHistory.list(projectId);
      expect(records).toHaveLength(10);
    });

    it('should handle long error messages', async () => {
      const longError = 'Error: '.repeat(100) + 'Network timeout occurred during export';

      const record = await exportHistory.add({
        projectId,
        type: 'pdf',
        chaptersIncluded: 1,
        totalWordCount: 0,
        durationMs: 100,
        result: 'fail',
        errorMessage: longError,
      });

      expect(record.errorMessage).toBe(longError);
    });

    it('should handle all export types', async () => {
      const types: Array<'pdf' | 'epub' | 'docx'> = ['pdf', 'epub', 'docx'];

      for (const type of types) {
        await exportHistory.add({
          projectId,
          type,
          chaptersIncluded: 1,
          totalWordCount: 100,
          durationMs: 100,
          result: 'success',
        });
      }

      const records = await exportHistory.list(projectId);
      const recordTypes = records.map((r) => r.type);

      expect(recordTypes).toContain('pdf');
      expect(recordTypes).toContain('epub');
      expect(recordTypes).toContain('docx');
    });
  });
});
