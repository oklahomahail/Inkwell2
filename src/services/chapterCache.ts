/**
 * Chapter Cache Service
 *
 * Implements chapter-level LRU cache with:
 * - Max 100 entries (configurable)
 * - 5-minute TTL per entry
 * - Cross-tab invalidation via BroadcastChannel
 * - Automatic eviction on capacity overflow
 *
 * Cache keys:
 * - chapterList:{projectId} → ChapterMeta[]
 * - chapterMeta:{chapterId} → ChapterMeta
 * - chapterDoc:{chapterId} → ChapterDoc
 */

import type { ChapterMeta } from '@/types/writing';

const CACHE_MAX_ENTRIES = 100;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const BROADCAST_CHANNEL_NAME = 'inkwell:chapter-cache';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

type CacheKey = string;
type InvalidationMessage = {
  type: 'invalidate';
  keys?: CacheKey[]; // Specific keys, or undefined for full invalidation
  projectId?: string; // For project-scoped invalidation
};

class ChapterCacheService {
  private cache = new Map<CacheKey, CacheEntry<unknown>>();
  private accessOrder: CacheKey[] = []; // LRU tracking
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.initBroadcastChannel();
  }

  /**
   * Initialize BroadcastChannel for cross-tab invalidation
   */
  private initBroadcastChannel(): void {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel not available - cross-tab cache sync disabled');
      return;
    }

    try {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent<InvalidationMessage>) => {
        const msg = event.data;
        if (msg.type === 'invalidate') {
          if (msg.keys) {
            // Invalidate specific keys
            msg.keys.forEach((key) => this.evict(key));
          } else if (msg.projectId) {
            // Invalidate all keys for a project
            this.invalidateProject(msg.projectId);
          } else {
            // Full invalidation
            this.clear();
          }
        }
      };
    } catch (error) {
      console.error('Failed to initialize BroadcastChannel:', error);
    }
  }

  /**
   * Get cached value with TTL check
   */
  get<T>(key: CacheKey): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    // Check TTL
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL_MS) {
      this.evict(key);
      return null;
    }

    // Update LRU position
    this.updateAccessOrder(key);

    return entry.data;
  }

  /**
   * Set cached value with LRU eviction if needed
   */
  set<T>(key: CacheKey, data: T): void {
    // Evict LRU entry if at capacity
    if (this.cache.size >= CACHE_MAX_ENTRIES && !this.cache.has(key)) {
      const lruKey = this.accessOrder[0];
      if (lruKey) {
        this.evict(lruKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key,
    });

    this.updateAccessOrder(key);
  }

  /**
   * Invalidate specific keys (local + broadcast)
   */
  invalidate(keys: CacheKey[]): void {
    keys.forEach((key) => this.evict(key));

    // Broadcast to other tabs
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'invalidate',
          keys,
        } satisfies InvalidationMessage);
      } catch (error) {
        console.error('Failed to broadcast invalidation:', error);
      }
    }
  }

  /**
   * Invalidate all entries for a project
   */
  invalidateProject(projectId: string): void {
    const keysToInvalidate: CacheKey[] = [];

    // Find all keys related to this project
    for (const key of this.cache.keys()) {
      if (key.startsWith(`chapterList:${projectId}`) || key.includes(`:${projectId}:`)) {
        keysToInvalidate.push(key);
      }
    }

    keysToInvalidate.forEach((key) => this.evict(key));

    // Broadcast to other tabs
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'invalidate',
          projectId,
        } satisfies InvalidationMessage);
      } catch (error) {
        console.error('Failed to broadcast project invalidation:', error);
      }
    }
  }

  /**
   * Clear entire cache (local + broadcast)
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];

    // Broadcast to other tabs
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'invalidate',
        } satisfies InvalidationMessage);
      } catch (error) {
        console.error('Failed to broadcast clear:', error);
      }
    }
  }

  /**
   * Evict a single key without broadcasting
   */
  private evict(key: CacheKey): void {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Update LRU access order
   */
  private updateAccessOrder(key: CacheKey): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key); // Most recently used at end
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      capacity: CACHE_MAX_ENTRIES,
      ttl: CACHE_TTL_MS,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cleanup: close BroadcastChannel
   */
  destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

// Singleton instance
export const chapterCache = new ChapterCacheService();

/**
 * Cache key builders
 */
export const CacheKeys = {
  chapterList: (projectId: string) => `chapterList:${projectId}`,
  chapterMeta: (chapterId: string) => `chapterMeta:${chapterId}`,
  chapterDoc: (chapterId: string) => `chapterDoc:${chapterId}`,
};

/**
 * Helper: Wrap ChapterMeta[] query with cache
 */
export async function withChapterListCache(
  projectId: string,
  fetcher: () => Promise<ChapterMeta[]>,
): Promise<ChapterMeta[]> {
  const key = CacheKeys.chapterList(projectId);
  const cached = chapterCache.get<ChapterMeta[]>(key);

  if (cached) {
    return cached;
  }

  const data = await fetcher();
  chapterCache.set(key, data);
  return data;
}

/**
 * Helper: Wrap ChapterMeta query with cache
 */
export async function withChapterMetaCache(
  chapterId: string,
  fetcher: () => Promise<ChapterMeta | null>,
): Promise<ChapterMeta | null> {
  const key = CacheKeys.chapterMeta(chapterId);
  const cached = chapterCache.get<ChapterMeta | null>(key);

  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  if (data) {
    chapterCache.set(key, data);
  }
  return data;
}
