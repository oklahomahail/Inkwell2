/**
 * Lightweight performance measurement utilities for dev/CI
 * Usage:
 *   mark('app:boot')
 *   // ... some work ...
 *   measure('tti:dashboard', 'app:boot')
 */

export function mark(name: string): void {
  try {
    performance.mark(name);
  } catch {
    // Silently fail in environments without performance API
  }
}

export function measure(label: string, start: string, end?: string): number | null {
  try {
    if (end) performance.mark(end);
    performance.measure(label, start, end);
    const entry = performance.getEntriesByName(label)[0];
    return entry?.duration ?? null;
  } catch {
    return null;
  }
}

export function clearMarks(prefix?: string): void {
  try {
    if (prefix) {
      const marks = performance.getEntriesByType('mark');
      marks.filter((m) => m.name.startsWith(prefix)).forEach((m) => performance.clearMarks(m.name));
    } else {
      performance.clearMarks();
    }
  } catch {
    // Ignore
  }
}

export function clearMeasures(prefix?: string): void {
  try {
    if (prefix) {
      const measures = performance.getEntriesByType('measure');
      measures
        .filter((m) => m.name.startsWith(prefix))
        .forEach((m) => performance.clearMeasures(m.name));
    } else {
      performance.clearMeasures();
    }
  } catch {
    // Ignore
  }
}

/**
 * Get all measures matching a pattern
 */
export function getMeasures(pattern?: string): PerformanceEntry[] {
  try {
    const all = performance.getEntriesByType('measure');
    if (!pattern) return all;
    return all.filter((m) => m.name.includes(pattern));
  } catch {
    return [];
  }
}

/**
 * Chapter Query Telemetry
 * Tracks query latencies with percentile calculations
 */
class QueryMetricsCollector {
  private latencies: number[] = [];
  private maxSamples = 1000; // Keep last 1000 samples

  record(durationMs: number): void {
    this.latencies.push(durationMs);

    // Trim to max samples (FIFO)
    if (this.latencies.length > this.maxSamples) {
      this.latencies.shift();
    }
  }

  getPercentile(p: number): number {
    if (this.latencies.length === 0) return 0;

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] ?? 0;
  }

  getMetrics() {
    if (this.latencies.length === 0) {
      return { p50: 0, p95: 0, count: 0, mean: 0 };
    }

    const p50 = this.getPercentile(50);
    const p95 = this.getPercentile(95);
    const mean = this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;

    return {
      p50: Math.round(p50),
      p95: Math.round(p95),
      count: this.latencies.length,
      mean: Math.round(mean),
    };
  }

  clear(): void {
    this.latencies = [];
  }
}

// Singleton for chapter query metrics
const chapterQueryMetrics = new QueryMetricsCollector();

/**
 * Track a chapter query with automatic timing
 */
export async function trackChapterQuery<T>(label: string, queryFn: () => Promise<T>): Promise<T> {
  const start = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    // Record latency
    chapterQueryMetrics.record(duration);

    // Log if threshold exceeded
    const metrics = chapterQueryMetrics.getMetrics();
    if (metrics.p95 > 250 || metrics.p50 > 150) {
      console.warn(`[Chapter Query] ${label} - p50: ${metrics.p50}ms, p95: ${metrics.p95}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    chapterQueryMetrics.record(duration);
    throw error;
  }
}

/**
 * Get current chapter query metrics
 */
export function getChapterQueryMetrics() {
  return chapterQueryMetrics.getMetrics();
}

/**
 * Clear chapter query metrics
 */
export function clearChapterQueryMetrics() {
  chapterQueryMetrics.clear();
}
