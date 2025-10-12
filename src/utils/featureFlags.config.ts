import { FeatureFlagConfig } from '../types/featureFlags';

/**
 * Feature flag definitions
 */
export const FEATURE_FLAGS: FeatureFlagConfig = {
  // Plot Boards
  PLOT_BOARDS: {
    key: 'plotBoards',
    name: 'Plot Boards',
    description: 'Kanban-style plot and scene organization boards',
    defaultValue: false,
    category: 'experimental',
    requiresReload: true,
  },

  // Export Wizard
  EXPORT_WIZARD: {
    key: 'exportWizard',
    name: 'Export Wizard',
    description: '3-step export wizard (format → style → review)',
    defaultValue: true,
    category: 'core',
  },

  // Advanced exports
  ADVANCED_EXPORT: {
    key: 'advancedExport',
    name: 'Advanced Export Options',
    description: 'PDF generation and advanced formatting options',
    defaultValue: false,
    category: 'experimental',
    dependencies: ['exportWizard'],
  },

  // AI Plot Analysis
  AI_PLOT_ANALYSIS: {
    key: 'aiPlotAnalysis',
    name: 'AI Plot Analysis',
    description: 'AI-powered plot analysis with pacing, conflicts, and character insights',
    defaultValue: true,
    category: 'core',
  },

  // AI Writing Assistant
  AI_WRITING_ASSISTANT: {
    key: 'aiWritingAssistant',
    name: 'AI Writing Assistant',
    description: 'Enhanced AI-powered writing suggestions and analysis',
    defaultValue: true,
    category: 'core',
  },

  // Performance Monitoring
  PERFORMANCE_MONITORING: {
    key: 'performanceMonitoring',
    name: 'Performance Monitoring',
    description: 'Track app performance metrics and render times',
    defaultValue: false,
    category: 'debug',
  },

  // Timeline Consistency
  TIMELINE_CONSISTENCY: {
    key: 'timelineConsistency',
    name: 'Timeline Consistency Checks',
    description: 'Automatic detection of timeline conflicts and plot holes',
    defaultValue: true,
    category: 'core',
  },

  // Character Consistency
  CHARACTER_CONSISTENCY: {
    key: 'characterConsistency',
    name: 'Character Consistency Tracking',
    description: 'Monitor character trait consistency across scenes',
    defaultValue: true,
    category: 'core',
  },

  // Advanced Text Analysis
  ADVANCED_TEXT_ANALYSIS: {
    key: 'advancedTextAnalysis',
    name: 'Advanced Text Analysis',
    description: 'Sentiment analysis, reading level, and style metrics',
    defaultValue: false,
    category: 'experimental',
    dependencies: ['aiPlotAnalysis'],
  },

  // Project Insights Tab
  INSIGHTS_TAB: {
    key: 'insightsTab',
    name: 'Project Insights Tab',
    description: 'Analytics dashboard with writing metrics, progress tracking, and insights',
    defaultValue: true,
    category: 'core',
  },

  // Real-time Collaboration
  COLLABORATION: {
    key: 'collaboration',
    name: 'Real-time Collaboration',
    description: 'Share projects and collaborate with other writers',
    defaultValue: false,
    category: 'experimental',
    requiresReload: true,
  },

  // Enhanced Collaboration UI
  COLLABORATION_UI: {
    key: 'collaborationUI',
    name: 'Enhanced Collaboration UI',
    description:
      'Advanced collaboration interface with presence, comments, and conflict resolution',
    defaultValue: false,
    category: 'experimental',
    requiresReload: true,
    dependencies: ['collaboration'],
  },

  // Distraction-free Mode
  DISTRACTION_FREE_MODE: {
    key: 'distractionFreeMode',
    name: 'Distraction-Free Writing Mode',
    description: 'Hide all UI elements except the editor',
    defaultValue: false,
    category: 'core',
  },

  // Debug Features
  DEBUG_STORAGE: {
    key: 'debugStorage',
    name: 'Storage Debug Info',
    description: 'Show detailed storage operation logs',
    defaultValue: false,
    category: 'debug',
  },

  DEBUG_STATE: {
    key: 'debugState',
    name: 'State Debug Panel',
    description: 'Show current app state in debug panel',
    defaultValue: false,
    category: 'debug',
  },

  // Spotlight Tour
  SPOTLIGHT_TOUR: {
    key: 'spotlightTour',
    name: 'Spotlight Tour',
    description: 'Enhanced onboarding tour with spotlight focus',
    defaultValue: true,
    category: 'core',
  },
};
