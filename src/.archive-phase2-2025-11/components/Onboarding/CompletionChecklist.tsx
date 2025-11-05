// src/components/Onboarding/CompletionChecklist.tsx
import {
  CheckCircle2,
  Circle,
  Trophy,
  Target,
  BookOpen,
  Users,
  FileText,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';

import { useTour } from './useTour';

interface ChecklistItemConfig {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  tourTrigger?: string; // Which tour to suggest when clicked
}

const CHECKLIST_ITEMS: ChecklistItemConfig[] = [
  {
    key: 'createProject',
    label: 'Create your first project',
    description: 'Start a new story or choose from our templates',
    icon: BookOpen,
    tourTrigger: 'core-onboarding',
  },
  {
    key: 'addChapter',
    label: 'Add a chapter',
    description: 'Structure your story with chapters and scenes',
    icon: FileText,
    tourTrigger: 'timeline-panel',
  },
  {
    key: 'addCharacter',
    label: 'Create a character',
    description: 'Develop memorable characters with detailed profiles',
    icon: Users,
    tourTrigger: 'timeline-panel',
  },
  {
    key: 'writeContent',
    label: 'Write your first 100 words',
    description: 'Get started with the writing process',
    icon: Target,
    tourTrigger: 'writing-panel',
  },
  {
    key: 'useTimeline',
    label: 'Explore the Timeline',
    description: 'Plan and organize your story structure',
    icon: BarChart3,
    tourTrigger: 'timeline-panel',
  },
  {
    key: 'exportProject',
    label: 'Export your work',
    description: 'Share your story in PDF, Word, or other formats',
    icon: FileText,
  },
  {
    key: 'useAI',
    label: 'Try the AI assistant',
    description: 'Get writing suggestions and overcome blocks',
    icon: Sparkles,
    tourTrigger: 'writing-panel',
  },
];

interface CompletionChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour?: (tourType: string) => void;
  checklist?: Record<string, boolean>;
}

export const CompletionChecklistComponent: React.FC<CompletionChecklistProps> = ({
  isOpen,
  onClose,
  onStartTour,
}) => {
  const { checklist, getChecklistProgress, canShowContextualTour, logAnalytics } = useTour();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const progress = getChecklistProgress();
  const progressPercentage = (progress.completed / progress.total) * 100;

  if (!isOpen) return null;

  const handleItemClick = (item: ChecklistItemConfig) => {
    if (item.tourTrigger && canShowContextualTour(item.tourTrigger)) {
      logAnalytics('checklist_tour_requested', {
        tourType: item.tourTrigger,
        item: item.key,
      });
      onStartTour?.(item.tourTrigger);
      onClose();
    }
  };

  const getItemStyle = (item: ChecklistItemConfig) => {
    const isCompleted = checklist?.[item.key as keyof typeof checklist] || false;
    const canStartTour = item.tourTrigger && canShowContextualTour(item.tourTrigger);

    return {
      opacity: isCompleted ? 0.7 : 1,
      cursor: canStartTour ? 'pointer' : 'default',
      background:
        hoveredItem === String(item.key) && canStartTour
          ? 'rgba(59, 130, 246, 0.05)'
          : 'transparent',
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Getting Started
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Complete these steps to master Inkwell
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Close checklist"
            >
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Progress</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {progress.completed} of {progress.total}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {progress.completed === progress.total && (
              <div className="text-center py-2">
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  🎉 Congratulations! You've mastered the basics!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Checklist items */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((item) => {
              const Icon = item.icon;
              const isCompleted = checklist?.[item.key as keyof typeof checklist] || false;
              const canStartTour = item.tourTrigger && canShowContextualTour(item.tourTrigger);

              return (
                <div
                  key={String(item.key)}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    isCompleted
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                      : canStartTour
                        ? 'border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600'
                        : 'border-slate-200 dark:border-slate-700'
                  }`}
                  style={getItemStyle(item)}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => setHoveredItem(String(item.key))}
                  onMouseLeave={() => setHoveredItem(null)}
                  role={canStartTour ? 'button' : 'listitem'}
                  tabIndex={canStartTour ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(item);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-slate-100 dark:bg-slate-700'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isCompleted
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-medium text-sm ${
                          isCompleted
                            ? 'text-green-900 dark:text-green-100 line-through'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {item.label}
                      </h3>
                      <p
                        className={`text-xs mt-1 ${
                          isCompleted
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.description}
                      </p>

                      {/* Tour availability hint */}
                      {!isCompleted && canStartTour && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                            <Target className="w-3 h-3" />
                            Click for quick tour
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Click on incomplete items to get guided tours and tips
          </div>
        </div>
      </div>
    </div>
  );
};

export { CompletionChecklistComponent as default };
