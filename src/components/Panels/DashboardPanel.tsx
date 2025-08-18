// src/components/Panels/DashboardPanel.tsx - Fixed imports
import React from 'react';
import { PlusCircle, FileText, Clock, BarChart3, BookOpen } from 'lucide-react';

// Import the context hook directly - make sure there's only one import
import { useAppContext } from '@/context/AppContext';

const DashboardPanel: React.FC = () => {
  const { state, currentProject, addProject, setCurrentProjectId } = useAppContext();

  const createNewProject = () => {
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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <button
          onClick={createNewProject}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Current Project */}
      {currentProject ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2">{currentProject.name}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{currentProject.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Word Count</p>
                <p className="font-semibold">{currentProject.content?.split(' ').length || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-semibold">
                  {new Date(currentProject.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Progress</p>
                <p className="font-semibold">In Progress</p>
              </div>
            </div>
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
          <button
            onClick={createNewProject}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <PlusCircle className="w-5 h-5" />
            Create Your First Project
          </button>
        </div>
      )}

      {/* Recent Projects */}
      {state.projects.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
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
