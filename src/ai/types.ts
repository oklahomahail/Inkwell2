/**
 * AI Provider Types
 *
 * Core types and interfaces for multi-provider AI integration.
 * Supports both free models and user-provided API keys.
 */

/**
 * Streaming chunk from AI provider
 */
export interface AIStreamChunk {
  content: string;
  isComplete: boolean;
  provider?: string;
  model?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Options for AI generation
 */
export interface AIGenerateOptions {
  /** User's API key (if provider requires it) */
  apiKey?: string;
  /** Specific model to use (e.g., "gpt-4", "claude-3-opus") */
  model?: string;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for randomness (0-2) */
  temperature?: number;
  /** System message/context */
  systemMessage?: string;
  /** Streaming callback */
  onStream?: (chunk: AIStreamChunk) => void;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Result from AI generation
 */
export interface AIGenerateResult {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
}

/**
 * Base interface for AI providers
 */
export interface AIProvider {
  /** Unique identifier (e.g., "openai", "anthropic") */
  id: string;

  /** Display name */
  name: string;

  /** Brief description */
  description: string;

  /** Whether this provider requires an API key */
  requiresKey: boolean;

  /** Available models for this provider */
  models: AIModel[];

  /** Default model ID */
  defaultModel: string;

  /**
   * Generate text from prompt
   */
  generate(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResult>;

  /**
   * Generate text with streaming (optional, falls back to generate if not supported)
   */
  generateStream?(prompt: string, options?: AIGenerateOptions): AsyncIterable<AIStreamChunk>;

  /**
   * Validate API key format (basic client-side validation)
   */
  validateKey?(key: string): boolean;
}

/**
 * Model information
 */
export interface AIModel {
  /** Unique model ID */
  id: string;

  /** Display name */
  name: string;

  /** Brief description */
  description: string;

  /** Whether this is a free/demo model */
  isFree: boolean;

  /** Context window size in tokens */
  contextWindow: number;

  /** Cost per 1M input tokens (USD, null if free) */
  inputCost?: number | null;

  /** Cost per 1M output tokens (USD, null if free) */
  outputCost?: number | null;

  /** Maximum output tokens */
  maxOutputTokens: number;

  /** Supports streaming */
  supportsStreaming: boolean;
}

/**
 * User's AI provider settings
 */
export interface UserAISettings {
  /** Default provider ID */
  defaultProvider: string;

  /** Default model ID for the provider */
  defaultModel: string;

  /** Encrypted API keys by provider ID */
  apiKeys: Record<string, string>;

  /** Usage tracking per provider */
  usage: Record<
    string,
    {
      totalTokens: number;
      promptTokens: number;
      completionTokens: number;
      requestCount: number;
      lastUsed: string | null;
    }
  >;

  /** Preferences */
  preferences: {
    /** Auto-fallback to free model on error */
    autoFallback: boolean;

    /** Default temperature */
    temperature: number;

    /** Default max tokens */
    maxTokens: number;

    /** Track usage stats */
    trackUsage: boolean;
  };
}

/**
 * Error types for AI operations
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class AIKeyError extends AIProviderError {
  constructor(provider: string, message = 'Invalid or missing API key') {
    super(message, provider, 'KEY_ERROR');
    this.name = 'AIKeyError';
  }
}

export class AIRateLimitError extends AIProviderError {
  constructor(provider: string, message = 'Rate limit exceeded') {
    super(message, provider, 'RATE_LIMIT');
    this.name = 'AIRateLimitError';
  }
}

export class AIQuotaError extends AIProviderError {
  constructor(provider: string, message = 'Quota exceeded') {
    super(message, provider, 'QUOTA_EXCEEDED');
    this.name = 'AIQuotaError';
  }
}
