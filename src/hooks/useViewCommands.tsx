// src/hooks/useViewCommands.ts
import { useEffect } from 'react';
import { useCommandPalette } from '@/components/CommandPalette/CommandPaletteProvider';
import { useAppContext, View } from '@/context/AppContext';

export const useViewCommands = () => {
  const { setView } = useAppContext();
  const { registerCommand, unregisterCommand } = useCommandPalette();

  useEffect(() => {
    // Register view navigation commands
    const viewCommands = [
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        description: 'View project overview and statistics',
        category: 'navigation' as const,
        shortcut: '⌘1',
        action: () => setView(View.Dashboard),
      },
      {
        id: 'nav-writing',
        label: 'Go to Writing',
        description: 'Open the writing editor',
        category: 'navigation' as const,
        shortcut: '⌘2',
        action: () => setView(View.Writing),
      },
      {
        id: 'nav-timeline',
        label: 'Go to Timeline',
        description: 'View story timeline and structure',
        category: 'navigation' as const,
        shortcut: '⌘3',
        action: () => setView(View.Timeline),
      },
      {
        id: 'nav-analysis',
        label: 'Go to Analysis',
        description: 'View writing analytics and insights',
        category: 'navigation' as const,
        shortcut: '⌘4',
        action: () => setView(View.Analysis),
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        description: 'Configure application settings',
        category: 'navigation' as const,
        shortcut: '⌘,',
        action: () => setView(View.Settings),
      },
    ];

    // Register all commands
    viewCommands.forEach(registerCommand);

    // Cleanup on unmount
    return () => {
      viewCommands.forEach((cmd) => unregisterCommand(cmd.id));
    };
  }, [setView, registerCommand, unregisterCommand]);

  // Register global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setView(View.Dashboard);
            break;
          case '2':
            e.preventDefault();
            setView(View.Writing);
            break;
          case '3':
            e.preventDefault();
            setView(View.Timeline);
            break;
          case '4':
            e.preventDefault();
            setView(View.Analysis);
            break;
          case ',':
            e.preventDefault();
            setView(View.Settings);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setView]);
};
