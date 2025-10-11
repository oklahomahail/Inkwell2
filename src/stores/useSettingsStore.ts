// File: src/stores/useSettingsStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { SettingsStoreState, ExportFormat } from '../domain/types';
import { traceStoreAction } from '../utils/trace';

// Public API for components/tests
export interface SettingsStore extends SettingsStoreState {
  // Theme
  setTheme: (_theme: 'light' | 'dark') => void;

  // Auto-save
  setAutoSaveEnabled: (_enabled: boolean) => void;
  setAutoSaveInterval: (_interval: number) => void;

  // Backup
  setBackupEnabled: (_enabled: boolean) => void;
  setBackupFrequency: (_frequency: 'daily' | 'weekly' | 'monthly') => void;

  // Editor
  setEditorFontSize: (_size: number) => void;
  setEditorFontFamily: (_family: string) => void;
  setEditorLineHeight: (_height: number) => void;
  setShowWordCount: (_show: boolean) => void;
  setShowCharacterCount: (_show: boolean) => void;

  // Export
  setDefaultExportFormat: (_format: ExportFormat) => void;
  setIncludeMetadata: (_include: boolean) => void;
  setCompressImages: (_compress: boolean) => void;

  // Feature flags
  setFeatureFlag: (_flag: string, _enabled: boolean) => void;

  // Status and errors
  setIsLoading: (_loading: boolean) => void;
  setError: (_message: string | null) => void;
  clearError: () => void;

  // Reset
  resetToDefaults: () => void;
}

// Defaults (single source of truth)
const initialState: SettingsStoreState = {
  theme: 'light',
  autoSave: {
    enabled: true,
    interval: 30_000, // 30 seconds
  },
  backup: {
    enabled: true,
    frequency: 'daily',
  },
  editor: {
    fontSize: 16,
    fontFamily: 'Inter, system-ui, sans-serif',
    lineHeight: 1.6,
    showWordCount: true,
    showCharacterCount: false,
  },
  export: {
    defaultFormat: ExportFormat.MARKDOWN,
    includeMetadata: true,
    compressImages: true,
  },
  featureFlags: {},
  isLoading: false,
  error: null,
};

const isDev =
  // Vite
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.DEV) ||
  // Node/CI
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ||
  false;

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set /* ,  _get */) => ({
        ...initialState,

        // Theme
        setTheme: (theme) => {
          traceStoreAction?.('settings:setTheme', { theme });
          set((s) => ({ ...s, theme }));
        },

        // Auto-save
        setAutoSaveEnabled: (_enabled) => {
          traceStoreAction?.('settings:setAutoSaveEnabled', { enabled });
          set((s) => ({ ...s, autoSave: { ...s.autoSave, enabled } }));
        },
        setAutoSaveInterval: (_interval) => {
          traceStoreAction?.('settings:setAutoSaveInterval', { interval });
          set((s) => ({ ...s, autoSave: { ...s.autoSave, interval } }));
        },

        // Backup
        setBackupEnabled: (_enabled) => {
          traceStoreAction?.('settings:setBackupEnabled', { enabled });
          set((s) => ({ ...s, backup: { ...s.backup, enabled } }));
        },
        setBackupFrequency: (_frequency) => {
          traceStoreAction?.('settings:setBackupFrequency', { frequency });
          set((s) => ({ ...s, backup: { ...s.backup, frequency } }));
        },

        // Editor
        setEditorFontSize: (_size) => {
          traceStoreAction?.('settings:setEditorFontSize', { size });
          set((s) => ({ ...s, editor: { ...s.editor, fontSize: size } }));
        },
        setEditorFontFamily: (_family) => {
          traceStoreAction?.('settings:setEditorFontFamily', { family });
          set((s) => ({ ...s, editor: { ...s.editor, fontFamily: family } }));
        },
        setEditorLineHeight: (_height) => {
          traceStoreAction?.('settings:setEditorLineHeight', { height });
          set((s) => ({ ...s, editor: { ...s.editor, lineHeight: height } }));
        },
        setShowWordCount: (_show) => {
          traceStoreAction?.('settings:setShowWordCount', { show });
          set((s) => ({ ...s, editor: { ...s.editor, showWordCount: show } }));
        },
        setShowCharacterCount: (_show) => {
          traceStoreAction?.('settings:setShowCharacterCount', { show });
          set((s) => ({ ...s, editor: { ...s.editor, showCharacterCount: show } }));
        },

        // Export
        setDefaultExportFormat: (_format) => {
          traceStoreAction?.('settings:setDefaultExportFormat', { format });
          set((s) => ({ ...s, export: { ...s.export, defaultFormat: format } }));
        },
        setIncludeMetadata: (_include) => {
          traceStoreAction?.('settings:setIncludeMetadata', { include });
          set((s) => ({ ...s, export: { ...s.export, includeMetadata: include } }));
        },
        setCompressImages: (_compress) => {
          traceStoreAction?.('settings:setCompressImages', { compress });
          set((s) => ({ ...s, export: { ...s.export, compressImages: compress } }));
        },

        // Feature flags
        setFeatureFlag: (_flag, _enabled) => {
          traceStoreAction?.('settings:setFeatureFlag', { flag, enabled });
          set((s) => ({
            ...s,
            featureFlags: { ...s.featureFlags, [flag]: enabled },
          }));
        },

        // Status and errors
        setIsLoading: (_loading) => {
          traceStoreAction?.('settings:setIsLoading', { loading });
          set((s) => ({ ...s, isLoading: loading }));
        },
        setError: (_message) => {
          traceStoreAction?.('settings:setError', { message });
          set((s) => ({ ...s, error: message }));
        },
        clearError: () => {
          traceStoreAction?.('settings:clearError');
          set((s) => ({ ...s, error: null }));
        },

        // Reset
        resetToDefaults: () => {
          traceStoreAction?.('settings:resetToDefaults');
          set(() => ({ ...initialState }));
        },
      }),
      {
        name: 'inkwell-settings',
        version: 1,
        // Keep persist payload minimal if you like:
        // partialize: (_state) => ({
        //   theme: state.theme,
        //   autoSave: state.autoSave,
        //   backup: state.backup,
        //   editor: state.editor,
        //   export: state.export,
        //   featureFlags: state.featureFlags,
        // }),
        // You can add a migrate if future versions change shape
        // migrate: (_persisted, _version) => persisted,
      },
    ),
    {
      name: 'settings-store',
      enabled: isDev,
    },
  ),
);
