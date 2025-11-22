/**
 * AI Scene Classification Service (Wave 1, Feature #2)
 *
 * Classifies scenes into narrative types to help authors understand
 * the purpose and function of each scene in their story structure.
 */

import { openDB } from 'idb';

import { aiService } from '@/services/aiService';
import type { SceneType, SceneMetadata, AIProcessingResult } from '@/types/ai';
import devLog from '@/utils/devLog';

import { generateCacheKey, getCached, setCached } from './shared/caching';
import { sceneClassificationPrompt, validateResponse, extractJSON } from './shared/promptTemplates';
import { AIServiceError, AIErrorCode } from './shared/types';

const DB_NAME = 'inkwell-ai';
const METADATA_STORE = 'scene_metadata';

/**
 * Classify scene content using AI
 */
export async function classifyScene(
  chapterId: string,
  content: string,
  options?: {
    bypassCache?: boolean;
    signal?: AbortSignal;
  },
): Promise<AIProcessingResult<SceneMetadata>> {
  const startTime = performance.now();

  try {
    // Check cache first (unless bypassed)
    const cacheKey = generateCacheKey({
      type: 'classification',
      chapterId,
      content,
    });

    if (!options?.bypassCache) {
      const cached = await getCached<SceneMetadata>(cacheKey);
      if (cached) {
        devLog.log(`[SceneClassification] Using cached result for chapter ${chapterId}`);
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
    const prompt = sceneClassificationPrompt(content);

    // Call AI service
    devLog.log(`[SceneClassification] Classifying scene for chapter ${chapterId}...`);
    const result = await aiService.generate(prompt.user, {
      systemMessage: prompt.system,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
      signal: options?.signal,
    });

    // Parse and validate response
    const parsed = extractJSON(result.content);
    const validated = validateResponse(parsed, prompt.schema!);

    // Build full scene metadata
    const sceneMetadata: SceneMetadata = {
      chapterId,
      sceneType: validated.sceneType,
      confidence: validated.confidence,
      analyzedAt: Date.now(),
    };

    // Cache the result
    await setCached(cacheKey, sceneMetadata, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      metadata: {
        model: result.model,
        provider: result.provider,
      },
    });

    // Store in database (with updatedAt and clear stale flag)
    await storeSceneMetadata(
      { ...sceneMetadata, updatedAt: Date.now(), isStale: false },
      {
        model: result.model,
        provider: result.provider,
        tokensUsed: result.usage?.totalTokens,
        latency: performance.now() - startTime,
      },
    );

    devLog.log(
      `[SceneClassification] Classified scene for chapter ${chapterId}: ${validated.sceneType} (confidence: ${validated.confidence})`,
    );

    return {
      success: true,
      data: sceneMetadata,
      metadata: {
        model: result.model,
        provider: result.provider,
        tokensUsed: result.usage?.totalTokens,
        latency: performance.now() - startTime,
        cached: false,
      },
    };
  } catch (error) {
    devLog.error('[SceneClassification] Classification failed:', error);

    // Map error types
    let code = AIErrorCode.UNKNOWN;
    let message = 'Failed to classify scene';

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
 * Store scene metadata in database
 */
async function storeSceneMetadata(
  metadata: SceneMetadata,
  processingMetadata: {
    model: string;
    provider: string;
    tokensUsed?: number;
    latency: number;
  },
): Promise<void> {
  try {
    const db = await openDB(DB_NAME, 1);

    // Store with processing metadata for analytics
    const record = {
      ...metadata,
      _processing: processingMetadata,
    };

    await db.put(METADATA_STORE, record);
    devLog.debug(
      `[SceneClassification] Stored metadata in database for chapter ${metadata.chapterId}`,
    );
  } catch (error) {
    devLog.error('[SceneClassification] Failed to store in database:', error);
    // Don't throw - storage failure shouldn't break classification
  }
}

/**
 * Get stored scene metadata from database
 */
export async function getStoredSceneMetadata(chapterId: string): Promise<SceneMetadata | null> {
  try {
    const db = await openDB(DB_NAME, 1);
    const record = await db.get(METADATA_STORE, chapterId);

    if (!record) {
      return null;
    }

    // Strip processing metadata before returning
    const { _processing, ...metadata } = record;
    return metadata as SceneMetadata;
  } catch (error) {
    devLog.error('[SceneClassification] Failed to retrieve from database:', error);
    return null;
  }
}

/**
 * Get all scene metadata for multiple chapters
 */
export async function getBulkSceneMetadata(
  chapterIds: string[],
): Promise<Map<string, SceneMetadata>> {
  try {
    const db = await openDB(DB_NAME, 1);
    const tx = db.transaction(METADATA_STORE, 'readonly');
    const store = tx.objectStore(METADATA_STORE);

    const results = new Map<string, SceneMetadata>();

    await Promise.all(
      chapterIds.map(async (id) => {
        const record = await store.get(id);
        if (record) {
          const { _processing, ...metadata } = record;
          results.set(id, metadata as SceneMetadata);
        }
      }),
    );

    await tx.done;
    return results;
  } catch (error) {
    devLog.error('[SceneClassification] Failed to retrieve bulk metadata:', error);
    return new Map();
  }
}

/**
 * Get statistics about scene types in a project
 */
export async function getSceneTypeStats(): Promise<Record<SceneType, number>> {
  try {
    const db = await openDB(DB_NAME, 1);
    const allMetadata = await db.getAll(METADATA_STORE);

    const stats: Record<SceneType, number> = {
      conflict: 0,
      reveal: 0,
      transition: 0,
      action: 0,
      emotional: 0,
      setup: 0,
      resolution: 0,
    };

    for (const record of allMetadata) {
      const sceneType = record.sceneType as SceneType;
      if (sceneType && sceneType in stats) {
        stats[sceneType]++;
      }
    }

    return stats;
  } catch (error) {
    devLog.error('[SceneClassification] Failed to get stats:', error);
    return {
      conflict: 0,
      reveal: 0,
      transition: 0,
      action: 0,
      emotional: 0,
      setup: 0,
      resolution: 0,
    };
  }
}

/**
 * Delete scene metadata
 */
export async function deleteSceneMetadata(chapterId: string): Promise<void> {
  try {
    const db = await openDB(DB_NAME, 1);
    await db.delete(METADATA_STORE, chapterId);
    devLog.debug(`[SceneClassification] Deleted metadata for chapter ${chapterId}`);
  } catch (error) {
    devLog.error('[SceneClassification] Failed to delete metadata:', error);
    throw new AIServiceError(AIErrorCode.UNKNOWN, 'Failed to delete scene metadata', error);
  }
}

/**
 * Bulk classify multiple scenes
 */
export async function classifyScenes(
  scenes: Array<{ chapterId: string; content: string }>,
  options?: {
    bypassCache?: boolean;
    onProgress?: (completed: number, total: number) => void;
    signal?: AbortSignal;
  },
): Promise<Map<string, AIProcessingResult<SceneMetadata>>> {
  const results = new Map<string, AIProcessingResult<SceneMetadata>>();
  const total = scenes.length;
  let completed = 0;

  devLog.log(`[SceneClassification] Classifying ${total} scenes...`);

  for (const scene of scenes) {
    if (options?.signal?.aborted) {
      devLog.log('[SceneClassification] Bulk classification aborted');
      break;
    }

    const result = await classifyScene(scene.chapterId, scene.content, {
      bypassCache: options?.bypassCache,
      signal: options?.signal,
    });

    results.set(scene.chapterId, result);
    completed++;

    if (options?.onProgress) {
      options.onProgress(completed, total);
    }
  }

  devLog.log(`[SceneClassification] Classified ${completed}/${total} scenes`);
  return results;
}

/**
 * Mark scene metadata as stale (content has changed)
 * This signals that the metadata should be refreshed on next view
 */
export async function markSceneMetadataStale(chapterId: string): Promise<void> {
  try {
    const db = await openDB(DB_NAME, 1);
    const existing = await db.get(METADATA_STORE, chapterId);

    if (existing) {
      // Update existing record to mark as stale
      await db.put(METADATA_STORE, {
        ...existing,
        isStale: true,
        updatedAt: Date.now(),
      });
      devLog.debug(`[SceneClassification] Marked metadata as stale for chapter ${chapterId}`);
    }
  } catch (error) {
    devLog.error('[SceneClassification] Failed to mark metadata as stale:', error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Refresh scene metadata if it's stale or missing
 * Includes rate limiting to avoid hammering the AI API
 */
export async function refreshSceneMetadataIfStale(
  chapterId: string,
  content: string,
  options?: {
    forceRefresh?: boolean; // Bypass all checks and refresh anyway
    signal?: AbortSignal;
  },
): Promise<AIProcessingResult<SceneMetadata> | null> {
  try {
    const db = await openDB(DB_NAME, 1);
    const existing = await db.get(METADATA_STORE, chapterId);

    // Check if refresh is needed
    const needsRefresh =
      options?.forceRefresh || !existing || existing.isStale || !existing.sceneType;

    if (!needsRefresh) {
      devLog.debug(
        `[SceneClassification] Skipping refresh for chapter ${chapterId} - metadata is fresh`,
      );
      return null;
    }

    // Rate limiting: don't refresh if last update was within cooldown period (2 minutes)
    const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes
    if (
      !options?.forceRefresh &&
      existing?.updatedAt &&
      Date.now() - existing.updatedAt < COOLDOWN_MS
    ) {
      devLog.debug(
        `[SceneClassification] Skipping refresh for chapter ${chapterId} - within cooldown period`,
      );
      return null;
    }

    // Perform classification
    devLog.log(`[SceneClassification] Refreshing metadata for chapter ${chapterId}...`);
    const result = await classifyScene(chapterId, content, {
      bypassCache: options?.forceRefresh, // Only bypass cache if forced
      signal: options?.signal,
    });

    return result;
  } catch (error) {
    devLog.error('[SceneClassification] Failed to refresh metadata:', error);
    return null;
  }
}
