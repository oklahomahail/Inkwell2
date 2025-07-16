import React from 'react';
import { Home, Moon, Sun, Edit3, Clock, BarChart3 } from 'lucide-react';
import { useWritingPlatform } from '../../context/WritingPlatformProvider';

const Navigation: React.FC = () => {
  const { activeView, setActiveView, currentProject, theme, setTheme } = useWritingPlatform();

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Writing Platform</h1>
          {currentProject && (
            <div className="flex items-center gap-4">
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 dark:text-gray-400">{currentProject.title}</span>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {[{ id: 'writing', icon: Edit3 }, { id: 'timeline', icon: Clock }, { id: 'analysis', icon: BarChart3 }].map(view => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id as 'dashboard' | 'writing' | 'timeline' | 'analysis')}
                    className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
                      activeView === view.id
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <view.icon size={14} />
                    {view.id.charAt(0).toUpperCase() + view.id.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentProject && (
            <button onClick={() => setActiveView('dashboard')} title="Dashboard">
              <Home size={18} />
            </button>
          )}
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Toggle Theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
