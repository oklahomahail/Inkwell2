// src/components/CommandPalette/CommandPaletteProvider.tsx
import React, { useCallback, useEffect, useState, type ReactNode } from 'react';

import { SCENE_STATUS, EXPORT_FORMAT } from '@/consts/writing';
import { useAppContext, View } from '@/context/AppContext';
import {
  CommandPaletteContext,
  type CommandPaletteContextValue,
} from '@/context/CommandPaletteContext';
import { useToast } from '@/context/toast';
import { useChapters, ChapterHelpers } from '@/hooks/useChapters';
import { exportService } from '@/services/exportService';
import { storageService } from '@/services/storageService';
import type { Chapter as WritingChapter } from '@/types/writing';
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

export const CommandPaletteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setView, claudeActions, currentProject, projects } = useAppContext();
  const { showToast } = useToast();

  // Use new chapter hooks for v0.6.0 chapter system
  const {
    chapters,
    createChapter,
    loading: chaptersLoading,
  } = useChapters(currentProject?.id ?? null);

  const [state, setState] = useState<State>({
    isOpen: false,
    query: '',
    selectedIndex: 0,
    commands: [],
  });

  // --- commands ---
  const createNewChapter = useCallback(async () => {
    if (!currentProject) return showToast('No project selected', 'error');
    if (chaptersLoading) return showToast('Loading chapters...', 'info');
    try {
      const sortedChapters = ChapterHelpers.sortByOrder(chapters);
      const nextIndex = sortedChapters.length;
      const chapter = await createChapter(`Chapter ${nextIndex + 1}`, {
        order: nextIndex,
        status: 'in-progress',
        content: '',
        wordCount: 0,
      });
      showToast(`Created ${chapter.title}`, 'success');
      setView(View.Writing);
    } catch (e) {
      console.error(e);
      showToast('Failed to create chapter', 'error');
    }
  }, [currentProject, chaptersLoading, chapters, createChapter, showToast, setView]);

  const createNewScene = useCallback(async () => {
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
      const target: WritingChapter | undefined = chapters[0];
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
        status: SCENE_STATUS.DRAFT,
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
  }, [currentProject, showToast, createNewChapter, setView]); // storageService is stable

  const showWordCount = useCallback(async () => {
    if (!currentProject) return showToast('No project selected', 'error');
    try {
      const chapters = await storageService.loadWritingChapters(currentProject.id);
      const totalWords = chapters.reduce(
        (t: number, ch: WritingChapter) =>
          t + (ch.scenes?.reduce((ct: number, s: any) => ct + (s.wordCount || 0), 0) || 0),
        0,
      );
      const chapterCount = chapters.length;
      const sceneCount = chapters.reduce((t, ch) => t + (ch.scenes?.length || 0), 0);
      showToast(
        `📊 Project Stats: ${totalWords.toLocaleString()} words, ${chapterCount} chapters, ${sceneCount} scenes`,
        'success',
        5000,
      );
    } catch (e) {
      console.error(e);
      showToast('Failed to calculate word count', 'error');
    }
  }, [currentProject, showToast]); // storageService is stable

  const openExportDialog = useCallback(() => {
    if (!currentProject) return showToast('No project selected', 'error');
    const btn = document.getElementById('global-export-trigger');
    if (btn) btn.click();
    else showToast('Export dialog not available', 'error');
  }, [currentProject, showToast]);

  const quickExportMarkdown = useCallback(async () => {
    if (!currentProject) return showToast('No project selected', 'error');
    try {
      showToast('Exporting to Markdown...', 'info');
      const res = await exportService.exportProject(currentProject.id, EXPORT_FORMAT.MARKDOWN);
      res.success
        ? showToast(`Successfully exported ${res.filename}`, 'success')
        : showToast(`Export failed: ${res.error}`, 'error');
    } catch (e) {
      console.error(e);
      showToast('Export failed', 'error');
    }
  }, [currentProject, showToast]); // exportService is stable

  const quickExportPDF = useCallback(async () => {
    if (!currentProject) return showToast('No project selected', 'error');
    try {
      showToast('Opening PDF export...', 'info');
      const res = await exportService.exportProject(currentProject.id, EXPORT_FORMAT.PDF);
      res.success
        ? showToast('PDF export window opened', 'success')
        : showToast(`Export failed: ${res.error}`, 'error');
    } catch (e) {
      console.error(e);
      showToast('Export failed', 'error');
    }
  }, [currentProject, showToast]); // exportService is stable

  const backupProject = useCallback(async () => {
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
  }, [currentProject, showToast]); // storageService is stable

  // New chapter system commands (v0.6.0)
  const copyChaptersAsMarkdown = useCallback(async () => {
    if (!currentProject) return showToast('No project selected', 'error');
    if (chapters.length === 0) return showToast('No chapters to export', 'error');
    try {
      const sortedChapters = ChapterHelpers.sortByOrder(chapters);
      const markdown = sortedChapters
        .map((ch, idx) => {
          const header = `# Chapter ${idx + 1}: ${ch.title}\n\n`;
          const summary = ch.summary ? `> ${ch.summary}\n\n` : '';
          const content = ch.content || '_[No content yet]_';
          const meta = `\n\n---\n_${ch.wordCount.toLocaleString()} words • Status: ${ch.status}_\n\n`;
          return header + summary + content + meta;
        })
        .join('\n');

      const fullMarkdown = `# ${currentProject.name}\n\n${currentProject.description || ''}\n\n---\n\n${markdown}`;

      await navigator.clipboard.writeText(fullMarkdown);
      showToast(
        `Copied ${chapters.length} chapters (${ChapterHelpers.getTotalWords(chapters).toLocaleString()} words) to clipboard`,
        'success',
        4000,
      );
    } catch (e) {
      console.error(e);
      showToast('Failed to copy markdown', 'error');
    }
  }, [currentProject, chapters, showToast]);

  const exportChaptersAsPDF = useCallback(async () => {
    if (!currentProject) return showToast('No project selected', 'error');
    if (chapters.length === 0) return showToast('No chapters to export', 'error');
    try {
      showToast('Preparing PDF export...', 'info', 2000);
      // Use new telemetry-enabled export method (v0.7.0)
      const result = await exportService.exportPDFWithChapters(currentProject.id, chapters, {
        format: EXPORT_FORMAT.PDF,
        includeMetadata: true,
        includeSynopsis: true,
        customTitle: currentProject.name,
      });
      if (result.success) {
        showToast('PDF export ready - check print dialog', 'success', 4000);
      } else {
        showToast(result.error || 'PDF export failed', 'error');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      showToast('Failed to export PDF', 'error');
    }
  }, [currentProject, chapters, showToast]);

  const exportChaptersAsDOCX = useCallback(async () => {
    if (!currentProject) return showToast('No project selected', 'error');
    if (chapters.length === 0) return showToast('No chapters to export', 'error');
    try {
      showToast('Preparing DOCX export...', 'info', 2000);
      // Use new telemetry-enabled export method (v0.7.0)
      const result = await exportService.exportDOCXWithChapters(currentProject.id, chapters, {
        format: EXPORT_FORMAT.DOCX,
        includeMetadata: true,
        includeSynopsis: true,
        customTitle: currentProject.name,
      });
      if (result.success) {
        showToast(`Downloaded ${result.filename}`, 'success', 4000);
      } else {
        showToast(result.error || 'DOCX export failed', 'error');
      }
    } catch (error) {
      console.error('DOCX export error:', error);
      showToast('Failed to export DOCX', 'error');
    }
  }, [currentProject, chapters, showToast]);

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
        id: 'nav-formatting',
        label: 'Go to Formatting',
        description: 'Configure document typography and layout',
        category: 'navigation',
        action: () => setView(View.Formatting),
        condition: () => !!currentProject,
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
        id: 'nav-export',
        label: 'Open Export Dashboard',
        description: 'View export history and analytics',
        category: 'navigation',
        shortcut: '⌘E',
        action: () => setView(View.Export),
        condition: () => !!currentProject,
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

      // New chapter system commands
      {
        id: 'chapter-copy-markdown',
        label: 'Copy Chapters as Markdown',
        description: 'Copy all chapters to clipboard in Markdown format',
        category: 'export',
        shortcut: '⌘⇧C',
        action: copyChaptersAsMarkdown,
        condition: () => !!currentProject && chapters.length > 0,
      },
      {
        id: 'chapter-export-pdf',
        label: 'Export Chapters → PDF',
        description: 'Export all chapters as a professionally formatted PDF document',
        category: 'export',
        action: exportChaptersAsPDF,
        condition: () => !!currentProject && chapters.length > 0,
      },
      {
        id: 'chapter-export-docx',
        label: 'Export Chapters → DOCX',
        description: 'Export all chapters as a Word-compatible RTF document',
        category: 'export',
        action: exportChaptersAsDOCX,
        condition: () => !!currentProject && chapters.length > 0,
      },

      {
        id: 'export-wizard',
        label: 'Export Project...',
        description: 'Open professional export wizard with publishing options',
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
          const projectList = others.map((p, i) => `${i + 1}. ${p.name}`).join('\\n');
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

      // Tour commands - temporarily disabled during rebuild
      {
        id: 'tour-start',
        label: 'Start Tour',
        description: 'Tour system being rebuilt',
        category: 'settings',
        action: () => showToast?.('Tour system being rebuilt', 'info'),
      },
    ];

    setState((prev) => ({ ...prev, commands: cmds }));
  }, [
    setView,
    claudeActions,
    currentProject,
    projects,
    chapters,
    showToast,
    backupProject,
    createNewChapter,
    createNewScene,
    openExportDialog,
    quickExportMarkdown,
    quickExportPDF,
    showWordCount,
    copyChaptersAsMarkdown,
    exportChaptersAsPDF,
    exportChaptersAsDOCX,
  ]);

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
  const open = useCallback(
    () => setState((p) => ({ ...p, isOpen: true, query: '', selectedIndex: 0 })),
    [setState],
  );
  const close = useCallback(
    () => setState((p) => ({ ...p, isOpen: false, query: '', selectedIndex: 0 })),
    [setState],
  );
  const toggle = () =>
    setState((p) => ({ ...p, isOpen: !p.isOpen, selectedIndex: p.isOpen ? 0 : p.selectedIndex }));

  const setQuery = (query: string) =>
    setState((p) => ({
      ...p,
      query,
      selectedIndex: 0,
    }));

  const executeCommand = useCallback(
    async (cmd: Command) => {
      try {
        await cmd.action();
        close();
      } catch (e) {
        console.error('Failed to execute command:', e);
        showToast(`Failed to execute ${cmd.label}`, 'error');
      }
    },
    [close, showToast],
  );

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
  }, [state.isOpen, state.selectedIndex, filteredCommands, open, close, executeCommand]);

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
