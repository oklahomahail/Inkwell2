// src/components/CommandPalette/CommandPaletteProvider.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAppContext, View } from '@/context/AppContext';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType;
  shortcut?: string;
  category: 'navigation' | 'writing' | 'project' | 'ai' | 'settings';
  action: () => void | Promise<void>;
  condition?: () => boolean; // Show command only if condition is true
}

interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  commands: Command[];
}

interface CommandPaletteContextValue {
  state: CommandPaletteState;
  openPalette: () => void;
  closePalette: () => void;
  setQuery: (query: string) => void;
  executeCommand: (command: Command) => void;
  registerCommand: (command: Command) => void;
  unregisterCommand: (commandId: string) => void;
  filteredCommands: Command[];
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export const useCommandPalette = () => {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
};

export const CommandPaletteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setView, claudeActions, currentProject } = useAppContext();
  const [state, setState] = useState<CommandPaletteState>({
    isOpen: false,
    query: '',
    selectedIndex: 0,
    commands: [],
  });

  // Initialize default commands
  useEffect(() => {
    // Define commands inside useEffect to avoid dependency issues
    const commands: Command[] = [
      // Navigation
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        description: 'View project overview and statistics',
        category: 'navigation',
        shortcut: '⌘1',
        action: () => setView(View.Dashboard),
      },
      {
        id: 'nav-writing',
        label: 'Go to Writing',
        description: 'Open the writing editor',
        category: 'navigation',
        shortcut: '⌘2',
        action: () => setView(View.Writing),
      },
      {
        id: 'nav-timeline',
        label: 'Go to Timeline',
        description: 'View story timeline and structure',
        category: 'navigation',
        shortcut: '⌘3',
        action: () => setView(View.Timeline),
      },
      {
        id: 'nav-analysis',
        label: 'Go to Analysis',
        description: 'View writing analytics and insights',
        category: 'navigation',
        shortcut: '⌘4',
        action: () => setView(View.Analysis),
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        description: 'Configure application settings',
        category: 'navigation',
        shortcut: '⌘,',
        action: () => setView(View.Settings),
      },

      // Writing
      {
        id: 'writing-new-chapter',
        label: 'New Chapter',
        description: 'Create a new chapter',
        category: 'writing',
        action: () => {
          // TODO: Implement new chapter creation
          console.log('Creating new chapter...');
        },
        condition: () => !!currentProject,
      },
      {
        id: 'writing-new-scene',
        label: 'New Scene',
        description: 'Add a new scene to current chapter',
        category: 'writing',
        action: () => {
          // TODO: Implement new scene creation
          console.log('Creating new scene...');
        },
        condition: () => !!currentProject,
      },
      {
        id: 'writing-word-count',
        label: 'Show Word Count',
        description: 'Display current project word count',
        category: 'writing',
        action: () => {
          // TODO: Show word count modal/toast
          console.log('Showing word count...');
        },
        condition: () => !!currentProject,
      },

      // AI Commands
      {
        id: 'ai-toggle',
        label: 'Toggle AI Assistant',
        description: 'Show/hide Claude writing assistant',
        category: 'ai',
        action: () => claudeActions.toggleVisibility(),
      },
      {
        id: 'ai-brainstorm',
        label: 'Brainstorm Ideas',
        description: 'Get creative ideas from AI',
        category: 'ai',
        action: async () => {
          const topic = prompt('What would you like to brainstorm about?');
          if (topic) {
            await claudeActions.brainstormIdeas(topic);
          }
        },
      },
      {
        id: 'ai-generate-plot',
        label: 'Generate Plot Ideas',
        description: 'Get plot suggestions from AI',
        category: 'ai',
        action: async () => {
          const context = currentProject?.description || 'a story';
          await claudeActions.generatePlotIdeas(context);
        },
        condition: () => !!currentProject,
      },

      // Project Management
      {
        id: 'project-export',
        label: 'Export Project',
        description: 'Export current project to various formats',
        category: 'project',
        action: () => {
          // TODO: Implement export functionality
          console.log('Exporting project...');
        },
        condition: () => !!currentProject,
      },
      {
        id: 'project-backup',
        label: 'Backup Project',
        description: 'Create a backup of current project',
        category: 'project',
        action: () => {
          // TODO: Implement backup functionality
          console.log('Creating backup...');
        },
        condition: () => !!currentProject,
      },
    ];

    setState((prev) => ({
      ...prev,
      commands,
    }));
  }, [setView, claudeActions, currentProject]);

  // Filter commands based on query and conditions
  const filteredCommands = state.commands.filter((command) => {
    // Check condition if exists
    if (command.condition && !command.condition()) {
      return false;
    }

    // Filter by query
    if (!state.query) return true;

    const query = state.query.toLowerCase();
    return (
      command.label.toLowerCase().includes(query) ||
      command.description?.toLowerCase().includes(query) ||
      command.category.toLowerCase().includes(query)
    );
  });

  const openPalette = () => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      query: '',
      selectedIndex: 0,
    }));
  };

  const closePalette = () => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      query: '',
      selectedIndex: 0,
    }));
  };

  const setQuery = (query: string) => {
    setState((prev) => ({
      ...prev,
      query,
      selectedIndex: 0, // Reset selection when query changes
    }));
  };

  const executeCommand = async (command: Command) => {
    try {
      await command.action();
      closePalette();
    } catch (error) {
      console.error('Failed to execute command:', error);
    }
  };

  const registerCommand = (command: Command) => {
    setState((prev) => ({
      ...prev,
      commands: [...prev.commands.filter((c) => c.id !== command.id), command],
    }));
  };

  const unregisterCommand = (commandId: string) => {
    setState((prev) => ({
      ...prev,
      commands: prev.commands.filter((c) => c.id !== commandId),
    }));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.isOpen) {
        // Global shortcut to open palette
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          openPalette();
        }
        return;
      }

      // Handle navigation within palette
      switch (e.key) {
        case 'Escape': {
          e.preventDefault();
          closePalette();
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          setState((prev) => ({
            ...prev,
            selectedIndex: Math.min(prev.selectedIndex + 1, filteredCommands.length - 1),
          }));
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setState((prev) => ({
            ...prev,
            selectedIndex: Math.max(prev.selectedIndex - 1, 0),
          }));
          break;
        }
        case 'Enter': {
          e.preventDefault();
          const selectedCommand = filteredCommands[state.selectedIndex];
          if (selectedCommand) {
            executeCommand(selectedCommand);
          }
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isOpen, state.selectedIndex, filteredCommands]);

  const contextValue: CommandPaletteContextValue = {
    state,
    openPalette,
    closePalette,
    setQuery,
    executeCommand,
    registerCommand,
    unregisterCommand,
    filteredCommands,
  };

  return (
    <CommandPaletteContext.Provider value={contextValue}>{children}</CommandPaletteContext.Provider>
  );
};
