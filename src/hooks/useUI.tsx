import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

/** UI Context with sidebar state */

const SIDEBAR_COLLAPSED_KEY = 'inkwell_sidebar_collapsed';

export interface UIContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  newProjectDialogOpen: boolean;
  openNewProjectDialog: () => void;
  closeNewProjectDialog: () => void;
}

const defaultValue: UIContextValue = {
  sidebarCollapsed: false,
  toggleSidebar: () => undefined,
  newProjectDialogOpen: false,
  openNewProjectDialog: () => undefined,
  closeNewProjectDialog: () => undefined,
};

export const UIContext = createContext<UIContextValue>(defaultValue);

/** Internal hook (pre-existing name) */
export function useUI(): UIContextValue {
  return useContext(UIContext);
}

export function UIProvider({
  children,
  initialCollapsed = false,
}: {
  children: ReactNode;
  initialCollapsed?: boolean;
}) {
  // Hydrate from localStorage on mount
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return stored ? stored === 'true' : initialCollapsed;
    } catch {
      return initialCollapsed;
    }
  });
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch (error) {
      console.warn('[UIProvider] Failed to persist sidebar state:', error);
    }
  }, [sidebarCollapsed]);

  const value = useMemo(
    () => ({
      sidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed((c) => !c),
      newProjectDialogOpen,
      openNewProjectDialog: () => setNewProjectDialogOpen(true),
      closeNewProjectDialog: () => setNewProjectDialogOpen(false),
    }),
    [sidebarCollapsed, newProjectDialogOpen],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export default useUI;
