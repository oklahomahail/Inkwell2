import { useMemo } from 'react';

import { useAppContext, View } from '@/context/AppContext';
import { useToast } from '@/context/toast';
import { Command } from '@/types/commands';
import { triggerOnProjectCreated } from '@/utils/tourTriggers';

export function useCommands(
  _selectedText?: string,
  _onCommandExecute?: (commandId: string) => void,
): Command[] {
  const { setView, addProject, currentProject, claudeActions } = useAppContext();
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
          _onCommandExecute?.('nav-dashboard');
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
          _onCommandExecute?.('nav-writing');
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
          _onCommandExecute?.('nav-timeline');
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
          _onCommandExecute?.('nav-analysis');
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
          _onCommandExecute?.('nav-settings');
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
            const newProjectId = crypto.randomUUID();
            addProject({
              id: newProjectId,
              name: projectName,
              description: '',
              content: '',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              chapters: [],
              characters: [],
              beatSheet: [],
            });

            // Fire tour trigger for project creation
            triggerOnProjectCreated(newProjectId);

            _onCommandExecute?.('project-new');
            showToast(`Created project: ${projectName}`, 'success');
          }
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
          description: _selectedText
            ? 'Improve selected text with Claude AI'
            : 'Improve current writing with Claude AI',
          icon: '✨',
          category: 'claude',
          keywords: ['improve', 'enhance', 'claude', 'ai'],
          enabled: !!currentProject?.content || !!_selectedText,
          action: async () => {
            try {
              _onCommandExecute?.('claude-improve');
              const textToImprove = _selectedText || currentProject?.content || '';
              if (textToImprove) {
                await claudeActions.improveText(textToImprove);
                showToast('Text improvement requested', 'success');
              } else {
                showToast('No text to improve', 'error');
              }
            } catch {
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
              _onCommandExecute?.('claude-continue');
              const content = currentProject?.content || '';
              if (content) {
                await claudeActions.suggestContinuation(content);
                showToast('Continuation requested', 'success');
              } else {
                showToast('No text to continue from', 'error');
              }
            } catch {
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
              _onCommandExecute?.('claude-analyze');
              const content = currentProject?.content || '';
              if (content) {
                await claudeActions.analyzeWritingStyle(content);
                showToast('Analysis requested', 'success');
              } else {
                showToast('No text to analyze', 'error');
              }
            } catch {
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
              _onCommandExecute?.('claude-brainstorm');
              const context = currentProject?.content || 'New creative writing project';
              await claudeActions.brainstormIdeas(context);
              showToast('Brainstorming session started', 'success');
            } catch {
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
              _onCommandExecute?.('claude-plot-ideas');
              const context = currentProject?.content || 'Story development';
              await claudeActions.generatePlotIdeas(context);
              showToast('Plot ideas generated', 'success');
            } catch {
              showToast('Failed to generate plot ideas', 'error');
            }
          },
        },
      );
    }

    return commands.filter((cmd) => cmd.enabled !== false);
  }, [
    _selectedText,
    currentProject,
    setView,
    addProject,
    claudeActions,
    showToast,
    _onCommandExecute,
  ]);
}
