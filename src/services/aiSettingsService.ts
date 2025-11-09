/**
 * AI Settings Service
 *
 * Manages user's AI provider settings, API keys, and usage tracking.
 * Stores settings in localStorage with client-side encryption for API keys.
 */

import { getDefaultProviderAndModel } from '@/ai/registry';
import { UserAISettings } from '@/ai/types';

const STORAGE_KEY = 'inkwell_ai_settings';
const ENCRYPTION_KEY = 'inkwell-ai-keys-v1';

/**
 * Simple client-side encryption for API keys
 * Note: For production with sensitive keys, consider using Web Crypto API with user-derived key
 */
function encryptKey(key: string): string {
  if (!key) return '';
  const encrypted = key
    .split('')
    .map((char, i) => {
      const keyChar = ENCRYPTION_KEY[i % ENCRYPTION_KEY.length];
      if (!keyChar) return char;
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    })
    .join('');
  return btoa(encrypted);
}

function decryptKey(encrypted: string): string {
  if (!encrypted) return '';
  try {
    const decoded = atob(encrypted);
    return decoded
      .split('')
      .map((char, i) => {
        const keyChar = ENCRYPTION_KEY[i % ENCRYPTION_KEY.length];
        if (!keyChar) return char;
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
      })
      .join('');
  } catch {
    return '';
  }
}

/**
 * Get default settings
 */
function getDefaultSettings(): UserAISettings {
  const defaults = getDefaultProviderAndModel();
  return {
    defaultProvider: defaults.providerId,
    defaultModel: defaults.modelId,
    apiKeys: {},
    usage: {},
    preferences: {
      autoFallback: true,
      temperature: 0.7,
      maxTokens: 2048,
      trackUsage: true,
    },
  };
}

/**
 * AI Settings Service
 */
class AISettingsService {
  private settings: UserAISettings;
  private listeners: Array<(settings: UserAISettings) => void> = [];

  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): UserAISettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all fields exist
        return {
          ...getDefaultSettings(),
          ...parsed,
          preferences: {
            ...getDefaultSettings().preferences,
            ...parsed.preferences,
          },
        };
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
    return getDefaultSettings();
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save AI settings:', error);
    }
  }

  /**
   * Subscribe to settings changes
   */
  subscribe(listener: (settings: UserAISettings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.settings));
  }

  /**
   * Get current settings
   */
  getSettings(): UserAISettings {
    return { ...this.settings };
  }

  /**
   * Set default provider and model
   */
  setDefaultProvider(providerId: string, modelId: string): void {
    this.settings.defaultProvider = providerId;
    this.settings.defaultModel = modelId;
    this.saveSettings();
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): { providerId: string; modelId: string } {
    return {
      providerId: this.settings.defaultProvider,
      modelId: this.settings.defaultModel,
    };
  }

  /**
   * Set API key for provider (encrypted)
   */
  setApiKey(providerId: string, apiKey: string): void {
    if (apiKey) {
      this.settings.apiKeys[providerId] = encryptKey(apiKey);
    } else {
      delete this.settings.apiKeys[providerId];
    }
    this.saveSettings();
  }

  /**
   * Get decrypted API key for provider
   */
  getApiKey(providerId: string): string | undefined {
    const encrypted = this.settings.apiKeys[providerId];
    return encrypted ? decryptKey(encrypted) : undefined;
  }

  /**
   * Check if provider has API key
   */
  hasApiKey(providerId: string): boolean {
    return !!this.settings.apiKeys[providerId];
  }

  /**
   * Remove API key for provider
   */
  removeApiKey(providerId: string): void {
    delete this.settings.apiKeys[providerId];
    this.saveSettings();
  }

  /**
   * Update usage stats
   */
  updateUsage(providerId: string, promptTokens: number, completionTokens: number): void {
    if (!this.settings.preferences.trackUsage) {
      return;
    }

    if (!this.settings.usage[providerId]) {
      this.settings.usage[providerId] = {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        requestCount: 0,
        lastUsed: null,
      };
    }

    const usage = this.settings.usage[providerId];
    usage.promptTokens += promptTokens;
    usage.completionTokens += completionTokens;
    usage.totalTokens += promptTokens + completionTokens;
    usage.requestCount += 1;
    usage.lastUsed = new Date().toISOString();

    this.saveSettings();
  }

  /**
   * Get usage stats for provider
   */
  getUsage(providerId: string) {
    return this.settings.usage[providerId];
  }

  /**
   * Get total usage across all providers
   */
  getTotalUsage() {
    const allUsage = Object.values(this.settings.usage);
    return {
      totalTokens: allUsage.reduce((sum, u) => sum + u.totalTokens, 0),
      promptTokens: allUsage.reduce((sum, u) => sum + u.promptTokens, 0),
      completionTokens: allUsage.reduce((sum, u) => sum + u.completionTokens, 0),
      requestCount: allUsage.reduce((sum, u) => sum + u.requestCount, 0),
    };
  }

  /**
   * Reset usage stats
   */
  resetUsage(providerId?: string): void {
    if (providerId) {
      delete this.settings.usage[providerId];
    } else {
      this.settings.usage = {};
    }
    this.saveSettings();
  }

  /**
   * Update preferences
   */
  updatePreferences(preferences: Partial<UserAISettings['preferences']>): void {
    this.settings.preferences = {
      ...this.settings.preferences,
      ...preferences,
    };
    this.saveSettings();
  }

  /**
   * Get preferences
   */
  getPreferences() {
    return { ...this.settings.preferences };
  }

  /**
   * Reset all settings to defaults
   */
  resetSettings(): void {
    this.settings = getDefaultSettings();
    this.saveSettings();
  }

  /**
   * Export settings for backup
   */
  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings from backup
   */
  importSettings(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      this.settings = {
        ...getDefaultSettings(),
        ...parsed,
        preferences: {
          ...getDefaultSettings().preferences,
          ...parsed.preferences,
        },
      };
      this.saveSettings();
      return true;
    } catch (error) {
      console.error('Failed to import AI settings:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiSettingsService = new AISettingsService();
