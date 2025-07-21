import React, { createContext, useContext, useState } from 'react';

export type View = 'dashboard' | 'writing' | 'timeline' | 'analysis';

interface WritingPlatformContextType {
  activeView: View;
  setActiveView: (view: View) => void;

  theme: 'light' | 'dark';
  toggleTheme: () => void;

  currentProject: string;
  setCurrentProject: (project: string) => void;
}

const WritingPlatformContext = createContext<WritingPlatformContextType | undefined>(undefined);

export const WritingPlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentProject, setCurrentProject] = useState<string>('My First Project');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <WritingPlatformContext.Provider
      value={{
        activeView,
        setActiveView,
        theme,
        toggleTheme,
        currentProject,
        setCurrentProject,
      }}
    >
      {children}
    </WritingPlatformContext.Provider>
  );
};

export const useWritingPlatform = (): WritingPlatformContextType => {
  const ctx = useContext(WritingPlatformContext);
  if (!ctx) throw new Error('useWritingPlatform must be used within a WritingPlatformProvider');
  return ctx;
};
export default WritingPlatformProvider;