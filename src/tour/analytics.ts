/**
 * Tour Analytics Dashboard Utilities
 * Provides metrics and insights for tour performance
 */

import { getFirstOpenTimestamp } from './tourStorage';

import type { TourEvent } from './adapters/analyticsAdapter';

/**
 * Get all tour events from storage
 */
export function getTourEvents(): TourEvent[] {
  try {
    const stored = localStorage.getItem('analytics.tour.events');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[TourAnalytics] Failed to load tour events:', error);
  }
  return [];
}

/**
 * Get tour completion counts by day for the last N days
 */
export function getCompletionSparkline(days: number = 14): Array<{ date: string; count: number }> {
  const events = getTourEvents();
  const completions = events.filter((e) => e.type === 'tour_completed');

  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  // Initialize sparkline data
  const sparkline: Array<{ date: string; count: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * dayInMs);
    const dateStr = date.toISOString().split('T')[0] || '';

    const count = completions.filter((e) => {
      const eventDate = new Date(e.ts).toISOString().split('T')[0];
      return eventDate === dateStr;
    }).length;

    sparkline.push({ date: dateStr, count });
  }

  return sparkline;
}

/**
 * Get drop-off analysis for a specific tour
 */
export interface DropOffPoint {
  stepIndex: number;
  stepId?: string;
  count: number;
  percentage: number;
}

export function getDropOffAnalysis(tourId: string): DropOffPoint[] {
  const events = getTourEvents();

  // Get all step views for this tour
  const stepViews = events.filter((e) => e.type === 'tour_step_viewed' && e.tour_id === tourId);

  // Get all completions for this tour
  const completions = events.filter((e) => e.type === 'tour_completed' && e.tour_id === tourId);

  // Get all skips for this tour
  const skips = events.filter((e) => e.type === 'tour_skipped' && e.tour_id === tourId);

  // Count last steps viewed before skip/abandon
  const lastSteps = new Map<number, { stepId?: string; count: number }>();

  skips.forEach((skip) => {
    if (skip.type !== 'tour_skipped') return;

    const index = skip.index ?? 0;
    const existing = lastSteps.get(index) || { count: 0, stepId: skip.step_id };
    existing.count++;
    lastSteps.set(index, existing);
  });

  // Convert to array and calculate percentages
  const totalSkips = skips.length;
  const dropOffs: DropOffPoint[] = [];

  lastSteps.forEach((value, index) => {
    dropOffs.push({
      stepIndex: index,
      stepId: value.stepId,
      count: value.count,
      percentage: totalSkips > 0 ? (value.count / totalSkips) * 100 : 0,
    });
  });

  // Sort by count descending
  return dropOffs.sort((a, b) => b.count - a.count);
}

/**
 * Get time to first tour metric
 */
export function getTimeToFirstTourMetrics(): {
  averageMs: number;
  medianMs: number;
  count: number;
} | null {
  const events = getTourEvents();
  const firstOpen = getFirstOpenTimestamp();

  // Find all tour_started events
  const tourStarts = events.filter((e) => e.type === 'tour_started');

  if (tourStarts.length === 0) {
    return null;
  }

  // Calculate time deltas
  const deltas = tourStarts.map((e) => e.ts - firstOpen).filter((d) => d > 0);

  if (deltas.length === 0) {
    return null;
  }

  // Calculate average
  const sum = deltas.reduce((acc, d) => acc + d, 0);
  const averageMs = sum / deltas.length;

  // Calculate median
  const sorted = [...deltas].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianMs =
    sorted.length % 2 === 0
      ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
      : (sorted[mid] ?? 0);

  return {
    averageMs,
    medianMs,
    count: deltas.length,
  };
}

/**
 * Get tour completion rate
 */
export function getTourCompletionRate(tourId: string): {
  started: number;
  completed: number;
  rate: number;
} {
  const events = getTourEvents();

  const started = events.filter((e) => e.type === 'tour_started' && e.tour_id === tourId).length;

  const completed = events.filter(
    (e) => e.type === 'tour_completed' && e.tour_id === tourId,
  ).length;

  const rate = started > 0 ? (completed / started) * 100 : 0;

  return { started, completed, rate };
}

/**
 * Get average tour duration
 */
export function getAverageTourDuration(tourId: string): number | null {
  const events = getTourEvents();

  const completions = events.filter((e) => e.type === 'tour_completed' && e.tour_id === tourId);

  if (completions.length === 0) {
    return null;
  }

  const durations = completions
    .map((e) => (e as any).duration_ms)
    .filter((d): d is number => typeof d === 'number' && d > 0);

  if (durations.length === 0) {
    return null;
  }

  const sum = durations.reduce((acc, d) => acc + d, 0);
  return sum / durations.length;
}

/**
 * Format milliseconds to human-readable time
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get summary statistics for all tours
 */
export function getTourSummaryStats() {
  const events = getTourEvents();

  const totalStarts = events.filter((e) => e.type === 'tour_started').length;
  const totalCompletions = events.filter((e) => e.type === 'tour_completed').length;
  const totalSkips = events.filter((e) => e.type === 'tour_skipped').length;
  const totalErrors = events.filter((e) => e.type === 'tour_error').length;

  const overallCompletionRate = totalStarts > 0 ? (totalCompletions / totalStarts) * 100 : 0;

  return {
    totalStarts,
    totalCompletions,
    totalSkips,
    totalErrors,
    overallCompletionRate,
  };
}
