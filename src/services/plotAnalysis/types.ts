// Types for AI Plot Analysis MVP

export type Severity = 'low' | 'med' | 'high';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface ChapterMetrics {
  i: number;
  title: string;
  words: number;
  pov?: string;
  tags: string[];
  updatedAt: string;
  summary: string; // Truncated to 150-250 words
}

export interface BookMetrics {
  chapters: ChapterMetrics[];
  totalWords: number;
  targets: {
    midpointPct: [number, number];
    incitingPctMax: number;
    climaxPct: [number, number];
  };
}

export interface Insight {
  id: string;
  severity: Severity;
  finding: string; // Max 40 words
  suggestion: string; // Max 30 words
  affectedChapters: number[];
}

export interface Scorecard {
  structure: number; // 0-100
  pacing: number; // 0-100
  scenePurpose: number; // 0-100
  coverage: number; // 0-100
  overall: number; // Average
  grade: Grade;
}

export interface AnalysisResult {
  scorecard: Scorecard;
  insights: Insight[];
  notes?: string; // Optional, <=30 words
  timestamp: string;
  projectHash: string; // For cache invalidation
}

export interface PlotAnalysisFilters {
  includeNotes: boolean;
  includeDrafts: boolean;
  excludedChapterIds: string[];
}
