// Main plot analysis orchestrator

import type { Project } from '@/context/AppContext';

import { prepareBookMetrics, computeProjectHash } from './dataPrep';
import { generateInsights, computeScorecard } from './insightRules';
import { callClaudeAPI, mergeInsights, mergeScorecard } from './llmAnalysis';

import type { AnalysisResult, PlotAnalysisFilters } from './types';

const CACHE_KEY_PREFIX = 'plot_analysis_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedAnalysis {
  result: AnalysisResult;
  cachedAt: number;
}

/**
 * Get cached analysis if still valid
 */
function getCachedAnalysis(projectHash: string): AnalysisResult | null {
  const cacheKey = CACHE_KEY_PREFIX + projectHash;
  const cached = localStorage.getItem(cacheKey);

  if (!cached) return null;

  try {
    const parsed: CachedAnalysis = JSON.parse(cached);
    const age = Date.now() - parsed.cachedAt;

    if (age > CACHE_EXPIRY_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return parsed.result;
  } catch (error) {
    console.error('Failed to parse cached analysis:', error);
    localStorage.removeItem(cacheKey);
    return null;
  }
}

/**
 * Save analysis to cache
 */
function cacheAnalysis(projectHash: string, result: AnalysisResult): void {
  const cacheKey = CACHE_KEY_PREFIX + projectHash;
  const cached: CachedAnalysis = {
    result,
    cachedAt: Date.now(),
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (error) {
    console.warn('Failed to cache analysis:', error);
  }
}

/**
 * Run plot analysis on a project
 */
export async function analyzePlot(
  project: Project,
  filters: PlotAnalysisFilters,
  options: { useLLM?: boolean; forceRefresh?: boolean } = {},
): Promise<AnalysisResult> {
  const { useLLM = true, forceRefresh = false } = options;

  // Check for insufficient data
  if (!project.chapters || project.chapters.length < 3) {
    throw new Error(
      'Not enough chapters. Please add at least 3 chapters to analyze plot structure.',
    );
  }

  // Compute project hash for cache
  const projectHash = computeProjectHash(project);

  // Check cache unless forcing refresh
  if (!forceRefresh) {
    const cached = getCachedAnalysis(projectHash);
    if (cached) {
      console.log('Using cached analysis');
      return cached;
    }
  }

  // Prepare data
  const { data, sampled } = prepareBookMetrics(project, filters);

  // Run deterministic rules
  const ruleInsights = generateInsights(data);
  const ruleScorecard = computeScorecard(data, ruleInsights);

  let finalInsights = ruleInsights;
  let finalScorecard = ruleScorecard;
  let notes: string | undefined;

  // Enhance with LLM if enabled
  if (useLLM) {
    try {
      console.log('Calling Claude API for enhanced analysis...');
      const llmResult = await callClaudeAPI(data);

      if (llmResult) {
        finalInsights = mergeInsights(ruleInsights, llmResult.insights);
        finalScorecard = mergeScorecard(ruleScorecard, llmResult.scorecard);
        notes = llmResult.notes;
      }
    } catch (error) {
      console.warn('LLM analysis failed, using rule-based analysis only:', error);
    }
  }

  // Add sampling note if applicable
  if (sampled) {
    notes = notes
      ? `${notes} (Sampled chapters due to token limits)`
      : 'Sampled chapters due to token limits';
  }

  // Build result
  const result: AnalysisResult = {
    scorecard: finalScorecard,
    insights: finalInsights,
    chapters: data.chapters,
    notes,
    timestamp: new Date().toISOString(),
    projectHash,
  };

  // Cache result
  cacheAnalysis(projectHash, result);

  return result;
}

/**
 * Clear cached analysis for a project
 */
export function clearAnalysisCache(projectHash: string): void {
  const cacheKey = CACHE_KEY_PREFIX + projectHash;
  localStorage.removeItem(cacheKey);
}

/**
 * Clear all cached analyses
 */
export function clearAllAnalysisCaches(): void {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(CACHE_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}
