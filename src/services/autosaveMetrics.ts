/**
 * Autosave Metrics Collector
 *
 * Tracks autosave and render performance metrics:
 * - Save latency (p50, p95, p99)
 * - Render drift (time between user input and screen update)
 * - Success/error rates
 *
 * Metrics are anonymized (no chapter IDs or content) and can be
 * displayed in DevTools console when VITE_ENABLE_DEV_METRICS is true.
 */

export interface AutosaveMetricsSample {
  timestamp: number;
  latencyMs: number;
  contentSizeBytes: number;
  success: boolean;
  errorCode?: string;
}

export interface RenderMetricsSample {
  timestamp: number;
  renderTimeMs: number;
  driftMs: number; // Time from input to screen update
}

interface AutosaveMetricsSnapshot {
  latency: {
    p50: number;
    p95: number;
    p99: number;
    mean: number;
    count: number;
  };
  render: {
    averageDriftMs: number;
    maxDriftMs: number;
    count: number;
  };
  successRate: number;
}

class AutosaveMetricsCollector {
  private latencySamples: number[] = [];
  private renderSamples: RenderMetricsSample[] = [];
  private successCount = 0;
  private errorCount = 0;
  private maxSamples = 1000; // Keep last 1000 samples

  /**
   * Record autosave latency
   */
  recordSave(latencyMs: number, contentSizeBytes: number, success: boolean, errorCode?: string) {
    this.latencySamples.push(latencyMs);

    // Track success/error
    if (success) {
      this.successCount++;
    } else {
      this.errorCount++;
    }

    // Trim to max samples (FIFO)
    if (this.latencySamples.length > this.maxSamples) {
      this.latencySamples.shift();
    }

    // Emit to telemetry if available
    if (import.meta.env.VITE_ENABLE_TELEMETRY) {
      this.emitToTelemetry({
        timestamp: Date.now(),
        latencyMs,
        contentSizeBytes,
        success,
        errorCode,
      });
    }
  }

  /**
   * Record render metrics
   */
  recordRender(renderTimeMs: number, driftMs: number) {
    this.renderSamples.push({
      timestamp: Date.now(),
      renderTimeMs,
      driftMs,
    });

    // Trim to max samples
    if (this.renderSamples.length > this.maxSamples) {
      this.renderSamples.shift();
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  private getPercentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] ?? 0;
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): AutosaveMetricsSnapshot {
    const sortedLatencies = [...this.latencySamples].sort((a, b) => a - b);

    const latencyMetrics = {
      p50: Math.round(this.getPercentile(sortedLatencies, 50)),
      p95: Math.round(this.getPercentile(sortedLatencies, 95)),
      p99: Math.round(this.getPercentile(sortedLatencies, 99)),
      mean:
        sortedLatencies.length > 0
          ? Math.round(sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length)
          : 0,
      count: sortedLatencies.length,
    };

    const renderMetrics = {
      averageDriftMs:
        this.renderSamples.length > 0
          ? Math.round(
              this.renderSamples.reduce((sum, s) => sum + s.driftMs, 0) / this.renderSamples.length,
            )
          : 0,
      maxDriftMs:
        this.renderSamples.length > 0 ? Math.max(...this.renderSamples.map((s) => s.driftMs)) : 0,
      count: this.renderSamples.length,
    };

    const totalOps = this.successCount + this.errorCount;
    const successRate = totalOps > 0 ? (this.successCount / totalOps) * 100 : 100;

    return {
      latency: latencyMetrics,
      render: renderMetrics,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Check if metrics meet performance targets
   */
  checkTargets(): {
    latencyOk: boolean;
    renderOk: boolean;
    message: string;
  } {
    const metrics = this.getMetrics();

    const latencyOk = metrics.latency.p95 < 250;
    const renderOk = metrics.render.averageDriftMs < 10;

    let message = '';
    if (!latencyOk) {
      message += `⚠️ p95 latency ${metrics.latency.p95}ms exceeds 250ms target. `;
    }
    if (!renderOk) {
      message += `⚠️ Average render drift ${metrics.render.averageDriftMs}ms exceeds 10ms target. `;
    }
    if (latencyOk && renderOk) {
      message = '✅ All performance targets met';
    }

    return { latencyOk, renderOk, message: message.trim() };
  }

  /**
   * Emit anonymized data to telemetry
   */
  /* eslint-disable no-console */
  private emitToTelemetry(sample: AutosaveMetricsSample) {
    // Emit to telemetry service with anonymized data
    // Note: We deliberately don't include any identifiable information
    try {
      const event = {
        type: 'editor.autosave.latency',
        timestamp: sample.timestamp,
        latency_ms: sample.latencyMs,
        content_size_bytes: sample.contentSizeBytes,
        success: sample.success,
        error_code: sample.errorCode || null,
      };

      // Send via beacon API for non-blocking telemetry
      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
        navigator.sendBeacon('/api/telemetry', blob);
      }
    } catch (error) {
      // Silently fail - telemetry should never break app functionality
      console.debug('Failed to emit telemetry:', error);
    }
  }
  /* eslint-enable no-console */

  /**
   * Display metrics in DevTools console (when VITE_ENABLE_DEV_METRICS is true)
   */
  /* eslint-disable no-console */
  logToConsole() {
    if (!import.meta.env.VITE_ENABLE_DEV_METRICS) return;

    const metrics = this.getMetrics();
    const targets = this.checkTargets();

    console.group('📊 Autosave Performance Metrics');
    console.log('Latency:', {
      p50: `${metrics.latency.p50}ms`,
      p95: `${metrics.latency.p95}ms ${metrics.latency.p95 < 250 ? '✅' : '⚠️'}`,
      p99: `${metrics.latency.p99}ms`,
      mean: `${metrics.latency.mean}ms`,
      samples: metrics.latency.count,
    });
    console.log('Render Drift:', {
      average: `${metrics.render.averageDriftMs}ms ${metrics.render.averageDriftMs < 10 ? '✅' : '⚠️'}`,
      max: `${metrics.render.maxDriftMs}ms`,
      samples: metrics.render.count,
    });
    console.log('Success Rate:', `${metrics.successRate}%`);
    console.log(targets.message);
    console.groupEnd();

    return metrics;
  }
  /* eslint-enable no-console */

  /**
   * Clear all collected metrics
   */
  clear() {
    this.latencySamples = [];
    this.renderSamples = [];
    this.successCount = 0;
    this.errorCount = 0;
  }
}

// Singleton instance
export const autosaveMetrics = new AutosaveMetricsCollector();

// Expose to window for console access in dev mode
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).Inkwell = {
    ...(window as any).Inkwell,
    autosaveMetrics: {
      get: () => autosaveMetrics.getMetrics(),
      log: () => autosaveMetrics.logToConsole(),
      check: () => autosaveMetrics.checkTargets(),
      clear: () => autosaveMetrics.clear(),
    },
  };
}
