/**
 * Platform AI Service
 *
 * Provides access to Inkwell's platform-side AI endpoints.
 * These endpoints use the platform's API keys (not the user's personal keys).
 *
 * Used for "Free AI" features like:
 * - Generate Outline with AI
 * - Brainstorming prompts
 * - Writing suggestions
 * - Light planning AI
 */

import devLog from '@/utils/devLog';

export interface PlatformAiOptions {
  provider?: 'anthropic' | 'openai' | 'google';
  model?: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface PlatformAiResponse {
  text: string;
}

class PlatformAiService {
  private baseUrl = '/api/ai/simple';

  /**
   * Check if platform AI is available
   * (Always true - it's a platform feature, not dependent on user API keys)
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Generate text using platform AI
   */
  async generate(prompt: string, options?: PlatformAiOptions): Promise<string> {
    try {
      devLog.debug('🤖 Platform AI: Generating response...');

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: options?.provider || 'anthropic',
          model: options?.model,
          system: options?.system,
          prompt,
          temperature: options?.temperature ?? 0.7,
          maxTokens: options?.maxTokens ?? 1000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        const errorText = await response.text();
        throw new Error(`Platform AI error: ${errorText}`);
      }

      const data: PlatformAiResponse = await response.json();
      devLog.debug('✅ Platform AI: Response received');

      return data.text;
    } catch (error) {
      devLog.error('❌ Platform AI: Generation failed', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Generate a story outline using platform AI
   *
   * This is the "Free AI" version of outline generation that doesn't
   * require the user to provide their own Claude API key.
   */
  async generateStoryOutline(prompt: string): Promise<string> {
    devLog.debug('📖 Platform AI: Generating story outline...');

    return this.generate(prompt, {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.8,
      maxTokens: 1000, // Capped by /api/ai/simple to 1000
    });
  }
}

export const platformAiService = new PlatformAiService();
