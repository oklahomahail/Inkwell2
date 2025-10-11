// File: src/stores/useSettingsStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { SettingsStoreState, ExportFormat } from '../domain/types';
import { traceStoreAction } from '../utils/trace';

// Public API for components/tests
export interface SettingsStore extends SettingsStoreState {
  // Theme
  setTheme: (theme: 'light' | 'dark') => void;

  // Auto-save
  setAutoSaveEnabled: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;

  // Backup
  setBackupEnabled: (enabled: boolean) => void;
  setBackupFrequency: (frequency: 'daily' | 'weekly' | 'monthly') => void;

  // Editor
  setEditorFontSize: (size: number) => void;
  setEditorFontFamily: (family: string) => void;
  setEditorLineHeight: (height: number) => void;
  setShowWordCount: (show: boolean) => void;
  setShowCharacterCount: (show: boolean) => void;

  // Export
  setDefaultExportFormat: (format: ExportFormat) => void;
  setIncludeMetadata: (include: boolean) => void;
  setCompressImages: (compress: boolean) => void;

  // Feature flags
  setFeatureFlag: (flag: string, enabled: boolean) => void;

  // Status and errors
  setIsLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;
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
      (set /* , _get */) => ({
        ...initialState,

        // Theme
        setTheme: (theme) => {
          traceStoreAction?.('settings:setTheme', { theme });
          set((s) => ({ ...s, theme }));
        },

        // Auto-save
        setAutoSaveEnabled: (enabled) => {
          traceStoreAction?.('settings:setAutoSaveEnabled', { enabled });
          set((s) => ({ ...s, autoSave: { ...s.autoSave, enabled } }));
        },
        setAutoSaveInterval: (interval) => {
          traceStoreAction?.('settings:setAutoSaveInterval', { interval });
          set((s) => ({ ...s, autoSave: { ...s.autoSave, interval } }));
        },

        // Backup
        setBackupEnabled: (enabled) => {
          traceStoreAction?.('settings:setBackupEnabled', { enabled });
          set((s) => ({ ...s, backup: { ...s.backup, enabled } }));
        },
        setBackupFrequency: (frequency) => {
          traceStoreAction?.('settings:setBackupFrequency', { frequency });
          set((s) => ({ ...s, backup: { ...s.backup, frequency } }));
        },

        // Editor
        setEditorFontSize: (size) => {
          traceStoreAction?.('settings:setEditorFontSize', { size });
          set((s) => ({ ...s, editor: { ...s.editor, fontSize: size } }));
        },
        setEditorFontFamily: (family) => {
          traceStoreAction?.('settings:setEditorFontFamily', { family });
          set((s) => ({ ...s, editor: { ...s.editor, fontFamily: family } }));
        },
        setEditorLineHeight: (height) => {
          traceStoreAction?.('settings:setEditorLineHeight', { height });
          set((s) => ({ ...s, editor: { ...s.editor, lineHeight: height } }));
        },
        setShowWordCount: (show) => {
          traceStoreAction?.('settings:setShowWordCount', { show });
          set((s) => ({ ...s, editor: { ...s.editor, showWordCount: show } }));
        },
        setShowCharacterCount: (show) => {
          traceStoreAction?.('settings:setShowCharacterCount', { show });
          set((s) => ({ ...s, editor: { ...s.editor, showCharacterCount: show } }));
        },

        // Export
        setDefaultExportFormat: (format) => {
          traceStoreAction?.('settings:setDefaultExportFormat', { format });
          set((s) => ({ ...s, export: { ...s.export, defaultFormat: format } }));
        },
        setIncludeMetadata: (include) => {
          traceStoreAction?.('settings:setIncludeMetadata', { include });
          set((s) => ({ ...s, export: { ...s.export, includeMetadata: include } }));
        },
        setCompressImages: (compress) => {
          traceStoreAction?.('settings:setCompressImages', { compress });
          set((s) => ({ ...s, export: { ...s.export, compressImages: compress } }));
        },

        // Feature flags
        setFeatureFlag: (flag, enabled) => {
          traceStoreAction?.('settings:setFeatureFlag', { flag, enabled });
          set((s) => ({
            ...s,
            featureFlags: { ...s.featureFlags, [flag]: enabled },
          }));
        },

        // Status and errors
        setIsLoading: (loading) => {
          traceStoreAction?.('settings:setIsLoading', { loading });
          set((s) => ({ ...s, isLoading: loading }));
        },
        setError: (message) => {
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
        // partialize: (state) => ({
        //   theme: state.theme,
        //   autoSave: state.autoSave,
        //   backup: state.backup,
        //   editor: state.editor,
        //   export: state.export,
        //   featureFlags: state.featureFlags,
        // }),
        // You can add a migrate if future versions change shape
        // migrate: (persisted, version) => persisted,
      },
    ),
    {
      name: 'settings-store',
      enabled: isDev,
    },
  ),
);
