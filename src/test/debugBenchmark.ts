import { generateSyntheticCorpus } from './syntheticCorpusGenerator';

async function debugBenchmark() {
  try {
    console.log('Step 1: Testing corpus generation...');
    const corpus = generateSyntheticCorpus({
      targetWordCount: 150000,
      chapterCount: 50,
      sceneCount: 900,
      characterCount: 20,
    });
    console.log('Corpus generated successfully:', {
      words: corpus.stats.totalWords,
      scenes: corpus.stats.totalScenes,
      chapters: corpus.stats.totalChapters,
    });

    console.log('Step 2: Testing storage service import...');
    const { storageService } = await import('@/services/storageService');
    console.log('Storage service imported successfully');

    console.log('Step 3: Testing search service import...');
    const { searchService } = await import('@/services/searchService');
    console.log('Search service imported successfully');

    console.log('All imports successful - issue is likely in the benchmark execution');
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
