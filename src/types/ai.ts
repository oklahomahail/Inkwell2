export type AiProvider = 'anthropic' | 'openai' | 'google';

export type AiModel =
  // Anthropic
  | 'claude-3-5-sonnet-20241022'
  // OpenAI
  | 'gpt-4o-mini'
  | 'gpt-4o'
  // Google
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro';

export interface AiRequest {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AiResponseChunk {
  content: string;
  done?: boolean;
}

export interface AiSettings {
  mode: 'simple' | 'custom';
  provider: AiProvider;
  model: AiModel;
  customApiKey?: string | null;
}

/**
 * AI Feature Types - Wave 1-8
 * Extended types for AI-powered writing assistance features
 */

import type { z } from 'zod';

/**
 * AI Suggestion Types
 */
export type AISuggestionType =
  | 'synopsis'
  | 'classification'
  | 'publishing'
  | 'outline_comparison'
  | 'revision'
  | 'semantic_analysis'
  | 'scene_purpose'
  | 'tension_tracking';

/**
 * AI Suggestion - Base interface for all AI-generated content
 */
export interface AISuggestion {
  id: string;
  projectId: string;
  chapterId?: string;
  type: AISuggestionType;
  content: unknown;
  timestamp: number;
  accepted?: boolean;
  userFeedback?: string;
  metadata?: {
    model?: string;
    provider?: string;
    tokensUsed?: number;
    latency?: number;
  };
}

/**
 * Chapter Synopsis (Wave 1, Feature #1)
 */
export interface ChapterSynopsis {
  summary: string;
  keyBeats: string[];
  emotionalArc: string;
  conflicts: string[];
  generatedAt: number;
}

/**
 * Scene Types (Wave 1, Feature #2)
 */
export type SceneType =
  | 'conflict'
  | 'reveal'
  | 'transition'
  | 'action'
  | 'emotional'
  | 'setup'
  | 'resolution';

/**
 * Scene Metadata (Wave 1-2)
 */
export interface SceneMetadata {
  chapterId: string;
  sceneType?: SceneType;
  narrativePurpose?: string;
  missingElements?: string[];
  emotionalScore?: number; // -1 to +1
  tensionScore?: number; // 0 to 10
  narrativeFunction?: 'setup' | 'development' | 'payoff';
  confidence?: number; // 0 to 1
  analyzedAt?: number;
  updatedAt?: number; // Timestamp of last metadata update
  isStale?: boolean; // True if content has changed since last classification
}

/**
 * Publishing Materials (Wave 1, Feature #3)
 */
export interface PublishingMaterials {
  blurb?: string;
  queryLetter?: string;
  synopsisOnePage?: string;
  synopsisThreePage?: string;
  generatedAt: number;
}

/**
 * Outline Comparison (Wave 1, Feature #4)
 */
export interface OutlineComparisonResult {
  matches: OutlineMatch[];
  divergences: OutlineDivergence[];
  forgottenBeats: ForgottenBeat[];
  analyzedAt: number;
}

export interface OutlineMatch {
  plotNoteId: string;
  chapterId: string;
  similarity: number; // 0 to 1
  explanation?: string;
}

export interface OutlineDivergence {
  plotNoteId: string;
  chapterId?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface ForgottenBeat {
  plotNoteId: string;
  expectedPosition?: number;
  reason: string;
}

/**
 * Prompt Template with Schema Validation
 */
export interface PromptTemplate<T = unknown> {
  system: string;
  user: string;
  schema?: z.ZodSchema<T>;
  temperature?: number;
  maxTokens?: number;
}

/**
 * AI Processing Result
 */
export interface AIProcessingResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata: {
    model: string;
    provider: string;
    tokensUsed?: number;
    latency: number;
    cached?: boolean;
  };
}
