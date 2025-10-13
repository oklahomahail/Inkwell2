import { vi, describe, it, expect, beforeEach } from 'vitest';

// We'll stub storageService that enhancedSearchService uses internally (must be mocked before importing service)
vi.mock('./storageService', async () => {
  const chapters = [
    {
      id: 'ch-1',
      title: 'Chapter One',
      status: 'draft',
      totalWordCount: 5,
      updatedAt: 1700000000000,
      scenes: [
        {
          id: 's-1',
          title: 'Arrival',
          content: 'The hero arrives in town.',
          wordCount: 5,
          updatedAt: 1700000000001,
        },
        {
          id: 's-2',
          title: 'Market',
          content: 'A bustling market with vendors. The market is very busy.',
          wordCount: 9,
          updatedAt: 1700000000002,
        },
      ],
    },
  ];
  return {
    storageService: {
      loadProject: vi.fn().mockReturnValue({
        id: 'p-1',
        name: 'Demo Project',
        title: 'Demo Project',
        description: 'A test project',
        characters: [],
        chapters: [],
        plotNotes: [],
        worldBuilding: [],
        currentWordCount: 0,
        recentContent: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sessions: [],
        claudeContext: {
          includeCharacters: false,
          includePlotNotes: false,
          includeWorldBuilding: false,
          maxCharacters: 0,
          maxPlotNotes: 0,
          contextLength: 'short',
        },
      }),
      loadWritingChapters: vi.fn(async () => chapters),
    },
  };
});

// Force main-thread path (pretend worker not available)
vi.mock('./searchWorkerService', () => {
  return {
    searchWorkerService: {
      initializeProject: vi.fn().mockResolvedValue({ success: false }),
      getWorkerStatus: vi.fn().mockReturnValue({
        ready: false,
        initialized: false,
        pendingOperations: 0,
        queuedMessages: 0,
      }),
      search: vi.fn(),
      updateDocument: vi.fn(),
      getPerformanceMetrics: vi.fn().mockReturnValue({ p50: 0, p95: 0, queries: 0 }),
    },
  };
});

// Import after mocks so service sees mocked dependencies
const { enhancedSearchService } = await import('./enhancedSearchService');

describe('enhancedSearchService (main-thread fallback)', () => {
  const projectId = 'p-1';

  beforeEach(async () => {
    // Re-init per test
    await enhancedSearchService.initializeProject(projectId);

    // Debug log index contents
    const index = (enhancedSearchService.engine as any).index;
    const docs = index.get(projectId) || [];
    console.log('Index contents for', projectId, ':', docs);
  });

  it('indexes chapters & scenes and returns scored results', async () => {
    const results = await enhancedSearchService.search('market', {
      projectId,
      maxResults: 5,
      minScore: -1,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('excerpt');
    const ids = results.map((r) => r.id);
    expect(ids).toContain('s-2');
    expect(results.some((r) => r.excerpt.toLowerCase().includes('market'))).toBe(true);
  });

  it('updateDocument() reindexes content reflectively', async () => {
    // search for a term that does not exist yet
    const before = await enhancedSearchService.search('dragons', { projectId });
    expect(before.length).toBe(0);

    await enhancedSearchService.updateDocument(projectId, 's-2', 'Market', 'There be dragons here');
    const after = await enhancedSearchService.search('dragons', { projectId });
    expect(after.length).toBeGreaterThan(0);
  });

  it('getStats() returns basic counters', () => {
    const stats = enhancedSearchService.getStats(projectId);
    expect(stats).not.toBeNull();
    expect(stats!.totalDocuments).toBeGreaterThan(0);
    expect(typeof stats!.averageLatency).toBe('number');
  });

  it('handles empty/invalid search queries', async () => {
    // Test undefined query
    const resultsUndefined = await enhancedSearchService.search(undefined as any, { projectId });
    expect(resultsUndefined).toHaveLength(0);

    // Test empty string
    const resultsEmpty = await enhancedSearchService.search('', { projectId });
    expect(resultsEmpty).toHaveLength(0);

    // Test whitespace only
    const resultsWhitespace = await enhancedSearchService.search('   ', { projectId });
    expect(resultsWhitespace).toHaveLength(0);
  });

  it('is resilient to repeated initialization', async () => {
    // Calling initializeProject multiple times should not throw and should yield a stable count
    const first = await enhancedSearchService.initializeProject(projectId);
    const second = await enhancedSearchService.initializeProject(projectId);
    expect(first.totalDocuments).toBeGreaterThanOrEqual(0);
    expect(second.totalDocuments).toBe(first.totalDocuments);
  });

  it('handles partial document content', async () => {
    // Initialize with a partial chapter (missing fields)
    const partialChapter = {
      id: 'partial-1',
      scenes: [
        {
          id: 'scene-partial',
          // Only has ID, missing title/content
        },
      ],
    };

    const storageWithPartial = {
      loadProject: vi.fn().mockResolvedValue({
        id: 'p-partial',
        chapters: [partialChapter],
      }),
      loadWritingChapters: vi.fn().mockResolvedValue([partialChapter]),
    };

    // Temporarily replace storage
    const original = (await import('./storageService')).storageService;
    vi.doMock('./storageService', () => ({
      storageService: storageWithPartial,
    }));

    // Test with partial content
    const { enhancedSearchService: partialService } = await import('./enhancedSearchService');
    const initResult = await partialService.initializeProject('p-partial');
    expect(initResult.totalDocuments).toBeGreaterThan(0); // Should index IDs at minimum

    // Reset mock
    vi.doMock('./storageService', () => ({
      storageService: original,
    }));
  });

  it('getPerformanceMetrics() returns p50/p95/queries', () => {
    const perf = enhancedSearchService.getPerformanceMetrics();
    expect(perf).toHaveProperty('p50');
    expect(perf).toHaveProperty('p95');
    expect(perf).toHaveProperty('queries');
  });
});
