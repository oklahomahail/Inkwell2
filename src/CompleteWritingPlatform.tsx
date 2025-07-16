// 10. src/CompleteWritingPlatform.tsx
import React, { useState } from 'react';
import Navigation from './components/Navigation/Navigation';
import ProjectDashboard from './components/Dashboard/ProjectDashboard';
import WritingInterface from './components/Panels/WritingInterface';
import TimelineInterface from './components/Panels/TimelineInterface';
import AnalysisInterface from './components/Panels/AnalysisInterface';
import CreateProjectModal from './components/Modals/CreateProjectModal';

const CompleteWritingPlatform: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'writing' | 'timeline' | 'analysis'>('dashboard');
  const [currentProject, setCurrentProject] = useState<{ project: { title: string } } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    document.documentElement.classList.toggle('dark');
  };

  const handleProjectCreate = (title: string) => {
    setCurrentProject({ project: { title } });
    setActiveView('writing');
  };

  return (
    <div className={`${theme} min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white`}>
      <Navigation
        activeView={activeView}
        onViewChange={setActiveView}
        currentProject={currentProject}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <main className="p-6">
        {!currentProject && (
          <div className="text-center mt-20">
            <h2 className="text-2xl mb-4">Welcome to Your Writing Assistant</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Project
            </button>
          </div>
        )}

        {currentProject && activeView === 'dashboard' && <ProjectDashboard />}
        {currentProject && activeView === 'writing' && <WritingInterface />}
        {currentProject && activeView === 'timeline' && <TimelineInterface />}
        {currentProject && activeView === 'analysis' && <AnalysisInterface />}
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleProjectCreate}
      />
    </div>
  );
};

export default CompleteWritingPlatform;
