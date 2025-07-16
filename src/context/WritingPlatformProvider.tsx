// src/context/WritingPlatformProvider.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of the shared context state
interface WritingPlatformContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  currentProject: { title: string } | null;
  setCurrentProject: (project: { title: string } | null) => void;
  activeView: 'dashboard' | 'writing' | 'timeline' | 'analysis';
  setActiveView: (view: 'dashboard' | 'writing' | 'timeline' | 'analysis') => void;
  resetApp: () => void;
}

// Create the context with default undefined
const WritingPlatformContext = createContext<WritingPlatformContextType | undefined>(undefined);

// Custom hook for consuming the context
export const useWritingPlatform = (): WritingPlatformContextType => {
  const context = useContext(WritingPlatformContext);
  if (!context) {
    throw new Error('useWritingPlatform must be used within a WritingPlatformProvider');
  }
  return context;
};

// Provider component that wraps the app
interface WritingPlatformProviderProps {
  children: ReactNode;
}

const WritingPlatformProvider: React.FC<WritingPlatformProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const [currentProject, setCurrentProjectState] = useState<{ title: string } | null>(() => {
    const stored = localStorage.getItem('currentProject');
    return stored ? JSON.parse(stored) : null;
  });

  const [activeView, setActiveViewState] = useState<'dashboard' | 'writing' | 'timeline' | 'analysis'>(() => {
    return (localStorage.getItem('activeView') as 'dashboard' | 'writing' | 'timeline' | 'analysis') || 'dashboard';
  });

  // Persist theme
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
  }, [theme]);

  // Persist current project
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('currentProject', JSON.stringify(currentProject));
    } else {
      localStorage.removeItem('currentProject');
    }
  }, [currentProject]);

  // Persist active view
  useEffect(() => {
    localStorage.setItem('activeView', activeView);
  }, [activeView]);

  const setTheme = (newTheme: 'light' | 'dark') => setThemeState(newTheme);
  const setCurrentProject = (project: { title: string } | null) => setCurrentProjectState(project);
  const setActiveView = (view: 'dashboard' | 'writing' | 'timeline' | 'analysis') => setActiveViewState(view);

  const resetApp = () => {
    localStorage.clear();
    setThemeState('light');
    setCurrentProjectState(null);
    setActiveViewState('dashboard');
  };

  const value = {
    theme,
    setTheme,
    currentProject,
    setCurrentProject,
    activeView,
    setActiveView,
    resetApp,
  };

  return (
    <WritingPlatformContext.Provider value={value}>
      {children}
    </WritingPlatformContext.Provider>
  );
};

export default WritingPlatformProvider;
