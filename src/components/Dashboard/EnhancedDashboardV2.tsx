// src/components/Dashboard/EnhancedDashboardV2.tsx
import {
  PlusCircle,
  FileText,
  BarChart3,
  BookOpen,
  Target,
  Zap,
  ArrowRight,
  Grid,
  Lightbulb,
} from 'lucide-react';
import React, { useState } from 'react';

import EnhancedProjectBrowser from '@/components/ProjectBrowser/EnhancedProjectBrowser';
import ProjectInsights from '@/components/ProjectInsights/ProjectInsights';
import TemplateSelector from '@/components/ProjectTemplates/TemplateSelector';
import { useAppContext, View } from '@/context/AppContext';

const EnhancedDashboardV2: React.FC = () => {
  const { state, currentProject, addProject, setCurrentProjectId, dispatch } = useAppContext();
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'projects' | 'insights'>('projects');

  const createNewProject = async () => {
    setIsCreatingProject(true);

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

      // Auto-navigate to writing after creation
      setTimeout(() => {
        dispatch({ type: 'SET_VIEW', payload: View.Writing });
      }, 500);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const navigateToView = (view: View) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  // If no projects exist, show onboarding
  if (state.projects.length === 0) {
    return (
      <div className="enhanced-dashboard fade-in">
        <div className="max-w-4xl mx-auto text-center py-16">
          {/* Welcome Header */}
          <div className="mb-12">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-primary-600 dark:text-primary-400" />
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

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={createNewProject}
                disabled={isCreatingProject}
                className="btn btn-primary btn-lg"
              >
                {isCreatingProject ? (
                  <>
                    <div className="loading w-5 h-5" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    Create Your First Project
                  </>
                )}
              </button>
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="btn btn-secondary btn-lg"
              >
                <FileText className="w-5 h-5" />
                Use Template
              </button>
            </div>
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

        {/* Template Selector Modal */}
        <TemplateSelector
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          onSelect={(templateId) => {
            console.log('Selected template:', templateId);
          }}
        />
      </div>
    );
  }

  // Main dashboard with projects
  return (
    <div className="enhanced-dashboard fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Welcome back! Here's your writing overview and project library.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowTemplateSelector(true)} className="btn btn-secondary">
              <FileText className="w-4 h-4" />
              From Template
            </button>
            <button
              onClick={createNewProject}
              disabled={isCreatingProject}
              className="btn btn-primary"
            >
              {isCreatingProject ? (
                <>
                  <div className="loading w-4 h-4" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  New Project
                </>
              )}
            </button>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('projects')}
            className={`btn btn-sm ${viewMode === 'projects' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Grid className="w-4 h-4" />
            Projects
          </button>
          <button
            onClick={() => setViewMode('insights')}
            className={`btn btn-sm ${viewMode === 'insights' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Insights
          </button>
        </div>
      </div>

      {/* Current Project Quick Access */}
      {currentProject && viewMode === 'projects' && (
        <div className="card card-interactive mb-8" onClick={() => navigateToView(View.Writing)}>
          <div className="card-content">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                    Currently Working On
                  </h2>
                  <h3 className="text-lg text-slate-700 dark:text-slate-300 mb-2">
                    {currentProject.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {currentProject.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <span className="text-sm font-medium">Continue writing</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Project Quick Stats */}
            <ProjectInsights compact />
          </div>
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'insights' ? (
        <ProjectInsights />
      ) : (
        <div>
          <EnhancedProjectBrowser />

          {/* Helpful Tips */}
          <div className="mt-8 card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <div className="card-content">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Project Management Tips
                  </h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Use tags to organize projects by theme, status, or priority</li>
                    <li>• Star your favorites for quick access to important projects</li>
                    <li>
                      • Right-click any project for quick actions like duplicate, rename, or export
                    </li>
                    <li>• Use the search to find projects by content, not just titles</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={(templateId) => {
          console.log('Selected template:', templateId);
        }}
      />
    </div>
  );
};

export default EnhancedDashboardV2;
