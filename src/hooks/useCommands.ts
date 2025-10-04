import { useMemo } from 'react';

import { useAppContext, View } from '@/context/AppContext';
import { useToast } from '@/context/toast';
import { Command } from '@/types/commands';

export function useCommands(
  selectedText?: string,
  onCommandExecute?: (commandId: string) => void,
): Command[] {
  const { setView, addProject, currentProject, claudeActions, setTheme } = useAppContext();

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
        action: () => {
          setView(View.Dashboard);
          onCommandExecute?.('nav-dashboard');
          showToast('Switched to Dashboard', 'success');
        },
      },
      {
        id: 'nav-writing',
        label: 'Go to Writing',
        description: 'Switch to writing workspace',
        icon: '✍️',
        category: 'navigation',
        keywords: ['writing', 'write', 'editor'],
        action: () => {
          setView(View.Writing);
          onCommandExecute?.('nav-writing');
          showToast('Switched to Writing', 'success');
        },
      },
      {
        id: 'nav-timeline',
        label: 'Go to Timeline',
        description: 'View project timeline',
        icon: '📅',
        category: 'navigation',
        keywords: ['timeline', 'schedule', 'calendar'],
        action: () => {
          setView(View.Timeline);
          onCommandExecute?.('nav-timeline');
          showToast('Switched to Timeline', 'success');
        },
      },
      {
        id: 'nav-analysis',
        label: 'Go to Analysis',
        description: 'View writing analytics',
        icon: '📊',
        category: 'navigation',
        keywords: ['analysis', 'analytics', 'stats'],
        action: () => {
          setView(View.Analysis);
          onCommandExecute?.('nav-analysis');
          showToast('Switched to Analysis', 'success');
        },
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        description: 'Access application settings',
        icon: '⚙️',
        category: 'navigation',
        keywords: ['settings', 'preferences', 'config'],
        action: () => {
          setView(View.Settings);
          onCommandExecute?.('nav-settings');
          showToast('Switched to Settings', 'success');
        },
      },

      // ========================================
      // PROJECT COMMANDS
      // ========================================
      {
        id: 'project-new',
        label: 'New Project',
        description: 'Create a new writing project',
        icon: '📄',
        category: 'project',
        keywords: ['new', 'create', 'project'],
        action: () => {
          const projectName = prompt('Enter project name:');
          if (projectName) {
            addProject({
              id: crypto.randomUUID(),
              name: projectName,
              description: '',
              content: '',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              chapters: [],
              characters: [],
              beatSheet: [],
            });
            onCommandExecute?.('project-new');
            showToast(`Created project: ${projectName}`, 'success');
          }
        },
      },

      // ========================================
      // THEME COMMANDS
      // ========================================
      {
        id: 'theme-light',
        label: 'Light Theme',
        description: 'Switch to light theme',
        icon: '☀️',
        category: 'navigation',
        keywords: ['light', 'theme', 'bright'],
        action: () => {
          setTheme('light');
          onCommandExecute?.('theme-light');
          showToast('Switched to Light Theme', 'success');
        },
      },
      {
        id: 'theme-dark',
        label: 'Dark Theme',
        description: 'Switch to dark theme',
        icon: '🌙',
        category: 'navigation',
        keywords: ['dark', 'theme', 'night'],
        action: () => {
          setTheme('dark');
          onCommandExecute?.('theme-dark');
          showToast('Switched to Dark Theme', 'success');
        },
      },
    ];

    // ========================================
    // CLAUDE AI COMMANDS (only if current project exists)
    // ========================================
    if (currentProject && claudeActions) {
      commands.push(
        {
          id: 'claude-improve',
          label: 'Improve Writing',
          description: selectedText
            ? 'Improve selected text with Claude AI'
            : 'Improve current writing with Claude AI',
          icon: '✨',
          category: 'claude',
          keywords: ['improve', 'enhance', 'claude', 'ai'],
          enabled: !!currentProject?.content || !!selectedText,
          action: async () => {
            try {
              onCommandExecute?.('claude-improve');
              const textToImprove = selectedText || currentProject?.content || '';
              if (textToImprove) {
                await claudeActions.improveText(textToImprove);
                showToast('Text improvement requested', 'success');
              } else {
                showToast('No text to improve', 'error');
              }
            } catch (__error) {
              showToast('Failed to improve text', 'error');
            }
          },
        },
        {
          id: 'claude-continue',
          label: 'Continue Writing',
          description: 'Continue writing from current position',
          icon: '➡️',
          category: 'claude',
          keywords: ['continue', 'extend', 'claude', 'ai'],
          enabled: !!currentProject?.content,
          action: async () => {
            try {
              onCommandExecute?.('claude-continue');
              const content = currentProject?.content || '';
              if (content) {
                await claudeActions.suggestContinuation(content);
                showToast('Continuation requested', 'success');
              } else {
                showToast('No text to continue from', 'error');
              }
            } catch (__error) {
              showToast('Failed to continue writing', 'error');
            }
          },
        },
        {
          id: 'claude-analyze',
          label: 'Analyze Writing',
          description: 'Get AI analysis of your writing',
          icon: '🔍',
          category: 'claude',
          keywords: ['analyze', 'analysis', 'claude', 'ai'],
          enabled: !!currentProject.content,
          action: async () => {
            try {
              onCommandExecute?.('claude-analyze');
              const content = currentProject?.content || '';
              if (content) {
                await claudeActions.analyzeWritingStyle(content);
                showToast('Analysis requested', 'success');
              } else {
                showToast('No text to analyze', 'error');
              }
            } catch (__error) {
              showToast('Failed to analyze text', 'error');
            }
          },
        },
        {
          id: 'claude-brainstorm',
          label: 'Brainstorm Ideas',
          description: 'Generate creative ideas for your project',
          icon: '💡',
          category: 'claude',
          keywords: ['brainstorm', 'ideas', 'creative', 'claude'],
          action: async () => {
            try {
              onCommandExecute?.('claude-brainstorm');
              const context = currentProject?.content || 'New creative writing project';
              await claudeActions.brainstormIdeas(context);
              showToast('Brainstorming session started', 'success');
            } catch (__error) {
              showToast('Failed to generate ideas', 'error');
            }
          },
        },
        {
          id: 'claude-plot-ideas',
          label: 'Generate Plot Ideas',
          description: 'Get plot suggestions for your story',
          icon: '📖',
          category: 'claude',
          keywords: ['plot', 'story', 'narrative', 'claude'],
          action: async () => {
            try {
              onCommandExecute?.('claude-plot-ideas');
              const context = currentProject?.content || 'Story development';
              await claudeActions.generatePlotIdeas(context);
              showToast('Plot ideas generated', 'success');
            } catch (__error) {
              showToast('Failed to generate plot ideas', 'error');
            }
          },
        },
      );
    }

    return commands.filter((cmd) => cmd.enabled !== false);
  }, [
    selectedText,
    currentProject,
    setView,
    addProject,
    claudeActions,
    setTheme,
    showToast,
    onCommandExecute,
  ]);
}
