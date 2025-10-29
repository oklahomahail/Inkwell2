/**
 * Tour Replay Button
 *
 * Allows users to restart the Inkwell Spotlight Tour from Settings → Help
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useToast } from '@/context/toast';
import { resetTour } from '@/tour/persistence';
import { startDefaultTour } from '@/tour/tourEntry';
import { tourService } from '@/tour/TourService';
import devLog from '@/utils/devLog';
import { useGo } from '@/utils/navigate';

const FIRST_RUN_KEY = 'inkwell:firstRunShown';

export function TourReplayButton() {
  const [isResetting, setIsResetting] = useState(false);
  const { showToast } = useToast();
  const navigate = useGo();
  const location = useLocation();

  // Check if user has completed tour before (from localStorage)
  const hasCompletedBefore = localStorage.getItem('inkwell:tour:completed') === 'true';

  // Check if we're on Settings page
  const isOnSettings = location.search.includes('view=dashboard');

  const handleReplay = async () => {
    setIsResetting(true);

    try {
      // Reset tour completion state - use actual DEFAULT_TOUR_ID from config
      resetTour('inkwell-onboarding-v1');

      // Reset first-run flag so tour can auto-start again if needed
      localStorage.removeItem(FIRST_RUN_KEY);

      // Clear any crash shield state that might block the tour
      try {
        sessionStorage.removeItem('inkwell:tour:crash-shield');
      } catch (err) {
        console.warn('[TourReplay] Could not clear crash shield:', err);
      }

      // If we're in Settings, offer to navigate to Dashboard
      if (isOnSettings) {
        showToast('Navigating to Dashboard to start tour...', 'info');

        // Navigate to dashboard first
        navigate('/dashboard');

        // Wait for navigation and DOM to settle
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Small delay for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Start the tour with logging
      devLog.log('[TourReplay] Starting default tour...');
      startDefaultTour();

      // Verify tour started and provide feedback
      setTimeout(() => {
        const tourState = tourService.getState();
        devLog.log('[TourReplay] Tour state after start:', tourState);

        if (!tourState?.isRunning) {
          devLog.error(
            '[TourReplay] Tour did not start! Check for missing tour anchors in the DOM.',
          );
          showToast(
            'Unable to start tour. Some required elements may not be visible. Please try again from the Dashboard.',
            'error',
          );

          // Log detailed diagnostics
          if (typeof (window as any).debugTour === 'function') {
            devLog.log('[TourReplay] Running diagnostics...');
            (window as any).debugTour();
          }
        } else {
          showToast('Tour started! Follow the highlighted areas.', 'success');
        }
      }, 100);
    } catch (error) {
      console.error('[TourReplay] Failed to restart tour:', error);
      showToast('Failed to start tour. Please try again.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Inkwell Spotlight Tour
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {hasCompletedBefore
              ? "Replay the cinematic walkthrough of Inkwell's core features."
              : "Start the guided tour to learn about Inkwell's core features."}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>11 steps • ~5 minutes</span>
          </div>
        </div>

        <button
          onClick={handleReplay}
          disabled={isResetting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
        >
          {isResetting ? (
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Starting...
            </span>
          ) : hasCompletedBefore ? (
            'Replay Tour'
          ) : (
            'Start Tour'
          )}
        </button>
      </div>

      {hasCompletedBefore && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your progress will be reset, and you'll be guided through the full walkthrough again.
          </p>
        </div>
      )}

      {isOnSettings && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>The tour will navigate you to the Dashboard to showcase all core features.</span>
          </p>
        </div>
      )}
    </div>
  );
}
