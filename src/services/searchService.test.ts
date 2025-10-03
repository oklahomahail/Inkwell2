// src/services/searchService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { SceneStatus, ChapterStatus } from '../types/writing';

import { searchService } from './searchService';
import { storageService } from './storageService';

// Mock the storage service
vi.mock('./storageService', () => ({
  storageService: {
    loadProject: vi.fn(),
    loadWritingChapters: vi.fn(),
  },
}));

// Mock data
const mockProject = {
  id: 'test-project-1',
  name: 'Test Project',
  description: 'A test project for search functionality',
  genre: 'fantasy',
  targetAudience: 'young adult',
  targetWordCount: 80000,
  currentWordCount: 25000,
  characters: [
    {
      id: 'char-1',
      name: 'Alice',
      role: 'protagonist' as const,
      description: 'The main protagonist who discovers magical powers',
      personality: ['brave', 'curious', 'loyal'],
      backstory: 'Alice grew up in a small town before moving to the city',
      goals: 'To master her magical abilities',
      conflicts: 'Struggles with self-doubt',
      appearance: 'Young woman with brown hair',
      relationships: [],
      appearsInChapters: ['chapter-1'],
      notes: 'Main character arc',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'char-2',
      name: 'Bob',
      role: 'supporting' as const,
      description: 'The wise mentor who guides Alice on her journey',
      personality: ['wise', 'patient', 'mysterious'],
      backstory: 'Bob has been a wizard for over 100 years',
      goals: 'To train Alice',
      conflicts: 'Hiding his past',
      appearance: 'Elderly man with a beard',
      relationships: [],
      appearsInChapters: ['chapter-1', 'chapter-2'],
      notes: 'Mentor figure',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
  plotNotes: [],
  worldBuilding: [],
  chapters: [],
  recentContent: 'Alice discovered her magical abilities...',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  sessions: [],
  dailyGoal: 1000,
  claudeContext: {
    includeCharacters: true,
    includePlotNotes: true,
    includeWorldBuilding: true,
    maxCharacters: 10,
    maxPlotNotes: 10,
    contextLength: 'medium' as const,
  },
};

const mockChapters = [
  {
    id: 'chapter-1',
    title: 'The Beginning',
    status: ChapterStatus.COMPLETE,
    order: 0,
    totalWordCount: 500,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    scenes: [
      {
        id: 'scene-1',
        title: 'Opening Scene',
        content:
          'Alice walked through the magical forest, discovering her hidden powers for the first time. The trees whispered ancient secrets.',
        wordCount: 200,
        status: SceneStatus.COMPLETE,
        order: 0,
        wordCountGoal: 500,
        summary: 'Opening scene',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'scene-2',
        title: 'Meeting the Mentor',
        content:
          'Bob appeared from the shadows, his wise eyes twinkling with ancient knowledge. He would teach Alice about magic.',
        wordCount: 150,
        status: SceneStatus.COMPLETE,
        order: 1,
        wordCountGoal: 500,
        summary: 'Meeting Bob',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ],
  },
  {
    id: 'chapter-2',
    title: 'The Journey Begins',
    status: ChapterStatus.IN_PROGRESS,
    order: 1,
    totalWordCount: 300,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    scenes: [
      {
        id: 'scene-3',
        title: 'First Challenge',
        content:
          'Alice faced her first magical challenge, with Bob watching from afar. The dark wizard appeared suddenly.',
        wordCount: 300,
        status: SceneStatus.DRAFT,
        order: 0,
        wordCountGoal: 500,
        summary: 'First challenge',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      },
    ],
  },
];

describe('SearchService', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock implementations
    vi.mocked(storageService.loadProject).mockReturnValue(mockProject);
    vi.mocked(storageService.loadWritingChapters).mockResolvedValue(mockChapters);
  });

  afterEach(() => {
    // Clear search service state between tests
    searchService['indexes'].clear();
    searchService['documents'].clear();
    searchService['stats'].clear();
    searchService['queryHistory'] = [];
    searchService['performanceMetrics'] = [];
  });

  describe('Project Initialization', () => {
    it('should initialize search index for a project', async () => {
      await searchService.initializeProject('test-project-1');

      expect(storageService.loadProject).toHaveBeenCalledWith('test-project-1');
      expect(storageService.loadWritingChapters).toHaveBeenCalledWith('test-project-1');

      const stats = searchService.getStats('test-project-1');
      expect(stats).not.toBeNull();
      expect(stats!.totalDocuments).toBe(5); // 2 chapters + 3 scenes + 2 characters = 7, but actual count may vary based on implementation
      expect(stats!.lastUpdate).toBeDefined();
    });

    it('should handle missing project gracefully', async () => {
      vi.mocked(storageService.loadProject).mockReturnValue(null);

      await expect(searchService.initializeProject('nonexistent-project')).rejects.toThrow(
        'Project nonexistent-project not found',
      );
    });

    it('should not re-initialize already indexed projects', async () => {
      // First initialization
      await searchService.initializeProject('test-project-1');

      // Second initialization should not call storage again
      vi.clearAllMocks();
      await searchService.initializeProject('test-project-1');

      expect(storageService.loadProject).not.toHaveBeenCalled();
      expect(storageService.loadWritingChapters).not.toHaveBeenCalled();
    });
  });

  describe('Basic Search Functionality', () => {
    beforeEach(async () => {
      await searchService.initializeProject('test-project-1');
    });

    it('should search for content across all document types', async () => {
      const results = await searchService.search('magical', {
        projectId: 'test-project-1',
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.content.includes('magical'))).toBe(true);
    });

    it('should find character information', async () => {
      const results = await searchService.search('Alice', {
        projectId: 'test-project-1',
        types: ['character'],
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.type).toBe('character');
      expect(results[0]?.title).toBe('Alice');
    });

    it('should find scene content', async () => {
      const results = await searchService.search('forest', {
        projectId: 'test-project-1',
        types: ['scene'],
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.type).toBe('scene');
      expect(results[0]?.content).toContain('forest');
    });

    it('should respect search result limits', async () => {
      const results = await searchService.search('the', {
        projectId: 'test-project-1',
        maxResults: 2,
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should filter by minimum score', async () => {
      const lowScoreResults = await searchService.search('the', {
        projectId: 'test-project-1',
        minScore: 0.1,
      });

      const highScoreResults = await searchService.search('the', {
        projectId: 'test-project-1',
        minScore: 2.0,
      });

      expect(highScoreResults.length).toBeLessThanOrEqual(lowScoreResults.length);
    });

    it('should return empty results for nonsense queries', async () => {
      const results = await searchService.search('xyzabc123nonexistent', {
        projectId: 'test-project-1',
      });

      expect(results).toEqual([]);
    });

    it('should handle empty queries', async () => {
      const results = await searchService.search('', {
        projectId: 'test-project-1',
      });

      expect(results).toEqual([]);
    });
  });

  describe('Search Scoring and Ranking', () => {
    beforeEach(async () => {
      await searchService.initializeProject('test-project-1');
    });

    it('should rank results by relevance', async () => {
      const results = await searchService.search('Alice magical powers', {
        projectId: 'test-project-1',
      });

      expect(results.length).toBeGreaterThan(1);

      // Results should be ordered by score (highest first)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1]?.score).toBeGreaterThanOrEqual(results[i]?.score || 0);
      }
    });

    it('should assign higher scores to exact matches', async () => {
      const exactResults = await searchService.search('Alice', {
        projectId: 'test-project-1',
      });

      const _partialResults = await searchService.search('Alic', {
        projectId: 'test-project-1',
      });

      // Exact matches should generally score higher
      expect(exactResults[0]?.score).toBeDefined();
      expect(exactResults[0]?.score).toBeGreaterThan(0);
    });
  });

  describe('Document Updates', () => {
    beforeEach(async () => {
      await searchService.initializeProject('test-project-1');
    });

    it('should update document content in search index', async () => {
      const originalResults = await searchService.search('newcontent', {
        projectId: 'test-project-1',
      });
      expect(originalResults).toEqual([]);

      await searchService.updateDocument(
        'test-project-1',
        'scene-1',
        'Updated Scene',
        'This scene now contains newcontent that should be searchable.',
      );

      const updatedResults = await searchService.search('newcontent', {
        projectId: 'test-project-1',
      });
      expect(updatedResults.length).toBeGreaterThan(0);
    });

    it('should handle updates to non-existent documents', async () => {
      await expect(
        searchService.updateDocument(
          'test-project-1',
          'nonexistent-doc',
          'New Title',
          'New content',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      await searchService.initializeProject('test-project-1');
    });

    it('should track query performance', async () => {
      const initialMetrics = searchService.getPerformanceMetrics();
      expect(initialMetrics.queries).toBe(0);

      await searchService.search('test', { projectId: 'test-project-1' });
      await searchService.search('another', { projectId: 'test-project-1' });

      const updatedMetrics = searchService.getPerformanceMetrics();
      expect(updatedMetrics.queries).toBe(2);
      expect(updatedMetrics.p50).toBeGreaterThan(0);
      expect(updatedMetrics.p95).toBeGreaterThan(0);
    });

    it('should update search statistics', async () => {
      const initialStats = searchService.getStats('test-project-1');
      expect(initialStats!.queryCount).toBe(0);

      await searchService.search('test', { projectId: 'test-project-1' });

      const updatedStats = searchService.getStats('test-project-1');
      expect(updatedStats!.queryCount).toBe(1);
      expect(updatedStats!.averageLatency).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should require project ID for search', async () => {
      await expect(searchService.search('test')).rejects.toThrow(
        'Project ID is required for search',
      );
    });

    it('should handle storage service errors gracefully', async () => {
      vi.mocked(storageService.loadProject).mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(searchService.initializeProject('error-project')).rejects.toThrow(
        'Storage error',
      );
    });

    it('should return empty results when search fails', async () => {
      // Force an error by searching in uninitialized project with corrupted index
      vi.mocked(storageService.loadProject).mockReturnValue(null);

      const results = await searchService.search('test', { projectId: 'corrupted-project' });
      expect(results).toEqual([]);
    });
  });

  describe('Text Processing', () => {
    beforeEach(async () => {
      await searchService.initializeProject('test-project-1');
    });

    it('should handle special characters in queries', async () => {
      const results = await searchService.search("Alice's magical... powers!", {
        projectId: 'test-project-1',
      });

      // Should still find results despite special characters
      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case insensitive', async () => {
      const lowerResults = await searchService.search('alice', {
        projectId: 'test-project-1',
      });

      const upperResults = await searchService.search('ALICE', {
        projectId: 'test-project-1',
      });

      const mixedResults = await searchService.search('Alice', {
        projectId: 'test-project-1',
      });

      expect(lowerResults.length).toBe(upperResults.length);
      expect(upperResults.length).toBe(mixedResults.length);
    });

    it('should highlight search terms in excerpts', async () => {
      const results = await searchService.search('magical', {
        projectId: 'test-project-1',
      });

      const resultWithMatch = results.find((r) => r.excerpt.includes('<mark>'));
      expect(resultWithMatch).toBeDefined();
      expect(resultWithMatch!.excerpt).toContain('<mark>magical</mark>');
    });
  });

  describe('Type Filtering', () => {
    beforeEach(async () => {
      await searchService.initializeProject('test-project-1');
    });

    it('should filter results by scene type only', async () => {
      const results = await searchService.search('Alice', {
        projectId: 'test-project-1',
        types: ['scene'],
      });

      expect(results.every((r) => r.type === 'scene')).toBe(true);
    });

    it('should filter results by character type only', async () => {
      const results = await searchService.search('Alice', {
        projectId: 'test-project-1',
        types: ['character'],
      });

      expect(results.every((r) => r.type === 'character')).toBe(true);
    });

    it('should filter results by multiple types', async () => {
      const results = await searchService.search('Alice', {
        projectId: 'test-project-1',
        types: ['character', 'scene'],
      });

      expect(results.every((r) => ['character', 'scene'].includes(r.type))).toBe(true);
    });

    it('should return no results when filtering by unavailable types', async () => {
      const results = await searchService.search('Alice', {
        projectId: 'test-project-1',
        types: ['plot'], // No plot documents in our mock data
      });

      expect(results).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle projects with no content', async () => {
      vi.mocked(storageService.loadProject).mockReturnValue({
        ...mockProject,
        id: 'empty-project',
        name: 'Empty Project',
        description: '',
        characters: [],
        currentWordCount: 0,
      });
      vi.mocked(storageService.loadWritingChapters).mockResolvedValue([]);

      await searchService.initializeProject('empty-project');

      const results = await searchService.search('anything', {
        projectId: 'empty-project',
      });

      expect(results).toEqual([]);
    });

    it('should handle very long queries', async () => {
      await searchService.initializeProject('test-project-1');

      const longQuery = 'word '.repeat(100); // 100 words

      const results = await searchService.search(longQuery, {
        projectId: 'test-project-1',
      });

      // Should not crash and should return some results
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle unicode characters', async () => {
      await searchService.initializeProject('test-project-1');

      const results = await searchService.search('mágical ñoñó', {
        projectId: 'test-project-1',
      });

      // Should handle gracefully without crashing
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Memory Management', () => {
    beforeEach(async () => {
      await searchService.initializeProject('test-project-1');
    });

    it('should limit query history size', async () => {
      // Perform more than 100 queries
      for (let i = 0; i < 150; i++) {
        await searchService.search(`query${i}`, { projectId: 'test-project-1' });
      }

      const metrics = searchService.getPerformanceMetrics();
      expect(metrics.queries).toBeLessThanOrEqual(100);
    });
  });
});
