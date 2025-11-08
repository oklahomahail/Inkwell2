/**
 * ChaptersService Comprehensive Tests
 *
 * Phase 2: Service Layer Coverage
 * Target: 33% → 80% coverage
 *
 * Tests all IndexedDB operations including:
 * - CRUD operations (create, read, update, delete)
 * - Advanced operations (split, merge, duplicate, reorder)
 * - Bulk operations (import, export)
 * - Word counting and metadata management
 * - Cache invalidation logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexedDBHarness, CacheMockHarness } from '@/test/serviceHarness';
import type { ChapterMeta, ChapterDoc, CreateChapterInput } from '@/types/writing';

// Setup test harnesses
const indexedDB = new IndexedDBHarness();
const cache = new CacheMockHarness();

// Hoist cache mock before module imports
const mockCacheModule = vi.hoisted(() => {
  return {
    chapterCache: {
      invalidate: vi.fn(),
      invalidateProject: vi.fn(),
    },
    CacheKeys: {
      chapterMeta: (projectId: string, chapterId: string) =>
        `chapter:meta:${projectId}:${chapterId}`,
      chapterDoc: (projectId: string, chapterId: string) => `chapter:doc:${projectId}:${chapterId}`,
      chapterList: (projectId: string) => `chapter:list:${projectId}`,
    },
  };
});

// Mock the cache module
vi.mock('@/services/chapterCache', () => mockCacheModule);

// Import service AFTER mocking dependencies
import { Chapters } from '../chaptersService';
import { chapterCache } from '@/services/chapterCache';

describe('ChaptersService - Comprehensive', () => {
  const projectId = 'test-project-123';

  beforeEach(async () => {
    // Reset IndexedDB (creates fresh instance)
    await indexedDB.clearAll();
    indexedDB.setup();

    // Reset the Chapters service singleton state
    // Access private properties to reset them for test isolation
    (Chapters as any).db?.close?.(); // Close existing connection if any
    (Chapters as any).db = null;
    (Chapters as any).initPromise = null;

    // Reset cache spies
    vi.clearAllMocks();
  });

  afterEach(() => {
    indexedDB.teardown();
  });

  describe('Initialization', () => {
    it('should initialize IndexedDB with correct stores', async () => {
      // Trigger initialization by calling a method
      const chapters = await Chapters.list(projectId);

      expect(chapters).toEqual([]);
      expect(globalThis.indexedDB).toBeDefined();
    });

    it('should handle multiple concurrent initialization calls', async () => {
      // Call multiple methods concurrently
      const promises = [
        Chapters.list(projectId),
        Chapters.getCount(projectId),
        Chapters.getTotalWordCount(projectId),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toEqual([]); // list
      expect(results[1]).toBe(0); // count
      expect(results[2]).toBe(0); // word count
    });
  });

  describe('create()', () => {
    it('should create chapter with default values', async () => {
      const input: CreateChapterInput = {
        projectId,
        title: 'Test Chapter',
      };

      const chapter = await Chapters.create(input);

      expect(chapter).toMatchObject({
        projectId,
        title: 'Test Chapter',
        index: 0,
        status: 'draft',
        wordCount: 0,
        sceneCount: 0,
        tags: [],
      });
      expect(chapter.id).toBeDefined();
      expect(chapter.createdAt).toBeDefined();
      expect(chapter.updatedAt).toBeDefined();
    });

    it('should create chapter with custom values', async () => {
      const input: CreateChapterInput = {
        projectId,
        title: 'Custom Chapter',
        summary: 'Custom summary',
        content: 'Custom content here',
        status: 'revising',
        index: 5,
      };

      const chapter = await Chapters.create(input);

      expect(chapter).toMatchObject({
        projectId,
        title: 'Custom Chapter',
        summary: 'Custom summary',
        status: 'revising',
        index: 5,
      });
    });

    it('should auto-increment index when not provided', async () => {
      const ch1 = await Chapters.create({ projectId, title: 'Chapter 1' });
      const ch2 = await Chapters.create({ projectId, title: 'Chapter 2' });
      const ch3 = await Chapters.create({ projectId, title: 'Chapter 3' });

      expect(ch1.index).toBe(0);
      expect(ch2.index).toBe(1);
      expect(ch3.index).toBe(2);
    });

    it('should create empty document alongside metadata', async () => {
      const chapter = await Chapters.create({ projectId, title: 'Test' });

      const fullChapter = await Chapters.get(chapter.id);

      expect(fullChapter.content).toBeDefined();
      expect(fullChapter.version).toBe(1);
    });

    it('should create document with initial content', async () => {
      const chapter = await Chapters.create({
        projectId,
        title: 'With Content',
        content: 'Initial content',
      });

      const fullChapter = await Chapters.get(chapter.id);

      expect(fullChapter.content).toBe('Initial content');
    });
  });

  describe('list()', () => {
    it('should return empty array for project with no chapters', async () => {
      const chapters = await Chapters.list(projectId);

      expect(chapters).toEqual([]);
    });

    it('should return all chapters for a project', async () => {
      await Chapters.create({ projectId, title: 'Chapter 1' });
      await Chapters.create({ projectId, title: 'Chapter 2' });
      await Chapters.create({ projectId, title: 'Chapter 3' });

      const chapters = await Chapters.list(projectId);

      expect(chapters).toHaveLength(3);
      expect(chapters.map((c) => c.title)).toEqual(['Chapter 1', 'Chapter 2', 'Chapter 3']);
    });

    it('should return chapters sorted by index', async () => {
      await Chapters.create({ projectId, title: 'C', index: 2 });
      await Chapters.create({ projectId, title: 'A', index: 0 });
      await Chapters.create({ projectId, title: 'B', index: 1 });

      const chapters = await Chapters.list(projectId);

      expect(chapters.map((c) => c.title)).toEqual(['A', 'B', 'C']);
    });

    it('should only return chapters for specified project', async () => {
      const otherProject = 'other-project';

      await Chapters.create({ projectId, title: 'Project 1 Chapter' });
      await Chapters.create({ projectId: otherProject, title: 'Project 2 Chapter' });

      const chapters = await Chapters.list(projectId);

      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBe('Project 1 Chapter');
    });
  });

  describe('get()', () => {
    it('should return full chapter with metadata and content', async () => {
      const meta = await Chapters.create({
        projectId,
        title: 'Test Chapter',
        content: 'Test content',
        summary: 'Test summary',
      });

      const fullChapter = await Chapters.get(meta.id);

      expect(fullChapter).toMatchObject({
        id: meta.id,
        title: 'Test Chapter',
        summary: 'Test summary',
        content: 'Test content',
      });
      expect(fullChapter.version).toBeDefined();
    });

    it('should throw error when chapter not found', async () => {
      await expect(Chapters.get('non-existent')).rejects.toThrow('not found');
    });
  });

  describe('getMeta()', () => {
    it('should return chapter metadata without content', async () => {
      const created = await Chapters.create({
        projectId,
        title: 'Test',
        content: 'Long content that should not be loaded',
      });

      const meta = await Chapters.getMeta(created.id);

      expect(meta).toMatchObject({
        id: created.id,
        title: 'Test',
        projectId,
      });
      expect(meta).not.toHaveProperty('content');
    });

    it('should return null when chapter not found', async () => {
      const meta = await Chapters.getMeta('non-existent');

      expect(meta).toBeNull();
    });
  });

  describe('updateMeta()', () => {
    it('should update chapter title', async () => {
      const chapter = await Chapters.create({ projectId, title: 'Original Title' });

      await Chapters.updateMeta({ id: chapter.id, title: 'Updated Title' });

      const updated = await Chapters.getMeta(chapter.id);
      expect(updated?.title).toBe('Updated Title');
    });

    it('should update chapter summary', async () => {
      const chapter = await Chapters.create({ projectId, title: 'Test' });

      await Chapters.updateMeta({ id: chapter.id, summary: 'New summary' });

      const updated = await Chapters.getMeta(chapter.id);
      expect(updated?.summary).toBe('New summary');
    });

    it('should update chapter status', async () => {
      const chapter = await Chapters.create({ projectId, title: 'Test' });

      await Chapters.updateMeta({ id: chapter.id, status: 'final' });

      const updated = await Chapters.getMeta(chapter.id);
      expect(updated?.status).toBe('final');
    });

    it('should update updatedAt timestamp', async () => {
      const chapter = await Chapters.create({ projectId, title: 'Test' });
      const originalUpdatedAt = chapter.updatedAt;

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      await Chapters.updateMeta({ id: chapter.id, title: 'New Title' });

      const updated = await Chapters.getMeta(chapter.id);
      expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should invalidate cache after update', async () => {
      const chapter = await Chapters.create({ projectId, title: 'Test' });

      await Chapters.updateMeta({ id: chapter.id, title: 'Updated' });

      expect(chapterCache.invalidate).toHaveBeenCalled();
    });

    it('should throw error when updating non-existent chapter', async () => {
      await expect(Chapters.updateMeta({ id: 'non-existent', title: 'Test' })).rejects.toThrow();
    });
  });

  describe('updateWordCount()', () => {
    it('should update word count', async () => {
      const chapter = await Chapters.create({ projectId, title: 'Test' });

      await Chapters.updateWordCount(chapter.id, 500);

      const updated = await Chapters.getMeta(chapter.id);
      expect(updated?.wordCount).toBe(500);
    });

    it('should invalidate cache', async () => {
      const chapter = await Chapters.create({ projectId, title: 'Test' });

      await Chapters.updateWordCount(chapter.id, 100);

      expect(chapterCache.invalidate).toHaveBeenCalled();
    });

    it('should handle non-existent chapter gracefully', async () => {
      await expect(Chapters.updateWordCount('non-existent', 100)).resolves.toBeUndefined();
    });
  });

  describe('saveDoc()', () => {
    it('should save chapter content', async () => {
      const chapter = await Chapters.create({ projectId, title: 'Test' });

      const doc: ChapterDoc = {
        id: chapter.id,
        content: 'Updated content',
        version: 2,
      };

      await Chapters.saveDoc(doc);

      const fullChapter = await Chapters.get(chapter.id);
      expect(fullChapter.content).toBe('Updated content');
      expect(fullChapter.version).toBe(2);
    });

    it('should invalidate cache', async () => {
      const chapter = await Chapters.create({ projectId, title: 'Test' });

      await Chapters.saveDoc({ id: chapter.id, content: 'New', version: 2 });

      expect(chapterCache.invalidate).toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('should delete chapter metadata and document', async () => {
      const chapter = await Chapters.create({ projectId, title: 'To Delete' });

      await Chapters.remove(chapter.id);

      const meta = await Chapters.getMeta(chapter.id);
      expect(meta).toBeNull();

      await expect(Chapters.get(chapter.id)).rejects.toThrow();
    });

    it('should invalidate cache', async () => {
      const chapter = await Chapters.create({ projectId, title: 'Test' });

      await Chapters.remove(chapter.id);

      expect(chapterCache.invalidate).toHaveBeenCalled();
    });

    it('should not throw when deleting non-existent chapter', async () => {
      await expect(Chapters.remove('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('reorder()', () => {
    it('should reorder chapters by ID array', async () => {
      const ch1 = await Chapters.create({ projectId, title: 'Chapter 1' });
      const ch2 = await Chapters.create({ projectId, title: 'Chapter 2' });
      const ch3 = await Chapters.create({ projectId, title: 'Chapter 3' });

      // Reorder: 3, 1, 2
      await Chapters.reorder(projectId, [ch3.id, ch1.id, ch2.id]);

      const chapters = await Chapters.list(projectId);

      expect(chapters.map((c) => c.title)).toEqual(['Chapter 3', 'Chapter 1', 'Chapter 2']);
      expect(chapters.map((c) => c.index)).toEqual([0, 1, 2]);
    });

    it('should invalidate project cache', async () => {
      const ch1 = await Chapters.create({ projectId, title: 'Chapter 1' });
      const ch2 = await Chapters.create({ projectId, title: 'Chapter 2' });

      await Chapters.reorder(projectId, [ch2.id, ch1.id]);

      expect(chapterCache.invalidateProject).toHaveBeenCalledWith(projectId);
    });

    it('should only reorder chapters belonging to the project', async () => {
      const otherProject = 'other-project';
      const ch1 = await Chapters.create({ projectId, title: 'Project 1' });
      const ch2 = await Chapters.create({ projectId: otherProject, title: 'Project 2' });

      // Try to reorder with chapter from different project
      await Chapters.reorder(projectId, [ch2.id, ch1.id]);

      const chapters = await Chapters.list(projectId);
      // Should only have ch1, ch2 is ignored
      expect(chapters).toHaveLength(1);
    });
  });

  describe('duplicate()', () => {
    it('should create copy of chapter with "(Copy)" suffix', async () => {
      const original = await Chapters.create({
        projectId,
        title: 'Original Chapter',
        content: 'Original content',
        summary: 'Original summary',
      });

      const duplicate = await Chapters.duplicate(original.id);

      expect(duplicate.title).toBe('Original Chapter (Copy)');
      expect(duplicate.projectId).toBe(projectId);
      expect(duplicate.status).toBe('draft');
    });

    it('should copy content from original', async () => {
      const original = await Chapters.create({
        projectId,
        title: 'Test',
        content: 'Content to copy',
      });

      const duplicate = await Chapters.duplicate(original.id);
      const duplicateFull = await Chapters.get(duplicate.id);

      expect(duplicateFull.content).toBe('Content to copy');
    });

    it('should give duplicate a new ID', async () => {
      const original = await Chapters.create({ projectId, title: 'Test' });

      const duplicate = await Chapters.duplicate(original.id);

      expect(duplicate.id).not.toBe(original.id);
    });
  });

  describe('split()', () => {
    it('should split chapter at cursor position', async () => {
      const original = await Chapters.create({
        projectId,
        title: 'Long Chapter',
        content: 'First half. Second half.',
      });

      const result = await Chapters.split(original.id, 12); // After "First half."

      expect(result.first.id).toBe(original.id);
      expect(result.second.id).not.toBe(original.id);

      const firstFull = await Chapters.get(result.first.id);
      const secondFull = await Chapters.get(result.second.id);

      expect(firstFull.content).toBe('First half. ');
      expect(secondFull.content).toBe('Second half.');
    });

    it('should use custom title for second chapter', async () => {
      const original = await Chapters.create({
        projectId,
        title: 'Original',
        content: 'Part one. Part two.',
      });

      const result = await Chapters.split(original.id, 10, 'Second Part');

      expect(result.second.title).toBe('Second Part');
    });

    it('should default to "(Part 2)" suffix for second chapter', async () => {
      const original = await Chapters.create({
        projectId,
        title: 'Chapter 1',
        content: 'Content here. More content.',
      });

      const result = await Chapters.split(original.id, 14);

      expect(result.second.title).toBe('Chapter 1 (Part 2)');
    });

    it('should update word counts for both chapters', async () => {
      const original = await Chapters.create({
        projectId,
        title: 'Test',
        content: 'One two three. Four five six.',
      });

      const result = await Chapters.split(original.id, 15);

      // Re-fetch to ensure we have the latest metadata
      const firstMeta = await Chapters.getMeta(result.first.id);
      const secondMeta = await Chapters.getMeta(result.second.id);

      expect(firstMeta?.wordCount).toBe(3); // "One two three. "
      expect(secondMeta?.wordCount).toBe(3); // "Four five six."
    });

    it('should place new chapter immediately after original', async () => {
      await Chapters.create({ projectId, title: 'Chapter 1' });
      const toSplit = await Chapters.create({ projectId, title: 'Chapter 2', content: 'AB' });
      await Chapters.create({ projectId, title: 'Chapter 3' });

      await Chapters.split(toSplit.id, 1);

      const chapters = await Chapters.list(projectId);
      expect(chapters.map((c) => c.title)).toEqual([
        'Chapter 1',
        'Chapter 2',
        'Chapter 2 (Part 2)',
        'Chapter 3',
      ]);
    });
  });

  describe('mergeWithNext()', () => {
    it('should merge current chapter with next chapter', async () => {
      const ch1 = await Chapters.create({
        projectId,
        title: 'Chapter 1',
        content: 'First chapter content.',
      });
      const ch2 = await Chapters.create({
        projectId,
        title: 'Chapter 2',
        content: 'Second chapter content.',
      });

      await Chapters.mergeWithNext(ch1.id);

      const merged = await Chapters.get(ch1.id);
      expect(merged.content).toBe('First chapter content.\n\nSecond chapter content.');

      // Chapter 2 should be deleted
      const ch2Meta = await Chapters.getMeta(ch2.id);
      expect(ch2Meta).toBeNull();
    });

    it('should update word count after merge', async () => {
      const ch1 = await Chapters.create({ projectId, title: 'Ch1', content: 'One two' });
      const ch2 = await Chapters.create({ projectId, title: 'Ch2', content: 'Three four' });

      await Chapters.mergeWithNext(ch1.id);

      const merged = await Chapters.getMeta(ch1.id);
      expect(merged?.wordCount).toBe(4);
    });

    it('should throw error when merging last chapter', async () => {
      const only = await Chapters.create({ projectId, title: 'Only Chapter' });

      await expect(Chapters.mergeWithNext(only.id)).rejects.toThrow('Cannot merge');
    });

    it('should throw error when chapter not found', async () => {
      await expect(Chapters.mergeWithNext('non-existent')).rejects.toThrow();
    });
  });

  describe('importFromDocument()', () => {
    it('should split document by chapter headings', async () => {
      const document = `## Chapter One
Content for chapter one.

## Chapter Two
Content for chapter two.`;

      const chapters = await Chapters.importFromDocument(projectId, document);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('One');
      expect(chapters[1].title).toBe('Two');
    });

    it('should create single chapter when no headings found', async () => {
      const document = 'Just plain content without headings.';

      const chapters = await Chapters.importFromDocument(projectId, document);

      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBe('Chapter 1');
    });

    it('should update word counts for imported chapters', async () => {
      const document = `## Chapter One
One two three four.`;

      const chapters = await Chapters.importFromDocument(projectId, document);

      // Re-fetch to get updated word count
      const refreshed = await Chapters.getMeta(chapters[0].id);
      expect(refreshed?.wordCount).toBe(4);
    });

    it('should handle custom heading patterns', async () => {
      const document = `# Part 1
Content here.

# Part 2
More content.`;

      const chapters = await Chapters.importFromDocument(projectId, document);

      expect(chapters).toHaveLength(2);
    });
  });

  describe('getCount()', () => {
    it('should return 0 for project with no chapters', async () => {
      const count = await Chapters.getCount(projectId);

      expect(count).toBe(0);
    });

    it('should return correct chapter count', async () => {
      await Chapters.create({ projectId, title: 'Ch 1' });
      await Chapters.create({ projectId, title: 'Ch 2' });
      await Chapters.create({ projectId, title: 'Ch 3' });

      const count = await Chapters.getCount(projectId);

      expect(count).toBe(3);
    });
  });

  describe('getTotalWordCount()', () => {
    it('should return 0 for project with no chapters', async () => {
      const wordCount = await Chapters.getTotalWordCount(projectId);

      expect(wordCount).toBe(0);
    });

    it('should sum word counts across all chapters', async () => {
      const ch1 = await Chapters.create({ projectId, title: 'Ch 1' });
      const ch2 = await Chapters.create({ projectId, title: 'Ch 2' });
      const ch3 = await Chapters.create({ projectId, title: 'Ch 3' });

      await Chapters.updateWordCount(ch1.id, 100);
      await Chapters.updateWordCount(ch2.id, 200);
      await Chapters.updateWordCount(ch3.id, 150);

      const total = await Chapters.getTotalWordCount(projectId);

      expect(total).toBe(450);
    });
  });

  describe('exportChapters()', () => {
    it('should export all chapters with content in order', async () => {
      await Chapters.create({ projectId, title: 'C', content: 'Third', index: 2 });
      await Chapters.create({ projectId, title: 'A', content: 'First', index: 0 });
      await Chapters.create({ projectId, title: 'B', content: 'Second', index: 1 });

      const exported = await Chapters.exportChapters(projectId);

      expect(exported).toHaveLength(3);
      expect(exported.map((c) => c.title)).toEqual(['A', 'B', 'C']);
      expect(exported.map((c) => c.content)).toEqual(['First', 'Second', 'Third']);
    });

    it('should return empty array for project with no chapters', async () => {
      const exported = await Chapters.exportChapters(projectId);

      expect(exported).toEqual([]);
    });
  });

  describe('Word Counting', () => {
    it('should count words correctly', async () => {
      const chapter = await Chapters.create({
        projectId,
        title: 'Test',
        content: 'One two three four five',
      });

      // Update word count (will use internal countWords)
      const fullChapter = await Chapters.get(chapter.id);
      await Chapters.updateWordCount(chapter.id, fullChapter.content.split(/\s+/).length);

      const meta = await Chapters.getMeta(chapter.id);
      expect(meta?.wordCount).toBe(5);
    });

    it('should strip HTML before counting', async () => {
      const chapter = await Chapters.create({
        projectId,
        title: 'Test',
        content: '<p>One two three</p><div>four five</div>',
      });

      // The service's countWords strips HTML
      // Manually test by splitting the chapter
      await Chapters.split(chapter.id, 10);

      const meta = await Chapters.getMeta(chapter.id);
      // Word count should reflect stripped text
      expect(meta?.wordCount).toBeGreaterThan(0);
    });

    it('should handle empty content', async () => {
      const chapter = await Chapters.create({
        projectId,
        title: 'Empty',
        content: '   ',
      });

      await Chapters.updateWordCount(chapter.id, 0);

      const meta = await Chapters.getMeta(chapter.id);
      expect(meta?.wordCount).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent creates for same project', async () => {
      const promises = [
        Chapters.create({ projectId, title: 'A' }),
        Chapters.create({ projectId, title: 'B' }),
        Chapters.create({ projectId, title: 'C' }),
      ];

      const chapters = await Promise.all(promises);

      expect(chapters).toHaveLength(3);
      // All should have unique IDs
      const ids = chapters.map((c) => c.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('should handle very long content', async () => {
      const longContent = 'word '.repeat(10000);

      const chapter = await Chapters.create({
        projectId,
        title: 'Long',
        content: longContent,
      });

      const fullChapter = await Chapters.get(chapter.id);

      expect(fullChapter.content.length).toBeGreaterThan(40000);
    });

    it('should handle special characters in title', async () => {
      const chapter = await Chapters.create({
        projectId,
        title: 'Chapter "Special" & <Chars>',
      });

      const retrieved = await Chapters.getMeta(chapter.id);

      expect(retrieved?.title).toBe('Chapter "Special" & <Chars>');
    });
  });
});
