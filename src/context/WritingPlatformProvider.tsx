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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentProject, setCurrentProject] = useState<{ title: string } | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'writing' | 'timeline' | 'analysis'>('dashboard');

  // Sync theme with body class for Tailwind
  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    currentProject,
    setCurrentProject,
    activeView,
    setActiveView,
  };

  return (
    <WritingPlatformContext.Provider value={value}>
      {children}
    </WritingPlatformContext.Provider>
  );
};

export default WritingPlatformProvider;