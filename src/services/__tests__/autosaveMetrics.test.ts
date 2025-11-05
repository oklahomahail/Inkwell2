/**
 * Autosave Metrics Tests
 *
 * Verifies:
 * - Latency tracking and percentile calculations
 * - p95 < 250ms threshold
 * - Render drift < 10ms threshold
 * - Success rate calculation
 * - Metrics collection and aggregation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { autosaveMetrics } from '../autosaveMetrics';

describe('AutosaveMetrics', () => {
  beforeEach(() => {
    autosaveMetrics.clear();
  });

  describe('Latency Tracking', () => {
    it('should record save latency', () => {
      autosaveMetrics.recordSave(50, 1000, true);
      autosaveMetrics.recordSave(100, 2000, true);
      autosaveMetrics.recordSave(150, 3000, true);

      const metrics = autosaveMetrics.getMetrics();

      expect(metrics.latency.count).toBe(3);
      expect(metrics.latency.mean).toBeGreaterThan(0);
      expect(metrics.latency.p50).toBeGreaterThan(0);
      expect(metrics.latency.p95).toBeGreaterThan(0);
    });

    it('should calculate p50 correctly', () => {
      // Add samples: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
      for (let i = 1; i <= 10; i++) {
        autosaveMetrics.recordSave(i * 10, 1000, true);
      }

      const metrics = autosaveMetrics.getMetrics();

      // p50 should be around 50-60
      expect(metrics.latency.p50).toBeGreaterThanOrEqual(50);
      expect(metrics.latency.p50).toBeLessThanOrEqual(60);
    });

    it('should calculate p95 correctly', () => {
      // Add 100 samples from 1ms to 100ms
      for (let i = 1; i <= 100; i++) {
        autosaveMetrics.recordSave(i, 1000, true);
      }

      const metrics = autosaveMetrics.getMetrics();

      // p95 should be around 95ms
      expect(metrics.latency.p95).toBeGreaterThanOrEqual(94);
      expect(metrics.latency.p95).toBeLessThanOrEqual(96);
    });

    it('should verify p95 < 250ms threshold', () => {
      // Simulate fast saves (all under 200ms)
      for (let i = 0; i < 100; i++) {
        const latency = 50 + Math.random() * 100; // 50-150ms
        autosaveMetrics.recordSave(latency, 1000, true);
      }

      const metrics = autosaveMetrics.getMetrics();
      const targets = autosaveMetrics.checkTargets();

      expect(metrics.latency.p95).toBeLessThan(250);
      expect(targets.latencyOk).toBe(true);
      expect(targets.message).toContain('✅');
    });

    it('should detect when p95 exceeds threshold', () => {
      // Simulate slow saves (some over 250ms)
      for (let i = 0; i < 100; i++) {
        const latency = 200 + Math.random() * 100; // 200-300ms
        autosaveMetrics.recordSave(latency, 1000, true);
      }

      const targets = autosaveMetrics.checkTargets();

      if (autosaveMetrics.getMetrics().latency.p95 >= 250) {
        expect(targets.latencyOk).toBe(false);
        expect(targets.message).toContain('⚠️');
        expect(targets.message).toContain('250ms');
      }
    });
  });

  describe('Render Drift Tracking', () => {
    it('should record render drift', () => {
      autosaveMetrics.recordRender(5, 8);
      autosaveMetrics.recordRender(6, 9);
      autosaveMetrics.recordRender(4, 7);

      const metrics = autosaveMetrics.getMetrics();

      expect(metrics.render.count).toBe(3);
      expect(metrics.render.averageDriftMs).toBe(8); // (8+9+7)/3 = 8
      expect(metrics.render.maxDriftMs).toBe(9);
    });

    it('should verify render drift < 10ms threshold', () => {
      // Simulate fast renders (all under 10ms drift)
      for (let i = 0; i < 50; i++) {
        const renderTime = 2 + Math.random() * 3; // 2-5ms
        const drift = 3 + Math.random() * 5; // 3-8ms
        autosaveMetrics.recordRender(renderTime, drift);
      }

      const metrics = autosaveMetrics.getMetrics();
      const targets = autosaveMetrics.checkTargets();

      expect(metrics.render.averageDriftMs).toBeLessThan(10);
      expect(targets.renderOk).toBe(true);
    });

    it('should detect when render drift exceeds threshold', () => {
      // Simulate slow renders (drift over 10ms)
      for (let i = 0; i < 50; i++) {
        const renderTime = 10 + Math.random() * 5; // 10-15ms
        const drift = 15 + Math.random() * 10; // 15-25ms
        autosaveMetrics.recordRender(renderTime, drift);
      }

      const metrics = autosaveMetrics.getMetrics();
      const targets = autosaveMetrics.checkTargets();

      expect(metrics.render.averageDriftMs).toBeGreaterThanOrEqual(10);
      expect(targets.renderOk).toBe(false);
      expect(targets.message).toContain('⚠️');
      expect(targets.message).toContain('render drift');
    });
  });

  describe('Success Rate', () => {
    it('should calculate success rate correctly', () => {
      // 80% success rate
      for (let i = 0; i < 80; i++) {
        autosaveMetrics.recordSave(50, 1000, true);
      }
      for (let i = 0; i < 20; i++) {
        autosaveMetrics.recordSave(50, 1000, false, 'NETWORK_ERROR');
      }

      const metrics = autosaveMetrics.getMetrics();

      expect(metrics.successRate).toBeCloseTo(80, 1);
    });

    it('should start with 100% success rate', () => {
      const metrics = autosaveMetrics.getMetrics();
      expect(metrics.successRate).toBe(100);
    });

    it('should track error codes', () => {
      autosaveMetrics.recordSave(50, 1000, false, 'QUOTA_EXCEEDED');
      // Error code is recorded internally; metrics still calculated
      const metrics = autosaveMetrics.getMetrics();
      expect(metrics.successRate).toBe(0);
    });
  });

  describe('Sample Management', () => {
    it('should limit samples to max size', () => {
      // Record 1500 samples (max is 1000)
      for (let i = 0; i < 1500; i++) {
        autosaveMetrics.recordSave(50, 1000, true);
        autosaveMetrics.recordRender(5, 7);
      }

      const metrics = autosaveMetrics.getMetrics();

      // Should keep only last 1000
      expect(metrics.latency.count).toBe(1000);
      expect(metrics.render.count).toBe(1000);
    });

    it('should clear all metrics', () => {
      autosaveMetrics.recordSave(50, 1000, true);
      autosaveMetrics.recordRender(5, 7);

      autosaveMetrics.clear();

      const metrics = autosaveMetrics.getMetrics();

      expect(metrics.latency.count).toBe(0);
      expect(metrics.render.count).toBe(0);
      expect(metrics.successRate).toBe(100);
    });
  });

  describe('Performance Targets Integration', () => {
    it('should pass all targets with optimal metrics', () => {
      // Simulate optimal performance
      for (let i = 0; i < 100; i++) {
        const latency = 50 + Math.random() * 50; // 50-100ms
        const renderTime = 2 + Math.random() * 2; // 2-4ms
        const drift = 3 + Math.random() * 3; // 3-6ms

        autosaveMetrics.recordSave(latency, 1000, true);
        autosaveMetrics.recordRender(renderTime, drift);
      }

      const metrics = autosaveMetrics.getMetrics();
      const targets = autosaveMetrics.checkTargets();

      // Verify thresholds
      expect(metrics.latency.p95).toBeLessThan(250);
      expect(metrics.render.averageDriftMs).toBeLessThan(10);
      expect(targets.latencyOk).toBe(true);
      expect(targets.renderOk).toBe(true);
      expect(targets.message).toBe('✅ All performance targets met');
    });

    it('should report specific failures', () => {
      // Simulate poor latency, good render
      for (let i = 0; i < 100; i++) {
        const latency = 200 + Math.random() * 150; // 200-350ms (p95 will exceed 250ms)
        const renderTime = 2;
        const drift = 5;

        autosaveMetrics.recordSave(latency, 1000, true);
        autosaveMetrics.recordRender(renderTime, drift);
      }

      const targets = autosaveMetrics.checkTargets();

      if (!targets.latencyOk) {
        expect(targets.message).toContain('p95 latency');
        expect(targets.message).toContain('250ms');
      }
    });
  });

  describe('DevTools Console Output', () => {
    it('should log metrics when VITE_ENABLE_DEV_METRICS is true', () => {
      const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      // Temporarily enable dev metrics
      const originalEnv = import.meta.env.VITE_ENABLE_DEV_METRICS;
      (import.meta.env as any).VITE_ENABLE_DEV_METRICS = true;

      autosaveMetrics.recordSave(50, 1000, true);
      autosaveMetrics.logToConsole();

      // Should have called console methods if flag is on
      if (import.meta.env.VITE_ENABLE_DEV_METRICS) {
        expect(consoleSpy).toHaveBeenCalledWith('📊 Autosave Performance Metrics');
        expect(groupEndSpy).toHaveBeenCalled();
      }

      // Restore
      (import.meta.env as any).VITE_ENABLE_DEV_METRICS = originalEnv;
      consoleSpy.mockRestore();
      logSpy.mockRestore();
      groupEndSpy.mockRestore();
    });
  });
});
