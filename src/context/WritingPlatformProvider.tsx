import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define valid view types
export type View = 'dashboard' | 'writing' | 'timeline' | 'analysis';

// Context type definition
interface WritingPlatformContextType {
  activeView: View;
  setActiveView: (view: View) => void;
}

// Default context (to prevent undefined errors if accessed outside provider)
export const WritingPlatformContext = createContext<WritingPlatformContextType>({
  activeView: 'dashboard',
  setActiveView: () => {},
});

// Hook for easy context access
export const useWritingPlatform = () => useContext(WritingPlatformContext);

// Props for the provider
interface WritingPlatformProviderProps {
  children: ReactNode;
}

// The provider component
export const WritingPlatformProvider: React.FC<WritingPlatformProviderProps> = ({ children }) => {
  const [activeView, setActiveView] = useState<View>('dashboard');

  return (
    <WritingPlatformContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </WritingPlatformContext.Provider>
  );
};

// Add a default export so App.tsx can import it directly
export default WritingPlatformProvider;
