// Hook for integrating analytics tracking with existing features
import { useEffect, useRef, useCallback } from 'react';

import { useAppContext } from '../context/AppContext';
import { useAnalytics } from '../services/analyticsService';

// Feature usage tracking
const featureFirstUseMap = new Map<string, boolean>();

function _useAnalyticsTracking() {
  const analytics = useAnalytics();
  const { state } = useAppContext();
  const sessionStartTime = useRef(Date.now());
  const lastView = useRef(state.view);

  // Track view changes
  useEffect(() => {
    const currentView = state.view.toString();

    // Only track if view actually changed
    if (lastView.current !== state.view) {
      analytics.setActiveView(currentView);
      lastView.current = state.view;
    }
  }, [state.view, analytics]);

  // Writing session tracking
  const trackWritingSessionStart = useCallback(
    (
      projectType: 'new' | 'existing',
      wordCount: number,
      entryMethod: 'dashboard' | 'quick_write' | 'project_list' | 'recent',
    ) => {
      sessionStartTime.current = Date.now();
      analytics.trackWritingSessionStarted(projectType, wordCount, entryMethod);
    },
    [analytics],
  );

  const trackWritingSessionEnd = useCallback(
    (
      wordsWritten: number,
      savedManually: boolean,
      exitMethod: 'navigation' | 'close' | 'timeout' | 'error' = 'navigation',
    ) => {
      const sessionDuration = Date.now() - sessionStartTime.current;
      analytics.trackWritingSessionEnded(sessionDuration, wordsWritten, savedManually, exitMethod);
    },
    [analytics],
  );

  // Feature first use tracking
  const trackFeatureFirstUse = useCallback(
    (
      featureName:
        | 'plot_boards'
        | 'timeline'
        | 'analytics'
        | 'export'
        | 'claude_assistant'
        | 'writing_mode',
      discoveryMethod: 'tour' | 'exploration' | 'suggestion' | 'shortcut' = 'exploration',
      timeToFirstUse?: number,
    ) => {
      if (!featureFirstUseMap.has(featureName)) {
        featureFirstUseMap.set(featureName, true);
        analytics.trackFeatureFirstUse(featureName, discoveryMethod, timeToFirstUse);

        // Store in localStorage to persist across sessions
        const usedFeatures = JSON.parse(localStorage.getItem('inkwell_used_features') || '[]');
        if (!usedFeatures.includes(featureName)) {
          usedFeatures.push(featureName);
          localStorage.setItem('inkwell_used_features', JSON.stringify(usedFeatures));
        }
      }
    },
    [analytics],
  );

  // Initialize feature usage tracking from localStorage
  useEffect(() => {
    const usedFeatures = JSON.parse(localStorage.getItem('inkwell_used_features') || '[]');
    usedFeatures.forEach((feature: string) => {
      featureFirstUseMap.set(feature, true);
    });
  }, []);

  return {
    trackWritingSessionStart,
    trackWritingSessionEnd,
    trackFeatureFirstUse,
    trackTourStarted: analytics.trackTourStarted,
    trackTourStepCompleted: analytics.trackTourStepCompleted,
    trackTourAbandoned: analytics.trackTourAbandoned,
    trackTourCompleted: analytics.trackTourCompleted,
    setUserId: analytics.setUserId,
    isEnabled: analytics.isEnabled,
  };
}

// Hook for writing session tracking
function _useWritingSessionTracking() {
  const { trackWritingSessionStart, trackWritingSessionEnd } = useAnalyticsTracking();
  const { currentProject } = useAppContext();
  const sessionRef = useRef<{
    startTime: number;
    startWordCount: number;
    isActive: boolean;
  } | null>(null);

  const startSession = useCallback(
    (entryMethod: 'dashboard' | 'quick_write' | 'project_list' | 'recent' = 'dashboard') => {
      if (!currentProject) return;

      const wordCount = currentProject.content ? currentProject.content.split(/\s+/).length : 0;
      const projectType =
        currentProject.createdAt === currentProject.updatedAt ? 'new' : 'existing';

      sessionRef.current = {
        startTime: Date.now(),
        startWordCount: wordCount,
        isActive: true,
      };

      trackWritingSessionStart(projectType, wordCount, entryMethod);
    },
    [currentProject, trackWritingSessionStart],
  );

  const endSession = useCallback(
    (exitMethod: 'navigation' | 'close' | 'timeout' | 'error' = 'navigation') => {
      if (!sessionRef.current?.isActive || !currentProject) return;

      const currentWordCount = currentProject.content
        ? currentProject.content.split(/\s+/).length
        : 0;
      const wordsWritten = Math.max(0, currentWordCount - sessionRef.current.startWordCount);

      trackWritingSessionEnd(wordsWritten, false, exitMethod);
      sessionRef.current.isActive = false;
    },
    [currentProject, trackWritingSessionEnd],
  );

  const saveSession = useCallback(() => {
    if (!sessionRef.current?.isActive || !currentProject) return;

    const currentWordCount = currentProject.content
      ? currentProject.content.split(/\s+/).length
      : 0;
    const wordsWritten = Math.max(0, currentWordCount - sessionRef.current.startWordCount);

    trackWritingSessionEnd(wordsWritten, true, 'navigation');
    sessionRef.current.isActive = false;
  }, [currentProject, trackWritingSessionEnd]);

  // Auto-end session on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current?.isActive) {
        endSession('close');
      }
    };
  }, [endSession]);

  return {
    startSession,
    endSession,
    saveSession,
    isSessionActive: sessionRef.current?.isActive || false,
  };
}

// Hook for tour/onboarding tracking
function _useTourTracking() {
  const { trackTourStarted, trackTourStepCompleted, trackTourAbandoned, trackTourCompleted } =
    useAnalyticsTracking();
  const tourStateRef = useRef<{
    tourType: string;
    startTime: number;
    totalSteps: number;
    currentStep: number;
    stepsSkipped: number;
    stepStartTime: number;
  } | null>(null);

  const startTour = useCallback(
    (
      tourType: 'first_time' | 'feature_tour' | 'help_requested',
      entryPoint: string,
      totalSteps: number,
    ) => {
      tourStateRef.current = {
        tourType,
        startTime: Date.now(),
        totalSteps,
        currentStep: 0,
        stepsSkipped: 0,
        stepStartTime: Date.now(),
      };

      trackTourStarted(tourType, entryPoint);
    },
    [trackTourStarted],
  );

  const completeStep = useCallback(
    (stepName: string, skipped = false) => {
      if (!tourStateRef.current) return;

      const timeOnStep = Date.now() - tourStateRef.current.stepStartTime;

      if (!skipped) {
        trackTourStepCompleted(
          tourStateRef.current.tourType,
          tourStateRef.current.currentStep,
          stepName,
          timeOnStep,
        );
      } else {
        tourStateRef.current.stepsSkipped++;
      }

      tourStateRef.current.currentStep++;
      tourStateRef.current.stepStartTime = Date.now();
    },
    [trackTourStepCompleted],
  );

  const abandonTour = useCallback(() => {
    if (!tourStateRef.current) return;

    const timeBeforeAbandon = Date.now() - tourStateRef.current.startTime;

    trackTourAbandoned(
      tourStateRef.current.tourType,
      tourStateRef.current.currentStep,
      tourStateRef.current.totalSteps,
      timeBeforeAbandon,
    );

    tourStateRef.current = null;
  }, [trackTourAbandoned]);

  const completeTour = useCallback(() => {
    if (!tourStateRef.current) return;

    const totalTime = Date.now() - tourStateRef.current.startTime;

    trackTourCompleted(
      tourStateRef.current.tourType,
      tourStateRef.current.totalSteps,
      totalTime,
      tourStateRef.current.stepsSkipped,
    );

    tourStateRef.current = null;
  }, [trackTourCompleted]);

  return {
    startTour,
    completeStep,
    abandonTour,
    completeTour,
    currentStep: tourStateRef.current?.currentStep || 0,
    totalSteps: tourStateRef.current?.totalSteps || 0,
    isActive: tourStateRef.current !== null,
  };
}

// Hook for feature discovery tracking
function _useFeatureDiscovery() {
  const { trackFeatureFirstUse } = useAnalyticsTracking();

  const recordFeatureUse = useCallback(
    (
      featureName:
        | 'plot_boards'
        | 'timeline'
        | 'analytics'
        | 'export'
        | 'claude_assistant'
        | 'writing_mode',
      discoveryMethod: 'tour' | 'exploration' | 'suggestion' | 'shortcut' = 'exploration',
    ) => {
      trackFeatureFirstUse(featureName, discoveryMethod);
    },
    [trackFeatureFirstUse],
  );

  const recordFeatureFromTour = useCallback(
    (
      featureName:
        | 'plot_boards'
        | 'timeline'
        | 'analytics'
        | 'export'
        | 'claude_assistant'
        | 'writing_mode',
    ) => {
      recordFeatureUse(featureName, 'tour');
    },
    [recordFeatureUse],
  );

  const recordFeatureFromShortcut = useCallback(
    (
      featureName:
        | 'plot_boards'
        | 'timeline'
        | 'analytics'
        | 'export'
        | 'claude_assistant'
        | 'writing_mode',
    ) => {
      recordFeatureUse(featureName, 'shortcut');
    },
    [recordFeatureUse],
  );

  const recordFeatureFromSuggestion = useCallback(
    (
      featureName:
        | 'plot_boards'
        | 'timeline'
        | 'analytics'
        | 'export'
        | 'claude_assistant'
        | 'writing_mode',
    ) => {
      recordFeatureUse(featureName, 'suggestion');
    },
    [recordFeatureUse],
  );

  return {
    recordFeatureUse,
    recordFeatureFromTour,
    recordFeatureFromShortcut,
    recordFeatureFromSuggestion,
  };
}

// Named exports
export const useAnalyticsTracking = _useAnalyticsTracking;
export const useWritingSessionTracking = _useWritingSessionTracking;
export const useTourTracking = _useTourTracking;
export const useFeatureDiscovery = _useFeatureDiscovery;
