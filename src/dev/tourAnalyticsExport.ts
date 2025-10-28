/**
 * Tour Analytics CSV Export
 * One-liner CSV download for analytics review
 *
 * Usage (in browser console):
 *   import { downloadTourCSV } from '@/dev/tourAnalyticsExport';
 *   downloadTourCSV();
 */
import type { TourEvent } from '@/tour/adapters/analyticsAdapter';
import devLog from "@/utils/devLog";


/**
 * Download all tour analytics events as CSV
 */
export function downloadTourCSV(): void {
  try {
    const events: TourEvent[] = JSON.parse(localStorage.getItem('analytics.tour.events') || '[]');

    if (events.length === 0) {
      console.warn('⚠️ No tour analytics events found');
      return;
    }

    // CSV header
    const header = ['type', 'tour_id', 'step_id', 'index', 'duration_ms', 'ts', 'date_time'];

    // Convert events to CSV rows
    const rows = events.map((e: any) => [
      e.type || '',
      e.tour_id || '',
      e.step_id || '',
      e.index ?? '',
      e.duration_ms ?? '',
      e.ts || '',
      e.ts ? new Date(e.ts).toISOString() : '',
    ]);

    // Build CSV
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tour_analytics_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    devLog.debug(`✅ Downloaded ${events.length} tour events to CSV`);
  } catch (error) {
    console.error('❌ Failed to download tour CSV:', error);
  }
}

/**
 * Download tour summary statistics as JSON
 */
export function downloadTourSummaryJSON(): void {
  try {
    const events: TourEvent[] = JSON.parse(localStorage.getItem('analytics.tour.events') || '[]');

    // Calculate summary stats
    const summary = {
      exportDate: new Date().toISOString(),
      totalEvents: events.length,
      byType: {} as Record<string, number>,
      byTour: {} as Record<string, { starts: number; completions: number; skips: number }>,
      timeRange: {
        first:
          events.length > 0 ? new Date(Math.min(...events.map((e) => e.ts))).toISOString() : null,
        last:
          events.length > 0 ? new Date(Math.max(...events.map((e) => e.ts))).toISOString() : null,
      },
    };

    // Count by type
    events.forEach((e) => {
      summary.byType[e.type] = (summary.byType[e.type] || 0) + 1;

      if ('tour_id' in e && e.tour_id) {
        if (!summary.byTour[e.tour_id]) {
          summary.byTour[e.tour_id] = { starts: 0, completions: 0, skips: 0 };
        }

        const tourStats = summary.byTour[e.tour_id]!;
        if (e.type === 'tour_started') tourStats.starts++;
        if (e.type === 'tour_completed') tourStats.completions++;
        if (e.type === 'tour_skipped') tourStats.skips++;
      }
    });

    // Download
    const json = JSON.stringify(summary, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tour_summary_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    devLog.debug('✅ Downloaded tour summary statistics');
    console.table(summary.byTour);
  } catch (error) {
    console.error('❌ Failed to download tour summary:', error);
  }
}

/**
 * Print analytics summary to console
 */
export function printTourAnalytics(): void {
  try {
    const events: TourEvent[] = JSON.parse(localStorage.getItem('analytics.tour.events') || '[]');

    devLog.debug('\n📊 Tour Analytics Summary\n');
    devLog.debug(`Total Events: ${events.length}`);

    // By type
    const byType: Record<string, number> = {};
    events.forEach((e) => {
      byType[e.type] = (byType[e.type] || 0) + 1;
    });

    devLog.debug('\n📈 Events by Type:');
    console.table(Object.entries(byType).map(([type, count]) => ({ type, count })));

    // By tour
    const byTour: Record<string, { starts: number; completions: number; rate: string }> = {};
    events.forEach((e) => {
      if ('tour_id' in e && e.tour_id) {
        if (!byTour[e.tour_id]) {
          byTour[e.tour_id] = { starts: 0, completions: 0, rate: '0%' };
        }

        const tourStats = byTour[e.tour_id]!;
        if (e.type === 'tour_started') tourStats.starts++;
        if (e.type === 'tour_completed') tourStats.completions++;
      }
    });

    // Calculate rates
    Object.keys(byTour).forEach((tourId) => {
      const tourStats = byTour[tourId];
      if (tourStats) {
        const { starts, completions } = tourStats;
        tourStats.rate = starts > 0 ? `${((completions / starts) * 100).toFixed(1)}%` : '0%';
      }
    });

    devLog.debug('\n🎯 Completion Rates by Tour:');
    console.table(byTour);

    // Recent events
    const recent = events.slice(-10);
    devLog.debug('\n🕐 Recent Events (last 10):');
    console.table(
      recent.map((e) => ({
        type: e.type,
        tour: 'tour_id' in e ? e.tour_id : '-',
        time: new Date(e.ts).toLocaleTimeString(),
      })),
    );
  } catch (error) {
    console.error('❌ Failed to print analytics:', error);
  }
}

// Expose globally in development
if (import.meta.env.DEV) {
  (window as any).tourAnalytics = {
    downloadCSV: downloadTourCSV,
    downloadSummary: downloadTourSummaryJSON,
    print: printTourAnalytics,
  };

  devLog.debug('💡 Tour analytics helpers available: window.tourAnalytics');
}
