/**
 * Performance Guard Integration Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PerformanceGuardIntegration } from '../PerformanceGuardIntegration';
import { analyticsService } from '@/services/analytics';
import type { AnalyticsMetric } from '@/services/analytics/types';

// Mock analytics service
vi.mock('@/services/analytics', () => ({
  analyticsService: {
    queryMetrics: vi.fn(),
  },
}));

describe('PerformanceGuardIntegration', () => {
  const mockMetrics: AnalyticsMetric[] = [
    {
      id: 'm1',
      timestamp: Date.now(),
      category: 'autosave',
      name: 'save.latency',
      value: 120,
      unit: 'ms',
      sessionId: 'session-1',
    },
    {
      id: 'm2',
      timestamp: Date.now(),
      category: 'autosave',
      name: 'save.latency',
      value: 150,
      unit: 'ms',
      sessionId: 'session-1',
    },
    {
      id: 'm3',
      timestamp: Date.now(),
      category: 'performance',
      name: 'render.time',
      value: 16,
      unit: 'ms',
      sessionId: 'session-1',
    },
    {
      id: 'm4',
      timestamp: Date.now(),
      category: 'storage',
      name: 'storage.read',
      value: 50,
      unit: 'ms',
      sessionId: 'session-1',
    },
    {
      id: 'm5',
      timestamp: Date.now(),
      category: 'storage',
      name: 'storage.write',
      value: 80,
      unit: 'ms',
      sessionId: 'session-1',
    },
    {
      id: 'm6',
      timestamp: Date.now(),
      category: 'ai',
      name: 'ai.request.latency',
      value: 2000,
      unit: 'ms',
      sessionId: 'session-1',
    },
  ];

  beforeEach(() => {
    vi.mocked(analyticsService.queryMetrics).mockResolvedValue(mockMetrics);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders performance guard integration', async () => {
    render(<PerformanceGuardIntegration />);

    await waitFor(() => {
      expect(screen.getByText('Autosave Performance')).toBeInTheDocument();
    });
  });

  it('displays autosave metrics', async () => {
    render(<PerformanceGuardIntegration />);

    await waitFor(() => {
      expect(screen.getByText('Autosave Performance')).toBeInTheDocument();
      expect(screen.getByText('Average Latency')).toBeInTheDocument();
      expect(screen.getByText('P95 Latency')).toBeInTheDocument();
    });
  });

  it('displays render performance metrics', async () => {
    render(<PerformanceGuardIntegration />);

    await waitFor(() => {
      expect(screen.getByText('Render Performance')).toBeInTheDocument();
    });
  });

  it('displays storage operations', async () => {
    render(<PerformanceGuardIntegration />);

    await waitFor(() => {
      expect(screen.getByText('Storage Operations')).toBeInTheDocument();
      expect(screen.getByText('Reads')).toBeInTheDocument();
      expect(screen.getByText('Writes')).toBeInTheDocument();
    });
  });

  it('displays AI request metrics', async () => {
    render(<PerformanceGuardIntegration />);

    await waitFor(() => {
      expect(screen.getByText('AI Requests')).toBeInTheDocument();
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
      expect(screen.getByText('Avg Latency')).toBeInTheDocument();
    });
  });

  it('detects performance regressions', async () => {
    // First call returns baseline (low latency)
    vi.mocked(analyticsService.queryMetrics).mockResolvedValueOnce([
      {
        id: 'm1',
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000,
        category: 'autosave',
        name: 'save.latency',
        value: 100,
        unit: 'ms',
        sessionId: 'session-old',
      },
    ]);

    // Second call returns current (high latency - regression!)
    vi.mocked(analyticsService.queryMetrics).mockResolvedValueOnce([
      {
        id: 'm2',
        timestamp: Date.now(),
        category: 'autosave',
        name: 'save.latency',
        value: 300, // 3x increase = 200% regression
        unit: 'ms',
        sessionId: 'session-new',
      },
    ]);

    render(<PerformanceGuardIntegration />);

    await waitFor(() => {
      expect(screen.getByText('Performance Regressions Detected')).toBeInTheDocument();
      expect(screen.getByText(/Autosave Latency/)).toBeInTheDocument();
    });
  });

  it('shows no regressions when performance is stable', async () => {
    // Both calls return similar latency
    vi.mocked(analyticsService.queryMetrics).mockResolvedValue([
      {
        id: 'm1',
        timestamp: Date.now(),
        category: 'autosave',
        name: 'save.latency',
        value: 120,
        unit: 'ms',
        sessionId: 'session-1',
      },
    ]);

    render(<PerformanceGuardIntegration />);

    await waitFor(() => {
      expect(screen.queryByText('Performance Regressions Detected')).not.toBeInTheDocument();
    });
  });

  it('formats milliseconds correctly', async () => {
    vi.mocked(analyticsService.queryMetrics).mockResolvedValue([
      {
        id: 'm1',
        timestamp: Date.now(),
        category: 'autosave',
        name: 'save.latency',
        value: 0.5,
        unit: 'ms',
        sessionId: 'session-1',
      },
      {
        id: 'm2',
        timestamp: Date.now(),
        category: 'autosave',
        name: 'save.latency',
        value: 1500,
        unit: 'ms',
        sessionId: 'session-1',
      },
    ]);

    render(<PerformanceGuardIntegration />);

    await waitFor(() => {
      // Should show microseconds for < 1ms
      expect(screen.getByText(/μs/)).toBeInTheDocument();
      // Should show seconds for > 1000ms
      expect(screen.getByText(/s$/)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    vi.mocked(analyticsService.queryMetrics).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<PerformanceGuardIntegration />);

    expect(screen.getByText('Loading performance data...')).toBeInTheDocument();
  });

  it('shows empty state when no data available', async () => {
    vi.mocked(analyticsService.queryMetrics).mockResolvedValue([]);

    render(<PerformanceGuardIntegration />);

    await waitFor(() => {
      expect(screen.getByText('Autosave Performance')).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(analyticsService.queryMetrics).mockRejectedValue(new Error('Failed to load'));

    render(<PerformanceGuardIntegration />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '[PerformanceGuard] Failed to load performance data:',
        expect.any(Error),
      );
    });

    consoleError.mockRestore();
  });

  it('calculates baseline comparison correctly', async () => {
    const baselineTime = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Mock baseline metrics
    vi.mocked(analyticsService.queryMetrics).mockResolvedValueOnce([
      {
        id: 'baseline',
        timestamp: baselineTime,
        category: 'autosave',
        name: 'save.latency',
        value: 100,
        unit: 'ms',
        sessionId: 'session-old',
      },
    ]);

    // Mock current metrics
    vi.mocked(analyticsService.queryMetrics).mockResolvedValueOnce([
      {
        id: 'current',
        timestamp: Date.now(),
        category: 'autosave',
        name: 'save.latency',
        value: 100,
        unit: 'ms',
        sessionId: 'session-new',
      },
    ]);

    render(<PerformanceGuardIntegration />);

    await waitFor(() => {
      const baselineDate = new Date(baselineTime).toLocaleDateString();
      expect(
        screen.getByText(new RegExp(`Comparing to baseline from ${baselineDate}`)),
      ).toBeInTheDocument();
    });
  });

  it('marks critical regressions correctly', async () => {
    // Baseline with low latency
    vi.mocked(analyticsService.queryMetrics).mockResolvedValueOnce([
      {
        id: 'm1',
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000,
        category: 'autosave',
        name: 'save.latency',
        value: 100,
        unit: 'ms',
        sessionId: 'session-old',
      },
    ]);

    // Current with 60% increase (> 50% threshold = critical)
    vi.mocked(analyticsService.queryMetrics).mockResolvedValueOnce([
      {
        id: 'm2',
        timestamp: Date.now(),
        category: 'autosave',
        name: 'save.latency',
        value: 160,
        unit: 'ms',
        sessionId: 'session-new',
      },
    ]);

    render(<PerformanceGuardIntegration />);

    await waitFor(() => {
      expect(screen.getByText('Performance Regressions Detected')).toBeInTheDocument();
      // The regression should show the percentage increase
      expect(screen.getByText(/\+60\.0%/)).toBeInTheDocument();
    });
  });
});
