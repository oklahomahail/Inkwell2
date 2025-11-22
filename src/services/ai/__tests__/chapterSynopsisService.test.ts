/**
 * Chapter Synopsis Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { Chapter } from '@/types/project';
import type { ChapterSynopsis } from '@/types/ai';

import * as chapterSynopsisService from '../chapterSynopsisService';

// Mock dependencies
vi.mock('@/services/aiService', () => ({
  aiService: {
    generate: vi.fn(),
  },
}));

vi.mock('idb', () => ({
  openDB: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      transaction: vi.fn(() => ({
        store: {
          index: vi.fn(() => ({
            getAll: vi.fn(() => Promise.resolve([])),
          })),
        },
      })),
    }),
  ),
}));

vi.mock('../shared/caching', () => ({
  generateCacheKey: vi.fn(() => 'test-cache-key'),
  getCached: vi.fn(() => Promise.resolve(null)),
  setCached: vi.fn(() => Promise.resolve()),
}));

describe('chapterSynopsisService', () => {
  const mockChapter: Chapter = {
    id: 'chapter-1',
    title: 'The Beginning',
    content: 'Once upon a time in a land far away, a young hero began their journey...',
    index: 0,
    wordCount: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockSynopsis: ChapterSynopsis = {
    summary:
      'A young hero begins their journey in a distant land, setting the stage for adventure.',
    keyBeats: [
      'Hero introduced in their ordinary world',
      'Call to adventure presented',
      'Initial hesitation shown',
    ],
    emotionalArc: 'From comfortable complacency to curious anticipation',
    conflicts: ['Internal: fear vs. desire for adventure'],
    generatedAt: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateChapterSynopsis', () => {
    it('should generate synopsis for a chapter', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      // Ensure cache miss
      mockGetCached.mockResolvedValueOnce(null);

      mockGenerate.mockResolvedValueOnce({
        content: JSON.stringify(mockSynopsis),
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        usage: {
          promptTokens: 150,
          completionTokens: 200,
          totalTokens: 350,
        },
      });

      const result = await chapterSynopsisService.generateChapterSynopsis(mockChapter, 'project-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.summary).toBe(mockSynopsis.summary);
      expect(result.data?.keyBeats).toHaveLength(3);
      expect(result.metadata.provider).toBe('anthropic');
      expect(result.metadata.cached).toBe(false);
    });

    it('should use cached synopsis if available', async () => {
      const { getCached } = await import('../shared/caching');
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      mockGetCached.mockResolvedValueOnce(mockSynopsis);

      const result = await chapterSynopsisService.generateChapterSynopsis(mockChapter, 'project-1');

      expect(result.success).toBe(true);
      expect(result.metadata.cached).toBe(true);
      expect(result.data).toEqual(mockSynopsis);
    });

    it('should bypass cache when requested', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');

      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      mockGenerate.mockResolvedValueOnce({
        content: JSON.stringify(mockSynopsis),
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });

      const result = await chapterSynopsisService.generateChapterSynopsis(
        mockChapter,
        'project-1',
        { bypassCache: true },
      );

      expect(result.success).toBe(true);
      expect(mockGetCached).not.toHaveBeenCalled();
      expect(mockGenerate).toHaveBeenCalled();
    });

    it('should handle AI service errors gracefully', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      // Ensure cache miss so we hit the error
      mockGetCached.mockResolvedValueOnce(null);
      mockGenerate.mockRejectedValueOnce(new Error('API key not found'));

      const result = await chapterSynopsisService.generateChapterSynopsis(mockChapter, 'project-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('API key');
    });

    it('should handle invalid JSON responses', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      // Ensure cache miss
      mockGetCached.mockResolvedValueOnce(null);

      mockGenerate.mockResolvedValueOnce({
        content: 'This is not JSON',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });

      const result = await chapterSynopsisService.generateChapterSynopsis(mockChapter, 'project-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate synopsis schema', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      // Ensure cache miss
      mockGetCached.mockResolvedValueOnce(null);

      // Invalid synopsis (missing required fields)
      const invalidSynopsis = {
        summary: 'Too short',
        keyBeats: [],
      };

      mockGenerate.mockResolvedValueOnce({
        content: JSON.stringify(invalidSynopsis),
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });

      const result = await chapterSynopsisService.generateChapterSynopsis(mockChapter, 'project-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getStoredChapterSynopsis', () => {
    it('should retrieve stored synopsis', async () => {
      const { openDB } = await import('idb');
      const mockOpenDB = openDB as ReturnType<typeof vi.fn>;

      const mockSuggestion = {
        id: 'synopsis_chapter-1_123',
        projectId: 'project-1',
        chapterId: 'chapter-1',
        type: 'synopsis',
        content: mockSynopsis,
        timestamp: Date.now(),
      };

      mockOpenDB.mockResolvedValueOnce({
        transaction: vi.fn(() => ({
          store: {
            index: vi.fn(() => ({
              getAll: vi.fn(() => Promise.resolve([mockSuggestion])),
            })),
          },
        })),
      });

      const result = await chapterSynopsisService.getStoredChapterSynopsis('chapter-1');

      expect(result).toBeDefined();
      expect(result?.chapterId).toBe('chapter-1');
      expect(result?.type).toBe('synopsis');
    });

    it('should return null if no synopsis found', async () => {
      const { openDB } = await import('idb');
      const mockOpenDB = openDB as ReturnType<typeof vi.fn>;

      mockOpenDB.mockResolvedValueOnce({
        transaction: vi.fn(() => ({
          store: {
            index: vi.fn(() => ({
              getAll: vi.fn(() => Promise.resolve([])),
            })),
          },
        })),
      });

      const result = await chapterSynopsisService.getStoredChapterSynopsis('chapter-1');

      expect(result).toBeNull();
    });
  });

  describe('acceptChapterSynopsis', () => {
    it('should mark synopsis as accepted', async () => {
      const { openDB } = await import('idb');
      const mockOpenDB = openDB as ReturnType<typeof vi.fn>;

      const mockSuggestion = {
        id: 'synopsis_chapter-1_123',
        projectId: 'project-1',
        chapterId: 'chapter-1',
        type: 'synopsis',
        content: mockSynopsis,
        timestamp: Date.now(),
      };

      const mockPut = vi.fn();
      mockOpenDB.mockResolvedValueOnce({
        get: vi.fn(() => Promise.resolve(mockSuggestion)),
        put: mockPut,
      });

      await chapterSynopsisService.acceptChapterSynopsis(
        'synopsis_chapter-1_123',
        'Great summary!',
      );

      expect(mockPut).toHaveBeenCalledWith(
        'ai_suggestions',
        expect.objectContaining({
          accepted: true,
          userFeedback: 'Great summary!',
        }),
      );
    });
  });
});
