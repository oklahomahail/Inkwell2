// src/components/Panels/DashboardPanel.tsx - Fixed imports
import { PlusCircle, FileText, Clock, BarChart3, BookOpen, Download } from 'lucide-react';
import React from 'react';

import ExportReadyBadge from '@/components/Badges/ExportReadyBadge';
import Welcome from '@/components/Dashboard/Welcome';
import { useAppContext } from '@/context/AppContext';
import { useChapterCount, useLastEditedChapter } from '@/context/ChaptersContext';
import { useAutostartSpotlight } from '@/hooks/useAutostartSpotlight';
import { useUI } from '@/hooks/useUI';

// Helper to format relative time
const timeAgo = (isoString: string): string => {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(isoString).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const DashboardPanel: React.FC = () => {
  const { state, currentProject, setCurrentProjectId } = useAppContext();
  const { openNewProjectDialog } = useUI();

  // Auto-start Spotlight Tour for first-time users
  useAutostartSpotlight();

  // Chapter statistics (with safe fallback for undefined projectId)
  const chapterCount = useChapterCount(currentProject?.id ?? '');
  const lastEditedChapter = useLastEditedChapter(currentProject?.id ?? '');

  return (
    <div className="space-y-8" data-tour="dashboard">
      {/* Branded welcome section */}
      <Welcome onCreateProject={openNewProjectDialog} hasProjects={state.projects.length > 0} />

      {/* Quick action header */}
      {state.projects.length > 0 && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Projects</h2>
          <button
            onClick={openNewProjectDialog}
            data-tour="create-project-btn"
            className="flex items-center gap-2 px-4 py-2 bg-inkwell-navy text-white rounded-lg hover:bg-inkwell-navy-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Project
          </button>
        </div>
      )}

      {/* Current Project */}
      {currentProject ? (
        <div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          data-spotlight-id="dashboard.welcome"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">{currentProject.name}</h2>
              <p className="text-gray-600 dark:text-gray-300">{currentProject.description}</p>
            </div>
            <ExportReadyBadge
              projectId={currentProject.id}
              variant="badge"
              onExportClick={() => {
                const btn = document.getElementById('global-export-trigger');
                if (btn) btn.click();
              }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Word Count</p>
                <p className="font-semibold dark:text-white">
                  {currentProject.content?.split(' ').length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chapters</p>
                <p className="font-semibold dark:text-white">{chapterCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Characters</p>
                <p className="font-semibold dark:text-white">
                  {currentProject.characters?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="font-semibold dark:text-white">
                  {new Date(currentProject.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Last Edited Chapter Info */}
          {lastEditedChapter && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Last Edited Chapter</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {lastEditedChapter.title}
                  </p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {timeAgo(lastEditedChapter.updatedAt)}
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                // Trigger the global export dialog
                const btn = document.getElementById('global-export-trigger');
                if (btn) btn.click();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Project
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
            No Project Selected
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create or select a project to start writing
          </p>
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 data-spotlight-id="dashboard.welcome" className="text-xl font-semibold">
              Welcome to Inkwell
            </h2>
            <p data-spotlight-id="dashboard.hint">Start by creating your first writing project</p>
            <button
              data-spotlight-id="dashboard.createProject"
              onClick={() => openNewProjectDialog()}
              className="mt-4 px-4 py-2 rounded bg-inkwell-gold text-slate-900"
            >
              Create Your First Project
            </button>
          </div>
        </div>
      )}

      {/* Recent Projects */}
      {state.projects.length > 0 && (
        <div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          data-tour="projects"
        >
          <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
          <div className="space-y-3">
            {state.projects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  currentProject?.id === project.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setCurrentProjectId(project.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {project.description}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPanel;
