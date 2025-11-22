/**
 * Publishing Tools Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { Chapter } from '@/types/project';
import type { PublishingMaterials } from '@/types/ai';

import * as publishingToolsService from '../publishingToolsService';

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

// Helper to generate minimum length strings for validation
const generateMinLengthString = (type: string): string => {
  const prefix = `${type} content: `;
  const minLength =
    type === 'blurb' ? 100 : type === 'query' ? 200 : type === 'synopsis-1' ? 300 : 800;
  return prefix + 'x'.repeat(Math.max(0, minLength - prefix.length));
};

describe('publishingToolsService', () => {
  const mockChapters: Chapter[] = [
    {
      id: 'ch-1',
      title: 'Chapter 1',
      content: 'A hero begins their journey...',
      index: 0,
      wordCount: 500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ch-2',
      title: 'Chapter 2',
      content: 'The adventure continues...',
      index: 1,
      wordCount: 600,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockPublishingMaterials: PublishingMaterials = {
    blurb:
      'A thrilling adventure awaits as our hero embarks on a quest to save the realm from an ancient evil. Packed with magic, betrayal, and redemption in this epic fantasy tale.',
    queryLetter:
      'Dear Agent, I am seeking representation for my 80,000-word fantasy novel THE QUEST. When a disgraced knight discovers an ancient prophecy, he must gather unlikely allies to prevent the return of an evil that nearly destroyed the world. The manuscript is complete and available upon request. I believe this will appeal to readers who enjoyed works similar to Brandon Sanderson and Patrick Rothfuss.',
    synopsisOnePage:
      'THE QUEST follows Sir Aldric, a knight stripped of his title after a tragic betrayal. Living in exile, he discovers an ancient scroll predicting the return of the Shadow King, an entity that nearly destroyed civilization. Despite his disgrace, Aldric must assemble a team including a young mage, a thief with a mysterious past, and the very lord who stripped him of his honor. Together they journey across treacherous lands to find three sacred artifacts needed to seal the Shadow King away. In the climactic battle, Aldric makes a choice that costs him everything but saves the realm, finding redemption not in glory but in sacrifice.',
    synopsisThreePage:
      'THE QUEST is an epic fantasy following Sir Aldric from disgrace to redemption. Five years ago, Aldric was the most celebrated knight until a tragic decision led to civilian casualties and his exile. Now living as a common guard, Aldric discovers an ancient scroll predicting the return of the Shadow King, an entity that nearly destroyed all life. The story follows Aldric as he attempts to warn the kingdom, faces rejection from former allies, and must forge new alliances to prevent catastrophe. He gathers a diverse group: Lyra, a young mage; Finn, a charming thief; and Lord Brennan, the man who stripped him of his knighthood. Their quest takes them through the Whispering Forest, across the Desert of Lost Souls, and into the Sunken City. Each location holds one of three sacred artifacts needed to seal the Shadow King. The journey tests their physical limits and forces them to confront past mistakes. In the final battle, Aldric chooses differently than before, sacrificing his chance at redemption to save his companions and the realm. The novel ends with Aldric recognized as a hero, knowing true redemption comes from making peace with his past. Themes include the nature of honor, the weight of past decisions, and finding strength through vulnerability. The supporting characters each have complete arcs that mirror Aldrics journey in different ways. Lyra learns to trust her power, Finn discovers the meaning of loyalty, and Lord Brennan must admit he was wrong. The antagonist, the Shadow King, represents not just external evil but the darkness within each character that they must overcome.',
    generatedAt: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePublishingMaterial', () => {
    it('should generate a blurb', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      mockGetCached.mockResolvedValueOnce(null);
      mockGenerate.mockResolvedValueOnce({
        content: JSON.stringify({
          blurb: mockPublishingMaterials.blurb,
          generatedAt: Date.now(),
        }),
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        usage: {
          promptTokens: 200,
          completionTokens: 100,
          totalTokens: 300,
        },
      });

      const result = await publishingToolsService.generatePublishingMaterial(
        'project-1',
        mockChapters,
        'blurb',
        { genre: 'Fantasy', description: 'Epic adventure story' },
      );

      expect(result.success).toBe(true);
      expect(result.data?.blurb).toBe(mockPublishingMaterials.blurb);
      expect(result.metadata.provider).toBe('anthropic');
      expect(result.metadata.cached).toBe(false);
    });

    it('should generate a query letter', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      mockGetCached.mockResolvedValueOnce(null);
      mockGenerate.mockResolvedValueOnce({
        content: JSON.stringify({
          queryLetter: mockPublishingMaterials.queryLetter,
          generatedAt: Date.now(),
        }),
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });

      const result = await publishingToolsService.generatePublishingMaterial(
        'project-1',
        mockChapters,
        'query',
      );

      expect(result.success).toBe(true);
      expect(result.data?.queryLetter).toBe(mockPublishingMaterials.queryLetter);
    });

    it('should generate a one-page synopsis', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      mockGetCached.mockResolvedValueOnce(null);
      mockGenerate.mockResolvedValueOnce({
        content: JSON.stringify({
          synopsisOnePage: mockPublishingMaterials.synopsisOnePage,
          generatedAt: Date.now(),
        }),
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });

      const result = await publishingToolsService.generatePublishingMaterial(
        'project-1',
        mockChapters,
        'synopsis-1',
      );

      expect(result.success).toBe(true);
      expect(result.data?.synopsisOnePage).toBe(mockPublishingMaterials.synopsisOnePage);
    });

    it('should use cached materials if available', async () => {
      const { getCached } = await import('../shared/caching');
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      mockGetCached.mockResolvedValueOnce(mockPublishingMaterials);

      const result = await publishingToolsService.generatePublishingMaterial(
        'project-1',
        mockChapters,
        'blurb',
      );

      expect(result.success).toBe(true);
      expect(result.metadata.cached).toBe(true);
      expect(result.data).toEqual(mockPublishingMaterials);
    });

    it('should bypass cache when requested', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      mockGenerate.mockResolvedValueOnce({
        content: JSON.stringify({
          blurb: generateMinLengthString('blurb'),
          generatedAt: Date.now(),
        }),
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });

      const result = await publishingToolsService.generatePublishingMaterial(
        'project-1',
        mockChapters,
        'blurb',
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

      mockGetCached.mockResolvedValueOnce(null);
      mockGenerate.mockRejectedValueOnce(new Error('API key not found'));

      const result = await publishingToolsService.generatePublishingMaterial(
        'project-1',
        mockChapters,
        'blurb',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('API key');
    });
  });

  describe('getStoredPublishingMaterials', () => {
    it('should retrieve and organize stored materials by type', async () => {
      const { openDB } = await import('idb');
      const mockOpenDB = openDB as ReturnType<typeof vi.fn>;

      const mockSuggestions = [
        {
          id: 'pub-blurb-1',
          projectId: 'project-1',
          type: 'publishing',
          content: {
            materialType: 'blurb',
            blurb: 'Test blurb',
            generatedAt: 100,
          },
          timestamp: 100,
        },
        {
          id: 'pub-query-1',
          projectId: 'project-1',
          type: 'publishing',
          content: {
            materialType: 'query',
            queryLetter: 'Test query',
            generatedAt: 200,
          },
          timestamp: 200,
        },
      ];

      mockOpenDB.mockResolvedValueOnce({
        transaction: vi.fn(() => ({
          store: {
            index: vi.fn(() => ({
              getAll: vi.fn(() => Promise.resolve(mockSuggestions)),
            })),
          },
        })),
      });

      const result = await publishingToolsService.getStoredPublishingMaterials('project-1');

      expect(result.size).toBe(2);
      expect(result.has('blurb')).toBe(true);
      expect(result.has('query')).toBe(true);
      expect(result.get('blurb')?.id).toBe('pub-blurb-1');
      expect(result.get('query')?.id).toBe('pub-query-1');
    });

    it('should keep most recent material of each type', async () => {
      const { openDB } = await import('idb');
      const mockOpenDB = openDB as ReturnType<typeof vi.fn>;

      const mockSuggestions = [
        {
          id: 'pub-blurb-old',
          projectId: 'project-1',
          type: 'publishing',
          content: { materialType: 'blurb', blurb: 'Old', generatedAt: 100 },
          timestamp: 100,
        },
        {
          id: 'pub-blurb-new',
          projectId: 'project-1',
          type: 'publishing',
          content: { materialType: 'blurb', blurb: 'New', generatedAt: 200 },
          timestamp: 200,
        },
      ];

      mockOpenDB.mockResolvedValueOnce({
        transaction: vi.fn(() => ({
          store: {
            index: vi.fn(() => ({
              getAll: vi.fn(() => Promise.resolve(mockSuggestions)),
            })),
          },
        })),
      });

      const result = await publishingToolsService.getStoredPublishingMaterials('project-1');

      expect(result.size).toBe(1);
      expect(result.get('blurb')?.id).toBe('pub-blurb-new');
    });
  });

  describe('generatePublishingPackage', () => {
    it('should generate complete package with all materials', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      mockGetCached.mockResolvedValue(null);
      mockGenerate.mockImplementation(async (prompt: string) => {
        // Return different content based on prompt
        if (prompt.includes('blurb')) {
          return {
            content: JSON.stringify({
              blurb: generateMinLengthString('blurb'),
              generatedAt: Date.now(),
            }),
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
          };
        }
        if (prompt.includes('query')) {
          return {
            content: JSON.stringify({
              queryLetter: generateMinLengthString('query'),
              generatedAt: Date.now(),
            }),
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
          };
        }
        if (prompt.includes('one-page')) {
          return {
            content: JSON.stringify({
              synopsisOnePage: generateMinLengthString('synopsis-1'),
              generatedAt: Date.now(),
            }),
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
          };
        }
        return {
          content: JSON.stringify({
            synopsisThreePage: generateMinLengthString('synopsis-3'),
            generatedAt: Date.now(),
          }),
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
        };
      });

      const result = await publishingToolsService.generatePublishingPackage(
        'project-1',
        mockChapters,
      );

      expect(result.success).toBe(true);
      expect(result.metadata.completed).toBe(4);
      expect(result.metadata.total).toBe(4);
      expect(result.materials.blurb).toBeDefined();
      expect(result.materials.query).toBeDefined();
      expect(result.materials['synopsis-1']).toBeDefined();
      expect(result.materials['synopsis-3']).toBeDefined();
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should generate only requested materials', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      mockGetCached.mockResolvedValue(null);
      mockGenerate.mockResolvedValue({
        content: JSON.stringify({
          blurb: generateMinLengthString('blurb'),
          generatedAt: Date.now(),
        }),
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });

      const result = await publishingToolsService.generatePublishingPackage(
        'project-1',
        mockChapters,
        { materials: ['blurb', 'query'] },
      );

      expect(result.metadata.total).toBe(2);
      expect(result.materials.blurb).toBeDefined();
      expect(result.materials['synopsis-1']).toBeUndefined();
    });

    it('should call progress callback', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      const progressCallback = vi.fn();

      mockGetCached.mockResolvedValue(null);
      mockGenerate.mockResolvedValue({
        content: JSON.stringify({
          blurb: generateMinLengthString('blurb'),
          generatedAt: Date.now(),
        }),
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });

      await publishingToolsService.generatePublishingPackage('project-1', mockChapters, {
        materials: ['blurb', 'query'],
        onProgress: progressCallback,
      });

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(0, 2, 'blurb');
      expect(progressCallback).toHaveBeenCalledWith(1, 2, 'query');
    });

    it('should handle partial failures gracefully', async () => {
      const { aiService } = await import('@/services/aiService');
      const { getCached } = await import('../shared/caching');
      const mockGenerate = aiService.generate as ReturnType<typeof vi.fn>;
      const mockGetCached = getCached as ReturnType<typeof vi.fn>;

      mockGetCached.mockResolvedValue(null);
      mockGenerate
        .mockResolvedValueOnce({
          content: JSON.stringify({
            blurb: generateMinLengthString('blurb'),
            generatedAt: Date.now(),
          }),
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
        })
        .mockRejectedValueOnce(new Error('Generation failed'));

      const result = await publishingToolsService.generatePublishingPackage(
        'project-1',
        mockChapters,
        { materials: ['blurb', 'query'] },
      );

      expect(result.success).toBe(false);
      expect(result.materials.blurb).toBeDefined();
      expect(result.errors.query).toBeDefined();
      expect(result.errors.query).toContain('Generation failed');
    });
  });
});
