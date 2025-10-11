// src/test/searchBenchmarkHarness.ts
import {
  generateSyntheticCorpus,
  type GeneratedCorpus,
  type CorpusSettings,
} from './syntheticCorpusGenerator';

import { searchService, type SearchOptions } from '@/services/searchService';
import { approxWordCount, makeCorpus } from '@/dev/makeCoprus';

export interface BenchmarkConfig {
  warmupQueries: number; // Number of warmup queries to run first
  benchmarkQueries: number; // Number of queries to measure
  corpusSettings?: Partial<CorpusSettings>;
  searchOptions?: Partial<SearchOptions>;
  queryTypes?: QueryType[]; // Types of queries to test
  logResults?: boolean; // Log detailed results
  targetMetrics: {
    p50MaxMs: number;
    p95MaxMs: number;
    maxIndexSizeBytes: number;
    maxIndexBuildTimeMs: number;
  };
}

export type QueryType = 'single-word' | 'multi-word' | 'character-name' | 'phrase' | 'rare-word';

export interface BenchmarkResult {
  passed: boolean;
  corpus: {
    totalWords: number;
    totalScenes: number;
    totalChapters: number;
    characters: number;
  };
  indexBuild: {
    timeMs: number;
    sizeBytes: number;
    documentsIndexed: number;
  };
  queryPerformance: {
    totalQueries: number;
    latencies: number[];
    p50: number;
    p95: number;
    p99: number;
    averageResultCount: number;
    failureRate: number;
  };
  memoryUsage: {
    beforeMB: number;
    afterMB: number;
    deltaMB: number;
  };
  detailsByQueryType: Record<
    QueryType,
    {
      count: number;
      p50: number;
      p95: number;
      averageResults: number;
    }
  >;
  suggestions: string[];
}

interface QueryPattern {
  type: QueryType;
  generator: (_corpus: GeneratedCorpus) => string[];
  weight: number;
}

class SearchBenchmarkHarness {
  private corpus: GeneratedCorpus | null = null;

  private queryPatterns: QueryPattern[] = [
    {
      type: 'single-word',
      weight: 0.4,
      generator: (_corpus) => [
        ...this.extractCommonWords(corpus, 1, 50), // Most common single words
        'mystery',
        'school',
        'discover',
        'secret',
        'friend',
        'chapter',
        'hallway',
        'locker',
        'student',
        'teacher',
        'question',
        'answer',
      ],
    },
    {
      type: 'character-name',
      weight: 0.25,
      generator: (_corpus) => {
        const names: string[] = [];
        corpus.characters.forEach((c) => {
          if (c.name && c.name.trim()) {
            names.push(c.name.trim());
            const firstName = c.name.split(' ')[0];
            if (firstName && firstName.trim()) {
              names.push(firstName.trim());
            }
          }
        });
        return names;
      },
    },
    {
      type: 'multi-word',
      weight: 0.2,
      generator: (_corpus) => [
        ...this.extractCommonWords(corpus, 2, 30), // Common two-word phrases
        'art hallway',
        'science class',
        'lunch table',
        'after school',
        'old locker',
        'strange column',
        'middle school',
        'time capsule',
        'hidden secret',
        'ancient evil',
      ],
    },
    {
      type: 'phrase',
      weight: 0.1,
      generator: (_corpus) => [
        ...this.extractCommonWords(corpus, 3, 15), // Three+ word phrases
        'solve the mystery',
        'figure this out',
        'what do you think',
        "I can't believe",
        'there was something',
        'had always been',
      ],
    },
    {
      type: 'rare-word',
      weight: 0.05,
      generator: (_corpus) => this.extractRareWords(corpus, 20),
    },
  ];

  async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
    const startTime = Date.now();
    console.log('Starting search performance benchmark...');

    // Measure initial memory
    const memoryBefore = this.measureMemoryUsage();

    // Generate corpus
    console.log('Generating synthetic corpus...');
    const corpusStartTime = Date.now();
    this.corpus = generateSyntheticCorpus(config.corpusSettings);
    const corpusTime = Date.now() - corpusStartTime;
    console.log(`Corpus generated in ${corpusTime}ms:`, this.corpus.stats);

    // Initialize search service with corpus
    console.log('Initializing search index...');
    const indexStartTime = Date.now();
    await searchService.initializeProject(this.corpus.project.id);
    const indexTime = Date.now() - indexStartTime;

    // Get index stats
    const indexStats = searchService.getStats(this.corpus.project.id);
    const indexSize = indexStats?.indexSize || 0;

    console.log(`Search index built in ${indexTime}ms (${(indexSize / 1024 / 1024).toFixed(2)}MB)`);

    // Generate queries
    console.log('Generating benchmark queries...');
    const allQueries = this.generateQueries(config);
    const warmupQueries = allQueries.slice(0, config.warmupQueries);
    const benchmarkQueries = allQueries.slice(
      config.warmupQueries,
      config.warmupQueries + config.benchmarkQueries,
    );

    // Warmup phase
    console.log(`Running ${warmupQueries.length} warmup queries...`);
    for (const { query } of warmupQueries) {
      try {
        await searchService.search(query, {
          projectId: this.corpus.project.id,
          ...config.searchOptions,
        });
      } catch (error) {
        console.warn('Warmup query failed:', query, error);
      }
    }

    // Benchmark phase
    console.log(`Running ${benchmarkQueries.length} benchmark queries...`);
    const results: Array<{
      query: string;
      type: QueryType;
      latency: number;
      resultCount: number;
      success: boolean;
    }> = [];

    for (const { query, type } of benchmarkQueries) {
      const queryStart = performance.now();
      try {
        const searchResults = await searchService.search(query, {
          projectId: this.corpus.project.id,
          ...config.searchOptions,
        });
        const queryEnd = performance.now();

        results.push({
          query,
          type,
          latency: queryEnd - queryStart,
          resultCount: searchResults.length,
          success: true,
        });

        if (config.logResults) {
          console.log(
            `"${query}" (${type}): ${(queryEnd - queryStart).toFixed(1)}ms, ${searchResults.length} results`,
          );
        }
      } catch (error) {
        const queryEnd = performance.now();
        results.push({
          query,
          type,
          latency: queryEnd - queryStart,
          resultCount: 0,
          success: false,
        });
        console.warn(`Query failed: "${query}"`, error);
      }
    }

    // Measure final memory
    const memoryAfter = this.measureMemoryUsage();

    // Analyze results
    const benchmarkResult = this.analyzeResults(config, results, {
      corpusTime,
      indexTime,
      indexSize,
      memoryBefore,
      memoryAfter,
    });
    const text = makeCorpus(150_000);
    console.log('words:', approxWordCount(text)); // ~150000

    const totalTime = Date.now() - startTime;
    console.log(`Benchmark completed in ${totalTime}ms`);
    console.log(`Results: ${benchmarkResult.passed ? 'PASS' : 'FAIL'}`);
    console.log(
      `P50: ${benchmarkResult.queryPerformance.p50.toFixed(1)}ms (target: ${config.targetMetrics.p50MaxMs}ms)`,
    );
    console.log(
      `P95: ${benchmarkResult.queryPerformance.p95.toFixed(1)}ms (target: ${config.targetMetrics.p95MaxMs}ms)`,
    );

    if (!benchmarkResult.passed) {
      console.log('Suggestions for improvement:');
      benchmarkResult.suggestions.forEach((suggestion) => {
        console.log(`  - ${suggestion}`);
      });
    }

    return benchmarkResult;
  }

  private generateQueries(config: BenchmarkConfig): Array<{ query: string; type: QueryType }> {
    if (!this.corpus) throw new Error('Corpus not generated');

    const totalQueries = config.warmupQueries + config.benchmarkQueries;
    const queries: Array<{ query: string; type: QueryType }> = [];

    // Generate queries by type based on weights
    for (const pattern of this.queryPatterns) {
      const queryCount = Math.round(totalQueries * pattern.weight);
      const availableQueries = pattern
        .generator(this.corpus)
        .filter((q) => q && q.trim().length > 0);

      for (let i = 0; i < queryCount && availableQueries.length > 0; i++) {
        const query = availableQueries[i % availableQueries.length]!;
        queries.push({ query, type: pattern.type });
      }
    }

    // Shuffle for realistic query distribution
    return this.shuffleArray(queries);
  }

  private analyzeResults(
    config: BenchmarkConfig,
    results: Array<{
      query: string;
      type: QueryType;
      latency: number;
      resultCount: number;
      success: boolean;
    }>,
    metadata: {
      corpusTime: number;
      indexTime: number;
      indexSize: number;
      memoryBefore: number;
      memoryAfter: number;
    },
  ): BenchmarkResult {
    const successfulResults = results.filter((r) => r.success);
    const latencies = successfulResults.map((r) => r.latency);
    latencies.sort((a, _b) => a - b);

    // Calculate percentiles
    const p50 = this.percentile(latencies, 0.5);
    const p95 = this.percentile(latencies, 0.95);
    const p99 = this.percentile(latencies, 0.99);

    // Analyze by query type
    const detailsByQueryType: Record<QueryType, any> = {} as any;
    for (const type of [
      'single-word',
      'multi-word',
      'character-name',
      'phrase',
      'rare-word',
    ] as QueryType[]) {
      const typeResults = successfulResults.filter((r) => r.type === type);
      if (typeResults.length > 0) {
        const typeLatencies = typeResults.map((r) => r.latency);
        typeLatencies.sort((a, _b) => a - b);

        detailsByQueryType[type] = {
          count: typeResults.length,
          p50: this.percentile(typeLatencies, 0.5),
          p95: this.percentile(typeLatencies, 0.95),
          averageResults:
            typeResults.reduce((sum, _r) => sum + r.resultCount, 0) / typeResults.length,
        };
      }
    }

    // Determine if benchmark passed
    const passed =
      p50 <= config.targetMetrics.p50MaxMs &&
      p95 <= config.targetMetrics.p95MaxMs &&
      metadata.indexSize <= config.targetMetrics.maxIndexSizeBytes &&
      metadata.indexTime <= config.targetMetrics.maxIndexBuildTimeMs;

    // Generate suggestions
    const suggestions: string[] = [];
    if (p50 > config.targetMetrics.p50MaxMs) {
      suggestions.push(
        `P50 latency (${p50.toFixed(1)}ms) exceeds target (${config.targetMetrics.p50MaxMs}ms). Consider optimizing common query paths.`,
      );
    }
    if (p95 > config.targetMetrics.p95MaxMs) {
      suggestions.push(
        `P95 latency (${p95.toFixed(1)}ms) exceeds target (${config.targetMetrics.p95MaxMs}ms). Investigate query timeout mechanisms.`,
      );
    }
    if (metadata.indexSize > config.targetMetrics.maxIndexSizeBytes) {
      suggestions.push(
        `Index size (${(metadata.indexSize / 1024 / 1024).toFixed(1)}MB) exceeds target. Consider term filtering or compression.`,
      );
    }
    if (metadata.indexTime > config.targetMetrics.maxIndexBuildTimeMs) {
      suggestions.push(
        `Index build time (${metadata.indexTime}ms) exceeds target. Consider incremental indexing or worker optimization.`,
      );
    }

    // Performance-specific suggestions
    if (p50 > 30) {
      suggestions.push(
        'P50 latency suggests tokenization or scoring bottlenecks. Profile the search pipeline.',
      );
    }
    if (results.some((r) => !r.success)) {
      suggestions.push(
        `${results.filter((r) => !r.success).length} queries failed. Check error handling and edge cases.`,
      );
    }
    if (detailsByQueryType['rare-word']?.p95 > p95 * 1.5) {
      suggestions.push(
        'Rare word queries are disproportionately slow. Consider early termination for uncommon terms.',
      );
    }

    return {
      passed,
      corpus: {
        totalWords: this.corpus!.stats.totalWords,
        totalScenes: this.corpus!.stats.totalScenes,
        totalChapters: this.corpus!.stats.totalChapters,
        characters: this.corpus!.characters.length,
      },
      indexBuild: {
        timeMs: metadata.indexTime,
        sizeBytes: metadata.indexSize,
        documentsIndexed:
          this.corpus!.stats.totalScenes +
          this.corpus!.stats.totalChapters +
          this.corpus!.characters.length,
      },
      queryPerformance: {
        totalQueries: results.length,
        latencies,
        p50,
        p95,
        p99,
        averageResultCount:
          successfulResults.reduce((sum, _r) => sum + r.resultCount, 0) / successfulResults.length,
        failureRate: (results.length - successfulResults.length) / results.length,
      },
      memoryUsage: {
        beforeMB: metadata.memoryBefore,
        afterMB: metadata.memoryAfter,
        deltaMB: metadata.memoryAfter - metadata.memoryBefore,
      },
      detailsByQueryType,
      suggestions,
    };
  }

  private extractCommonWords(corpus: GeneratedCorpus, wordCount: number, limit: number): string[] {
    const wordFreq = new Map<string, number>();

    // Extract from all scene content
    corpus.chapters.forEach((chapter) => {
      chapter.scenes.forEach((scene) => {
        const words = scene.content
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 2);

        if (wordCount === 1) {
          words.forEach((word) => {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
          });
        } else if (wordCount === 2) {
          for (let i = 0; i < words.length - 1; i++) {
            const phrase = `${words[i]} ${words[i + 1]}`;
            wordFreq.set(phrase, (wordFreq.get(phrase) || 0) + 1);
          }
        } else if (wordCount === 3) {
          for (let i = 0; i < words.length - 2; i++) {
            const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
            wordFreq.set(phrase, (wordFreq.get(phrase) || 0) + 1);
          }
        }
      });
    });

    return Array.from(wordFreq.entries())
      .sort((a, _b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  private extractRareWords(corpus: GeneratedCorpus, limit: number): string[] {
    const wordFreq = new Map<string, number>();

    corpus.chapters.forEach((chapter) => {
      chapter.scenes.forEach((scene) => {
        const words = scene.content
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 4); // Longer words tend to be rarer

        words.forEach((word) => {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        });
      });
    });

    return Array.from(wordFreq.entries())
      .filter(([, freq]) => freq <= 3) // Rare words appear 3 times or less
      .sort((a, _b) => a[1] - b[1]) // Sort by frequency (ascending)
      .slice(0, limit)
      .map(([word]) => word);
  }

  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil(sortedArray.length * p) - 1;
    const validIndex = Math.max(0, Math.min(index, sortedArray.length - 1));
    return sortedArray[validIndex] ?? 0;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j]!, result[i]!];
    }
    return result;
  }

  private measureMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0; // Fallback for browsers without memory API
  }
}

// Convenience functions for running benchmarks
export async function _runQuickBenchmark(): Promise<BenchmarkResult> {
  const harness = new SearchBenchmarkHarness();
  return harness.runBenchmark({
    warmupQueries: 10,
    benchmarkQueries: 50,
    targetMetrics: {
      p50MaxMs: 50,
      p95MaxMs: 120,
      maxIndexSizeBytes: 100 * 1024 * 1024, // 100MB
      maxIndexBuildTimeMs: 5000, // 5 seconds
    },
    logResults: true,
  });
}

export async function _runFullBenchmark(): Promise<BenchmarkResult> {
  const harness = new SearchBenchmarkHarness();
  return harness.runBenchmark({
    warmupQueries: 50,
    benchmarkQueries: 200,
    corpusSettings: {
      targetWordCount: 150000,
      chapterCount: 50,
      sceneCount: 900,
      characterCount: 20,
    },
    targetMetrics: {
      p50MaxMs: 50,
      p95MaxMs: 120,
      maxIndexSizeBytes: 100 * 1024 * 1024, // 100MB
      maxIndexBuildTimeMs: 5000, // 5 seconds
    },
    logResults: false,
  });
}

export async function _runStressBenchmark(): Promise<BenchmarkResult> {
  const harness = new SearchBenchmarkHarness();
  return harness.runBenchmark({
    warmupQueries: 100,
    benchmarkQueries: 500,
    corpusSettings: {
      targetWordCount: 200000, // Larger corpus
      chapterCount: 60,
      sceneCount: 1200,
      characterCount: 30,
    },
    targetMetrics: {
      p50MaxMs: 60, // Slightly more lenient for stress test
      p95MaxMs: 150,
      maxIndexSizeBytes: 150 * 1024 * 1024, // 150MB
      maxIndexBuildTimeMs: 8000, // 8 seconds
    },
    logResults: false,
  });
}

// Export the class for direct usage
export { SearchBenchmarkHarness };
