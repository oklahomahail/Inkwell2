/**
 * AI Publishing Tools Service (Wave 1, Feature #3)
 *
 * Generates professional publishing materials including blurbs,
 * query letters, and synopses for manuscript submissions.
 */

import { openDB } from 'idb';

import { aiService } from '@/services/aiService';
import type { PublishingMaterials, AISuggestion, AIProcessingResult } from '@/types/ai';
import type { Chapter } from '@/types/project';
import devLog from '@/utils/devLog';

import { generateCacheKey, getCached, setCached } from './shared/caching';
import { publishingMaterialsPrompt, validateResponse, extractJSON } from './shared/promptTemplates';
import { AIServiceError, AIErrorCode } from './shared/types';

const DB_NAME = 'inkwell-ai';
const STORE_NAME = 'ai_suggestions';

export type PublishingMaterialType = 'blurb' | 'query' | 'synopsis-1' | 'synopsis-3';

/**
 * Generate publishing material using AI
 */
export async function generatePublishingMaterial(
  projectId: string,
  chapters: Chapter[],
  type: PublishingMaterialType,
  options?: {
    genre?: string;
    description?: string;
    bypassCache?: boolean;
    signal?: AbortSignal;
  },
): Promise<AIProcessingResult<PublishingMaterials>> {
  const startTime = performance.now();

  try {
    // Check cache first (unless bypassed)
    const cacheKey = generateCacheKey({
      type: `publishing_${type}`,
      projectId,
      content: chapters.map((ch) => ch.id).join(','),
    });

    if (!options?.bypassCache) {
      const cached = await getCached<PublishingMaterials>(cacheKey);
      if (cached) {
        devLog.log(`[PublishingTools] Using cached result for ${type}`);
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
    const prompt = publishingMaterialsPrompt({
      chapters,
      genre: options?.genre,
      description: options?.description,
      type,
    });

    // Call AI service
    devLog.log(`[PublishingTools] Generating ${type} for project ${projectId}...`);
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
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days (longer for publishing materials)
      metadata: {
        model: result.model,
        provider: result.provider,
      },
    });

    // Store in database
    await storePublishingMaterial(projectId, type, validated, {
      model: result.model,
      provider: result.provider,
      tokensUsed: result.usage?.totalTokens,
      latency: performance.now() - startTime,
    });

    devLog.log(`[PublishingTools] Generated ${type} for project ${projectId}`);

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
    devLog.error('[PublishingTools] Generation failed:', error);

    // Map error types
    let code = AIErrorCode.UNKNOWN;
    let message = `Failed to generate ${type}`;

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
 * Store publishing material in database
 */
async function storePublishingMaterial(
  projectId: string,
  type: PublishingMaterialType,
  material: PublishingMaterials,
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
      id: `publishing_${type}_${projectId}_${Date.now()}`,
      projectId,
      type: 'publishing',
      content: {
        materialType: type,
        ...material,
      },
      timestamp: Date.now(),
      metadata,
    };

    await db.put(STORE_NAME, suggestion);
    devLog.debug(`[PublishingTools] Stored ${type} in database: ${suggestion.id}`);
  } catch (error) {
    devLog.error('[PublishingTools] Failed to store in database:', error);
    // Don't throw - storage failure shouldn't break generation
  }
}

/**
 * Get stored publishing materials for a project
 */
export async function getStoredPublishingMaterials(
  projectId: string,
): Promise<Map<PublishingMaterialType, AISuggestion>> {
  try {
    const db = await openDB(DB_NAME, 1);

    // Use compound index for efficient query
    const index = db.transaction(STORE_NAME).store.index('project_type');
    const suggestions = await index.getAll([projectId, 'publishing']);

    // Organize by material type
    const materials = new Map<PublishingMaterialType, AISuggestion>();

    for (const suggestion of suggestions) {
      const content = suggestion.content as { materialType?: PublishingMaterialType };
      const materialType = content.materialType;

      if (materialType) {
        // Keep most recent of each type
        const existing = materials.get(materialType);
        if (!existing || suggestion.timestamp > existing.timestamp) {
          materials.set(materialType, suggestion);
        }
      }
    }

    return materials;
  } catch (error) {
    devLog.error('[PublishingTools] Failed to retrieve from database:', error);
    return new Map();
  }
}

/**
 * Delete publishing material
 */
export async function deletePublishingMaterial(suggestionId: string): Promise<void> {
  try {
    const db = await openDB(DB_NAME, 1);
    await db.delete(STORE_NAME, suggestionId);
    devLog.debug(`[PublishingTools] Deleted material: ${suggestionId}`);
  } catch (error) {
    devLog.error('[PublishingTools] Failed to delete material:', error);
    throw new AIServiceError(AIErrorCode.UNKNOWN, 'Failed to delete publishing material', error);
  }
}

/**
 * Generate complete publishing package
 */
export async function generatePublishingPackage(
  projectId: string,
  chapters: Chapter[],
  options?: {
    genre?: string;
    description?: string;
    materials?: PublishingMaterialType[];
    bypassCache?: boolean;
    onProgress?: (completed: number, total: number, current: PublishingMaterialType) => void;
    signal?: AbortSignal;
  },
): Promise<{
  success: boolean;
  materials: Partial<Record<PublishingMaterialType, PublishingMaterials>>;
  errors: Partial<Record<PublishingMaterialType, string>>;
  metadata: {
    completed: number;
    total: number;
    duration: number;
  };
}> {
  const startTime = performance.now();

  // Determine which materials to generate
  const materialsToGenerate: PublishingMaterialType[] = options?.materials || [
    'blurb',
    'query',
    'synopsis-1',
    'synopsis-3',
  ];

  const total = materialsToGenerate.length;
  let completed = 0;

  const materials: Partial<Record<PublishingMaterialType, PublishingMaterials>> = {};
  const errors: Partial<Record<PublishingMaterialType, string>> = {};

  devLog.log(`[PublishingTools] Generating ${total} materials for project ${projectId}...`);

  for (const type of materialsToGenerate) {
    if (options?.signal?.aborted) {
      devLog.log('[PublishingTools] Package generation aborted');
      break;
    }

    if (options?.onProgress) {
      options.onProgress(completed, total, type);
    }

    const result = await generatePublishingMaterial(projectId, chapters, type, {
      genre: options?.genre,
      description: options?.description,
      bypassCache: options?.bypassCache,
      signal: options?.signal,
    });

    if (result.success && result.data) {
      materials[type] = result.data;
    } else if (result.error) {
      errors[type] = result.error.message;
    }

    completed++;
  }

  if (options?.onProgress && materialsToGenerate.length > 0) {
    const lastMaterial = materialsToGenerate[materialsToGenerate.length - 1]!;
    options.onProgress(completed, total, lastMaterial);
  }

  const duration = performance.now() - startTime;
  const success = Object.keys(materials).length === total;

  devLog.log(
    `[PublishingTools] Package generation ${success ? 'completed' : 'partially completed'} (${completed}/${total} in ${duration.toFixed(0)}ms)`,
  );

  return {
    success,
    materials,
    errors,
    metadata: {
      completed,
      total,
      duration,
    },
  };
}
