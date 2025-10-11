/// <reference lib="webworker" />

export type PhraseAnalysisRequest = {
  text: string;
  projectId: string;
  stopWords?: Set<string>;
};

export type PhraseAnalysisResponse = {
  phrases: Array<{
    phrase: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  totalWords: number;
  uniquePhrases: number;
};

// Mark as a module
export {};

self.onmessage = async (e) => {
  // Worker implementation here
  // ...

  // Send result back
  self.postMessage({
    type: 'ANALYSIS_COMPLETE',
    result: {
      phrases: [],
      totalWords: 0,
      uniquePhrases: 0,
    },
  });
};
