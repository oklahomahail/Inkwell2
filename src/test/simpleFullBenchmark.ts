// @ts-nocheck
import devLog from '@/utils/devLog';

import { SearchBenchmarkHarness } from './searchBenchmarkHarness';

async function _simpleBenchmark() {
  try {
    devLog.debug('Creating benchmark harness...');
    const harness = new SearchBenchmarkHarness();

    devLog.debug('Starting benchmark with explicit logging...');
    const result = await harness.runBenchmark({
      warmupQueries: 5, // Reduced for testing
      benchmarkQueries: 10, // Reduced for testing
      corpusSettings: {
        targetWordCount: 150000,
        chapterCount: 50,
        sceneCount: 900,
        characterCount: 20,
      },
      targetMetrics: {
        p50MaxMs: 50,
        p95MaxMs: 120,
        maxIndexSizeBytes: 100 * 1024 * 1024,
        maxIndexBuildTimeMs: 5000,
      },
      logResults: true, // Enable detailed logging
    });

    devLog.debug('\n=== BENCHMARK COMPLETED ===');
    devLog.debug(`Status: ${result.passed ? 'PASS' : 'FAIL'}`);
    devLog.debug(`Corpus: ${result.corpus.totalWords} words, ${result.corpus.totalScenes} scenes`);
    devLog.debug(`P50: ${result.queryPerformance.p50.toFixed(1)}ms`);
    devLog.debug(`P95: ${result.queryPerformance.p95.toFixed(1)}ms`);
  } catch (error: unknown) {
    console.error('Benchmark failed:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

simpleBenchmark();
