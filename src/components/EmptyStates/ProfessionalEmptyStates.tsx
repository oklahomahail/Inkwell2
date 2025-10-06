// src/components/EmptyStates/ProfessionalEmptyStates.tsx
import {
  BookOpen,
  FileText,
  Users,
  Calendar,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Coffee,
  Zap,
  TrendingUp,
} from 'lucide-react';
import React from 'react';

import { useTour, ONBOARDING_STEPS } from '@/components/Onboarding/TourProvider';
import { useAppContext, View } from '@/context/AppContext';
import { createSampleProject } from '@/data/sampleProject';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ElementType;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: React.ReactNode;
  tips?: string[];
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  actionButton,
  secondaryAction,
  illustration,
  tips,
  className = '',
}) => {
  return (
    <div className={`empty-state text-center py-16 max-w-2xl mx-auto ${className}`}>
      {/* Icon or Illustration */}
      {illustration || (
        <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
        </div>
      )}

      {/* Content */}
      <h2 className="text-heading-xl text-slate-900 dark:text-white mb-4">{title}</h2>
      <p className="text-body-lg text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto">
        {description}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className={`btn ${actionButton.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} btn-lg`}
          >
            {actionButton.label}
          </button>
        )}
        {secondaryAction && (
          <button onClick={secondaryAction.onClick} className="btn btn-ghost">
            {secondaryAction.label}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tips */}
      {tips && tips.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-heading-sm text-slate-900 dark:text-white">Pro Tips</h3>
          </div>
          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-body-sm text-slate-600 dark:text-slate-400"
              >
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Specific Empty States

export const NoProjectsEmptyState: React.FC = () => {
  const { addProject, setCurrentProjectId, dispatch } = useAppContext();
  const { startTour, setTourSteps, tourState, updateChecklist } = useTour();

  const createNewProject = async () => {
    const newProject = {
      id: `project-${Date.now()}`,
      name: 'My First Story',
      description: 'A new fiction project',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addProject({ ...newProject, chapters: [], characters: [], beatSheet: [] } as any);
    setCurrentProjectId(newProject.id);
    dispatch({ type: 'SET_VIEW', payload: View.Writing });

    // Update checklist - user created their first project!
    updateChecklist('createProject');

    // Start onboarding tour for first-time users
    if (tourState.isFirstTimeUser) {
      setTourSteps(ONBOARDING_STEPS);
      setTimeout(() => {
        startTour('full-onboarding');
      }, 1500); // Give time for view transition
    }
  };

  const createSampleProjectDemo = () => {
    const sampleProject = createSampleProject();
    // Convert domain Project to AppContext Project format
    const contextProject = {
      ...sampleProject,
      createdAt: sampleProject.createdAt.getTime(),
      updatedAt: sampleProject.updatedAt.getTime(),
      characters: [] as never[], // AppContext expects empty characters array
      beatSheet: [
        {
          id: 'opening-image',
          title: 'Opening Image',
          description:
            'Elena working alone in the library after hours, establishing the quiet, mysterious atmosphere.',
          type: 'plot',
          order: 1,
          completed: true,
          createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
        },
        {
          id: 'inciting-incident',
          title: 'The Books Come Alive',
          description:
            'At midnight, Elena discovers that fictional characters emerge from the books in the library.',
          type: 'plot',
          order: 2,
          completed: true,
          createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        },
      ] as never[],
    };
    addProject(contextProject);
    setCurrentProjectId(sampleProject.id);
    dispatch({ type: 'SET_VIEW', payload: View.Writing });

    // Update multiple checklist items since sample project has content
    updateChecklist('createProject');
    updateChecklist('addChapter');
    updateChecklist('addCharacter');
    updateChecklist('writeContent');

    // Optional: Show feature discovery instead of full tour for sample project
    if (tourState.isFirstTimeUser) {
      setTimeout(() => {
        startTour('feature-tour');
      }, 1000);
    }
  };

  const tips = [
    'Start with a simple idea - you can always expand later',
    'Take the interactive tour to learn key features',
    'Use the planning view to organize your story structure',
    'Set daily word count goals to maintain momentum',
    'Focus mode helps eliminate distractions while writing',
  ];

  return (
    <EmptyState
      title="Welcome to Inkwell"
      description="Transform your ideas into compelling stories with professional writing tools designed for serious writers."
      icon={BookOpen}
      actionButton={{
        label: 'Create Your First Project',
        onClick: createNewProject,
      }}
      secondaryAction={{
        label: 'Explore Sample Project',
        onClick: createSampleProjectDemo,
      }}
      tips={tips}
      illustration={
        <div className="mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-xs">✨</span>
            </div>
          </div>
        </div>
      }
    />
  );
};

export const NoProjectSelectedEmptyState: React.FC = () => {
  const { dispatch } = useAppContext();

  const goToDashboard = () => {
    dispatch({ type: 'SET_VIEW', payload: View.Dashboard });
  };

  return (
    <EmptyState
      title="No Project Selected"
      description="Select a project from your dashboard to start writing, or create a new project to begin your next story."
      icon={FileText}
      actionButton={{
        label: 'Go to Dashboard',
        onClick: goToDashboard,
      }}
      className="py-12"
    />
  );
};

export const NoChaptersEmptyState: React.FC = () => {
  const tips = [
    'Each chapter should advance your plot or develop characters',
    'Aim for consistent chapter lengths in your story',
    'Use chapter breaks to create natural pacing',
    'Consider ending chapters with hooks to keep readers engaged',
  ];

  return (
    <EmptyState
      title="No Chapters Yet"
      description="Structure your story by creating chapters. Each chapter helps organize your narrative and track your progress."
      icon={BookOpen}
      actionButton={{
        label: 'Create First Chapter',
        onClick: () => console.log('Create chapter'),
      }}
      tips={tips}
    />
  );
};

export const NoCharactersEmptyState: React.FC = () => {
  const tips = [
    'Start with your protagonist - who drives your story?',
    'Create character profiles with motivations and flaws',
    'Consider how characters change throughout your story',
    'Supporting characters should serve the plot or theme',
  ];

  return (
    <EmptyState
      title="No Characters Defined"
      description="Bring your story to life by creating memorable characters. Well-developed characters are the heart of great fiction."
      icon={Users}
      actionButton={{
        label: 'Add Your First Character',
        onClick: () => console.log('Add character'),
      }}
      tips={tips}
    />
  );
};

export const NoAnalyticsEmptyState: React.FC = () => {
  const { dispatch } = useAppContext();

  const startWriting = () => {
    dispatch({ type: 'SET_VIEW', payload: View.Writing });
  };

  return (
    <EmptyState
      title="No Writing Data Yet"
      description="Start writing to see detailed analytics about your progress, word count trends, and writing habits."
      icon={BarChart3}
      actionButton={{
        label: 'Start Writing',
        onClick: startWriting,
      }}
      illustration={
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
        </div>
      }
    />
  );
};

export const NoTimelineEmptyState: React.FC = () => {
  const tips = [
    'Set realistic deadlines for your writing milestones',
    'Break large goals into smaller, achievable tasks',
    'Track your daily writing streaks and celebrate wins',
    'Adjust timelines as needed - writing is a creative process',
  ];

  return (
    <EmptyState
      title="No Timeline Set"
      description="Create a writing schedule and set milestones to stay motivated and track your progress toward completion."
      icon={Calendar}
      actionButton={{
        label: 'Create Writing Timeline',
        onClick: () => console.log('Create timeline'),
      }}
      tips={tips}
    />
  );
};

export const WritingBreakEmptyState: React.FC = () => {
  const motivationalMessages = [
    'Every word counts, no matter how small',
    'The first draft is just the beginning',
    'Great stories are written one sentence at a time',
    'Your unique voice matters in this world',
    'Writing is rewriting - embrace the process',
  ];

  const randomMessage =
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return (
    <div className="text-center py-12 max-w-lg mx-auto">
      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <Coffee className="w-8 h-8 text-white" />
      </div>

      <h2 className="text-heading-lg text-slate-900 dark:text-white mb-3">Take a Creative Break</h2>

      <p className="text-body-base text-slate-600 dark:text-slate-400 mb-6">{randomMessage}</p>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3 justify-center text-blue-700 dark:text-blue-300">
          <Zap className="w-5 h-5" />
          <span className="text-body-sm font-medium">
            Ready to continue? Your story is waiting.
          </span>
        </div>
      </div>
    </div>
  );
};

// Loading State for Better UX
export const LoadingEmptyState: React.FC<{ message?: string }> = ({
  message = 'Loading your workspace...',
}) => {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin mx-auto mb-6" />
      <p className="text-body-base text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  );
};

// Error State
export const ErrorEmptyState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title = 'Something went wrong',
  message = 'We encountered an error loading your content. Please try again.',
  onRetry,
}) => {
  return (
    <div className="text-center py-16 max-w-lg mx-auto">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-2xl">😞</span>
      </div>

      <h2 className="text-heading-lg text-slate-900 dark:text-white mb-4">{title}</h2>

      <p className="text-body-base text-slate-600 dark:text-slate-400 mb-6">{message}</p>

      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary">
          Try Again
        </button>
      )}
    </div>
  );
};
