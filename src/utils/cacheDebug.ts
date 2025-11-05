/**
 * Cache Debug Utilities
 *
 * Helper functions for inspecting cache behavior in browser console.
 * Usage: Open DevTools console and call these functions.
 */

/* eslint-disable no-console */

import { chapterCache } from '@/services/chapterCache';

import { getChapterQueryMetrics, clearChapterQueryMetrics } from './perf';

/**
 * Get cache statistics
 */
export function inspectCache() {
  const stats = chapterCache.getStats();
  console.group('📦 Chapter Cache Statistics');
  console.log('Size:', `${stats.size} / ${stats.capacity}`);
  console.log('TTL:', `${stats.ttl / 1000 / 60} minutes`);
  console.log('Hit rate:', calculateHitRate());
  console.log('Entries:', stats.entries);
  console.groupEnd();
  return stats;
}

/**
 * Get query performance metrics
 */
export function inspectMetrics() {
  const metrics = getChapterQueryMetrics();
  console.group('📊 Query Performance Metrics');
  console.log('p50 latency:', `${metrics.p50}ms`, metrics.p50 < 150 ? '✅' : '⚠️');
  console.log('p95 latency:', `${metrics.p95}ms`, metrics.p95 < 250 ? '✅' : '⚠️');
  console.log('Mean latency:', `${metrics.mean}ms`);
  console.log('Total queries:', metrics.count);
  console.groupEnd();
  return metrics;
}

/**
 * Clear cache and metrics for testing
 */
export function resetCache() {
  chapterCache.clear();
  clearChapterQueryMetrics();
  console.log('✅ Cache and metrics cleared');
}

/**
 * Estimate cache hit rate (rough approximation)
 */
function calculateHitRate(): string {
  const metrics = getChapterQueryMetrics();
  const _stats = chapterCache.getStats();

  if (metrics.count === 0) return 'N/A (no queries yet)';

  // Rough estimate: queries with < 50ms latency are likely cache hits
  // This is approximate since we don't track hit/miss explicitly
  const estimatedHits = Math.floor(metrics.count * (metrics.p50 < 50 ? 0.7 : 0.3));
  const hitRate = ((estimatedHits / metrics.count) * 100).toFixed(1);

  return `~${hitRate}% (estimated)`;
}

/**
 * Test cache expiration
 */
export function testTTL() {
  const testKey = 'test:ttl-check';
  const testData = { timestamp: Date.now() };

  chapterCache.set(testKey, testData);

  console.group('⏱️ TTL Test');
  console.log('Test entry added:', testKey);
  console.log('Check again in 6 minutes to verify expiration');
  console.log('Run: `window.Inkwell.cache.get("test:ttl-check")`');
  console.groupEnd();

  return testKey;
}

/**
 * Monitor cache in real-time
 */
export function monitorCache(intervalMs = 5000) {
  let count = 0;

  const intervalId = setInterval(() => {
    count++;
    console.clear();
    console.log(`📡 Cache Monitor (${count * (intervalMs / 1000)}s elapsed)`);
    inspectCache();
    inspectMetrics();
  }, intervalMs);

  console.log(`✅ Cache monitoring started. Call stopMonitor() to stop.`);

  return () => {
    clearInterval(intervalId);
    console.log('⏹️ Cache monitoring stopped');
  };
}

// Expose globally for console access
if (typeof window !== 'undefined') {
  (window as any).Inkwell = {
    ...(window as any).Inkwell,
    cache: {
      inspect: inspectCache,
      metrics: inspectMetrics,
      reset: resetCache,
      testTTL,
      monitor: monitorCache,
      // Raw access for advanced debugging
      raw: chapterCache,
    },
  };

  console.log('✅ Inkwell cache debug utilities loaded');
  console.log('Try: window.Inkwell.cache.inspect()');
}

/**
 * Quick health check
 */
export function healthCheck() {
  const metrics = getChapterQueryMetrics();
  const stats = chapterCache.getStats();

  const health = {
    cache: {
      utilization: `${((stats.size / stats.capacity) * 100).toFixed(1)}%`,
      status: stats.size < stats.capacity ? '✅ OK' : '⚠️ At capacity',
    },
    performance: {
      p50: `${metrics.p50}ms ${metrics.p50 < 150 ? '✅' : '⚠️'}`,
      p95: `${metrics.p95}ms ${metrics.p95 < 250 ? '✅' : '⚠️'}`,
      status: metrics.p50 < 150 && metrics.p95 < 250 ? '✅ Within targets' : '⚠️ Outside targets',
    },
    queries: {
      total: metrics.count,
      mean: `${metrics.mean}ms`,
    },
  };

  console.log('🏥 Cache Health Check');
  console.table(health);

  return health;
}
