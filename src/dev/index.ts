/**
 * Development Tools Bootstrap
 * Loads all tour development helpers in development mode
 *
 * Import this in main.tsx or App.tsx during development
 */
import devLog from '@/utils/devLog';

import { analyticsHelpers } from './analyticsExport';
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

  // Expose tour analytics helpers
  (window as any).tourAnalytics = {
    downloadCSV: downloadTourCSV,
    downloadSummary: downloadTourSummaryJSON,
    print: printTourAnalytics,
  };

  // Expose general analytics helpers
  (window as any).analytics = analyticsHelpers;

  // Print welcome message
  devLog.debug(
    '\n%c🎯 Development Tools Loaded',
    'color: #10b981; font-weight: bold; font-size: 14px;',
  );
  devLog.debug('%cAvailable commands:', 'color: #6366f1; font-weight: bold;');
  devLog.debug('\n%c📊 Analytics:', 'color: #f59e0b; font-weight: bold;');
  devLog.debug('  %cwindow.analytics.summary()', 'color: #f59e0b');
  devLog.debug('  %cwindow.analytics.events()', 'color: #f59e0b');
  devLog.debug('  %cwindow.analytics.metrics()', 'color: #f59e0b');
  devLog.debug('  %cwindow.analytics.performance("category")', 'color: #f59e0b');
  devLog.debug('  %cwindow.analytics.config()', 'color: #f59e0b');
  devLog.debug('  %cwindow.analytics.downloadJSON()', 'color: #f59e0b');
  devLog.debug('  %cwindow.analytics.downloadCSV("events"|"metrics")', 'color: #f59e0b');
  devLog.debug('\n%c🎯 Tour Flags:', 'color: #8b5cf6; font-weight: bold;');
  devLog.debug('  %cwindow.tourFlags.print()', 'color: #8b5cf6');
  devLog.debug('  %cwindow.tourFlags.enableAll()', 'color: #8b5cf6');
  devLog.debug('  %cwindow.tourFlags.disableAll()', 'color: #8b5cf6');
  devLog.debug('  %cwindow.tourFlags.enableExport()', 'color: #8b5cf6');
  devLog.debug('  %cwindow.tourFlags.disableExport()', 'color: #8b5cf6');
  devLog.debug('\n%c📈 Tour Analytics:', 'color: #ec4899; font-weight: bold;');
  devLog.debug('  %cwindow.tourAnalytics.print()', 'color: #ec4899');
  devLog.debug('  %cwindow.tourAnalytics.downloadCSV()', 'color: #ec4899');
  devLog.debug('  %cwindow.tourAnalytics.downloadSummary()', 'color: #ec4899');
  devLog.debug(
    '\n%cFor full documentation, see: docs/TOUR_POST_DEPLOY_GUARDRAILS.md',
    'color: #64748b; font-style: italic;',
  );
  devLog.debug('');
}

// Auto-initialize in development
if (import.meta.env.DEV) {
  initTourDevTools();
}
