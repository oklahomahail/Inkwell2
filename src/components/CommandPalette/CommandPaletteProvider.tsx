// src/components/CommandPalette/CommandPaletteProvider.tsx - Updated with Export Integration
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { useAppContext, View } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { storageService } from '@/services/storageService';
import { exportService } from '@/services/exportService';
import { generateId } from '@/utils/id';
import { ChapterStatus, SceneStatus, ExportFormat } from '@/types/writing';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType;
  shortcut?: string;
  category: 'navigation' | 'writing' | 'project' | 'ai' | 'settings' | 'export';
  action: () => void | Promise<void>;
  condition?: () => boolean;
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
  const { setView, claudeActions, currentProject, projects } = useAppContext();
  const { showToast } = useToast();
  const [state, setState] = useState<CommandPaletteState>({
    isOpen: false,
    query: '',
    selectedIndex: 0,
    commands: [],
  });

  // Initialize default commands
  useEffect(() => {
    const createNewChapter = async () => {
      if (!currentProject) {
        showToast('No project selected', 'error');
        return;
      }

      try {
        const existingChapters = await storageService.loadWritingChapters(currentProject.id);
        const nextChapterNumber = existingChapters.length + 1;

        const newChapter = {
          id: generateId('chapter'),
          title: `Chapter ${nextChapterNumber}`,
          order: existingChapters.length,
          scenes: [],
          totalWordCount: 0,
          status: ChapterStatus.DRAFT,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedChapters = [...existingChapters, newChapter];
        await storageService.saveWritingChapters(currentProject.id, updatedChapters);

        showToast(`Created ${newChapter.title}`, 'success');
        setView(View.Writing);
      } catch (error) {
        console.error('Failed to create chapter:', error);
        showToast('Failed to create chapter', 'error');
      }
    };

    const createNewScene = async () => {
      if (!currentProject) {
        showToast('No project selected', 'error');
        return;
      }

      try {
        const chapters = await storageService.loadWritingChapters(currentProject.id);

        if (chapters.length === 0) {
          await createNewChapter();
          return;
        }

        const targetChapter = chapters[0];
        if (!targetChapter) {
          showToast('No chapter available', 'error');
          return;
        }

        const newScene = {
          id: generateId('scene'),
          title: `Scene ${targetChapter.scenes.length + 1}`,
          content: '',
          wordCount: 0,
          status: SceneStatus.DRAFT,
          order: targetChapter.scenes.length,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await storageService.saveScene(currentProject.id, newScene);
        showToast(`Added new scene to ${targetChapter.title}`, 'success');
        setView(View.Writing);
      } catch (error) {
        console.error('Failed to create scene:', error);
        showToast('Failed to create scene', 'error');
      }
    };

    const showWordCount = async () => {
      if (!currentProject) {
        showToast('No project selected', 'error');
        return;
      }

      try {
        const chapters = await storageService.loadWritingChapters(currentProject.id);
        const totalWords = chapters.reduce((total, chapter) => {
          return (
            total +
            chapter.scenes.reduce((chapterTotal, scene) => {
              return chapterTotal + (scene.wordCount || 0);
            }, 0)
          );
        }, 0);

        const chapterCount = chapters.length;
        const sceneCount = chapters.reduce((total, chapter) => total + chapter.scenes.length, 0);

        showToast(
          `📊 Project Stats: ${totalWords.toLocaleString()} words, ${chapterCount} chapters, ${sceneCount} scenes`,
          'success',
          5000,
        );
      } catch (error) {
        console.error('Failed to calculate word count:', error);
        showToast('Failed to calculate word count', 'error');
      }
    };

    // ✅ NEW: Enhanced export function that opens the dialog
    const openExportDialog = () => {
      if (!currentProject) {
        showToast('No project selected', 'error');
        return;
      }

      // Trigger the global export dialog
      const exportTrigger = document.getElementById('global-export-trigger');
      if (exportTrigger) {
        exportTrigger.click();
      } else {
        showToast('Export dialog not available', 'error');
      }
    };

    // ✅ NEW: Quick export functions for common formats
    const quickExportMarkdown = async () => {
      if (!currentProject) {
        showToast('No project selected', 'error');
        return;
      }

      try {
        showToast('Exporting to Markdown...', 'info');
        const result = await exportService.exportProject(currentProject.id, ExportFormat.MARKDOWN);

        if (result.success) {
          showToast(`Successfully exported ${result.filename}`, 'success');
        } else {
          showToast(`Export failed: ${result.error}`, 'error');
        }
      } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed', 'error');
      }
    };

    const quickExportPDF = async () => {
      if (!currentProject) {
        showToast('No project selected', 'error');
        return;
      }

      try {
        showToast('Opening PDF export...', 'info');
        const result = await exportService.exportProject(currentProject.id, ExportFormat.PDF);

        if (result.success) {
          showToast('PDF export window opened', 'success');
        } else {
          showToast(`Export failed: ${result.error}`, 'error');
        }
      } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed', 'error');
      }
    };

    const backupProject = async () => {
      if (!currentProject) {
        showToast('No project selected', 'error');
        return;
      }

      try {
        const chapters = await storageService.loadWritingChapters(currentProject.id);
        const backupData = {
          project: currentProject,
          chapters,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `${currentProject.name.replace(/[^a-z0-9]/gi, '_')}_backup_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        showToast('Project backup downloaded', 'success');
      } catch (error) {
        console.error('Failed to backup project:', error);
        showToast('Failed to create backup', 'error');
      }
    };

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

      // Writing commands
      {
        id: 'writing-new-chapter',
        label: 'New Chapter',
        description: 'Create a new chapter',
        category: 'writing',
        action: createNewChapter,
        condition: () => !!currentProject,
      },
      {
        id: 'writing-new-scene',
        label: 'New Scene',
        description: 'Add a new scene to current chapter',
        category: 'writing',
        action: createNewScene,
        condition: () => !!currentProject,
      },
      {
        id: 'writing-word-count',
        label: 'Show Word Count',
        description: 'Display current project word count and stats',
        category: 'writing',
        action: showWordCount,
        condition: () => !!currentProject,
      },

      // ✅ NEW: Enhanced Export Commands
      {
        id: 'export-dialog',
        label: 'Export Project...',
        description: 'Open export dialog with all format options',
        category: 'export',
        shortcut: '⌘⇧E',
        action: openExportDialog,
        condition: () => !!currentProject,
      },
      {
        id: 'export-markdown',
        label: 'Quick Export → Markdown',
        description: 'Instantly export as Markdown file',
        category: 'export',
        action: quickExportMarkdown,
        condition: () => !!currentProject,
      },
      {
        id: 'export-pdf',
        label: 'Quick Export → PDF',
        description: 'Instantly export as PDF file',
        category: 'export',
        action: quickExportPDF,
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
            claudeActions.toggleVisibility();
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
          claudeActions.toggleVisibility();
        },
        condition: () => !!currentProject,
      },

      // Project Management
      {
        id: 'project-backup',
        label: 'Backup Project',
        description: 'Create a backup of current project',
        category: 'project',
        action: backupProject,
        condition: () => !!currentProject,
      },
      {
        id: 'project-switch',
        label: 'Switch Project',
        description: 'Switch to a different project',
        category: 'project',
        action: () => {
          if (projects.length === 0) {
            showToast('No other projects available', 'error');
            return;
          }

          const projectList = projects
            .filter((p) => p.id !== currentProject?.id)
            .map((p, i) => `${i + 1}. ${p.name}`)
            .join('\n');

          if (projectList) {
            const choice = prompt(`Select project:\n${projectList}\n\nEnter number:`);
            const projectIndex = parseInt(choice || '0') - 1;
            const selectedProject = projects.filter((p) => p.id !== currentProject?.id)[
              projectIndex
            ];

            if (selectedProject) {
              showToast(`Switched to ${selectedProject.name}`, 'success');
              setView(View.Dashboard);
            } else {
              showToast('Invalid project selection', 'error');
            }
          }
        },
        condition: () => projects.length > 1,
      },

      // Quick actions
      {
        id: 'quick-save',
        label: 'Save All',
        description: 'Force save all changes',
        category: 'writing',
        shortcut: '⌘S',
        action: () => {
          showToast('All changes saved', 'success');
        },
        condition: () => !!currentProject,
      },
      {
        id: 'focus-mode',
        label: 'Toggle Focus Mode',
        description: 'Enter distraction-free writing mode',
        category: 'writing',
        shortcut: '⌘⇧F',
        action: () => {
          showToast('Focus mode toggled (feature coming soon)', 'success');
        },
        condition: () => !!currentProject,
      },

      // Settings & Help
      {
        id: 'help-shortcuts',
        label: 'Keyboard Shortcuts',
        description: 'View all keyboard shortcuts',
        category: 'settings',
        action: () => {
          const shortcuts = [
            '⌘K - Command Palette',
            '⌘1 - Dashboard',
            '⌘2 - Writing',
            '⌘3 - Timeline',
            '⌘4 - Analysis',
            '⌘, - Settings',
            '⌘S - Save All',
            '⌘⇧E - Export Dialog',
            '⌘⇧F - Focus Mode',
          ];
          alert(`Keyboard Shortcuts:\n\n${shortcuts.join('\n')}`);
        },
      },
      {
        id: 'help-about',
        label: 'About Inkwell',
        description: 'Information about this application',
        category: 'settings',
        action: () => {
          alert(
            'Inkwell - Local-first Fiction Writing Platform\nVersion 1.0.0\n\nBuilt with React, TypeScript, and Claude AI',
          );
        },
      },
    ];

    setState((prev) => ({
      ...prev,
      commands,
    }));
  }, [setView, claudeActions, currentProject, projects, showToast]);

  // Filter commands based on query and conditions
  const filteredCommands = state.commands.filter((command) => {
    if (command.condition && !command.condition()) {
      return false;
    }

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
      selectedIndex: 0,
    }));
  };

  const executeCommand = async (command: Command) => {
    try {
      await command.action();
      closePalette();
    } catch (error) {
      console.error('Failed to execute command:', error);
      showToast(`Failed to execute ${command.label}`, 'error');
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
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          openPalette();
        }
        return;
      }

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
