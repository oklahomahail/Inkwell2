/**
 * Chapter Model Gateway Tests
 *
 * Comprehensive test suite for the chapters model gateway,
 * covering both new (IndexedDB) and legacy (localStorage) modes.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Chapter } from '@/types/project';

// Create hoisted mocks before any imports
const mockFeatureFlags = vi.hoisted(() => ({
  FEATURE_FLAGS: {
    CHAPTER_MODEL: { defaultValue: false },
  },
}));

// Mock dependencies before imports
vi.mock('@/utils/featureFlags.config', () => mockFeatureFlags);

vi.mock('@/utils/perf', () => ({
  trackChapterQuery: vi.fn((name, fn) => fn()),
}));

// Now import the module under test
import {
  getChapters,
  getChapter,
  saveChapter,
  createChapter,
  updateChapterContent,
  deleteChapter,
  reorderChapters,
  getChapterCount,
  getTotalWordCount,
  isChapterModelEnabled,
  ChapterGateway,
} from '../chapters';

// Mock services (will be replaced per test)
const mockChaptersService = {
  list: vi.fn(),
  get: vi.fn(),
  getMeta: vi.fn(),
  create: vi.fn(),
  updateMeta: vi.fn(),
  saveDoc: vi.fn(),
  remove: vi.fn(),
  reorder: vi.fn(),
};

const mockStorageService = {
  getChapters: vi.fn(),
  getChapter: vi.fn(),
  saveChapter: vi.fn(),
  deleteChapter: vi.fn(),
  getProject: vi.fn(),
};

vi.mock('@/services/chaptersService', () => ({
  Chapters: mockChaptersService,
}));

vi.mock('@/services/storageService', () => ({
  EnhancedStorageService: mockStorageService,
}));

vi.mock('@/services/chapterCache', () => ({
  chapterCache: {
    invalidate: vi.fn(),
    invalidateProject: vi.fn(),
  },
  CacheKeys: {
    chapterList: (projectId: string) => `chapters:list:${projectId}`,
    chapterMeta: (chapterId: string) => `chapter:meta:${chapterId}`,
  },
  withChapterListCache: vi.fn((projectId, fn) => fn()),
}));

vi.mock('@/adapters', () => ({
  sceneChapterToCanonical: vi.fn((chapter) => chapter),
  convertLegacyChapters: vi.fn((chapters) => chapters),
  canonicalToLegacyChapter: vi.fn((chapter) => chapter),
  isLegacyChapterFormat: vi.fn(() => false),
}));

describe('Chapter Model Gateway', () => {
  const projectId = 'project-123';
  const chapterId = 'chapter-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset feature flag to default
    mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = false;
  });

  describe('Feature Flag Check', () => {
    it('should return false when chapter model is disabled', () => {
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = false;

      expect(isChapterModelEnabled()).toBe(false);
    });

    it('should return true when chapter model is enabled', () => {
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      expect(isChapterModelEnabled()).toBe(true);
    });
  });

  describe('getChapters (Legacy Mode)', () => {
    beforeEach(() => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = false;
    });

    it('should fetch chapters from storage service', async () => {
      const mockChapters: Chapter[] = [
        {
          id: 'ch-1',
          title: 'Chapter 1',
          summary: 'Summary 1',
          content: 'Content 1',
          wordCount: 100,
          status: 'in-progress',
          order: 0,
          charactersInChapter: [],
          plotPointsResolved: [],
          notes: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockStorageService.getChapters.mockResolvedValue(mockChapters);

      const result = await getChapters(projectId);

      expect(mockStorageService.getChapters).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(mockChapters);
    });

    it('should return empty array when no chapters exist', async () => {
      mockStorageService.getChapters.mockResolvedValue(null);

      const result = await getChapters(projectId);

      expect(result).toEqual([]);
    });

    it('should convert legacy scene-based chapters to canonical format', async () => {
      const legacyChapter = {
        id: 'ch-1',
        title: 'Chapter 1',
        scenes: [
          {
            id: 'scene-1',
            content: 'Scene content',
            metadata: {},
          },
        ],
      };

      mockStorageService.getChapters.mockResolvedValue([legacyChapter]);

      const result = await getChapters(projectId);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getChapters (New Model)', () => {
    beforeEach(() => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;
    });

    it('should fetch chapters from IndexedDB service', async () => {
      const mockMetas = [
        {
          id: 'ch-1',
          projectId,
          title: 'Chapter 1',
          summary: 'Summary 1',
          status: 'draft',
          index: 0,
          wordCount: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockFullChapter = {
        ...mockMetas[0],
        content: 'Chapter content',
      };

      mockChaptersService.list.mockResolvedValue(mockMetas);
      mockChaptersService.get.mockResolvedValue(mockFullChapter);

      const result = await getChapters(projectId);

      expect(mockChaptersService.list).toHaveBeenCalledWith(projectId);
      expect(mockChaptersService.get).toHaveBeenCalledWith('ch-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'ch-1',
        title: 'Chapter 1',
        content: 'Chapter content',
        wordCount: 100,
      });
    });

    it('should map chapter status correctly from new model', async () => {
      const mockMetas = [
        {
          id: 'ch-1',
          projectId,
          title: 'Chapter 1',
          summary: '',
          status: 'final',
          index: 0,
          wordCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockFullChapter = {
        ...mockMetas[0],
        content: '',
      };

      mockChaptersService.list.mockResolvedValue(mockMetas);
      mockChaptersService.get.mockResolvedValue(mockFullChapter);

      const result = await getChapters(projectId);

      expect(result[0].status).toBe('completed');
    });
  });

  describe('getChapter', () => {
    it('should fetch single chapter in legacy mode', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = false;

      const mockChapter: Chapter = {
        id: chapterId,
        title: 'Chapter Title',
        summary: 'Summary',
        content: 'Content',
        wordCount: 50,
        status: 'in-progress',
        order: 0,
        charactersInChapter: [],
        plotPointsResolved: [],
        notes: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockStorageService.getChapter.mockResolvedValue(mockChapter);

      const result = await getChapter(chapterId);

      expect(mockStorageService.getChapter).toHaveBeenCalledWith(chapterId);
      expect(result).toEqual(mockChapter);
    });

    it('should fetch single chapter in new model mode', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      const mockFullChapter = {
        id: chapterId,
        projectId,
        title: 'Chapter Title',
        summary: 'Summary',
        content: 'Content',
        status: 'draft',
        index: 0,
        wordCount: 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockChaptersService.get.mockResolvedValue(mockFullChapter);

      const result = await getChapter(chapterId);

      expect(mockChaptersService.get).toHaveBeenCalledWith(chapterId);
      expect(result).toMatchObject({
        id: chapterId,
        title: 'Chapter Title',
        content: 'Content',
      });
    });

    it('should return null when chapter not found in new model', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      mockChaptersService.get.mockRejectedValue(new Error('Not found'));

      // Suppress expected console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getChapter(chapterId);

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });

    it('should return null when chapter not found in legacy mode', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = false;

      mockStorageService.getChapter.mockResolvedValue(null);

      const result = await getChapter(chapterId);

      expect(result).toBeNull();
    });
  });

  describe('saveChapter', () => {
    const chapter: Chapter = {
      id: chapterId,
      title: 'Test Chapter',
      summary: 'Test summary',
      content: 'Test content',
      wordCount: 100,
      status: 'in-progress',
      order: 0,
      charactersInChapter: [],
      plotPointsResolved: [],
      notes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should create new chapter in new model when it does not exist', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      mockChaptersService.getMeta.mockResolvedValue(null);

      await saveChapter(projectId, chapter);

      expect(mockChaptersService.getMeta).toHaveBeenCalledWith(chapterId);
      expect(mockChaptersService.create).toHaveBeenCalledWith({
        id: chapterId,
        projectId,
        title: 'Test Chapter',
        summary: 'Test summary',
        content: 'Test content',
        index: 0,
        status: 'draft',
      });
    });

    it('should update existing chapter in new model', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      mockChaptersService.getMeta.mockResolvedValue({ id: chapterId });

      await saveChapter(projectId, chapter);

      expect(mockChaptersService.updateMeta).toHaveBeenCalled();
      expect(mockChaptersService.saveDoc).toHaveBeenCalledWith(chapterId, {
        content: 'Test content',
        wordCount: 100,
      });
    });

    it('should save chapter to localStorage in legacy mode', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = false;

      await saveChapter(projectId, chapter);

      expect(mockStorageService.saveChapter).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({
          id: chapterId,
          title: 'Test Chapter',
        }),
      );
    });
  });

  describe('createChapter', () => {
    it('should create chapter with default values', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      mockChaptersService.getMeta.mockResolvedValue(null);

      const result = await createChapter(projectId, 'New Chapter');

      expect(result).toMatchObject({
        title: 'New Chapter',
        summary: '',
        content: '',
        wordCount: 0,
        status: 'in-progress',
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it('should create chapter with custom options', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      mockChaptersService.getMeta.mockResolvedValue(null);

      const result = await createChapter(projectId, 'Custom Chapter', {
        summary: 'Custom summary',
        content: 'Custom content',
        status: 'completed',
        order: 5,
      });

      expect(result).toMatchObject({
        title: 'Custom Chapter',
        summary: 'Custom summary',
        content: 'Custom content',
        status: 'completed',
        order: 5,
      });
    });
  });

  describe('updateChapterContent', () => {
    it('should update content directly in new model', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      const mockMeta = {
        id: chapterId,
        title: 'Chapter',
        wordCount: 0,
      };

      mockChaptersService.getMeta.mockResolvedValue(mockMeta);

      await updateChapterContent(projectId, chapterId, 'New content here', 150);

      expect(mockChaptersService.saveDoc).toHaveBeenCalledWith(chapterId, {
        content: 'New content here',
        wordCount: 150,
      });
      expect(mockChaptersService.updateMeta).toHaveBeenCalledWith({
        ...mockMeta,
        wordCount: 150,
      });
    });

    it('should auto-calculate word count if not provided', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      mockChaptersService.getMeta.mockResolvedValue({ id: chapterId });

      await updateChapterContent(projectId, chapterId, 'One two three four five');

      expect(mockChaptersService.saveDoc).toHaveBeenCalledWith(chapterId, {
        content: 'One two three four five',
        wordCount: 5,
      });
    });

    it('should load, modify, and save in legacy mode', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = false;

      const existingChapter: Chapter = {
        id: chapterId,
        title: 'Chapter',
        summary: '',
        content: 'Old content',
        wordCount: 50,
        status: 'in-progress',
        order: 0,
        charactersInChapter: [],
        plotPointsResolved: [],
        notes: '',
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
      };

      mockStorageService.getChapter.mockResolvedValue(existingChapter);

      await updateChapterContent(projectId, chapterId, 'New content', 100);

      expect(mockStorageService.saveChapter).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({
          content: 'New content',
          wordCount: 100,
        }),
      );
    });
  });

  describe('deleteChapter', () => {
    it('should delete from IndexedDB in new model', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      await deleteChapter(projectId, chapterId);

      expect(mockChaptersService.remove).toHaveBeenCalledWith(chapterId);
    });

    it('should delete from localStorage in legacy mode', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = false;

      await deleteChapter(projectId, chapterId);

      expect(mockStorageService.deleteChapter).toHaveBeenCalledWith(projectId, chapterId);
    });
  });

  describe('reorderChapters', () => {
    it('should reorder chapters in new model', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      const chapterIds = ['ch-1', 'ch-2', 'ch-3'];

      await reorderChapters(projectId, chapterIds);

      expect(mockChaptersService.reorder).toHaveBeenCalledWith(projectId, chapterIds);
    });

    it('should reorder chapters in legacy mode by loading and saving', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = false;

      const mockChapters: Chapter[] = [
        {
          id: 'ch-3',
          title: 'Chapter 3',
          summary: '',
          content: '',
          wordCount: 0,
          status: 'in-progress',
          order: 2,
          charactersInChapter: [],
          plotPointsResolved: [],
          notes: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'ch-1',
          title: 'Chapter 1',
          summary: '',
          content: '',
          wordCount: 0,
          status: 'in-progress',
          order: 0,
          charactersInChapter: [],
          plotPointsResolved: [],
          notes: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'ch-2',
          title: 'Chapter 2',
          summary: '',
          content: '',
          wordCount: 0,
          status: 'in-progress',
          order: 1,
          charactersInChapter: [],
          plotPointsResolved: [],
          notes: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockStorageService.getChapters.mockResolvedValue(mockChapters);

      const newOrder = ['ch-2', 'ch-3', 'ch-1'];
      await reorderChapters(projectId, newOrder);

      expect(mockStorageService.saveChapter).toHaveBeenCalledTimes(3);
      expect(mockStorageService.saveChapter).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({ id: 'ch-2', order: 0 }),
      );
      expect(mockStorageService.saveChapter).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({ id: 'ch-3', order: 1 }),
      );
      expect(mockStorageService.saveChapter).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({ id: 'ch-1', order: 2 }),
      );
    });
  });

  describe('getChapterCount', () => {
    it('should count chapters from metas in new model', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      mockChaptersService.list.mockResolvedValue([{ id: '1' }, { id: '2' }, { id: '3' }]);

      const count = await getChapterCount(projectId);

      expect(count).toBe(3);
      expect(mockChaptersService.list).toHaveBeenCalledWith(projectId);
    });

    it('should count chapters from full list in legacy mode', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = false;

      mockStorageService.getChapters.mockResolvedValue([{}, {}, {}, {}]);

      const count = await getChapterCount(projectId);

      expect(count).toBe(4);
    });
  });

  describe('getTotalWordCount', () => {
    it('should sum word counts from metas in new model', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      mockChaptersService.list.mockResolvedValue([
        { wordCount: 100 },
        { wordCount: 200 },
        { wordCount: 150 },
      ]);

      const total = await getTotalWordCount(projectId);

      expect(total).toBe(450);
    });

    it('should sum word counts from chapters in legacy mode', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = false;

      mockStorageService.getChapters.mockResolvedValue([
        { wordCount: 300 },
        { wordCount: 400 },
      ] as Chapter[]);

      const total = await getTotalWordCount(projectId);

      expect(total).toBe(700);
    });
  });

  describe('ChapterGateway Export', () => {
    it('should export all gateway functions', () => {
      expect(ChapterGateway).toHaveProperty('getChapters');
      expect(ChapterGateway).toHaveProperty('getChapter');
      expect(ChapterGateway).toHaveProperty('saveChapter');
      expect(ChapterGateway).toHaveProperty('createChapter');
      expect(ChapterGateway).toHaveProperty('updateChapterContent');
      expect(ChapterGateway).toHaveProperty('deleteChapter');
      expect(ChapterGateway).toHaveProperty('reorderChapters');
      expect(ChapterGateway).toHaveProperty('getChapterCount');
      expect(ChapterGateway).toHaveProperty('getTotalWordCount');
      expect(ChapterGateway).toHaveProperty('isChapterModelEnabled');
    });
  });

  describe('Status Mapping', () => {
    it('should map "draft" status to "first-draft"', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      mockChaptersService.list.mockResolvedValue([
        {
          id: 'ch-1',
          projectId,
          title: 'Ch',
          summary: '',
          status: 'draft',
          index: 0,
          wordCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      mockChaptersService.get.mockResolvedValue({
        id: 'ch-1',
        projectId,
        title: 'Ch',
        summary: '',
        content: '',
        status: 'draft',
        index: 0,
        wordCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const chapters = await getChapters(projectId);
      expect(chapters[0].status).toBe('first-draft');
    });

    it('should map "revising" status to "revised"', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      mockChaptersService.list.mockResolvedValue([
        {
          id: 'ch-1',
          projectId,
          title: 'Ch',
          summary: '',
          status: 'revising',
          index: 0,
          wordCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      mockChaptersService.get.mockResolvedValue({
        id: 'ch-1',
        projectId,
        title: 'Ch',
        summary: '',
        content: '',
        status: 'revising',
        index: 0,
        wordCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const chapters = await getChapters(projectId);
      expect(chapters[0].status).toBe('revised');
    });

    it('should map canonical status back to ChapterMeta status when saving', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      mockChaptersService.getMeta.mockResolvedValue(null);

      const chapter: Chapter = {
        id: chapterId,
        title: 'Test',
        summary: '',
        content: '',
        wordCount: 0,
        status: 'completed',
        order: 0,
        charactersInChapter: [],
        plotPointsResolved: [],
        notes: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveChapter(projectId, chapter);

      expect(mockChaptersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'final',
        }),
      );
    });
  });

  describe('Word Count Calculation', () => {
    it('should strip HTML tags before counting words', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      mockChaptersService.getMeta.mockResolvedValue({ id: chapterId });

      const htmlContent = '<p>One two three</p> <div>four five</div>';

      await updateChapterContent(projectId, chapterId, htmlContent);

      expect(mockChaptersService.saveDoc).toHaveBeenCalledWith(chapterId, {
        content: htmlContent,
        wordCount: 5,
      });
    });

    it('should handle empty content', async () => {
      // Use mockFeatureFlags directly
      mockFeatureFlags.FEATURE_FLAGS.CHAPTER_MODEL.defaultValue = true;

      mockChaptersService.getMeta.mockResolvedValue({ id: chapterId });

      await updateChapterContent(projectId, chapterId, '   ');

      expect(mockChaptersService.saveDoc).toHaveBeenCalledWith(chapterId, {
        content: '   ',
        wordCount: 0,
      });
    });
  });
});
