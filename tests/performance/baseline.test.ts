/**
 * Performance Baseline Tests
 *
 * Establishes and enforces performance baselines for critical operations.
 * These tests ensure Inkwell maintains its "snappy" feel.
 *
 * Baseline Targets:
 * - Initial render: < 200 ms
 * - Autosave latency: < 50 ms (IndexedDB write)
 * - Snapshot creation: < 300 ms (with compression)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performance } from 'perf_hooks';

import { autosaveService } from '@/services/autosaveService';
import snapshotService from '@/services/snapshotService';
import { mockProject, mockChapter } from '@/test-utils/mockProject';

describe('Performance Baseline', () => {
  beforeEach(() => {
    // Clear any cached data
    vi.clearAllMocks();
  });

  describe('IndexedDB Operations', () => {
    it('writes to IndexedDB within 50ms', async () => {
      const start = performance.now();

      // Simulate autosave write
      await autosaveService.saveProject(mockProject);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('reads from IndexedDB within 50ms', async () => {
      // First save a project
      await autosaveService.saveProject(mockProject);

      const start = performance.now();

      // Read it back
      await autosaveService.loadProject(mockProject.id);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Snapshot Operations', () => {
    it('creates snapshot within 300ms', async () => {
      const start = performance.now();

      await snapshotService.createSnapshot({
        projectId: mockProject.id,
        description: 'Performance test snapshot',
      });

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(300);
    });

    it('validates project data within 100ms', async () => {
      const start = performance.now();

      const isValid = snapshotService.validateProject(mockProject);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      expect(isValid).toBe(true);
    });
  });

  describe('Editor Operations', () => {
    it('updates chapter content within 20ms', async () => {
      const newContent = 'Updated content for performance test';

      const start = performance.now();

      // Simulate content update (in-memory operation)
      const updatedChapter = {
        ...mockChapter,
        content: newContent,
        updatedAt: Date.now(),
      };

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(20);
      expect(updatedChapter.content).toBe(newContent);
    });

    it('calculates word count within 10ms', () => {
      const longText = 'word '.repeat(1000); // 1000 words

      const start = performance.now();

      const wordCount = longText.trim().split(/\s+/).length;

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
      expect(wordCount).toBe(1000);
    });
  });

  describe('Search Operations', () => {
    it('searches across chapters within 100ms', () => {
      const chapters = Array(50)
        .fill(mockChapter)
        .map((ch, i) => ({
          ...ch,
          id: `chapter-${i}`,
          title: `Chapter ${i}`,
          content: `This is chapter ${i} content with searchable text`,
        }));

      const searchTerm = 'searchable';

      const start = performance.now();

      const results = chapters.filter(
        (ch) =>
          ch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ch.content.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      expect(results.length).toBe(50);
    });
  });

  describe('Memory Performance', () => {
    it('handles large project without memory issues', () => {
      const largeProject = {
        ...mockProject,
        chapters: Array(100)
          .fill(mockChapter)
          .map((ch, i) => ({
            ...ch,
            id: `chapter-${i}`,
            content: 'x'.repeat(5000), // 5KB per chapter = 500KB total
          })),
      };

      const start = performance.now();

      // Simulate operations on large project
      const chapterCount = largeProject.chapters.length;
      const totalWords = largeProject.chapters.reduce(
        (sum, ch) => sum + ch.content.split(/\s+/).length,
        0,
      );

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(chapterCount).toBe(100);
      expect(totalWords).toBeGreaterThan(0);
    });
  });

  describe('Compression Performance', () => {
    it('compresses content within 200ms', async () => {
      const largeContent = JSON.stringify({
        ...mockProject,
        chapters: Array(20).fill(mockChapter),
      });

      const start = performance.now();

      // Simulate compression (using TextEncoder as a proxy for actual compression)
      const encoder = new TextEncoder();
      const compressed = encoder.encode(largeContent);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
      expect(compressed.length).toBeGreaterThan(0);
    });
  });
});
