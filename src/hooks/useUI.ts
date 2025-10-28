import { createContext, useContext } from 'react';

/** UI Context with sidebar state */

export type UIContextValue = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  newProjectDialogOpen: boolean;
  openNewProjectDialog: () => void;
  closeNewProjectDialog: () => void;
};

export const UIContext = createContext<UIContextValue | undefined>(undefined);

/** Internal hook (pre-existing name) */
export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUI must be used within a UIContext.Provider');
  }
  return ctx;
}

export default useUI;
