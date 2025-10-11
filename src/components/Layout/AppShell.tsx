// AppShell.tsx - Main application shell component
import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

function _AppShell({ children }: AppShellProps) {
  return <div className="app-shell">{children}</div>;
}

export const AppShell = _AppShell;
