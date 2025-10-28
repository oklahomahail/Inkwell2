// @ts-nocheck
import devLog from "@/utils/devLog";
import { _generateSyntheticCorpus as generateSyntheticCorpus } from './syntheticCorpusGenerator';

import { searchService } from '@/services/searchService';
import { storageService } from '@/services/storageService';

async function _workingFullBenchmark() {
  try {
    devLog.debug('Generating larger corpus...');

    // Generate larger corpus by requesting more scenes/chapters
    const corpus = generateSyntheticCorpus({
      targetWordCount: 150000,
      chapterCount: 80, // Increased
      sceneCount: 1500, // Increased significantly
      characterCount: 25,
      seed: 12345,
    });

    devLog.debug('Corpus stats:', corpus.stats);

    // Mock storage like the baseline test does (this worked)
    const originalLoadProject = storageService.loadProject;
    const originalLoadWritingChapters = storageService.loadWritingChapters;

    (storageService as any).loadProject = () => corpus.project;
    (storageService as any).loadWritingChapters = async (_projectId: string) => corpus.chapters;

    try {
      devLog.debug('Building search index...');
      const indexStart = Date.now();
      await searchService.initializeProject('full-test');
      const indexTime = Date.now() - indexStart;

      const stats = searchService.getStats('full-test');
      devLog.debug(`Index built: ${indexTime}ms, ${((stats?.indexSize || 0) / 1024).toFixed(1)}KB`);

      // Test a few representative queries
      const queries = ['Henry', 'mystery', 'school hallway', 'work together'];
      devLog.debug('Testing queries...');

      const latencies: number[] = [];
      for (const query of queries) {
        const start = performance.now();
        const results = await searchService.search(query, { projectId: 'full-test' });
        const end = performance.now();
        const latency = end - start;
        latencies.push(latency);
        devLog.debug(`"${query}": ${latency.toFixed(1)}ms, ${results.length} results`);
      }

      latencies.sort((a, _b) => a - b);
      const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
      const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;

      devLog.debug('\n=== RESULTS ===');
      devLog.debug(`Corpus: ${corpus.stats.totalWords} words, ${corpus.stats.totalScenes} scenes`);
      devLog.debug(`P50: ${p50.toFixed(1)}ms, P95: ${p95.toFixed(1)}ms`);
      devLog.debug(`Status: ${p50 <= 50 && p95 <= 120 ? 'PASS' : 'NEEDS_WORK'}`);
    } finally {
      (storageService as any).loadProject = originalLoadProject;
      (storageService as any).loadWritingChapters = originalLoadWritingChapters;
    }
  } catch (error: unknown) {
    console.error('Benchmark failed:', error);
  }
}

workingFullBenchmark();
