// @ts-nocheck
import devLog from "@/utils/devLog";

import { _generateSyntheticCorpus as generateSyntheticCorpus } from './syntheticCorpusGenerator';
async function _debugBenchmark() {
  try {
    devLog.debug('Step 1: Testing corpus generation...');
    const corpus = generateSyntheticCorpus({
      targetWordCount: 150000,
      chapterCount: 50,
      sceneCount: 900,
      characterCount: 20,
    });
    devLog.debug('Corpus generated successfully:', {
      words: corpus.stats.totalWords,
      scenes: corpus.stats.totalScenes,
      chapters: corpus.stats.totalChapters,
    });
    devLog.debug('Step 2: Testing storage service import...');
    const { storageService } = await import('@/services/storageService');
    devLog.debug('Storage service imported successfully');
    devLog.debug('Step 3: Testing search service import...');
    const { searchService } = await import('@/services/searchService');
    devLog.debug('Search service imported successfully');
    devLog.debug('All imports successful - issue is likely in the benchmark execution');
  } catch (error: unknown) {
    console.error('Debug benchmark failed at:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Unknown error type:', typeof error);
    }
  }
}
debugBenchmark();
