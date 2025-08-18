// src/components/ui/EmptyStates.tsx
import React from 'react';
import {
  BookOpen,
  Edit3,
  Plus,
  Calendar,
  BarChart3,
  Users,
  FileText,
  Lightbulb,
  Target,
  Sparkles,
  ArrowRight,
  Play,
} from 'lucide-react';
import { KeyboardShortcut } from './KeyboardHints';

// ==========================================
// BASE EMPTY STATE COMPONENT
// ==========================================

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    shortcut?: string[];
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    shortcut?: string[];
  };
  suggestions?: Array<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    onClick?: () => void;
  }>;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  suggestions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      {/* Icon */}
      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>

      {/* Content */}
      <div className="max-w-md">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-8">{description}</p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>{primaryAction.label}</span>
              {primaryAction.shortcut && (
                <KeyboardShortcut keys={primaryAction.shortcut} size="sm" variant="subtle" />
              )}
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <span>{secondaryAction.label}</span>
              {secondaryAction.shortcut && (
                <KeyboardShortcut keys={secondaryAction.shortcut} size="sm" variant="subtle" />
              )}
            </button>
          )}
        </div>

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Get started with:
            </h4>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => {
                const SuggestionIcon = suggestion.icon;
                return (
                  <button
                    key={index}
                    onClick={suggestion.onClick}
                    className="w-full flex items-center gap-3 p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                  >
                    <SuggestionIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {suggestion.title}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {suggestion.description}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// SPECIFIC EMPTY STATES
// ==========================================

// No Projects Empty State
export const NoProjectsEmptyState: React.FC<{
  onCreateProject: () => void;
  onOpenHelp: () => void;
}> = ({ onCreateProject, onOpenHelp }) => (
  <EmptyState
    icon={BookOpen}
    title="Welcome to Inkwell"
    description="Start your writing journey by creating your first project. Inkwell helps you organize chapters, track progress, and bring your stories to life."
    primaryAction={{
      label: 'Create Your First Project',
      onClick: onCreateProject,
      shortcut: ['⌘', 'N'],
    }}
    secondaryAction={{
      label: 'View Tutorial',
      onClick: onOpenHelp,
      shortcut: ['?'],
    }}
    suggestions={[
      {
        icon: Sparkles,
        title: 'Start with a template',
        description: 'Choose from novel, screenplay, or blog templates',
        onClick: onCreateProject,
      },
      {
        icon: Target,
        title: 'Set writing goals',
        description: 'Track daily word counts and deadlines',
        onClick: onCreateProject,
      },
      {
        icon: BarChart3,
        title: 'Monitor progress',
        description: 'View analytics and writing streaks',
        onClick: onCreateProject,
      },
    ]}
  />
);

// No Chapters Empty State
export const NoChaptersEmptyState: React.FC<{
  onCreateChapter: () => void;
  onOpenPlanning: () => void;
}> = ({ onCreateChapter, onOpenPlanning }) => (
  <EmptyState
    icon={Edit3}
    title="Ready to Write?"
    description="Your story begins with the first chapter. Create one now and start bringing your ideas to life."
    primaryAction={{
      label: 'Write First Chapter',
      onClick: onCreateChapter,
      shortcut: ['⌘', 'N'],
    }}
    secondaryAction={{
      label: 'Plan Your Story',
      onClick: onOpenPlanning,
      shortcut: ['⌘', '3'],
    }}
    suggestions={[
      {
        icon: Lightbulb,
        title: 'Start with an outline',
        description: 'Plan your story structure and key plot points',
        onClick: onOpenPlanning,
      },
      {
        icon: Users,
        title: 'Create characters',
        description: 'Develop compelling characters and relationships',
        onClick: onOpenPlanning,
      },
      {
        icon: Play,
        title: 'Just start writing',
        description: 'Dive in with a simple first chapter',
        onClick: onCreateChapter,
      },
    ]}
  />
);

// No Characters Empty State
export const NoCharactersEmptyState: React.FC<{ onCreateCharacter: () => void }> = ({
  onCreateCharacter,
}) => (
  <EmptyState
    icon={Users}
    title="Bring Characters to Life"
    description="Great stories start with compelling characters. Create your first character and define their personality, goals, and relationships."
    primaryAction={{
      label: 'Create Character',
      onClick: onCreateCharacter,
    }}
    suggestions={[
      {
        icon: Users,
        title: 'Protagonist',
        description: 'Your main character driving the story forward',
        onClick: onCreateCharacter,
      },
      {
        icon: Users,
        title: 'Antagonist',
        description: 'The opposing force creating conflict',
        onClick: onCreateCharacter,
      },
      {
        icon: Users,
        title: 'Supporting Character',
        description: 'Characters who help develop your story',
        onClick: onCreateCharacter,
      },
    ]}
  />
);

// No Analytics Data Empty State
export const NoAnalyticsEmptyState: React.FC<{ onStartWriting: () => void }> = ({
  onStartWriting,
}) => (
  <EmptyState
    icon={BarChart3}
    title="Track Your Writing Journey"
    description="Your analytics will appear here once you start writing. Track word counts, writing streaks, and productivity insights."
    primaryAction={{
      label: 'Start Writing',
      onClick: onStartWriting,
      shortcut: ['⌘', '2'],
    }}
    suggestions={[
      {
        icon: Target,
        title: 'Set daily goals',
        description: 'Establish word count targets and deadlines',
        onClick: onStartWriting,
      },
      {
        icon: Calendar,
        title: 'Build a streak',
        description: 'Write consistently to track your progress',
        onClick: onStartWriting,
      },
      {
        icon: BarChart3,
        title: 'Monitor trends',
        description: 'See patterns in your writing productivity',
        onClick: onStartWriting,
      },
    ]}
  />
);

// Search Results Empty State
export const SearchEmptyState: React.FC<{ query: string; onClearSearch: () => void }> = ({
  query,
  onClearSearch,
}) => (
  <EmptyState
    icon={FileText}
    title={`No results for "${query}"`}
    description="Try adjusting your search terms or browse your content using the navigation menu."
    secondaryAction={{
      label: 'Clear Search',
      onClick: onClearSearch,
    }}
    suggestions={[
      {
        icon: Edit3,
        title: 'Browse chapters',
        description: 'View all your written content',
        onClick: onClearSearch,
      },
      {
        icon: Users,
        title: 'Check characters',
        description: 'Look through your character profiles',
        onClick: onClearSearch,
      },
      {
        icon: Lightbulb,
        title: 'Review planning',
        description: 'Browse your story outlines and notes',
        onClick: onClearSearch,
      },
    ]}
  />
);

// ==========================================
// LOADING EMPTY STATE
// ==========================================

export const LoadingEmptyState: React.FC<{ message?: string }> = ({
  message = 'Loading your content...',
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
    <div className="max-w-md">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{message}</h3>
      <p className="text-slate-600 dark:text-slate-400">This won't take long...</p>
    </div>
  </div>
);

// ==========================================
// ERROR EMPTY STATE
// ==========================================

export const ErrorEmptyState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
}> = ({
  title = 'Something went wrong',
  description = "We couldn't load your content. Please try again.",
  onRetry,
}) => (
  <EmptyState
    icon={FileText}
    title={title}
    description={description}
    primaryAction={
      onRetry
        ? {
            label: 'Try Again',
            onClick: onRetry,
          }
        : undefined
    }
    className="text-red-600 dark:text-red-400"
  />
);
