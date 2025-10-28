// File: src/hooks/useUI.ts
import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(initialCollapsed);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState<boolean>(false);

  const value = useMemo<UIContextValue>(
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
