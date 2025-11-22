/**
 * Shared AI Service Types
 * Common types and utilities for all AI services
 */

export * from '@/types/ai';

/**
 * AI Service Config
 */
export interface AIServiceConfig {
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number; // milliseconds
}

/**
 * AI Cache Entry
 */
export interface AICacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  metadata?: {
    model?: string;
    provider?: string;
  };
}

/**
 * AI Service Error Codes
 */
export enum AIErrorCode {
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * AI Service Error
 */
export class AIServiceError extends Error {
  code: AIErrorCode;
  details?: unknown;

  constructor(code: AIErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.details = details;
  }
}
