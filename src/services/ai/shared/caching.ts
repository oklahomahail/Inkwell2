/**
 * AI Response Caching Utility
 * Provides efficient caching for AI API responses to reduce costs and latency
 */

import { openDB } from 'idb';

import devLog from '@/utils/devLog';

import type { AICacheEntry } from './types';

const DB_NAME = 'inkwell-ai';
const STORE_NAME = 'ai_suggestions';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate cache key from request parameters
 */
export function generateCacheKey(params: {
  type: string;
  projectId?: string;
  chapterId?: string;
  content?: string;
}): string {
  const parts = [params.type, params.projectId, params.chapterId].filter(Boolean);

  // Add content hash if provided
  if (params.content) {
    const contentHash = simpleHash(params.content);
    parts.push(contentHash);
  }

  return parts.join(':');
}

/**
 * Simple hash function for content
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get AI response from cache
 */
export async function getCached<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = await openDB(DB_NAME, 1);
    const entry = await db.get(STORE_NAME, key);

    if (!entry) {
      devLog.log(`[AICache] Miss: ${key}`);
      return null;
    }

    // Check if expired
    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > (entry.ttl || DEFAULT_TTL)) {
      devLog.log(`[AICache] Expired: ${key} (age: ${age}ms)`);
      await db.delete(STORE_NAME, key);
      return null;
    }

    devLog.log(`[AICache] Hit: ${key} (age: ${age}ms)`);
    return entry.data as T;
  } catch (error) {
    devLog.error('[AICache] Get error:', error);
    return null;
  }
}

/**
 * Store AI response in cache
 */
export async function setCached<T = unknown>(
  key: string,
  data: T,
  options?: {
    ttl?: number;
    metadata?: AICacheEntry['metadata'];
  },
): Promise<void> {
  try {
    const db = await openDB(DB_NAME, 1);

    const entry: AICacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl: options?.ttl || DEFAULT_TTL,
      metadata: options?.metadata,
    };

    await db.put(STORE_NAME, entry);
    devLog.log(`[AICache] Set: ${key}`);
  } catch (error) {
    devLog.error('[AICache] Set error:', error);
    // Don't throw - caching is optional
  }
}

/**
 * Invalidate cache entries by pattern
 */
export async function invalidateCache(pattern: {
  projectId?: string;
  chapterId?: string;
  type?: string;
}): Promise<number> {
  try {
    const db = await openDB(DB_NAME, 1);
    let count = 0;

    // Build index query based on pattern
    if (pattern.projectId && pattern.type) {
      // Use compound index
      const index = db.transaction(STORE_NAME).store.index('project_type');
      const keys = await index.getAllKeys([pattern.projectId, pattern.type]);
      for (const key of keys) {
        await db.delete(STORE_NAME, key);
        count++;
      }
    } else if (pattern.projectId) {
      // Use projectId index
      const index = db.transaction(STORE_NAME).store.index('projectId');
      const keys = await index.getAllKeys(pattern.projectId);
      for (const key of keys) {
        await db.delete(STORE_NAME, key);
        count++;
      }
    } else if (pattern.chapterId) {
      // Use chapterId index
      const index = db.transaction(STORE_NAME).store.index('chapterId');
      const keys = await index.getAllKeys(pattern.chapterId);
      for (const key of keys) {
        await db.delete(STORE_NAME, key);
        count++;
      }
    } else if (pattern.type) {
      // Use type index
      const index = db.transaction(STORE_NAME).store.index('type');
      const keys = await index.getAllKeys(pattern.type);
      for (const key of keys) {
        await db.delete(STORE_NAME, key);
        count++;
      }
    }

    devLog.log(`[AICache] Invalidated ${count} entries`, pattern);
    return count;
  } catch (error) {
    devLog.error('[AICache] Invalidate error:', error);
    return 0;
  }
}

/**
 * Clean up expired cache entries
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    const db = await openDB(DB_NAME, 1);
    const now = Date.now();
    let count = 0;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const entries = await store.getAll();

    for (const entry of entries) {
      const age = now - entry.timestamp;
      if (age > (entry.ttl || DEFAULT_TTL)) {
        await store.delete(entry.key);
        count++;
      }
    }

    await tx.done;
    devLog.log(`[AICache] Cleaned ${count} expired entries`);
    return count;
  } catch (error) {
    devLog.error('[AICache] Clean error:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSize: number;
  oldestEntry: number;
  newestEntry: number;
}> {
  try {
    const db = await openDB(DB_NAME, 1);
    const entries = await db.getAll(STORE_NAME);

    const timestamps = entries.map((e) => e.timestamp);

    return {
      totalEntries: entries.length,
      totalSize: JSON.stringify(entries).length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps),
    };
  } catch (error) {
    devLog.error('[AICache] Stats error:', error);
    return {
      totalEntries: 0,
      totalSize: 0,
      oldestEntry: 0,
      newestEntry: 0,
    };
  }
}
