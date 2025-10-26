// Plot Analysis Panel - Main component with tabs

import { Loader2, AlertTriangle } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

import type { Project } from '@/context/AppContext';
import { storeCapturedCharts, batchCaptureSVGs } from '@/export/utils/svgCapture';

import { usePlotAnalysis } from '../hooks/usePlotAnalysis';

import { ArcHeatmap } from './ArcHeatmap';
import { InsightList } from './InsightList';
import { PacingChart } from './PacingChart';
import { ScorecardSummary } from './ScorecardSummary';

import type { SeverityFilter } from '../types.ui';

type Tab = 'overview' | 'pacing' | 'arcs';

interface PlotAnalysisPanelProps {
  project: Project;
  onOpenChapter?: (chapterIndex: number) => void;
}

export function PlotAnalysisPanel({ project, onOpenChapter }: PlotAnalysisPanelProps) {
  const { status, result, error, lastAnalyzedAt, run } = usePlotAnalysis({ project });
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

  // Extract highlighted chapters from high-severity insights
  const highlightedChapters = useMemo(() => {
    if (!result) return [];
    return result.insights.filter((i) => i.severity === 'high').flatMap((i) => i.affectedChapters);
  }, [result]);

  // Capture SVG charts after they render for PDF export
  useEffect(() => {
    if (!result || status !== 'ready') return;

    // Wait for charts to fully render
    const timer = setTimeout(() => {
      try {
        // Define selectors for plot analysis charts
        // These match the Recharts ResponsiveContainer SVG outputs
        const charts = batchCaptureSVGs([
          'div[aria-label="Pacing by chapter"] svg', // PacingChart
          'div[aria-label="Arc presence heatmap"] svg', // ArcHeatmap
        ]);

        // Store captured charts in localStorage for export
        storeCapturedCharts(project.id, {
          pacing: charts['div[aria-label="Pacing by chapter"] svg'] || null,
          arcs: charts['div[aria-label="Arc presence heatmap"] svg'] || null,
        });

        console.log('Plot analysis charts captured for export');
      } catch (error) {
        console.warn('Failed to capture plot analysis charts:', error);
      }
    }, 500); // Allow time for animations to complete

    return () => clearTimeout(timer);
  }, [result, status, project.id]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-ink-500" />
        <p className="text-text-2">Analyzing plot structure...</p>
        <p className="text-sm text-text-2">This may take up to 10 seconds</p>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-600" />
        <p className="text-text-1 font-semibold">Analysis Failed</p>
        <p className="text-sm text-text-2 max-w-md text-center">{error}</p>
        {result && <p className="text-xs text-text-2">Showing last successful analysis</p>}
        <button
          onClick={run}
          className="px-4 py-2 rounded-lg bg-ink-500 text-white hover:bg-ink-600 transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  // Empty state
  if (!result) {
    const chapterCount = project.chapters?.length ?? 0;
    const totalWords =
      project.chapters?.reduce(
        (sum: number, ch: any) =>
          sum + (ch.content?.split(/\s+/).filter((w: string) => w.length > 0).length ?? 0),
        0,
      ) ?? 0;

    const canAnalyze = chapterCount >= 3 && totalWords >= 3000;

    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-text-1">Plot Analysis</h3>
          <p className="text-text-2">
            {chapterCount < 3
              ? `Add at least ${3 - chapterCount} more chapter${3 - chapterCount > 1 ? 's' : ''} to analyze your plot.`
              : totalWords < 3000
                ? `Add at least ${Math.ceil((3000 - totalWords) / 500)} more chapters (~${3000 - totalWords} words) to run analysis.`
                : 'Ready to analyze your plot structure!'}
          </p>
          <div className="text-sm text-text-2 space-y-1 mt-4">
            <p>
              Current: {chapterCount} chapters, ~{totalWords.toLocaleString()} words
            </p>
            <p>Required: 3+ chapters, 3,000+ words</p>
          </div>
        </div>
        {canAnalyze && (
          <button
            onClick={run}
            className="mt-6 px-6 py-3 rounded-lg bg-ink-500 text-white hover:bg-ink-600 transition-colors font-medium"
          >
            Run Analysis
          </button>
        )}
      </div>
    );
  }

  // Tabs
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'pacing', label: 'Pacing' },
    { id: 'arcs', label: 'Arcs' },
  ];

  return (
    <div className="space-y-6">
      {/* Scorecard */}
      <ScorecardSummary
        scorecard={result.scorecard}
        lastAnalyzedAt={lastAnalyzedAt}
        onRerun={run}
      />

      {/* Tabs */}
      <div className="border-b border-subtle">
        <nav className="flex space-x-8" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-ink-500 text-ink-700'
                  : 'border-transparent text-text-2 hover:text-text-1 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab panels */}
      <div role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`}>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <InsightList
              insights={result.insights}
              filter={severityFilter}
              onFilterChange={setSeverityFilter}
              onOpenChapter={onOpenChapter ?? (() => {})}
            />
            {result.notes && (
              <div className="rounded-lg border border-subtle bg-surface-1 p-4">
                <p className="text-sm text-text-2">{result.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pacing' && (
          <div className="space-y-4">
            <PacingChart
              chapters={result.chapters}
              highlightedChapters={highlightedChapters}
              showRollingAvg={true}
            />
          </div>
        )}

        {activeTab === 'arcs' && (
          <div className="space-y-4">
            <ArcHeatmap chapters={result.chapters} />
          </div>
        )}
      </div>
    </div>
  );
}
