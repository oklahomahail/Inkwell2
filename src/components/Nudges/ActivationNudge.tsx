// src/components/Nudges/ActivationNudge.tsx
import { BookOpen, Clock, Target, TrendingUp, X, ArrowRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { analyticsService } from '../../services/analyticsService';
import {
  selectProjectOnboarding,
  selectShouldShowNudge,
  selectWordCountProgress,
  selectCurrentStep,
} from '../../state/onboarding/onboardingSlice';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Progress } from '../ui/progress';

interface ActivationNudgeProps {
  projectId: string;
  onContinue: () => void;
  onDismiss: () => void;
}

export function ActivationNudge({ projectId, onContinue, onDismiss }: ActivationNudgeProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const shouldShow = useSelector((state: any) => selectShouldShowNudge(state, projectId));
  const projectOnboarding = useSelector((state: any) => selectProjectOnboarding(state, projectId));
  const wordProgress = useSelector((state: any) => selectWordCountProgress(state, projectId));
  const currentStep = useSelector((state: any) => selectCurrentStep(state, projectId));

  useEffect(() => {
    // Check if nudge was previously dismissed for this session
    const dismissedNudges = sessionStorage.getItem('dismissed_nudges');
    if (dismissedNudges) {
      const dismissed = JSON.parse(dismissedNudges);
      setIsDismissed(dismissed.includes(projectId));
    }
  }, [projectId]);

  const handleDismiss = () => {
    setIsDismissed(true);

    // Remember dismissal for this session
    const dismissedNudges = JSON.parse(sessionStorage.getItem('dismissed_nudges') || '[]');
    dismissedNudges.push(projectId);
    sessionStorage.setItem('dismissed_nudges', JSON.stringify(dismissedNudges));

    analyticsService.track('nudge_dismissed', {
      projectId,
      nudgeType: 'activation_comeback',
      wordCount: wordProgress.current,
      currentStep,
      timeSinceCreation: projectOnboarding ? Date.now() - projectOnboarding.startedAt : 0,
    });

    onDismiss();
  };

  const handleContinue = () => {
    analyticsService.track('nudge_clicked', {
      projectId,
      nudgeType: 'activation_comeback',
      action: 'continue_writing',
      wordCount: wordProgress.current,
      currentStep,
    });

    onContinue();
  };

  if (!shouldShow || isDismissed || !projectOnboarding) {
    return null;
  }

  const timeSinceCreation = Date.now() - projectOnboarding.startedAt;
  const minutesAgo = Math.floor(timeSinceCreation / (1000 * 60));

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-2">
      <Card className="border-l-4 border-l-blue-500 shadow-lg">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm">Pick up where you left off</span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              You were in <span className="font-medium">Chapter 1</span> about {minutesAgo} minutes
              ago.
            </p>

            {/* Progress indicators */}
            <div className="space-y-2">
              {/* Word progress */}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center">
                  <Target className="w-3 h-3 mr-1" />
                  Words
                </span>
                <span>
                  {wordProgress.current}/{wordProgress.target}
                </span>
              </div>
              <Progress value={wordProgress.percentage} className="h-1" />

              {/* Time indicator */}
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                <span>
                  Just {Math.ceil((wordProgress.target - wordProgress.current) / 50)} minutes to
                  reach your goal
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-2 pt-2">
              <Button onClick={handleContinue} size="sm" className="flex-1 h-8">
                <ArrowRight className="w-3 h-3 mr-1" />
                Continue writing
              </Button>
            </div>

            {/* Encouragement */}
            <div className="text-xs text-gray-500 text-center">
              You're {wordProgress.percentage}% of the way to your first milestone! 🎯
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Analytics dashboard component for tracking activation funnel
export function ActivationAnalytics({ projectId }: { projectId: string }) {
  const [metrics, setMetrics] = useState({
    A1_PROJECT_CREATED: false,
    A2_SCENE_CREATED: false,
    A3_300_WORDS_SAVED: false,
    A4_EXPORTED: false,
    timeToA3: null as number | null,
    success: false,
  });

  const projectOnboarding = useSelector((state: any) => selectProjectOnboarding(state, projectId));
  const wordProgress = useSelector((state: any) => selectWordCountProgress(state, projectId));

  useEffect(() => {
    if (!projectOnboarding) return;

    const completed = projectOnboarding.completed;
    const timeToA3 = completed.focusWrite ? Date.now() - projectOnboarding.startedAt : null;

    setMetrics({
      A1_PROJECT_CREATED: true, // Project exists
      A2_SCENE_CREATED: !!completed.scene,
      A3_300_WORDS_SAVED: wordProgress?.hasReachedTarget || false,
      A4_EXPORTED: !!completed.export,
      timeToA3,
      success: timeToA3 ? timeToA3 < 15 * 60 * 1000 : false, // 15 minutes
    });
  }, [projectOnboarding, wordProgress]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs">
      <Card className="bg-gray-900 text-white">
        <CardContent className="p-3">
          <h4 className="text-sm font-semibold mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            Activation Funnel
          </h4>

          <div className="space-y-1 text-xs">
            {/* A1 */}
            <div className="flex items-center justify-between">
              <span>A1 Project Created</span>
              <Badge
                variant={metrics.A1_PROJECT_CREATED ? 'default' : 'secondary'}
                className="h-4 px-1"
              >
                {metrics.A1_PROJECT_CREATED ? '✓' : '○'}
              </Badge>
            </div>

            {/* A2 */}
            <div className="flex items-center justify-between">
              <span>A2 Scene Created</span>
              <Badge
                variant={metrics.A2_SCENE_CREATED ? 'default' : 'secondary'}
                className="h-4 px-1"
              >
                {metrics.A2_SCENE_CREATED ? '✓' : '○'}
              </Badge>
            </div>

            {/* A3 */}
            <div className="flex items-center justify-between">
              <span>A3 300 Words Saved</span>
              <Badge
                variant={metrics.A3_300_WORDS_SAVED ? 'default' : 'secondary'}
                className="h-4 px-1"
              >
                {metrics.A3_300_WORDS_SAVED ? '✓' : '○'}
              </Badge>
            </div>

            {/* A4 */}
            <div className="flex items-center justify-between">
              <span>A4 Exported</span>
              <Badge variant={metrics.A4_EXPORTED ? 'default' : 'secondary'} className="h-4 px-1">
                {metrics.A4_EXPORTED ? '✓' : '○'}
              </Badge>
            </div>

            {/* Success metric */}
            {metrics.timeToA3 && (
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span>Time to A3</span>
                  <Badge variant={metrics.success ? 'default' : 'destructive'} className="h-4 px-1">
                    {Math.floor(metrics.timeToA3 / (1000 * 60))}min
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Success (≤15min)</span>
                  <Badge variant={metrics.success ? 'default' : 'destructive'} className="h-4 px-1">
                    {metrics.success ? 'YES' : 'NO'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for showing nudges at appropriate times
export function useActivationNudges(projectId: string) {
  const [showNudge, setShowNudge] = useState(false);
  const shouldShow = useSelector((state: any) => selectShouldShowNudge(state, projectId));

  useEffect(() => {
    if (shouldShow) {
      // Show nudge after a short delay when conditions are met
      const timer = setTimeout(() => {
        setShowNudge(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  const handleContinue = () => {
    setShowNudge(false);
    // Navigate to writing interface for the project
    // This would use your routing system
    window.location.hash = `#/project/${projectId}/write`;
  };

  const handleDismiss = () => {
    setShowNudge(false);
  };

  return {
    showNudge,
    NudgeComponent: showNudge ? (
      <ActivationNudge
        projectId={projectId}
        onContinue={handleContinue}
        onDismiss={handleDismiss}
      />
    ) : null,
  };
}

// Global nudge manager for multiple projects
export function GlobalNudgeManager() {
  const [activeProjects, setActiveProjects] = useState<string[]>([]);

  useEffect(() => {
    // Load active projects that might need nudges
    const stored = localStorage.getItem('recent_projects');
    if (stored) {
      try {
        const projects = JSON.parse(stored);
        setActiveProjects(projects.slice(0, 5)); // Check last 5 projects
      } catch (e) {
        console.warn('Failed to parse recent projects:', e);
      }
    }
  }, []);

  return (
    <>
      {activeProjects.map((projectId) => {
        const nudge = useActivationNudges(projectId);
        return nudge.NudgeComponent;
      })}
    </>
  );
}
