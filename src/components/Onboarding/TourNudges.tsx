// src/components/Onboarding/TourNudges.tsx
import { ArrowRight, Clock, X, BookOpen, Users, BarChart3 } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useTour, TOUR_MAP } from './ProfileTourProvider';

interface TourNudge {
  id: string;
  title: string;
  description: string;
  tourType: keyof typeof TOUR_MAP;
  icon: React.ElementType;
  trigger: {
    action: string; // Action that triggered this nudge
    delay?: number; // Delay in ms before showing
    conditions?: Record<string, any>; // Additional conditions
  };
  priority: 'low' | 'medium' | 'high';
  dismissible: boolean;
}

const TOUR_NUDGES: TourNudge[] = [
  {
    id: 'first-chapter-added',
    title: '🎉 Great start!',
    description: 'Want a 30-second tour of the Timeline to organize your story structure?',
    tourType: 'timeline-panel',
    icon: BarChart3,
    trigger: {
      action: 'chapter_added',
      delay: 2000,
      conditions: { isFirstChapter: true },
    },
    priority: 'high',
    dismissible: true,
  },
  {
    id: 'first-character-created',
    title: 'Character created!',
    description: 'Explore how to develop rich character profiles and track their arcs.',
    tourType: 'timeline-panel',
    icon: Users,
    trigger: {
      action: 'character_created',
      delay: 1500,
      conditions: { isFirstCharacter: true },
    },
    priority: 'medium',
    dismissible: true,
  },
  {
    id: 'writing-session-started',
    title: 'Ready to write?',
    description: 'Quick tour of writing tools to help you focus and be productive.',
    tourType: 'writing-panel',
    icon: BookOpen,
    trigger: {
      action: 'writing_started',
      delay: 5000,
      conditions: { wordCount: { min: 50 } },
    },
    priority: 'medium',
    dismissible: true,
  },
  {
    id: 'progress-milestone',
    title: "You're making progress!",
    description: 'See how the Analytics panel can help track your writing habits.',
    tourType: 'analytics-panel',
    icon: BarChart3,
    trigger: {
      action: 'word_count_milestone',
      delay: 3000,
      conditions: { wordCount: { min: 500 } },
    },
    priority: 'low',
    dismissible: true,
  },
  {
    id: 'multiple-projects',
    title: 'Growing your library!',
    description: 'Learn how to manage multiple projects efficiently.',
    tourType: 'dashboard-panel',
    icon: BookOpen,
    trigger: {
      action: 'project_created',
      delay: 1000,
      conditions: { projectCount: { min: 2 } },
    },
    priority: 'low',
    dismissible: true,
  },
];

interface TourNudgeProps {
  nudge: TourNudge;
  onStartTour: (tourType: string) => void;
  onDismiss: (nudgeId: string) => void;
  onClose: () => void;
}

const TourNudgeComponent: React.FC<TourNudgeProps> = ({
  nudge,
  onStartTour,
  onDismiss,
  onClose,
}) => {
  const Icon = nudge.icon;

  const handleStartTour = () => {
    onStartTour(nudge.tourType);
    onClose();
  };

  const handleDismiss = () => {
    onDismiss(nudge.id);
    onClose();
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div
        className={`rounded-lg shadow-xl border-2 backdrop-blur-sm ${
          nudge.priority === 'high'
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600'
            : nudge.priority === 'medium'
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600'
              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                nudge.priority === 'high'
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : nudge.priority === 'medium'
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : 'bg-slate-100 dark:bg-slate-700'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  nudge.priority === 'high'
                    ? 'text-blue-600 dark:text-blue-400'
                    : nudge.priority === 'medium'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-slate-600 dark:text-slate-400'
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                {nudge.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    nudge.priority === 'high'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : nudge.priority === 'medium'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  Quick tour
                </span>
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-500">~30s</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
            aria-label="Close nudge"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-2">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {nudge.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 pt-2">
          <div className="flex items-center gap-2">
            {nudge.dismissible && (
              <button
                onClick={handleDismiss}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Don't show again
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-1.5 rounded-md transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleStartTour}
              className="inline-flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors font-medium"
            >
              Show me
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TourNudgeManagerProps {
  onStartTour: (_tourType: string) => void;
}

export const TourNudgeManager: React.FC<TourNudgeManagerProps> = ({ onStartTour }) => {
  const { canShowContextualTour, logAnalytics } = useTour();
  const [activeNudge, setActiveNudge] = useState<TourNudge | null>(null);
  const [dismissedNudges, setDismissedNudges] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('inkwell-dismissed-nudges');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [nudgeQueue, setNudgeQueue] = useState<TourNudge[]>([]);

  // Save dismissed nudges to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('inkwell-dismissed-nudges', JSON.stringify(dismissedNudges));
    } catch (error) {
      console.warn('Failed to save dismissed nudges:', error);
    }
  }, [dismissedNudges]);

  // Process nudge queue
  useEffect(() => {
    if (activeNudge || nudgeQueue.length === 0) return;

    const nextNudge = nudgeQueue[0];
    if (
      nextNudge &&
      !dismissedNudges.includes(nextNudge.id) &&
      canShowContextualTour(nextNudge.tourType)
    ) {
      setActiveNudge(nextNudge);
      setNudgeQueue((prev) => prev.slice(1));
      logAnalytics('nudge_shown', { nudgeId: nextNudge.id, tourType: nextNudge.tourType });
    } else {
      setNudgeQueue((prev) => prev.slice(1));
    }
  }, [activeNudge, nudgeQueue, dismissedNudges, canShowContextualTour, logAnalytics]);

  // Function to trigger a nudge (called by other components)
  const triggerNudge = (action: string, conditions: Record<string, any> = {}) => {
    const matchingNudges = TOUR_NUDGES.filter((nudge) => {
      if (nudge.trigger.action !== action) return false;
      if (dismissedNudges.includes(nudge.id)) return false;
      if (!canShowContextualTour(nudge.tourType)) return false;

      // Check trigger conditions
      if (nudge.trigger.conditions) {
        for (const [key, expectedValue] of Object.entries(nudge.trigger.conditions)) {
          const actualValue = conditions[key];

          if (typeof expectedValue === 'object' && expectedValue.min !== undefined) {
            if (actualValue < expectedValue.min) return false;
          } else if (typeof expectedValue === 'object' && expectedValue.max !== undefined) {
            if (actualValue > expectedValue.max) return false;
          } else if (actualValue !== expectedValue) {
            return false;
          }
        }
      }

      return true;
    });

    if (matchingNudges.length > 0) {
      // Sort by priority and add to queue
      const sortedNudges = matchingNudges.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // Add delays and queue nudges
      sortedNudges.forEach((nudge, index) => {
        const delay = (nudge.trigger.delay || 0) + index * 500; // Stagger multiple nudges
        setTimeout(() => {
          setNudgeQueue((prev) => [...prev, nudge]);
        }, delay);
      });
    }
  };

  const handleStartTour = (tourType: string) => {
    if (activeNudge) {
      logAnalytics('nudge_tour_started', {
        nudgeId: activeNudge.id,
        tourType,
      });
    }
    onStartTour(tourType);
  };

  const handleDismissNudge = (nudgeId: string) => {
    setDismissedNudges((prev) => [...prev, nudgeId]);
    logAnalytics('nudge_dismissed', { nudgeId });
  };

  const handleCloseNudge = () => {
    if (activeNudge) {
      logAnalytics('nudge_closed', { nudgeId: activeNudge.id });
    }
    setActiveNudge(null);
  };

  // Expose triggerNudge function globally for other components to use
  useEffect(() => {
    (window as any).__inkwellTriggerNudge = triggerNudge;
    return () => {
      delete (window as any).__inkwellTriggerNudge;
    };
  }, []);

  if (!activeNudge) return null;

  return (
    <TourNudgeComponent
      nudge={activeNudge}
      onStartTour={handleStartTour}
      onDismiss={handleDismissNudge}
      onClose={handleCloseNudge}
    />
  );
};

// Helper function for other components to trigger nudges
export const triggerTourNudge = (action: string, conditions: Record<string, any> = {}) => {
  const triggerFn = (window as any).__inkwellTriggerNudge;
  if (triggerFn) {
    triggerFn(action, conditions);
  }
};

export default TourNudgeManager;
