// UI-specific types for Plot Analysis components

import type { AnalysisResult, Scorecard, Insight, ChapterMetrics } from './types';

export type SeverityFilter = 'all' | 'high' | 'med' | 'low';

export interface PlotFilters {
  includeDrafts: boolean;
  includeNotes: boolean;
  minWords?: number; // Hide chapters with fewer words
  pov?: string | 'all';
}

export interface PlotAnalysisPanelProps {
  projectId: string;
  initialFilters?: Partial<PlotFilters>;
}

export interface ScorecardSummaryProps {
  scorecard: Scorecard;
  onRerun?: () => void;
  lastAnalyzedAt?: number | null;
}

export interface InsightListProps {
  insights: Insight[];
  filter: SeverityFilter;
  onFilterChange: (f: SeverityFilter) => void;
  onOpenChapter: (chapterIndex: number) => void;
}

export interface PacingChartProps {
  chapters: ChapterMetrics[];
  highlightedChapters?: number[]; // from high severity insights
  showRollingAvg?: boolean;
}

export interface ArcHeatmapProps {
  chapters: ChapterMetrics[];
}

export interface RunControlsProps {
  onRun: () => void;
  disabled?: boolean;
  lastAnalyzedAt?: number | null;
  filters: PlotFilters;
  onChangeFilters: (next: PlotFilters) => void;
}

export interface AnalysisEmptyStateProps {
  chapterCount: number;
  totalWords: number;
  onAddChapters?: () => void;
}

// Re-export main types for convenience
export type { AnalysisResult, Scorecard, Insight, ChapterMetrics };
