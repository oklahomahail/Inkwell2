// File: src/hooks/useUI.ts
import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface UIContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const defaultValue: UIContextValue = {
  sidebarCollapsed: false,
  toggleSidebar: () => undefined,
};

export const UIContext = createContext<UIContextValue>(defaultValue);

export function _useUI(): UIContextValue {
  return useContext(UIContext);
}

export function _UIProvider({
  children,
  initialCollapsed = false,
}: {
  children: ReactNode;
  initialCollapsed?: boolean;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(initialCollapsed);

  const value = useMemo<UIContextValue>(
    () => ({
      sidebarCollapsed,
      _toggleSidebar: () => setSidebarCollapsed((c) => !c),
    }),
    [sidebarCollapsed],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
