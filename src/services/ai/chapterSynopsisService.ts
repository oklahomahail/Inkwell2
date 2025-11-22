/**
 * AI Chapter Synopsis Generator (Wave 1, Feature #1)
 *
 * Generates structured chapter summaries using AI to help authors
 * understand their narrative structure, key beats, and emotional arcs.
 */

import { openDB } from 'idb';

import { aiService } from '@/services/aiService';
import type { ChapterSynopsis, AISuggestion, AIProcessingResult } from '@/types/ai';
import type { Chapter } from '@/types/project';
import devLog from '@/utils/devLog';

import { generateCacheKey, getCached, setCached } from './shared/caching';
import { chapterSynopsisPrompt, validateResponse, extractJSON } from './shared/promptTemplates';
import { AIServiceError, AIErrorCode } from './shared/types';

const DB_NAME = 'inkwell-ai';
const STORE_NAME = 'ai_suggestions';

/**
 * Generate chapter synopsis using AI
 */
export async function generateChapterSynopsis(
  chapter: Chapter,
  projectId: string,
  options?: {
    bypassCache?: boolean;
    signal?: AbortSignal;
  },
): Promise<AIProcessingResult<ChapterSynopsis>> {
  const startTime = performance.now();

  try {
    // Check cache first (unless bypassed)
    const cacheKey = generateCacheKey({
      type: 'synopsis',
      projectId,
      chapterId: chapter.id,
      content: chapter.content,
    });

    if (!options?.bypassCache) {
      const cached = await getCached<ChapterSynopsis>(cacheKey);
      if (cached) {
        devLog.log(`[ChapterSynopsis] Using cached result for chapter ${chapter.id}`);
        return {
          success: true,
          data: cached,
          metadata: {
            model: 'unknown',
            provider: 'unknown',
            latency: performance.now() - startTime,
            cached: true,
          },
        };
      }
    }

    // Generate prompt
    const prompt = chapterSynopsisPrompt(chapter);

    // Call AI service
    devLog.log(`[ChapterSynopsis] Generating synopsis for chapter ${chapter.id}...`);
    const result = await aiService.generate(prompt.user, {
      systemMessage: prompt.system,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
      signal: options?.signal,
    });

    // Parse and validate response
    const parsed = extractJSON(result.content);
    const validated = validateResponse(parsed, prompt.schema!);

    // Cache the result
    await setCached(cacheKey, validated, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      metadata: {
        model: result.model,
        provider: result.provider,
      },
    });

    // Store in database
    await storeChapterSynopsis(projectId, chapter.id, validated, {
      model: result.model,
      provider: result.provider,
      tokensUsed: result.usage?.totalTokens,
      latency: performance.now() - startTime,
    });

    devLog.log(`[ChapterSynopsis] Generated synopsis for chapter ${chapter.id}`);

    return {
      success: true,
      data: validated,
      metadata: {
        model: result.model,
        provider: result.provider,
        tokensUsed: result.usage?.totalTokens,
        latency: performance.now() - startTime,
        cached: false,
      },
    };
  } catch (error) {
    devLog.error('[ChapterSynopsis] Generation failed:', error);

    // Map error types
    let code = AIErrorCode.UNKNOWN;
    let message = 'Failed to generate chapter synopsis';

    if (error instanceof AIServiceError) {
      code = error.code;
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;

      // Infer error code from message
      if (message.includes('API key')) {
        code = AIErrorCode.INVALID_REQUEST;
      } else if (message.includes('rate limit')) {
        code = AIErrorCode.RATE_LIMIT;
      } else if (message.includes('network') || message.includes('fetch')) {
        code = AIErrorCode.NETWORK_ERROR;
      } else if (message.includes('timeout')) {
        code = AIErrorCode.TIMEOUT;
      }
    }

    return {
      success: false,
      error: {
        code,
        message,
        details: error,
      },
      metadata: {
        model: 'unknown',
        provider: 'unknown',
        latency: performance.now() - startTime,
        cached: false,
      },
    };
  }
}

/**
 * Store chapter synopsis in database
 */
async function storeChapterSynopsis(
  projectId: string,
  chapterId: string,
  synopsis: ChapterSynopsis,
  metadata: {
    model: string;
    provider: string;
    tokensUsed?: number;
    latency: number;
  },
): Promise<void> {
  try {
    const db = await openDB(DB_NAME, 1);

    const suggestion: AISuggestion = {
      id: `synopsis_${chapterId}_${Date.now()}`,
      projectId,
      chapterId,
      type: 'synopsis',
      content: synopsis,
      timestamp: Date.now(),
      metadata,
    };

    await db.put(STORE_NAME, suggestion);
    devLog.debug(`[ChapterSynopsis] Stored synopsis in database: ${suggestion.id}`);
  } catch (error) {
    devLog.error('[ChapterSynopsis] Failed to store in database:', error);
    // Don't throw - storage failure shouldn't break generation
  }
}

/**
 * Get stored chapter synopsis from database
 */
export async function getStoredChapterSynopsis(chapterId: string): Promise<AISuggestion | null> {
  try {
    const db = await openDB(DB_NAME, 1);

    // Query by chapterId index
    const index = db.transaction(STORE_NAME).store.index('chapterId');
    const suggestions = await index.getAll(chapterId);

    // Filter for synopsis type and get most recent
    const synopses = suggestions.filter((s) => s.type === 'synopsis');
    if (synopses.length === 0) return null;

    // Sort by timestamp descending
    synopses.sort((a, b) => b.timestamp - a.timestamp);

    return synopses[0];
  } catch (error) {
    devLog.error('[ChapterSynopsis] Failed to retrieve from database:', error);
    return null;
  }
}

/**
 * Get all synopses for a project
 */
export async function getProjectSynopses(projectId: string): Promise<AISuggestion[]> {
  try {
    const db = await openDB(DB_NAME, 1);

    // Use compound index for efficient query
    const index = db.transaction(STORE_NAME).store.index('project_type');
    const suggestions = await index.getAll([projectId, 'synopsis']);

    // Sort by timestamp descending
    suggestions.sort((a, b) => b.timestamp - a.timestamp);

    return suggestions;
  } catch (error) {
    devLog.error('[ChapterSynopsis] Failed to retrieve project synopses:', error);
    return [];
  }
}

/**
 * Delete synopsis suggestion
 */
export async function deleteChapterSynopsis(suggestionId: string): Promise<void> {
  try {
    const db = await openDB(DB_NAME, 1);
    await db.delete(STORE_NAME, suggestionId);
    devLog.debug(`[ChapterSynopsis] Deleted synopsis: ${suggestionId}`);
  } catch (error) {
    devLog.error('[ChapterSynopsis] Failed to delete synopsis:', error);
    throw new AIServiceError(AIErrorCode.UNKNOWN, 'Failed to delete synopsis', error);
  }
}

/**
 * Mark synopsis as accepted by user
 */
export async function acceptChapterSynopsis(
  suggestionId: string,
  feedback?: string,
): Promise<void> {
  try {
    const db = await openDB(DB_NAME, 1);

    const suggestion = await db.get(STORE_NAME, suggestionId);
    if (!suggestion) {
      throw new AIServiceError(AIErrorCode.INVALID_REQUEST, 'Synopsis not found');
    }

    suggestion.accepted = true;
    if (feedback) {
      suggestion.userFeedback = feedback;
    }

    await db.put(STORE_NAME, suggestion);
    devLog.debug(`[ChapterSynopsis] Accepted synopsis: ${suggestionId}`);
  } catch (error) {
    devLog.error('[ChapterSynopsis] Failed to accept synopsis:', error);
    throw new AIServiceError(AIErrorCode.UNKNOWN, 'Failed to accept synopsis', error);
  }
}
