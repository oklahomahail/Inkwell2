// Settings store using Zustand
// User preferences, app configuration, and feature flags

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { SettingsStoreState, ExportFormat } from '../domain/types';
import { traceStoreAction } from '../utils/trace';

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

  // Reset
  resetToDefaults: () => void;
  clearError: () => void;
}

const initialState: SettingsStoreState = {
  theme: 'light',
  autoSave: {
    enabled: true,
    interval: 30000, // 30 seconds
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

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set, _get) => ({
        ...initialState,

        // Theme
        setTheme: (theme) => {
          traceStoreAction('SettingsStore', 'setTheme', { theme });
          set({ theme });
          document.documentElement.setAttribute('data-theme', theme);
        },

        // Auto-save
        setAutoSaveEnabled: (enabled) => {
          set((state) => ({
            autoSave: { ...state.autoSave, enabled },
          }));
        },

        setAutoSaveInterval: (interval) => {
          set((state) => ({
            autoSave: { ...state.autoSave, interval },
          }));
        },

        // Backup
        setBackupEnabled: (enabled) => {
          set((state) => ({
            backup: { ...state.backup, enabled },
          }));
        },

        setBackupFrequency: (frequency) => {
          set((state) => ({
            backup: { ...state.backup, frequency },
          }));
        },

        // Editor
        setEditorFontSize: (fontSize) => {
          set((state) => ({
            editor: { ...state.editor, fontSize },
          }));
        },

        setEditorFontFamily: (fontFamily) => {
          set((state) => ({
            editor: { ...state.editor, fontFamily },
          }));
        },

        setEditorLineHeight: (lineHeight) => {
          set((state) => ({
            editor: { ...state.editor, lineHeight },
          }));
        },

        setShowWordCount: (showWordCount) => {
          set((state) => ({
            editor: { ...state.editor, showWordCount },
          }));
        },

        setShowCharacterCount: (showCharacterCount) => {
          set((state) => ({
            editor: { ...state.editor, showCharacterCount },
          }));
        },

        // Export
        setDefaultExportFormat: (defaultFormat) => {
          set((state) => ({
            export: { ...state.export, defaultFormat },
          }));
        },

        setIncludeMetadata: (includeMetadata) => {
          set((state) => ({
            export: { ...state.export, includeMetadata },
          }));
        },

        setCompressImages: (compressImages) => {
          set((state) => ({
            export: { ...state.export, compressImages },
          }));
        },

        // Feature flags
        setFeatureFlag: (flag, enabled) => {
          set((state) => ({
            featureFlags: { ...state.featureFlags, [flag]: enabled },
          }));
        },

        // Reset
        resetToDefaults: () => {
          set(initialState);
        },

        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'inkwell-settings',
        version: 1,
      },
    ),
    {
      name: 'settings-store',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
);
