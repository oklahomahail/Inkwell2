import { useMemo } from 'react';
import { Command } from '@/types/commands';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';

export function useCommands(
  selectedText?: string,
  onCommandExecute?: (commandId: string) => void
): Command[] {
  const { 
    state,
    setView, 
    addProject, 
    updateProject,
    currentProject, 
    claudeActions,
    setTheme
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
        description: 'Switch to project dashboard',
        icon: '🏠',
        category: 'navigation',
        keywords: ['dashboard', 'home', 'projects'],
        shortcut: 'Cmd+1',
        action: () => {
          setView('dashboard' as any);
          showToast('Switched to Dashboard', 'info');
          onCommandExecute?.('nav-dashboard');
        },
      },
      {
        id: 'nav-writing',
        label: 'Go to Writing',
        description: 'Switch to writing panel',
        icon: '✍️',
        category: 'navigation',
        keywords: ['writing', 'editor', 'compose'],
        shortcut: 'Cmd+2',
        action: () => {
          setView('writing' as any);
          showToast('Switched to Writing', 'info');
          onCommandExecute?.('nav-writing');
        },
      },
      {
        id: 'nav-timeline',
        label: 'Go to Timeline',
        description: 'Switch to timeline view',
        icon: '📅',
        category: 'navigation',
        keywords: ['timeline', 'schedule', 'progress'],
        shortcut: 'Cmd+3',
        action: () => {
          setView('timeline' as any);
          showToast('Switched to Timeline', 'info');
          onCommandExecute?.('nav-timeline');
        },
      },
      {
        id: 'nav-analysis',
        label: 'Go to Analysis',
        description: 'Switch to writing analysis',
        icon: '📊',
        category: 'navigation',
        keywords: ['analysis', 'stats', 'metrics'],
        shortcut: 'Cmd+4',
        action: () => {
          setView('analysis' as any);
          showToast('Switched to Analysis', 'info');
          onCommandExecute?.('nav-analysis');
        },
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        description: 'Open application settings',
        icon: '⚙️',
        category: 'navigation',
        keywords: ['settings', 'preferences', 'config'],
        shortcut: 'Cmd+,',
        action: () => {
          setView('settings' as any);
          showToast('Switched to Settings', 'info');
          onCommandExecute?.('nav-settings');
        },
      },

      // ========================================
      // PROJECT COMMANDS
      // ========================================
      {
        id: 'project-new',
        label: 'New Project',
        description: 'Create a new writing project',
        icon: '📝',
        category: 'project',
        keywords: ['new', 'create', 'project', 'start'],
        shortcut: 'Cmd+N',
        action: () => {
          const projectName = prompt('Enter project name:') || `New Project ${state.projects.length + 1}`;
          const description = prompt('Enter project description:') || '';
          
          const newProject = {
            id: `project_${Date.now()}`,
            name: projectName,
            description,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          
          addProject(newProject);
          showToast(`Created project: ${projectName}`, 'success');
          onCommandExecute?.('project-new');
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
        keywords: ['claude', 'ai', 'assistant', 'toggle'],
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
        keywords: ['clear', 'history', 'reset', 'claude'],
        action: () => {
          const confirmed = confirm('Clear Claude conversation history?');
          if (confirmed) {
            claudeActions.clearMessages();
            showToast('Cleared Claude history', 'success');
            onCommandExecute?.('claude-clear');
          }
        },
      },

      // ========================================
      // WRITING COMMANDS
      // ========================================
      {
        id: 'writing-save',
        label: 'Save Current Work',
        description: 'Save your current writing',
        icon: '💾',
        category: 'writing',
        keywords: ['save', 'backup', 'persist'],
        shortcut: 'Cmd+S',
        action: () => {
          showToast('Work saved!', 'success');
          onCommandExecute?.('writing-save');
        },
      },

      // ========================================
      // EXPORT COMMANDS
      // ========================================
      {
        id: 'export-markdown',
        label: 'Export as Markdown',
        description: 'Export current document as Markdown',
        icon: '📄',
        category: 'export',
        keywords: ['export', 'markdown', 'download'],
        shortcut: 'Cmd+E',
        action: () => {
          showToast('Exporting as Markdown...', 'info');
          onCommandExecute?.('export-markdown');
        },
      },

      // ========================================
      // THEME COMMANDS
      // ========================================
      {
        id: 'theme-toggle',
        label: 'Toggle Dark/Light Mode',
        description: `Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`,
        icon: state.theme === 'dark' ? '☀️' : '🌙',
        category: 'navigation',
        keywords: ['theme', 'dark', 'light', 'mode'],
        shortcut: 'Cmd+Shift+L',
        action: () => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          setTheme(newTheme);
          showToast(`Switched to ${newTheme} mode`, 'info');
          onCommandExecute?.('theme-toggle');
        },
      },
    ];

    // ========================================
    // CONDITIONAL COMMANDS (TEXT SELECTION)
    // ========================================
    if (selectedText && selectedText.trim().length > 0) {
      const textPreview = selectedText.length > 30 
        ? `"${selectedText.slice(0, 30)}..."` 
        : `"${selectedText}"`;

      commands.push(
        {
          id: 'claude-improve-selection',
          label: 'Improve Selected Text',
          description: `Improve ${textPreview} with Claude`,
          icon: '✨',
          category: 'claude',
          keywords: ['improve', 'enhance', 'claude', 'selected'],
          shortcut: 'Cmd+I',
          action: async () => {
            try {
              await claudeActions.improveText(selectedText);
              showToast('Improving selected text', 'info');
              onCommandExecute?.('claude-improve');
            } catch (error) {
              showToast('Failed to improve text', 'error');
            }
          },
        },
        {
          id: 'claude-continue-selection',
          label: 'Continue from Selection',
          description: `Continue writing from ${textPreview}`,
          icon: '➡️',
          category: 'claude',
          keywords: ['continue', 'extend', 'claude'],
          shortcut: 'Cmd+Shift+C',
          action: async () => {
            try {
              await claudeActions.suggestContinuation(selectedText);
              showToast('Generating continuation', 'info');
              onCommandExecute?.('claude-continue');
            } catch (error) {
              showToast('Failed to continue text', 'error');
            }
          },
        },
        {
          id: 'claude-analyze-selection',
          label: 'Analyze Writing Style',
          description: `Analyze the style of ${textPreview}`,
          icon: '🔍',
          category: 'claude',
          keywords: ['analyze', 'style', 'claude'],
          shortcut: 'Cmd+Shift+A',
          action: async () => {
            try {
              await claudeActions.analyzeWritingStyle(selectedText);
              showToast('Analyzing writing style', 'info');
              onCommandExecute?.('claude-analyze');
            } catch (error) {
              showToast('Failed to analyze text', 'error');
            }
          },
        }
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
          keywords: ['character', 'ideas', 'claude', 'generate'],
          action: async () => {
            try {
              const prompt = `Generate character ideas for a story titled "${currentProject.name}". ${currentProject.description ? `Context: ${currentProject.description}` : ''}`;
              await claudeActions.brainstormIdeas(prompt);
              showToast('Generating character ideas', 'info');
              onCommandExecute?.('claude-character-ideas');
            } catch (error) {
              showToast('Failed to generate character ideas', 'error');
            }
          },
        },
        {
          id: 'claude-plot-ideas',
          label: 'Generate Plot Ideas',
          description: `Plot developments for "${currentProject.name}"`,
          icon: '📖',
          category: 'claude',
          keywords: ['plot', 'ideas', 'claude', 'story'],
          action: async () => {
            try {
              const context = currentProject.description || currentProject.name;
              await claudeActions.generatePlotIdeas(context);
              showToast('Generating plot ideas', 'info');
              onCommandExecute?.('claude-plot-ideas');
            } catch (error) {
              showToast('Failed to generate plot ideas', 'error');
            }
          },
        }
      );
    }

    return commands.filter(cmd => cmd.enabled !== false);
  }, [
    state, 
    selectedText, 
    currentProject, 
    setView, 
    addProject, 
    updateProject, 
    claudeActions, 
    setTheme, 
    showToast, 
    onCommandExecute
  ]);
}
