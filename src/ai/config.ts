/**
 * AI Configuration - Environment-based API Keys with User Overrides
 *
 * Baseline: Uses environment variables
 * Advanced Mode: Allows user-provided API key overrides stored in localStorage
 */

const USER_KEYS_STORAGE_KEY = 'inkwell_user_api_keys';

/**
 * Get user-provided API keys from localStorage
 */
function getUserApiKeys(): Record<string, string> {
  try {
    const stored = localStorage.getItem(USER_KEYS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Set user API key for a provider (Advanced Mode)
 */
export function setUserApiKey(providerId: string, key: string): void {
  try {
    const userKeys = getUserApiKeys();
    userKeys[providerId] = key;
    localStorage.setItem(USER_KEYS_STORAGE_KEY, JSON.stringify(userKeys));
  } catch {
    // Ignore localStorage errors (e.g., quota exceeded, private mode)
  }
}

/**
 * Remove user API key for a provider
 */
export function removeUserApiKey(providerId: string): void {
  try {
    const userKeys = getUserApiKeys();
    delete userKeys[providerId];
    localStorage.setItem(USER_KEYS_STORAGE_KEY, JSON.stringify(userKeys));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Get API key from user overrides or environment variables
 * Priority: User override > Environment variable
 */
export function getApiKey(providerId: string): string | undefined {
  // Check user override first (Advanced Mode)
  const userKeys = getUserApiKeys();
  if (userKeys[providerId]) {
    return userKeys[providerId];
  }

  // Fallback to environment variables (Baseline)
  switch (providerId) {
    case 'openai':
      return import.meta.env.VITE_OPENAI_API_KEY;
    case 'anthropic':
      return import.meta.env.VITE_ANTHROPIC_API_KEY;
    case 'google':
      return import.meta.env.VITE_GOOGLE_API_KEY;
    default:
      return undefined;
  }
}

/**
 * Check if API key is available for provider
 */
export function hasApiKey(providerId: string): boolean {
  return !!getApiKey(providerId);
}

/**
 * Get all providers with available API keys
 */
export function getAvailableProviders(): string[] {
  const providers = ['openai', 'anthropic', 'google'];
  return providers.filter((p) => hasApiKey(p));
}
