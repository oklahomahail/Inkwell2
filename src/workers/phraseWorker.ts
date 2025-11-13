// src/workers/phraseWorker.ts
// Web Worker for phrase frequency analysis

export interface PhraseAnalysisRequest {
  type: 'analyze';
  text: string;
  projectId: string;
  options: {
    ngramSizes: number[]; // e.g., [2, 3, 4] for 2-4 word phrases
    minOccurrences: number; // minimum times a phrase must appear
    stopWords: string[]; // words to ignore
    customStoplist?: string[]; // project-specific phrases to ignore
  };
}

export interface PhraseAnalysisResponse {
  phrases: Array<{
    phrase: string;
    count: number;
    ngramSize: number;
    positions: Array<{ start: number; end: number }>; // character positions
    severity: 'low' | 'medium' | 'high'; // based on frequency
  }>;
  totalWords: number;
  analysisTime: number;
  uniquePhrases: number;
}

export interface ProjectIndexRequest {
  type: 'index-project';
  projectId: string;
  chapters: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  options: {
    ngramSizes: number[];
    minOccurrences: number;
    stopWords: string[];
    customStoplist?: string[];
  };
}

export interface ProjectIndexResponse {
  type: 'indexing-complete';
  projectId: string;
  index: PhraseIndex;
  analysisTime: number;
}

export interface PhraseIndex {
  projectId: string;
  lastUpdated: number;
  totalWords: number;
  phrases: Map<
    string,
    {
      count: number;
      ngramSize: number;
      positions: Array<{
        chapterId: string;
        start: number;
        end: number;
      }>;
    }
  >;
  topOffenders: Array<{
    phrase: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
}

// Default stop words (common words to ignore in phrase analysis)
const DEFAULT_STOP_WORDS = [
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'he',
  'she',
  'it',
  'they',
  'we',
  'you',
  'i',
  'his',
  'her',
  'its',
  'their',
  'our',
  'your',
  'my',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'can',
  'may',
  'might',
  'must',
  'shall',
  'this',
  'that',
  'these',
  'those',
  'here',
  'there',
  'where',
  'when',
  'why',
  'how',
  'said',
  'says',
  'say',
  'asked',
  'asks',
  'ask',
  'told',
  'tells',
  'tell',
];

class PhraseAnalyzer {
  private indexes: Map<string, PhraseIndex> = new Map();

  analyzeText(request: PhraseAnalysisRequest): PhraseAnalysisResponse {
    const startTime = performance.now();
    const { text, options } = request;

    const words = this.tokenize(text);
    const allPhrases: Array<{
      phrase: string;
      count: number;
      ngramSize: number;
      positions: Array<{ start: number; end: number }>;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    // Generate n-grams for each requested size
    for (const ngramSize of options.ngramSizes) {
      const ngrams = this.generateNGrams(
        words,
        ngramSize,
        options.stopWords,
        options.customStoplist,
      );
      const phraseMap = this.countPhrases(ngrams);

      // Convert to results format
      for (const [phrase, data] of phraseMap.entries()) {
        if (data.count >= options.minOccurrences) {
          const positions = this.findPhrasePositions(text, phrase);
          const severity = this.calculateSeverity(data.count, words.length);

          allPhrases.push({
            phrase,
            count: data.count,
            ngramSize,
            positions,
            severity,
          });
        }
      }
    }

    // Sort by frequency, then by severity
    allPhrases.sort((a, b) => {
      if (a.severity !== b.severity) {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.count - a.count;
    });

    const endTime = performance.now();

    return {
      phrases: allPhrases,
      totalWords: words.length,
      analysisTime: endTime - startTime,
      uniquePhrases: allPhrases.length,
    };
  }

  indexProject(request: ProjectIndexRequest): ProjectIndexResponse {
    const startTime = performance.now();
    const { projectId, chapters, options } = request;

    const phraseMap = new Map<
      string,
      {
        count: number;
        ngramSize: number;
        positions: Array<{
          chapterId: string;
          start: number;
          end: number;
        }>;
      }
    >();

    let totalWords = 0;

    // Process each chapter
    for (const chapter of chapters) {
      const words = this.tokenize(chapter.content);
      totalWords += words.length;

      for (const ngramSize of options.ngramSizes) {
        const ngrams = this.generateNGrams(
          words,
          ngramSize,
          options.stopWords,
          options.customStoplist,
        );

        for (const ngram of ngrams) {
          const phrase = ngram.phrase;
          const existing = phraseMap.get(phrase);

          if (existing) {
            existing.count++;
            existing.positions.push({
              chapterId: chapter.id,
              start: ngram.position,
              end: ngram.position + phrase.length,
            });
          } else {
            phraseMap.set(phrase, {
              count: 1,
              ngramSize,
              positions: [
                {
                  chapterId: chapter.id,
                  start: ngram.position,
                  end: ngram.position + phrase.length,
                },
              ],
            });
          }
        }
      }
    }

    // Filter by minimum occurrences and create top offenders list
    const filteredPhrases = new Map();
    const topOffenders: Array<{
      phrase: string;
      count: number;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    for (const [phrase, data] of phraseMap.entries()) {
      if (data.count >= options.minOccurrences) {
        filteredPhrases.set(phrase, data);

        const severity = this.calculateSeverity(data.count, totalWords);
        topOffenders.push({
          phrase,
          count: data.count,
          severity,
        });
      }
    }

    // Sort top offenders
    topOffenders.sort((a, b) => {
      if (a.severity !== b.severity) {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.count - a.count;
    });

    const index: PhraseIndex = {
      projectId,
      lastUpdated: Date.now(),
      totalWords,
      phrases: filteredPhrases,
      topOffenders: topOffenders.slice(0, 50), // Keep top 50
    };

    // Cache the index
    this.indexes.set(projectId, index);

    const endTime = performance.now();

    return {
      type: 'indexing-complete',
      projectId,
      index,
      analysisTime: endTime - startTime,
    };
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/)
      .filter((word) => word.length > 0);
  }

  private generateNGrams(
    words: string[],
    ngramSize: number,
    stopWords: string[],
    customStoplist: string[] = [],
  ): Array<{ phrase: string; position: number }> {
    const stopWordSet = new Set([...DEFAULT_STOP_WORDS, ...stopWords]);
    const customStopSet = new Set(customStoplist.map((p) => p.toLowerCase()));
    const ngrams: Array<{ phrase: string; position: number }> = [];

    for (let i = 0; i <= words.length - ngramSize; i++) {
      const phraseWords = words.slice(i, i + ngramSize);

      // Skip if contains stop words (for larger n-grams)
      if (ngramSize > 2) {
        const hasStopWords = phraseWords.some((word) => stopWordSet.has(word));
        if (hasStopWords) continue;
      }

      const phrase = phraseWords.join(' ');

      // Skip if in custom stoplist
      if (customStopSet.has(phrase)) continue;

      // Skip very short phrases
      if (phrase.length < 3) continue;

      ngrams.push({
        phrase,
        position: i, // word position, not character position
      });
    }

    return ngrams;
  }

  private countPhrases(
    ngrams: Array<{ phrase: string; position: number }>,
  ): Map<string, { count: number }> {
    const counts = new Map<string, { count: number }>();

    for (const ngram of ngrams) {
      const existing = counts.get(ngram.phrase);
      if (existing) {
        existing.count++;
      } else {
        counts.set(ngram.phrase, { count: 1 });
      }
    }

    return counts;
  }

  private findPhrasePositions(text: string, phrase: string): Array<{ start: number; end: number }> {
    const positions: Array<{ start: number; end: number }> = [];
    const lowerText = text.toLowerCase();
    const lowerPhrase = phrase.toLowerCase();

    let index = 0;
    while ((index = lowerText.indexOf(lowerPhrase, index)) !== -1) {
      positions.push({
        start: index,
        end: index + phrase.length,
      });
      index += phrase.length;
    }

    return positions;
  }

  private calculateSeverity(count: number, totalWords: number): 'low' | 'medium' | 'high' {
    const frequency = (count / totalWords) * 1000; // per 1000 words

    if (frequency > 2) return 'high';
    if (frequency > 1) return 'medium';
    return 'low';
  }

  /**
   * Clear cached index for a specific project
   * Prevents memory leaks when projects are deleted or updated
   */
  clearProjectCache(projectId: string): void {
    this.indexes.delete(projectId);
    // Intentional log for cache lifecycle tracking
    // eslint-disable-next-line no-console
    console.log(`[PhraseWorker] Cleared cache for project: ${projectId}`);
  }

  /**
   * Clear all cached indexes
   * Use when switching users or resetting application state
   */
  clearAllCache(): void {
    const count = this.indexes.size;
    this.indexes.clear();
    // Intentional log for cache lifecycle tracking
    // eslint-disable-next-line no-console
    console.log(`[PhraseWorker] Cleared all cached indexes (${count} projects)`);
  }

  /**
   * Get cache statistics for monitoring memory usage
   */
  getCacheStats(): {
    projectCount: number;
    totalPhrases: number;
    totalMemoryEstimate: number;
  } {
    let totalPhrases = 0;
    let totalMemoryEstimate = 0;

    for (const [_projectId, index] of this.indexes.entries()) {
      const phraseCount = index.phrases.size;
      totalPhrases += phraseCount;

      // Rough memory estimate: 100 bytes per phrase entry (conservative)
      totalMemoryEstimate += phraseCount * 100;
    }

    return {
      projectCount: this.indexes.size,
      totalPhrases,
      totalMemoryEstimate, // bytes
    };
  }
}

// Worker context
declare const self: DedicatedWorkerGlobalScope;

const analyzer = new PhraseAnalyzer();

self.addEventListener('message', (event) => {
  const request = event.data;

  try {
    if (request.type === 'analyze') {
      const result = analyzer.analyzeText(request);
      self.postMessage({
        type: 'ANALYSIS_COMPLETE',
        result,
      });
    } else if (request.type === 'index-project') {
      const response = analyzer.indexProject(request);
      self.postMessage(response);
    } else if (request.type === 'clear-cache') {
      // Clear cached indexes for a specific project or all projects
      if (request.projectId) {
        analyzer.clearProjectCache(request.projectId);
        self.postMessage({
          type: 'cache-cleared',
          projectId: request.projectId,
        });
      } else {
        analyzer.clearAllCache();
        self.postMessage({
          type: 'cache-cleared',
          projectId: 'all',
        });
      }
    } else if (request.type === 'get-cache-stats') {
      // Return cache statistics for monitoring
      const stats = analyzer.getCacheStats();
      self.postMessage({
        type: 'cache-stats',
        stats,
      });
    } else {
      self.postMessage({
        type: 'error',
        message: `Unknown request type: ${request.type}`,
      });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
});

// Types are exported at the top of the file
