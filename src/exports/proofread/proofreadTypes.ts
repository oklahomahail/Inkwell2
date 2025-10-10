// proofreadTypes.ts - Types for AI-powered proofreading service

export interface ProofreadSuggestion {
  id: string;
  location: {
    chapter: number;
    scene: number;
    start: number;
    end: number;
  };
  before: string;
  after: string;
  rationale: string;
  category: 'clarity' | 'conciseness' | 'consistency' | 'tone' | 'grammar' | 'style' | 'flow';
  severity: 'note' | 'suggestion' | 'warning' | 'error';
  confidence: number; // 0-100
}

export interface ReadabilityMetrics {
  gradeLevel: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  passiveVoicePercentage: number;
  readingTimeMinutes: number;
  sentenceVariety: 'low' | 'medium' | 'high';
}

export interface ProofreadReport {
  id: string;
  projectId: string;
  generatedAt: number;
  totalSuggestions: number;
  suggestions: ProofreadSuggestion[];
  readability: ReadabilityMetrics;
  summary: string;
  highlights: string[];
  stats: {
    totalWords: number;
    totalSentences: number;
    totalParagraphs: number;
    issuesByCategory: Record<ProofreadSuggestion['category'], number>;
    issuesBySeverity: Record<ProofreadSuggestion['severity'], number>;
  };
}

export interface ProofreadOptions {
  includeGrammar: boolean;
  includeStyle: boolean;
  includeFlow: boolean;
  includeConsistency: boolean;
  targetAudience: 'general' | 'young_adult' | 'literary' | 'commercial';
  focusAreas: ProofreadSuggestion['category'][];
  maxSuggestions: number;
}

export interface ProofreadProgress {
  phase: 'analyzing' | 'processing' | 'generating' | 'complete';
  percentage: number;
  currentChapter?: number;
  totalChapters?: number;
  message?: string;
}

export const DEFAULT_PROOFREAD_OPTIONS: ProofreadOptions = {
  includeGrammar: true,
  includeStyle: true,
  includeFlow: true,
  includeConsistency: true,
  targetAudience: 'general',
  focusAreas: ['clarity', 'conciseness', 'consistency', 'tone', 'grammar'],
  maxSuggestions: 50
};

// Error types for proofreading
export class ProofreadError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ProofreadError';
  }
}

export class ProofreadQuotaError extends ProofreadError {
  constructor(message: string = 'Proofreading quota exceeded') {
    super(message, 'QUOTA_EXCEEDED');
  }
}

export class ProofreadServiceError extends ProofreadError {
  constructor(message: string, details?: any) {
    super(message, 'SERVICE_ERROR', details);
  }
}