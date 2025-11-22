/**
 * Scene Classification Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { SceneMetadata } from '@/types/ai';

import * as sceneClassificationService from '../sceneClassificationService';

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
      getAll: vi.fn(() => Promise.resolve([])),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve(null)),
        })),
        done: Promise.resolve(),
      })),
    }),
  ),
}));

vi.mock('../shared/caching', () => ({
  generateCacheKey: vi.fn(() => 'test-cache-key'),
  getCached: vi.fn(() => Promise.resolve(null)),
  setCached: vi.fn(() => Promise.resolve()),
}));

describe('sceneClassificationService', () => {
  const mockSceneContent = `
    The two warriors faced each other across the dusty arena.
    Steel rang against steel as their swords clashed.
    The crowd roared with approval as blood was drawn.
  `;

  const mockClassification = {
    sceneType: 'action' as const,
    confidence: 0.92,
    reasoning: 'Direct physical confrontation with combat description',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('classifyScene', () => {
    it('should classify a scene successfully', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      // Ensure cache miss
      mockGetCached.mockResolvedValueOnce(null);

      mockGenerate.mockResolvedValueOnce({
        content: JSON.stringify(mockClassification),
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
      });

      const result = await sceneClassificationService.classifyScene('chapter-1', mockSceneContent);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.sceneType).toBe('action');
      expect(result.data?.confidence).toBe(0.92);
      expect(result.data?.chapterId).toBe('chapter-1');
      expect(result.metadata.provider).toBe('anthropic');
      expect(result.metadata.cached).toBe(false);
    });

    it('should use cached classification if available', async () => {
      const { getCached } = await import('../shared/caching');
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      const cachedMetadata: SceneMetadata = {
        chapterId: 'chapter-1',
        sceneType: 'action',
        confidence: 0.92,
        analyzedAt: Date.now(),
      };

      mockGetCached.mockResolvedValueOnce(cachedMetadata);

      const result = await sceneClassificationService.classifyScene('chapter-1', mockSceneContent);

      expect(result.success).toBe(true);
      expect(result.metadata.cached).toBe(true);
      expect(result.data).toEqual(cachedMetadata);
    });

    it('should bypass cache when requested', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      mockGenerate.mockResolvedValueOnce({
        content: JSON.stringify(mockClassification),
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });

      const result = await sceneClassificationService.classifyScene('chapter-1', mockSceneContent, {
        bypassCache: true,
      });

      expect(result.success).toBe(true);
      expect(mockGetCached).not.toHaveBeenCalled();
      expect(mockGenerate).toHaveBeenCalled();
    });

    it('should handle AI service errors gracefully', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      mockGetCached.mockResolvedValueOnce(null);
      mockGenerate.mockRejectedValueOnce(new Error('API key not found'));

      const result = await sceneClassificationService.classifyScene('chapter-1', mockSceneContent);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('API key');
    });

    it('should classify different scene types correctly', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      const sceneTypes = ['conflict', 'reveal', 'transition', 'emotional', 'setup', 'resolution'];

      for (const sceneType of sceneTypes) {
        mockGetCached.mockResolvedValueOnce(null);
        mockGenerate.mockResolvedValueOnce({
          content: JSON.stringify({
            sceneType,
            confidence: 0.85,
          }),
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
        });

        const result = await sceneClassificationService.classifyScene('chapter-1', 'test content');

        expect(result.success).toBe(true);
        expect(result.data?.sceneType).toBe(sceneType);
      }
    });
  });

  describe('getStoredSceneMetadata', () => {
    it('should retrieve stored metadata', async () => {
      const { openDB } = await import('idb');
      const mockOpenDB = openDB as ReturnType<typeof vi.fn>;

      const mockMetadata = {
        chapterId: 'chapter-1',
        sceneType: 'action',
        confidence: 0.92,
        analyzedAt: Date.now(),
        _processing: {
          model: 'claude-3-5-sonnet-20241022',
          provider: 'anthropic',
        },
      };

      mockOpenDB.mockResolvedValueOnce({
        get: vi.fn(() => Promise.resolve(mockMetadata)),
      });

      const result = await sceneClassificationService.getStoredSceneMetadata('chapter-1');

      expect(result).toBeDefined();
      expect(result?.chapterId).toBe('chapter-1');
      expect(result?.sceneType).toBe('action');
      // Processing metadata should be stripped
      expect((result as any)._processing).toBeUndefined();
    });

    it('should return null if no metadata found', async () => {
      const { openDB } = await import('idb');
      const mockOpenDB = openDB as ReturnType<typeof vi.fn>;

      mockOpenDB.mockResolvedValueOnce({
        get: vi.fn(() => Promise.resolve(null)),
      });

      const result = await sceneClassificationService.getStoredSceneMetadata('chapter-1');

      expect(result).toBeNull();
    });
  });

  describe('getBulkSceneMetadata', () => {
    it('should retrieve metadata for multiple chapters', async () => {
      const { openDB } = await import('idb');
      const mockOpenDB = openDB as ReturnType<typeof vi.fn>;

      const mockGet = vi.fn((id: string) => {
        if (id === 'chapter-1') {
          return Promise.resolve({
            chapterId: 'chapter-1',
            sceneType: 'action',
            confidence: 0.92,
            analyzedAt: Date.now(),
          });
        }
        if (id === 'chapter-2') {
          return Promise.resolve({
            chapterId: 'chapter-2',
            sceneType: 'emotional',
            confidence: 0.88,
            analyzedAt: Date.now(),
          });
        }
        return Promise.resolve(null);
      });

      mockOpenDB.mockResolvedValueOnce({
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: mockGet,
          })),
          done: Promise.resolve(),
        })),
      });

      const results = await sceneClassificationService.getBulkSceneMetadata([
        'chapter-1',
        'chapter-2',
        'chapter-3',
      ]);

      expect(results.size).toBe(2);
      expect(results.get('chapter-1')?.sceneType).toBe('action');
      expect(results.get('chapter-2')?.sceneType).toBe('emotional');
      expect(results.has('chapter-3')).toBe(false);
    });
  });

  describe('getSceneTypeStats', () => {
    it('should calculate scene type statistics', async () => {
      const { openDB } = await import('idb');
      const mockOpenDB = openDB as ReturnType<typeof vi.fn>;

      const mockMetadata = [
        { sceneType: 'action' },
        { sceneType: 'action' },
        { sceneType: 'conflict' },
        { sceneType: 'emotional' },
        { sceneType: 'action' },
      ];

      mockOpenDB.mockResolvedValueOnce({
        getAll: vi.fn(() => Promise.resolve(mockMetadata)),
      });

      const stats = await sceneClassificationService.getSceneTypeStats();

      expect(stats.action).toBe(3);
      expect(stats.conflict).toBe(1);
      expect(stats.emotional).toBe(1);
      expect(stats.reveal).toBe(0);
    });
  });

  describe('classifyScenes', () => {
    it('should classify multiple scenes', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      const scenes = [
        { chapterId: 'ch-1', content: 'content 1' },
        { chapterId: 'ch-2', content: 'content 2' },
        { chapterId: 'ch-3', content: 'content 3' },
      ];

      mockGetCached.mockResolvedValue(null);
      mockGenerate.mockResolvedValue({
        content: JSON.stringify({ sceneType: 'action', confidence: 0.9 }),
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });

      const results = await sceneClassificationService.classifyScenes(scenes);

      expect(results.size).toBe(3);
      expect(results.get('ch-1')?.success).toBe(true);
      expect(results.get('ch-2')?.success).toBe(true);
      expect(results.get('ch-3')?.success).toBe(true);
    });

    it('should call progress callback', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      const progressCallback = vi.fn();
      const scenes = [
        { chapterId: 'ch-1', content: 'content 1' },
        { chapterId: 'ch-2', content: 'content 2' },
      ];

      mockGetCached.mockResolvedValue(null);
      mockGenerate.mockResolvedValue({
        content: JSON.stringify({ sceneType: 'action', confidence: 0.9 }),
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });

      await sceneClassificationService.classifyScenes(scenes, {
        onProgress: progressCallback,
      });

      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenCalledWith(1, 2);
      expect(progressCallback).toHaveBeenCalledWith(2, 2);
    });
  });
});
