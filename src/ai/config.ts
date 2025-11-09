/**
 * AI Configuration - Environment-based API Keys
 *
 * Simplified configuration using environment variables.
 * No user-managed API keys in baseline version.
 */

/**
 * Get API key from environment variables
 */
export function getApiKey(providerId: string): string | undefined {
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
