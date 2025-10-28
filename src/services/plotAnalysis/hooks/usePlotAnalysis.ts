// React hook for managing plot analysis state and execution
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import devLog from "@/utils/devLog";


import type { Project } from '@/context/AppContext';

import { computeProjectHash } from '../dataPrep';
import { analyzePlot } from '../plotAnalysisService';

import type { AnalysisResult } from '../types';
import type { PlotFilters } from '../types.ui';

type Status = 'idle' | 'loading' | 'ready' | 'error';

const DEFAULT_FILTERS: PlotFilters = {
  includeDrafts: false,
  includeNotes: false,
  minWords: 0,
  pov: 'all',
};

interface UsePlotAnalysisOptions {
  project: Project;
  initialFilters?: Partial<PlotFilters>;
}

export function usePlotAnalysis({ project, initialFilters }: UsePlotAnalysisOptions) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<number | null>(null);

  const [filters, setFilters] = useState<PlotFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const abortRef = useRef<AbortController | null>(null);

  // Local cache key for UI state persistence
  const projectHash = useMemo(() => computeProjectHash(project), [project]);
  const cacheKey = useMemo(() => `plot:ui:${projectHash}`, [projectHash]);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        result: AnalysisResult;
        lastAnalyzedAt: number;
        filters?: PlotFilters;
      };

      // Only use cached result if project hash matches
      if (parsed.result.projectHash === projectHash) {
        setResult(parsed.result);
        setLastAnalyzedAt(parsed.lastAnalyzedAt ?? null);
        if (parsed.filters) setFilters((f) => ({ ...f, ...parsed.filters }));
        setStatus('ready');
      }
    } catch {
      // Ignore parse errors
    }
  }, [cacheKey, projectHash]);

  // Persist UI cache when result changes
  useEffect(() => {
    if (!result) return;

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ result, lastAnalyzedAt, filters }));
    } catch {
      // Storage full or blocked
    }
  }, [cacheKey, result, lastAnalyzedAt, filters]);

  const invalidate = useCallback(() => {
    setResult(null);
    setLastAnalyzedAt(null);
    setStatus('idle');
    try {
      localStorage.removeItem(cacheKey);
    } catch {
      // Ignore errors
    }
  }, [cacheKey]);

  const run = useCallback(async () => {
    // Cancel prior run
    if (abortRef.current) abortRef.current.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;

    setStatus('loading');
    setError(null);

    const started = performance.now();

    try {
      // Convert UI filters to service filters
      const serviceFilters = {
        includeNotes: filters.includeNotes,
        includeDrafts: filters.includeDrafts,
        excludedChapterIds: [],
      };

      const next = await analyzePlot(project, serviceFilters, {
        useLLM: true,
        forceRefresh: false,
      });

      if (ctl.signal.aborted) return;

      setResult(next);
      setLastAnalyzedAt(Date.now());
      setStatus('ready');

      devLog.debug(`Analysis completed in ${Math.round(performance.now() - started)}ms`);
    } catch (e: any) {
      if (ctl.signal.aborted) return;

      setStatus('error');
      setError(e?.message ?? 'Analysis failed');
      console.error('Plot analysis failed:', e);
    }
  }, [project, filters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return {
    status,
    error,
    result,
    lastAnalyzedAt,
    filters,
    setFilters,
    run,
    invalidate,
  };
}
