// src/hooks/useCommands.ts
import { useMemo } from 'react';
import { useAppContext, View } from '@/context/AppContext';
import { Command } from '@/types/commands';
import { useToast } from '@/context/ToastContext';

export function useCommands(
  selectedText?: string,
  onCommandExecute?: (commandId: string) => void,
): Command[] {
  const {
    state,
    setView,
    addProject,
    updateProject,
    deleteProject,
    setCurrentProjectId,
    currentProject,
    claudeActions,
    setTheme,
  } = useAppContext();

  const { showToast } = useToast();

  return useMemo(() => {
    const commands: Command[] = [
      // ========================================
      // NAVIGATION COMMANDS
      // ========================================
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        description: 'Switch to project dashboard and overview',
        icon: '🏠',
        category: 'navigation',
        keywords: ['dashboard', 'home', 'projects', 'overview', 'stats'],
        shortcut: 'Cmd+1',
        action: () => {
          setView(View.Dashboard);
          showToast('Switched to Dashboard', 'info');
          onCommandExecute?.('nav-dashboard');
        },
      },
      {
        id: 'nav-writing',
        label: 'Go to Writing',
        description: 'Switch to writing panel and text editor',
        icon: '✍️',
        category: 'navigation',
        keywords: ['writing', 'editor', 'compose', 'write', 'text'],
        shortcut: 'Cmd+2',
        action: () => {
          setView(View.Writing);
          showToast('Switched to Writing', 'info');
          onCommandExecute?.('nav-writing');
        },
      },
      {
        id: 'nav-timeline',
        label: 'Go to Timeline',
        description: 'Switch to project timeline and progress tracking',
        icon: '📅',
        category: 'navigation',
        keywords: ['timeline', 'schedule', 'progress', 'calendar', 'planning'],
        shortcut: 'Cmd+3',
        action: () => {
          setView(View.Timeline);
          showToast('Switched to Timeline', 'info');
          onCommandExecute?.('nav-timeline');
        },
      },
      {
        id: 'nav-analysis',
        label: 'Go to Analysis',
        description: 'Switch to writing analytics and statistics',
        icon: '📊',
        category: 'navigation',
        keywords: ['analysis', 'stats', 'metrics', 'analytics', 'data', 'insights'],
        shortcut: 'Cmd+4',
        action: () => {
          setView(View.Analysis);
          showToast('Switched to Analysis', 'info');
          onCommandExecute?.('nav-analysis');
        },
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        description: 'Open application settings and preferences',
        icon: '⚙️',
        category: 'navigation',
        keywords: ['settings', 'preferences', 'config', 'options', 'setup'],
        shortcut: 'Cmd+,',
        action: () => {
          setView(View.Settings);
          showToast('Switched to Settings', 'info');
          onCommandExecute?.('nav-settings');
        },
      },

      // ========================================
      // PROJECT MANAGEMENT COMMANDS
      // ========================================
      {
        id: 'project-new',
        label: 'New Project',
        description: 'Create a new writing project',
        icon: '📝',
        category: 'project',
        keywords: ['new', 'create', 'project', 'start', 'begin'],
        shortcut: 'Cmd+N',
        action: () => {
          const newProject = {
            id: `project_${Date.now()}`,
            name: `New Project ${state.projects.length + 1}`,
            description: 'A new writing project',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          addProject({ ...newProject, chapters: [], characters: [], beatSheet: [] });
          setCurrentProjectId(newProject.id);
          setView(View.Writing);
          showToast(`Created project: ${newProject.name}`, 'success');
          onCommandExecute?.('project-new');
        },
      },
      {
        id: 'project-rename',
        label: 'Rename Current Project',
        description: currentProject
          ? `Rename "${currentProject.name}"`
          : 'Rename the current project',
        icon: '✏️',
        category: 'project',
        keywords: ['rename', 'edit', 'project', 'name', 'title'],
        enabled: !!currentProject,
        action: () => {
          if (!currentProject) return;

          const newName = prompt('Enter new project name:', currentProject.name);
          if (newName && newName.trim() && newName !== currentProject.name) {
            const updatedProject = {
              ...currentProject,
              name: newName.trim(),
              updatedAt: Date.now(),
            };
            updateProject(updatedProject);
            showToast(`Project renamed to: ${newName}`, 'success');
            onCommandExecute?.('project-rename');
          }
        },
      },
      {
        id: 'project-duplicate',
        label: 'Duplicate Current Project',
        description: currentProject
          ? `Duplicate "${currentProject.name}"`
          : 'Duplicate the current project',
        icon: '📋',
        category: 'project',
        keywords: ['duplicate', 'copy', 'clone', 'project'],
        enabled: !!currentProject,
        action: () => {
          if (!currentProject) return;

          const duplicatedProject = {
            ...currentProject,
            id: `project_${Date.now()}`,
            name: `${currentProject.name} (Copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          addProject(duplicatedProject);
          setCurrentProjectId(duplicatedProject.id);
          showToast(`Duplicated project: ${duplicatedProject.name}`, 'success');
          onCommandExecute?.('project-duplicate');
        },
      },
      {
        id: 'project-delete',
        label: 'Delete Current Project',
        description: currentProject
          ? `Delete "${currentProject.name}"`
          : 'Delete the current project',
        icon: '🗑️',
        category: 'project',
        keywords: ['delete', 'remove', 'project', 'destroy'],
        enabled: !!currentProject,
        action: () => {
          if (!currentProject) return;

          const confirmed = confirm(
            `Are you sure you want to delete "${currentProject.name}"? This cannot be undone.`,
          );
          if (confirmed) {
            deleteProject(currentProject.id);
            showToast(`Deleted project: ${currentProject.name}`, 'success');
            onCommandExecute?.('project-delete');
          }
        },
      },

      // ========================================
      // CLAUDE AI COMMANDS
      // ========================================
      {
        id: 'claude-toggle',
        label: 'Toggle Claude Assistant',
        description: 'Show or hide Claude AI panel',
        icon: '🤖',
        category: 'claude',
        keywords: ['claude', 'ai', 'assistant', 'toggle', 'show', 'hide'],
        shortcut: 'Cmd+Shift+K',
        action: () => {
          claudeActions.toggleVisibility();
          showToast('Toggled Claude Assistant', 'info');
          onCommandExecute?.('claude-toggle');
        },
      },
      {
        id: 'claude-clear',
        label: 'Clear Claude History',
        description: 'Clear conversation history with Claude',
        icon: '🗑️',
        category: 'claude',
        keywords: ['clear', 'history', 'reset', 'claude', 'conversation'],
        action: () => {
          const confirmed = confirm(
            'Are you sure you want to clear the Claude conversation history?',
          );
          if (confirmed) {
            claudeActions.clearMessages();
            showToast('Cleared Claude conversation history', 'success');
            onCommandExecute?.('claude-clear');
          }
        },
      },
      {
        id: 'claude-brainstorm-general',
        label: 'Brainstorm Ideas',
        description: 'Get creative ideas from Claude for your current project',
        icon: '💡',
        category: 'claude',
        keywords: ['brainstorm', 'ideas', 'creative', 'claude', 'inspiration'],
        action: async () => {
          try {
            const topic = currentProject?.name || 'creative writing';
            await claudeActions.brainstormIdeas(topic);
            showToast('Generated brainstorming ideas', 'success');
            onCommandExecute?.('claude-brainstorm');
          } catch (error) {
            showToast('Failed to generate ideas', 'error');
            console.error('Brainstorm error:', error);
          }
        },
      },

      // ========================================
      // WRITING COMMANDS
      // ========================================
      {
        id: 'writing-focus-mode',
        label: 'Toggle Focus Mode',
        description: 'Enter distraction-free writing mode',
        icon: '🎯',
        category: 'writing',
        keywords: ['focus', 'distraction-free', 'zen', 'writing', 'mode'],
        shortcut: 'Cmd+Shift+F',
        action: () => {
          // This would toggle a focus mode in your writing component
          showToast('Focus mode toggled', 'info');
          onCommandExecute?.('writing-focus');
        },
      },
      {
        id: 'writing-word-count',
        label: 'Show Word Count',
        description: 'Display detailed word count statistics',
        icon: '📊',
        category: 'writing',
        keywords: ['word', 'count', 'statistics', 'stats', 'writing'],
        action: () => {
          setView(View.Analysis);
          showToast('Showing word count statistics', 'info');
          onCommandExecute?.('writing-word-count');
        },
      },

      // ========================================
      // EXPORT COMMANDS
      // ========================================
      {
        id: 'export-markdown',
        label: 'Export as Markdown',
        description: 'Export current document as Markdown file',
        icon: '📄',
        category: 'export',
        keywords: ['export', 'markdown', 'md', 'download', 'save'],
        shortcut: 'Cmd+E',
        action: () => {
          // This would trigger your export functionality
          showToast('Exporting as Markdown...', 'info');
          onCommandExecute?.('export-markdown');
        },
      },
      {
        id: 'export-txt',
        label: 'Export as Text',
        description: 'Export current document as plain text file',
        icon: '📄',
        category: 'export',
        keywords: ['export', 'text', 'txt', 'plain', 'download'],
        action: () => {
          showToast('Exporting as text...', 'info');
          onCommandExecute?.('export-txt');
        },
      },
      {
        id: 'export-pdf',
        label: 'Export as PDF',
        description: 'Export current document as PDF file',
        icon: '📕',
        category: 'export',
        keywords: ['export', 'pdf', 'document', 'print'],
        action: () => {
          showToast('Exporting as PDF...', 'info');
          onCommandExecute?.('export-pdf');
        },
      },

      // ========================================
      // THEME AND UI COMMANDS
      // ========================================
      {
        id: 'theme-toggle',
        label: 'Toggle Dark/Light Mode',
        description: `Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`,
        icon: state.theme === 'dark' ? '☀️' : '🌙',
        category: 'navigation',
        keywords: ['theme', 'dark', 'light', 'mode', 'appearance'],
        shortcut: 'Cmd+Shift+L',
        action: () => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          setTheme(newTheme);
          showToast(`Switched to ${newTheme} mode`, 'info');
          onCommandExecute?.('theme-toggle');
        },
      },

      // ========================================
      // HELP AND INFO COMMANDS
      // ========================================
      {
        id: 'help-shortcuts',
        label: 'Show Keyboard Shortcuts',
        description: 'Display all available keyboard shortcuts',
        icon: '⌨️',
        category: 'navigation',
        keywords: ['help', 'shortcuts', 'keyboard', 'hotkeys', 'commands'],
        shortcut: 'Cmd+/',
        action: () => {
          // This could open a help modal or navigate to help
          showToast('Keyboard shortcuts help', 'info');
          onCommandExecute?.('help-shortcuts');
        },
      },
      {
        id: 'help-about',
        label: 'About Inkwell',
        description: 'Show information about Inkwell',
        icon: 'ℹ️',
        category: 'navigation',
        keywords: ['about', 'info', 'version', 'help', 'inkwell'],
        action: () => {
          alert('Inkwell - Your Creative Writing Companion\nVersion 1.0.0');
          onCommandExecute?.('help-about');
        },
      },
    ];

    // ========================================
    // CONDITIONAL COMMANDS (TEXT SELECTION)
    // ========================================
    if (selectedText && selectedText.trim().length > 0) {
      const textPreview =
        selectedText.length > 30 ? `"${selectedText.slice(0, 30)}..."` : `"${selectedText}"`;

      commands.push(
        {
          id: 'claude-improve-selection',
          label: 'Improve Selected Text',
          description: `Improve ${textPreview} with Claude AI`,
          icon: '✨',
          category: 'claude',
          keywords: ['improve', 'enhance', 'claude', 'selected', 'text', 'ai'],
          shortcut: 'Cmd+I',
          action: async () => {
            try {
              await claudeActions.improveText(selectedText);
              showToast('Improving selected text with Claude', 'info');
              onCommandExecute?.('claude-improve');
            } catch (error) {
              showToast('Failed to improve text', 'error');
              console.error('Improve text error:', error);
            }
          },
        },
        {
          id: 'claude-continue-selection',
          label: 'Continue from Selection',
          description: `Continue writing from ${textPreview}`,
          icon: '➡️',
          category: 'claude',
          keywords: ['continue', 'extend', 'claude', 'selected', 'writing'],
          shortcut: 'Cmd+Shift+C',
          action: async () => {
            try {
              await claudeActions.suggestContinuation(selectedText);
              showToast('Generating continuation with Claude', 'info');
              onCommandExecute?.('claude-continue');
            } catch (error) {
              showToast('Failed to continue text', 'error');
              console.error('Continue text error:', error);
            }
          },
        },
        {
          id: 'claude-analyze-selection',
          label: 'Analyze Writing Style',
          description: `Analyze the style of ${textPreview}`,
          icon: '🔍',
          category: 'claude',
          keywords: ['analyze', 'style', 'claude', 'selected', 'writing'],
          shortcut: 'Cmd+Shift+A',
          action: async () => {
            try {
              await claudeActions.analyzeWritingStyle(selectedText);
              showToast('Analyzing writing style with Claude', 'info');
              onCommandExecute?.('claude-analyze');
            } catch (error) {
              showToast('Failed to analyze text', 'error');
              console.error('Analyze text error:', error);
            }
          },
        },
        {
          id: 'claude-character-analysis',
          label: 'Analyze as Character',
          description: `Analyze ${textPreview} as character description`,
          icon: '👤',
          category: 'claude',
          keywords: ['character', 'analyze', 'claude', 'personality', 'development'],
          action: async () => {
            try {
              await claudeActions.analyzeCharacter(selectedText);
              showToast('Analyzing character with Claude', 'info');
              onCommandExecute?.('claude-character');
            } catch (error) {
              showToast('Failed to analyze character', 'error');
              console.error('Character analysis error:', error);
            }
          },
        },
      );
    }

    // ========================================
    // PROJECT-SPECIFIC COMMANDS
    // ========================================
    if (currentProject) {
      commands.push(
        {
          id: 'claude-character-ideas',
          label: 'Generate Character Ideas',
          description: `Character ideas for "${currentProject.name}"`,
          icon: '👥',
          category: 'claude',
          keywords: ['character', 'ideas', 'claude', 'generate', 'people'],
          action: async () => {
            try {
              const prompt = `Generate character ideas for a story titled "${currentProject.name}". ${currentProject.description ? `Context: ${currentProject.description}` : ''}`;
              await claudeActions.brainstormIdeas(prompt);
              showToast('Generating character ideas', 'info');
              onCommandExecute?.('claude-character-ideas');
            } catch (error) {
              showToast('Failed to generate character ideas', 'error');
              console.error('Character ideas error:', error);
            }
          },
        },
        {
          id: 'claude-plot-ideas',
          label: 'Generate Plot Ideas',
          description: `Plot developments for "${currentProject.name}"`,
          icon: '📖',
          category: 'claude',
          keywords: ['plot', 'ideas', 'claude', 'story', 'development'],
          action: async () => {
            try {
              const context = currentProject.description || currentProject.name;
              await claudeActions.generatePlotIdeas(context);
              showToast('Generating plot ideas', 'info');
              onCommandExecute?.('claude-plot-ideas');
            } catch (error) {
              showToast('Failed to generate plot ideas', 'error');
              console.error('Plot ideas error:', error);
            }
          },
        },
        {
          id: 'claude-world-building',
          label: 'World Building Ideas',
          description: `World building for "${currentProject.name}"`,
          icon: '🌍',
          category: 'claude',
          keywords: ['world', 'building', 'setting', 'environment', 'claude'],
          action: async () => {
            try {
              const prompt = `Generate world building ideas for "${currentProject.name}". Include settings, cultures, rules, and environmental details.`;
              await claudeActions.brainstormIdeas(prompt);
              showToast('Generating world building ideas', 'info');
              onCommandExecute?.('claude-world-building');
            } catch (error) {
              showToast('Failed to generate world building ideas', 'error');
              console.error('World building error:', error);
            }
          },
        },
      );
    }

    // ========================================
    // PROJECT SWITCHING COMMANDS
    // ========================================
    if (state.projects.length > 0) {
      // Add recent projects as quick-switch commands
      const recentProjects = state.projects.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

      recentProjects.forEach((project, index) => {
        commands.push({
          id: `switch-project-${project.id}`,
          label: `Switch to "${project.name}"`,
          description: project.description || 'Switch to this project',
          icon: project.id === currentProject?.id ? '📂' : '📁',
          category: 'project',
          keywords: ['switch', 'project', project.name.toLowerCase(), 'open'],
          shortcut: index < 5 ? `Cmd+${index + 1}` : undefined,
          enabled: project.id !== currentProject?.id,
          action: () => {
            setCurrentProjectId(project.id);
            setView(View.Writing);
            showToast(`Switched to project: ${project.name}`, 'success');
            onCommandExecute?.(`switch-project-${project.id}`);
          },
        });
      });
    }

    // Filter out disabled commands and return
    return commands.filter((cmd) => cmd.enabled !== false);
  }, [
    state,
    selectedText,
    currentProject,
    setView,
    addProject,
    updateProject,
    deleteProject,
    setCurrentProjectId,
    claudeActions,
    setTheme,
    showToast,
    onCommandExecute,
  ]);
}
