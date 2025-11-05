import { vi, describe, it, expect, beforeEach } from 'vitest';

import { enhancedSearchService } from './enhancedSearchService';

// We'll stub storageService that enhancedSearchService uses internally
vi.mock('./storageService', () => {
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
      loadProject: vi.fn().mockReturnValue({ id: 'p-1', title: 'Demo' }),
      loadWritingChapters: vi.fn().mockResolvedValue(chapters),
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

describe('enhancedSearchService (main-thread fallback)', () => {
  const projectId = 'p-1';

  beforeEach(async () => {
    // Re-init per test
    await enhancedSearchService.initializeProject(projectId);
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

  it('getPerformanceMetrics() returns p50/p95/queries', () => {
    const perf = enhancedSearchService.getPerformanceMetrics();
    expect(perf).toHaveProperty('p50');
    expect(perf).toHaveProperty('p95');
    expect(perf).toHaveProperty('queries');
  });
});
