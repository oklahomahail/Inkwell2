// @ts-nocheck
// src/services/featureFlagService.presets.ts

export interface FeatureFlagPreset {
  tours: {
    spotlightTour: boolean;
    simpleTour: boolean;
  };
  ui: {
    showPowerMenu: boolean;
    showFocusMode: boolean;
    showAdvancedExport: boolean;
    showAdvancedSettings: boolean;
    showKeyboardShortcuts: boolean;
    showThemeSelector: boolean;
  };
  features: {
    // Core writing features (always enabled)
    projects: boolean;
    chapters: boolean;
    scenes: boolean;
    notesBasic: boolean;
    exportBasic: boolean;

    // Advanced features (gated in Beginner mode)
    plotBoards: boolean;
    timeline: boolean;
    charactersAdvanced: boolean;
    templatesEditor: boolean;
    bulkImport: boolean;
    collaboration: boolean;
    collaborationUI: boolean;
    advancedAnalytics: boolean;
    customStructures: boolean;
    exportWizard: boolean;
    aiPlotAnalysis: boolean;
    insightsTab: boolean;
  };
  ai: {
    enableInlineAssist: boolean;
    showModelPicker: boolean;
    advancedSettings: boolean;
    showProviderConfig: boolean;
    batchOperations: boolean;
  };
  editor: {
    focusModeDefault: boolean;
    autosaveIntervalSeconds: number;
    softWrapDefault: boolean;
    showWordCount: boolean;
    showAdvancedFormatting: boolean;
  };
}

export const BeginnerPreset: FeatureFlagPreset = {
  tours: {
    spotlightTour: true,
    simpleTour: false,
  },
  ui: {
    showPowerMenu: false,
    showFocusMode: true,
    showAdvancedExport: false,
    showAdvancedSettings: false,
    showKeyboardShortcuts: false,
    showThemeSelector: false,
  },
  features: {
    // Core writing features - always available
    projects: true,
    chapters: true,
    scenes: true,
    notesBasic: true,
    exportBasic: true,

    // Advanced features - hidden until Pro mode
    plotBoards: false,
    timeline: false,
    charactersAdvanced: false,
    templatesEditor: false,
    bulkImport: false,
    collaboration: false,
    collaborationUI: false,
    advancedAnalytics: false,
    customStructures: false,
    // Core features enabled in Beginner mode
    exportWizard: true,
    aiPlotAnalysis: true,
    insightsTab: true,
  },
  ai: {
    enableInlineAssist: true, // Simple "Tighten this paragraph" button
    showModelPicker: false, // Hide complex model selection
    advancedSettings: false, // Hide advanced AI configuration
    showProviderConfig: false, // Hide multi-provider setup
    batchOperations: false, // Hide bulk AI operations
  },
  editor: {
    focusModeDefault: true, // Start in distraction-free mode
    autosaveIntervalSeconds: 2, // Frequent saves for peace of mind
    softWrapDefault: true, // No horizontal scrolling
    showWordCount: true, // Progress feedback
    showAdvancedFormatting: false, // Keep formatting simple
  },
};

export const ProPreset: FeatureFlagPreset = {
  tours: {
    spotlightTour: true,
    simpleTour: false,
  },
  ui: {
    showPowerMenu: true,
    showFocusMode: true,
    showAdvancedExport: true,
    showAdvancedSettings: true,
    showKeyboardShortcuts: true,
    showThemeSelector: true,
  },
  features: {
    // All features enabled
    projects: true,
    chapters: true,
    scenes: true,
    notesBasic: true,
    exportBasic: true,
    plotBoards: true,
    timeline: true,
    charactersAdvanced: true,
    templatesEditor: true,
    bulkImport: true,
    collaboration: true,
    collaborationUI: true,
    advancedAnalytics: true,
    customStructures: true,
    exportWizard: true,
    aiPlotAnalysis: true,
    insightsTab: true,
  },
  ai: {
    enableInlineAssist: true,
    showModelPicker: true,
    advancedSettings: true,
    showProviderConfig: true,
    batchOperations: true,
  },
  editor: {
    focusModeDefault: true,
    autosaveIntervalSeconds: 2,
    softWrapDefault: true,
    showWordCount: true,
    showAdvancedFormatting: true,
  },
};

export type UIMode = 'beginner' | 'pro';

/**
 * Get the appropriate preset for a UI mode
 */
export function _getPresetForMode(mode: UIMode): FeatureFlagPreset {
  return mode === 'beginner' ? BeginnerPreset : ProPreset;
}

/**
 * Convert preset to feature flag configuration
 */
export function _presetToFlags(preset: FeatureFlagPreset): Record<string, boolean> {
  const flags: Record<string, boolean> = {};

  // Map tour flags
  Object.entries(preset.tours).forEach(([key, value]) => {
    flags[`tour_${key}`] = value;
  });

  // Map UI flags
  Object.entries(preset.ui).forEach(([key, value]) => {
    flags[`ui_${key}`] = value;
  });

  // Map feature flags
  Object.entries(preset.features).forEach(([key, value]) => {
    flags[`feature_${key}`] = value;
  });

  // Map AI flags
  Object.entries(preset.ai).forEach(([key, value]) => {
    flags[`ai_${key}`] = value;
  });

  // Map editor flags
  Object.entries(preset.editor).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      flags[`editor_${key}`] = value;
    }
  });

  return flags;
}

/**
 * Default templates for new projects based on mode
 */
export const StarterTemplates = {
  beginner: [
    {
      id: 'simple-novel',
      name: 'Simple Novel',
      description: 'A basic story structure to get you started',
      icon: '📖',
      chapters: ['Chapter 1'],
      scenes: ['Opening scene'],
    },
    {
      id: 'short-story',
      name: 'Short Story',
      description: 'Perfect for a single sitting read',
      icon: '📝',
      chapters: ['Beginning', 'Middle', 'End'],
      scenes: ['Hook', 'Development', 'Resolution'],
    },
  ],
  pro: [
    {
      id: 'simple-novel',
      name: 'Simple Novel',
      description: 'A basic story structure to get you started',
      icon: '📖',
      chapters: ['Chapter 1'],
      scenes: ['Opening scene'],
    },
    {
      id: 'mystery-3-act',
      name: 'Mystery with 3 Acts',
      description: 'Classic mystery structure with investigation phases',
      icon: '🔍',
      chapters: ['Act I: Setup', 'Act II: Investigation', 'Act III: Resolution'],
      scenes: ['Hook', 'Crime', 'Investigation', 'Complications', 'Revelation', 'Resolution'],
    },
    {
      id: 'screenplay-5-beat',
      name: 'Screenplay 5-Beat',
      description: 'Standard screenplay structure for film/TV',
      icon: '🎬',
      chapters: ['Act I', 'Act II-A', 'Act II-B', 'Act III'],
      scenes: [
        'Opening Image',
        'Inciting Incident',
        'Plot Point 1',
        'Midpoint',
        'Plot Point 2',
        'Climax',
        'Resolution',
      ],
    },
  ],
};

/**
 * Opinionated file naming convention
 */
export function _formatSceneFilename(
  projectName: string,
  chapterIndex: number,
  sceneIndex: number,
): string {
  const chapterNum = String(chapterIndex + 1).padStart(2, '0');
  const sceneNum = String(sceneIndex + 1).padStart(2, '0');
  return `${projectName} — Chapter ${chapterNum} — Scene ${sceneNum}`;
}

/**
 * Default editor settings based on mode
 */
export const featureFlags = {
  isDebugMode: () => false,
  // add what your app reads
};

export function _getEditorDefaults(mode: UIMode) {
  const preset = getPresetForMode(mode);
  return {
    focusMode: preset.editor.focusModeDefault,
    autosave: preset.editor.autosaveIntervalSeconds * 1000, // Convert to milliseconds
    softWrap: preset.editor.softWrapDefault,
    showWordCount: preset.editor.showWordCount,
    showAdvancedFormatting: preset.editor.showAdvancedFormatting,
  };
}
