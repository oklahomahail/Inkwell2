import { createContext, useContext } from 'react';

/** UI Context with sidebar state */

export type UIContextValue = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

export const UIContext = createContext<UIContextValue | undefined>(undefined);

/** Internal hook (pre-existing name) */
export function _useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUI must be used within a UIContext.Provider');
  }
  return ctx;
}

/** ✅ Public alias expected by tests and components */
export const useUI = _useUI;

export type { UIContextValue };

export default useUI;
