// src/utils/textAnalysis.ts
import type { PhraseAnalysisRequest, PhraseAnalysisResponse } from '@/workers/phraseWorker';

export interface TextStats {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTime: number; // minutes at 200wpm
  averageWordsPerSentence: number;
  lengthCategory: 'Short' | 'Medium' | 'Long' | 'Very Long';
}

export interface PhraseHygieneSettings {
  enabled: boolean;
  ngramSizes: number[]; // e.g., [2, 3, 4] for 2-4 word phrases
  minOccurrences: number;
  thresholds: {
    low: number; // per 1000 words
    medium: number;
    high: number;
  };
  stopWords: string[];
  customStoplist: string[];
}

export const DEFAULT_PHRASE_HYGIENE_SETTINGS: PhraseHygieneSettings = {
  enabled: true,
  ngramSizes: [2, 3, 4],
  minOccurrences: 2,
  thresholds: {
    low: 0.5,
    medium: 1.0,
    high: 2.0,
  },
  stopWords: [],
  customStoplist: [],
};

class PhraseAnalysisService {
  private worker: Worker | null = null;
  private readonly STORAGE_KEY = 'phrase_hygiene_settings';

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      this.worker = new Worker(new URL('../workers/phraseWorker.ts', import.meta.url), {
        type: 'module',
      });
    } catch (error) {
      console.warn('Failed to initialize phrase analysis worker:', error);
    }
  }

  async analyzeText(
    text: string,
    projectId: string,
    settings?: Partial<PhraseHygieneSettings>,
  ): Promise<PhraseAnalysisResponse> {
    if (!this.worker) {
      throw new Error('Phrase analysis worker not available');
    }

    const hygieneSettings = this.getSettings(projectId);
    const finalSettings = { ...hygieneSettings, ...settings };

    const request: PhraseAnalysisRequest = {
      text,
      projectId,
    } as any;

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Analysis timeout'));
      }, 30000); // 30 second timeout

      const handleMessage = (event: MessageEvent) => {
        const response = event.data;

        if (response.type === 'ANALYSIS_COMPLETE') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleMessage);
          resolve(response.result as PhraseAnalysisResponse);
        } else if (response.type === 'error') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleMessage);
          reject(new Error(response.message));
        }
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.postMessage(request);
    });
  }

  getSettings(projectId: string): PhraseHygieneSettings {
    try {
      const storageKey = `${this.STORAGE_KEY}_${projectId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return { ...DEFAULT_PHRASE_HYGIENE_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load phrase hygiene settings:', error);
    }
    return { ...DEFAULT_PHRASE_HYGIENE_SETTINGS };
  }

  saveSettings(projectId: string, settings: Partial<PhraseHygieneSettings>): void {
    try {
      const storageKey = `${this.STORAGE_KEY}_${projectId}`;
      const currentSettings = this.getSettings(projectId);
      const updatedSettings = { ...currentSettings, ...settings };
      localStorage.setItem(storageKey, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to save phrase hygiene settings:', error);
    }
  }

  addToCustomStoplist(projectId: string, phrase: string): void {
    const settings = this.getSettings(projectId);
    const updatedStoplist = [...settings.customStoplist, phrase.toLowerCase()];
    this.saveSettings(projectId, {
      customStoplist: [...new Set(updatedStoplist)], // Remove duplicates
    });
  }

  removeFromCustomStoplist(projectId: string, phrase: string): void {
    const settings = this.getSettings(projectId);
    const updatedStoplist = settings.customStoplist.filter(
      (p) => p.toLowerCase() !== phrase.toLowerCase(),
    );
    this.saveSettings(projectId, { customStoplist: updatedStoplist });
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Global instance
export const phraseAnalysisService = new PhraseAnalysisService();

export function _analyzeText(content: string): TextStats {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const wordCount = words.length;
  const characterCount = content.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;

  const averageWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // Minimum 1 minute

  let lengthCategory: TextStats['lengthCategory'] = 'Short';
  if (wordCount >= 5000) lengthCategory = 'Very Long';
  else if (wordCount >= 2000) lengthCategory = 'Long';
  else if (wordCount >= 500) lengthCategory = 'Medium';

  return {
    wordCount,
    characterCount,
    sentenceCount,
    paragraphCount,
    readingTime,
    averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
    lengthCategory,
  };
}
