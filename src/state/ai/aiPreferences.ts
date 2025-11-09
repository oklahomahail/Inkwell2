/**
 * AI Preferences State
 *
 * Manages advanced mode preference and other AI-related settings
 */

import { create } from 'zustand';

const ADVANCED_MODE_KEY = 'inkwell_ai_advanced_mode';

interface AiPreferencesState {
  /** Advanced mode enables extended models and custom API keys */
  advancedMode: boolean;

  /** Toggle advanced mode */
  setAdvancedMode: (enabled: boolean) => void;

  /** Reset to defaults */
  reset: () => void;
}

/**
 * AI Preferences Store
 *
 * Persists advanced mode preference to localStorage
 */
export const useAiPreferences = create<AiPreferencesState>((set) => ({
  // Load from localStorage on init
  advancedMode: (() => {
    try {
      const stored = localStorage.getItem(ADVANCED_MODE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  })(),

  setAdvancedMode: (enabled: boolean) => {
    try {
      localStorage.setItem(ADVANCED_MODE_KEY, String(enabled));
    } catch {
      // Ignore localStorage errors
    }
    set({ advancedMode: enabled });
  },

  reset: () => {
    try {
      localStorage.removeItem(ADVANCED_MODE_KEY);
    } catch {
      // Ignore localStorage errors
    }
    set({ advancedMode: false });
  },
}));
