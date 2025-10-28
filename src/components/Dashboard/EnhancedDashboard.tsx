// src/components/Dashboard/EnhancedDashboard.tsx
import { PlusCircle, FileText, BarChart3, Target, Zap, Star, ArrowRight, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { InkwellFeather } from '@/components/icons';
import type { InkwellIconName } from '@/components/icons/InkwellFeather';
import NewProjectDialog from '@/components/Projects/NewProjectDialog';
import StatusChip from '@/components/Storage/StatusChip';
import { StorageHealthWidget } from '@/components/Storage/StorageHealthWidget';
import { useAppContext, View } from '@/context/AppContext';
import { useTourStartupFromUrl } from '@/hooks/useTourStartupFromUrl';
import { triggerOnProjectCreated } from '@/utils/tourTriggers';

const EnhancedDashboard: React.FC = () => {
  const { state, currentProject, addProject, setCurrentProjectId, dispatch } = useAppContext();
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [storageModalOpen, setStorageModalOpen] = useState(false);

  // Check for tour=start in URL and trigger tour if found
  useTourStartupFromUrl();

  // Handle URL parameter and keyboard shortcut for storage modal
  useEffect(() => {
    // Check for ?storage=1 in URL
    if (new URLSearchParams(window.location.search).get('storage') === '1') {
      setStorageModalOpen(true);
    }

    // Keyboard shortcut: Cmd/Ctrl + Shift + S
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setStorageModalOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openNewProjectDialog = () => {
    setNewProjectDialogOpen(true);
  };

  const _createNewProject = async () => {
    try {
      const newProject = {
        id: `project-${Date.now()}`,
        name: `New Story ${state.projects.length + 1}`,
        description: 'A new fiction project',
        content: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addProject({ ...newProject, chapters: [], characters: [], beatSheet: [] });
      setCurrentProjectId(newProject.id);

      // Fire tour trigger for project creation
      triggerOnProjectCreated(newProject.id);

      // Auto-navigate to writing after creation
      setTimeout(() => {
        dispatch({ type: 'SET_VIEW', payload: View.Writing });
      }, 500);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const navigateToView = (view: View) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProjectWordCount = (project: any) => {
    if (!project.content) return 0;
    return project.content.split(' ').filter((word: string) => word.length > 0).length;
  };

  const getDaysAgo = (timestamp: number) => {
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const quickActions = [
    {
      id: 'new-project',
      title: 'Create New Project',
      description: 'Start a fresh writing project with templates and structure',
      icon: PlusCircle,
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      action: () => setNewProjectDialogOpen(true),
    },
    {
      id: 'continue-writing',
      title: 'Continue Writing',
      description: 'Pick up where you left off in your current project',
      icon: FileText,
      color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      action: () => navigateToView(View.Writing),
      disabled: !currentProject,
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      description: 'Check your writing progress and statistics',
      icon: BarChart3,
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      action: () => navigateToView(View.Analysis),
    },
    {
      id: 'plan-story',
      title: 'Plan Your Story',
      description: 'Organize characters, plots, and story structure',
      icon: () => <InkwellFeather name={'planning' as InkwellIconName} size="sm" />,
      color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
      action: () => navigateToView(View.Planning),
    },
  ];

  // If no projects exist, show onboarding
  if (state.projects.length === 0) {
    return (
      <div className="enhanced-dashboard fade-in">
        <div className="max-w-4xl mx-auto text-center py-16">
          {/* Welcome Header */}
          <div className="mb-12">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <InkwellFeather name="writing" size="2xl" color="primary" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Welcome to Inkwell
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Your professional writing companion. Create compelling stories, track your progress,
              and achieve your writing goals with powerful tools designed for serious writers.
            </p>
          </div>

          {/* Getting Started */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">
              Let's get you started
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Create
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Start a new project with our guided setup
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">✍️</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Write</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Focus on your story with our distraction-free editor
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Track</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Monitor progress and celebrate milestones
                </p>
              </div>
            </div>
            <button
              onClick={openNewProjectDialog}
              className="btn btn-primary btn-lg"
              type="button"
              data-test="create-first-project"
              data-tour-id="create-project-button"
            >
              <PlusCircle className="w-5 h-5" />
              Create Your First Project
            </button>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Goal Tracking
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Set daily word count goals and track your writing streaks
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Smart Analytics
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Get insights into your writing patterns and productivity
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-dashboard fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <div className="flex items-center gap-3">
            <StatusChip onClick={() => setStorageModalOpen(true)} />
            <button
              onClick={openNewProjectDialog}
              className="btn btn-primary"
              type="button"
              data-test="new-project"
              data-tour-id="new-project-button"
            >
              <PlusCircle className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>
        <p className="text-base text-slate-600 dark:text-slate-400">
          Welcome back! Here's your writing overview and recent activity.
        </p>
      </div>

      {/* Storage Health Modal */}
      {storageModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setStorageModalOpen(false)}
          />
          <div className="relative z-10 w-[680px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Storage Health
              </h2>
              <button
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                onClick={() => setStorageModalOpen(false)}
                aria-label="Close storage health modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              Monitor your browser storage status, persistence, and quota usage. Press{' '}
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium dark:bg-slate-800">
                Cmd/Ctrl+Shift+S
              </kbd>{' '}
              to toggle this panel.
            </p>

            <StorageHealthWidget />
          </div>
        </div>
      )}

      {/* Current Project Highlight */}
      {currentProject && (
        <div className="card card-interactive mb-8" onClick={() => navigateToView(View.Writing)}>
          <div className="card-content">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <InkwellFeather name="writing" size="lg" color="primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">
                    {currentProject.name}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {currentProject.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Last updated {getDaysAgo(currentProject.updatedAt)}</span>
                    <span>•</span>
                    <span>{getProjectWordCount(currentProject)} words</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <span className="text-sm font-medium">Continue writing</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Project Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <div className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                  {getProjectWordCount(currentProject).toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">Total Words</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                  {currentProject.chapters?.length || 0}
                </div>
                <div className="text-xs text-slate-500">Chapters</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                  {currentProject.characters?.length || 0}
                </div>
                <div className="text-xs text-slate-500">Characters</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-green-600 dark:text-green-400 mb-1">
                  85%
                </div>
                <div className="text-xs text-slate-500">Progress</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                disabled={action.disabled}
                className={`card card-interactive text-left p-4 ${
                  action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Projects */}
      {state.projects.length > 1 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Recent Projects
            </h2>
            <button className="btn btn-ghost btn-sm">View All</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {state.projects
              .filter((project) => project.id !== currentProject?.id)
              .slice(0, 4)
              .map((project) => (
                <div
                  key={project.id}
                  className="card card-interactive"
                  onClick={() => setCurrentProjectId(project.id)}
                >
                  <div className="card-content">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatDate(project.updatedAt)}</span>
                      <span>{getProjectWordCount(project)} words</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Writing Streak & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Writing Streak
                </h3>
                <p className="text-xs text-slate-500">Keep the momentum going!</p>
              </div>
            </div>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">7</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Days in a row</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Today's Goal
                </h3>
                <p className="text-xs text-slate-500">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Progress</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  750 / 1,000 words
                </span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: '75%' }} />
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">250 words to go!</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Project Dialog */}
      <NewProjectDialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen} />
    </div>
  );
};

export default EnhancedDashboard;
