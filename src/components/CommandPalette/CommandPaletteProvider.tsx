// src/components/CommandPalette/CommandPaletteProvider.tsx
import React, { useEffect, useState, type ReactNode } from 'react';

import { useAppContext, View } from '@/context/AppContext';
import {
  CommandPaletteContext,
  type CommandPaletteContextValue,
} from '@/context/CommandPaletteContext';
import { useToast } from '@/context/toast';
import { exportService } from '@/services/exportService';
import { storageService } from '@/services/storageService';
import { ChapterStatus, SceneStatus, ExportFormat, type Chapter } from '@/types/writing';
import { generateId } from '@/utils/id';

export type CommandCategory = 'navigation' | 'writing' | 'project' | 'ai' | 'settings' | 'export';
export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType;
  shortcut?: string;
  category: CommandCategory;
  action: () => void | Promise<void>;
  condition?: () => boolean;
}

interface State {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  commands: Command[];
}
export function useCommandPalette() {}
export const CommandPaletteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setView, claudeActions, currentProject, projects } = useAppContext();
  const { showToast } = useToast();

  const [state, setState] = useState<State>({
    isOpen: false,
    query: '',
    selectedIndex: 0,
    commands: [],
  });

  // --- commands ---
  const createNewChapter = async () => {
    if (!currentProject) return showToast('No project selected', 'error');
    try {
      const existing = await storageService.loadWritingChapters(currentProject.id);
      const newChapter = {
        id: generateId('chapter'),
        title: `Chapter ${existing.length + 1}`,
        order: existing.length,
        scenes: [],
        totalWordCount: 0,
        status: ChapterStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await storageService.saveWritingChapters(currentProject.id, [...existing, newChapter]);
      showToast(`Created ${newChapter.title}`, 'success');
      setView(View.Writing);
    } catch (e) {
      console.error(e);
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
      if (!chapters || chapters.length === 0) {
        await createNewChapter();
        return;
      }
      const target: Chapter | undefined = chapters[0];
      if (!target) {
        showToast('No chapter available', 'error');
        return;
      }
      const nextSceneNumber = (target.scenes?.length ?? 0) + 1;
      const newScene = {
        id: generateId('scene'),
        title: `Scene ${nextSceneNumber}`,
        content: '',
        wordCount: 0,
        status: SceneStatus.DRAFT,
        order: nextSceneNumber - 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await storageService.saveScene(currentProject.id, newScene);
      showToast(`Added new scene to ${target.title}`, 'success');
      setView(View.Writing);
    } catch (e) {
      console.error(e);
      showToast('Failed to create scene', 'error');
    }
  };

  const showWordCount = async () => {
    if (!currentProject) return showToast('No project selected', 'error');
    try {
      const chapters = await storageService.loadWritingChapters(currentProject.id);
      const totalWords = chapters.reduce(
        (t, ch) => t + ch.scenes.reduce((ct, s) => ct + (s.wordCount || 0), 0),
        0,
      );
      const chapterCount = chapters.length;
      const sceneCount = chapters.reduce((t, ch) => t + ch.scenes.length, 0);
      showToast(
        `📊 Project Stats: ${totalWords.toLocaleString()} words, ${chapterCount} chapters, ${sceneCount} scenes`,
        'success',
        5000,
      );
    } catch (e) {
      console.error(e);
      showToast('Failed to calculate word count', 'error');
    }
  };

  const openExportDialog = () => {
    if (!currentProject) return showToast('No project selected', 'error');
    const btn = document.getElementById('global-export-trigger');
    if (btn) btn.click();
    else showToast('Export dialog not available', 'error');
  };

  const quickExportMarkdown = async () => {
    if (!currentProject) return showToast('No project selected', 'error');
    try {
      showToast('Exporting to Markdown...', 'info');
      const res = await exportService.exportProject(currentProject.id, ExportFormat.MARKDOWN);
      res.success
        ? showToast(`Successfully exported ${res.filename}`, 'success')
        : showToast(`Export failed: ${res.error}`, 'error');
    } catch (e) {
      console.error(e);
      showToast('Export failed', 'error');
    }
  };

  const quickExportPDF = async () => {
    if (!currentProject) return showToast('No project selected', 'error');
    try {
      showToast('Opening PDF export...', 'info');
      const res = await exportService.exportProject(currentProject.id, ExportFormat.PDF);
      res.success
        ? showToast('PDF export window opened', 'success')
        : showToast(`Export failed: ${res.error}`, 'error');
    } catch (e) {
      console.error(e);
      showToast('Export failed', 'error');
    }
  };

  const backupProject = async () => {
    if (!currentProject) return showToast('No project selected', 'error');
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
      const name = `${currentProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_backup_${
        new Date().toISOString().split('T')[0]
      }.json`;
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = name;
      a.click();
      showToast('Project backup downloaded', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to create backup', 'error');
    }
  };

  // Build commands when deps change
  useEffect(() => {
    const cmds: Command[] = [
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
          const ctx = currentProject?.description || 'a story';
          await claudeActions.generatePlotIdeas(ctx);
          claudeActions.toggleVisibility();
        },
        condition: () => !!currentProject,
      },

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
          if (projects.length === 0) return showToast('No other projects available', 'error');
          const others = projects.filter((p) => p.id !== currentProject?.id);
          const projectList = others.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
          if (!projectList) return;
          const choice = prompt(`Select project:\n${projectList}\n\nEnter number:`);
          const idx = parseInt(choice || '0', 10) - 1;
          const selected = others[idx];
          if (selected) {
            showToast(`Switched to ${selected.name}`, 'success');
            setView(View.Dashboard);
          } else {
            showToast('Invalid project selection', 'error');
          }
        },
        condition: () => projects.length > 1,
      },

      {
        id: 'quick-save',
        label: 'Save All',
        description: 'Force save all changes',
        category: 'writing',
        shortcut: '⌘S',
        action: () => showToast('All changes saved', 'success'),
        condition: () => !!currentProject,
      },
      {
        id: 'focus-mode',
        label: 'Toggle Focus Mode',
        description: 'Enter distraction-free writing mode',
        category: 'writing',
        shortcut: '⌘⇧F',
        action: () => showToast('Focus mode toggled (feature coming soon)', 'success'),
        condition: () => !!currentProject,
      },

      {
        id: 'help-shortcuts',
        label: 'Keyboard Shortcuts',
        description: 'View all keyboard shortcuts',
        category: 'settings',
        action: () =>
          alert(
            [
              '⌘K - Command Palette',
              '⌘1 - Dashboard',
              '⌘2 - Writing',
              '⌘3 - Timeline',
              '⌘4 - Analysis',
              '⌘, - Settings',
              '⌘S - Save All',
              '⌘⇧E - Export Dialog',
              '⌘⇧F - Focus Mode',
            ].join('\n'),
          ),
      },
      {
        id: 'help-about',
        label: 'About Inkwell',
        description: 'Information about this application',
        category: 'settings',
        action: () =>
          alert(
            'Inkwell - Local-first Fiction Writing Platform\nVersion 1.0.0\n\nBuilt with React, TypeScript, and Claude AI',
          ),
      },
    ];

    setState((prev) => ({ ...prev, commands: cmds }));
  }, [setView, claudeActions, currentProject, projects, showToast]);

  // ---- filtering ----
  const filteredCommands = state.commands.filter((c) => {
    if (c.condition && !c.condition()) return false;
    if (!state.query) return true;
    const q = state.query.toLowerCase();
    return (
      c.label.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  // ---- API expected by context ----
  const open = () => setState((p) => ({ ...p, isOpen: true, query: '', selectedIndex: 0 }));
  const close = () => setState((p) => ({ ...p, isOpen: false, query: '', selectedIndex: 0 }));
  const toggle = () =>
    setState((p) => ({ ...p, isOpen: !p.isOpen, selectedIndex: p.isOpen ? 0 : p.selectedIndex }));

  const setQuery = (query: string) =>
    setState((p) => ({
      ...p,
      query,
      selectedIndex: 0,
    }));

  const executeCommand = async (cmd: Command) => {
    try {
      await cmd.action();
      close();
    } catch (e) {
      console.error('Failed to execute command:', e);
      showToast(`Failed to execute ${cmd.label}`, 'error');
    }
  };

  const registerCommand = (cmd: Command) =>
    setState((p) => ({ ...p, commands: [...p.commands.filter((c) => c.id !== cmd.id), cmd] }));

  const unregisterCommand = (id: string) =>
    setState((p) => ({ ...p, commands: p.commands.filter((c) => c.id !== id) }));

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!state.isOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          open();
        }
        return;
      }
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setState((p) => ({
            ...p,
            selectedIndex: Math.min(p.selectedIndex + 1, filteredCommands.length - 1),
          }));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setState((p) => ({
            ...p,
            selectedIndex: Math.max(p.selectedIndex - 1, 0),
          }));
          break;
        case 'Enter': {
          e.preventDefault();
          const sel = filteredCommands[state.selectedIndex];
          if (sel) executeCommand(sel);
          break;
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state.isOpen, state.selectedIndex, filteredCommands]);

  // --- build the context payload ONCE ---
  const ctx: CommandPaletteContextValue = {
    isOpen: state.isOpen,
    query: state.query,
    selectedIndex: state.selectedIndex,
    open,
    close,
    toggle,
    setQuery,
    executeCommand,
    registerCommand,
    unregisterCommand,
    filteredCommands,
  };

  return <CommandPaletteContext.Provider value={ctx}>{children}</CommandPaletteContext.Provider>;
};
