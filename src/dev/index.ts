/**
 * Development Tools Bootstrap
 * Loads all tour development helpers in development mode
 *
 * Import this in main.tsx or App.tsx during development
 */

import { printTourFlags, tourFlagHelpers } from './printTourFlags';
import {
  downloadTourCSV,
  downloadTourSummaryJSON,
  printTourAnalytics,
} from './tourAnalyticsExport';

/**
 * Initialize tour development tools
 * Exposes helpers globally for console access
 */
export function initTourDevTools(): void {
  if (!import.meta.env.DEV) {
    return;
  }

  // Expose tour flag helpers
  (window as any).tourFlags = {
    print: printTourFlags,
    ...tourFlagHelpers,
  };

  // Expose analytics helpers
  (window as any).tourAnalytics = {
    downloadCSV: downloadTourCSV,
    downloadSummary: downloadTourSummaryJSON,
    print: printTourAnalytics,
  };

  // Print welcome message
  console.log(
    '\n%c🎯 Tour Development Tools Loaded',
    'color: #10b981; font-weight: bold; font-size: 14px;',
  );
  console.log('%cAvailable commands:', 'color: #6366f1; font-weight: bold;');
  console.log('  %cwindow.tourFlags.print()', 'color: #8b5cf6');
  console.log('  %cwindow.tourFlags.enableAll()', 'color: #8b5cf6');
  console.log('  %cwindow.tourFlags.disableAll()', 'color: #8b5cf6');
  console.log('  %cwindow.tourFlags.enableExport()', 'color: #8b5cf6');
  console.log('  %cwindow.tourFlags.disableExport()', 'color: #8b5cf6');
  console.log('  %cwindow.tourAnalytics.print()', 'color: #ec4899');
  console.log('  %cwindow.tourAnalytics.downloadCSV()', 'color: #ec4899');
  console.log('  %cwindow.tourAnalytics.downloadSummary()', 'color: #ec4899');
  console.log(
    '\n%cFor full documentation, see: docs/TOUR_POST_DEPLOY_GUARDRAILS.md',
    'color: #64748b; font-style: italic;',
  );
  console.log('');
}

// Auto-initialize in development
if (import.meta.env.DEV) {
  initTourDevTools();
}
