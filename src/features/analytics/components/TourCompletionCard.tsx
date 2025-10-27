/**
 * Tour Completion Card
 *
 * Displays tour engagement metrics from locally stored events.
 * Shows completion rate and average time to complete.
 */

import React, { useMemo } from 'react';

type TourEventRow = {
  type: string;
  tour_id: string;
  ts: number;
  duration_ms?: number;
  steps?: number;
};

function readTourEvents(): TourEventRow[] {
  try {
    const data = localStorage.getItem('analytics.tour.events');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.warn('[TourCompletionCard] Failed to read tour events:', error);
    return [];
  }
}

export default function TourCompletionCard() {
  const stats = useMemo(() => {
    const events = readTourEvents();
    const completed = events.filter((e) => e.type === 'tour_completed');
    const started = events.filter((e) => e.type === 'tour_started');

    const rate = started.length > 0 ? Math.round((completed.length / started.length) * 100) : 0;

    const avgMs =
      completed.length > 0
        ? Math.round(completed.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / completed.length)
        : 0;

    const avgSeconds = Math.round(avgMs / 1000);

    return {
      completionRate: rate,
      avgTimeSeconds: avgSeconds,
      totalStarted: started.length,
      totalCompleted: completed.length,
    };
  }, []);

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Tour Engagement
        </h3>
      </div>

      <div className="space-y-4">
        {/* Completion Rate */}
        <div>
          <div className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
            {stats.completionRate}%
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Completion rate</div>
        </div>

        {/* Average Time */}
        <div>
          <div className="text-2xl font-medium text-neutral-700 dark:text-neutral-300">
            {stats.avgTimeSeconds}s
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Avg time to complete
          </div>
        </div>

        {/* Stats Summary */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-medium text-neutral-900 dark:text-neutral-50">
                {stats.totalStarted}
              </div>
              <div className="text-neutral-500 dark:text-neutral-400">Started</div>
            </div>
            <div>
              <div className="font-medium text-neutral-900 dark:text-neutral-50">
                {stats.totalCompleted}
              </div>
              <div className="text-neutral-500 dark:text-neutral-400">Completed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
