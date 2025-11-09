/**
 * Insights Panel Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InsightsPanel } from '../InsightsPanel';
import { analyticsService } from '@/services/analytics';
import type { AnalyticsSummary, AnalyticsEvent } from '@/services/analytics/types';

// Mock analytics service
vi.mock('@/services/analytics', () => ({
  analyticsService: {
    getConfig: vi.fn(),
    updateConfig: vi.fn(),
    initialize: vi.fn(),
    getSummary: vi.fn(),
    queryMetrics: vi.fn(),
    queryEvents: vi.fn(),
  },
}));

describe('InsightsPanel', () => {
  const mockConfig = {
    enabled: true,
    telemetryEnabled: false,
    sampleRate: 1.0,
    retentionDays: 30,
    batchSize: 100,
    flushInterval: 60000,
  };

  const mockSummary: AnalyticsSummary = {
    totalEvents: 250,
    totalSessions: 10,
    averageSessionDuration: 600000, // 10 minutes
    categories: {
      writing: 100,
      autosave: 50,
      ai: 30,
      storage: 40,
      ui: 20,
      editor: 10,
      export: 0,
      timeline: 0,
      performance: 0,
    },
    topActions: [
      { action: 'session.start', count: 50 },
      { action: 'autosave.success', count: 40 },
    ],
    dateRange: {
      start: Date.now() - 30 * 24 * 60 * 60 * 1000,
      end: Date.now(),
    },
  };

  const mockEvents: AnalyticsEvent[] = Array.from({ length: 7 }, (_, i) => ({
    id: `event-${i}`,
    timestamp: Date.now() - i * 24 * 60 * 60 * 1000,
    category: 'writing',
    action: 'session.start',
    sessionId: 'session-1',
  }));

  beforeEach(() => {
    vi.mocked(analyticsService.getConfig).mockReturnValue(mockConfig);
    vi.mocked(analyticsService.getSummary).mockResolvedValue(mockSummary);
    vi.mocked(analyticsService.queryMetrics).mockResolvedValue([]);
    vi.mocked(analyticsService.queryEvents).mockResolvedValue(mockEvents);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders insights panel header', () => {
    render(<InsightsPanel />);

    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(
      screen.getByText('Privacy-first analytics about your writing sessions and performance'),
    ).toBeInTheDocument();
  });

  it('displays analytics toggle', () => {
    render(<InsightsPanel />);

    expect(screen.getByText('Enable Analytics')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Track your writing sessions and performance metrics. All data stays on your device.',
      ),
    ).toBeInTheDocument();
  });

  it('loads and displays insights when enabled', async () => {
    render(<InsightsPanel />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // Total sessions
      expect(screen.getByText('250')).toBeInTheDocument(); // Total events
    });
  });

  it('displays recent activity chart', async () => {
    render(<InsightsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Recent Activity (Last 7 Days)')).toBeInTheDocument();
    });
  });

  it('displays autosave performance metrics', async () => {
    vi.mocked(analyticsService.queryMetrics).mockResolvedValue([
      {
        id: 'm1',
        timestamp: Date.now(),
        category: 'autosave',
        name: 'save.latency',
        value: 85,
        unit: 'ms',
        sessionId: 'session-1',
      },
    ]);

    render(<InsightsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Autosave Performance')).toBeInTheDocument();
      expect(screen.getByText('85ms')).toBeInTheDocument();
    });
  });

  it('displays AI usage metrics', async () => {
    vi.mocked(analyticsService.queryMetrics).mockResolvedValue([
      {
        id: 'm1',
        timestamp: Date.now(),
        category: 'ai',
        name: 'request.latency',
        value: 1500,
        unit: 'ms',
        sessionId: 'session-1',
      },
      {
        id: 'm2',
        timestamp: Date.now(),
        category: 'ai',
        name: 'request.latency',
        value: 2000,
        unit: 'ms',
        sessionId: 'session-1',
      },
    ]);

    render(<InsightsPanel />);

    await waitFor(() => {
      expect(screen.getByText('AI Usage')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total requests
    });
  });

  it('toggles analytics on and off', async () => {
    const user = userEvent.setup();
    render(<InsightsPanel />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(analyticsService.updateConfig).toHaveBeenCalledWith({ enabled: false });

    await user.click(toggle);

    expect(analyticsService.updateConfig).toHaveBeenCalledWith({ enabled: true });
    expect(analyticsService.initialize).toHaveBeenCalled();
  });

  it('shows privacy notice', async () => {
    render(<InsightsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Your Privacy Matters')).toBeInTheDocument();
      expect(
        screen.getByText(/All analytics data is stored locally on your device/),
      ).toBeInTheDocument();
    });
  });

  it('shows disabled state when analytics is off', () => {
    vi.mocked(analyticsService.getConfig).mockReturnValue({
      ...mockConfig,
      enabled: false,
    });

    render(<InsightsPanel />);

    expect(screen.getByText('Analytics Disabled')).toBeInTheDocument();
    expect(
      screen.getByText('Enable analytics to see insights about your writing sessions.'),
    ).toBeInTheDocument();
  });

  it('shows loading state while fetching data', () => {
    vi.mocked(analyticsService.getSummary).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<InsightsPanel />);

    expect(screen.getByText('Loading insights...')).toBeInTheDocument();
  });

  it('handles errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(analyticsService.getSummary).mockRejectedValue(new Error('Failed to load'));

    render(<InsightsPanel />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '[InsightsPanel] Failed to load insights:',
        expect.any(Error),
      );
    });

    consoleError.mockRestore();
  });

  it('formats durations correctly', async () => {
    const summaryWithVariousDurations: AnalyticsSummary = {
      ...mockSummary,
      averageSessionDuration: 125000, // 2m 5s
    };

    vi.mocked(analyticsService.getSummary).mockResolvedValue(summaryWithVariousDurations);

    render(<InsightsPanel />);

    await waitFor(() => {
      expect(screen.getByText('2.1m')).toBeInTheDocument();
    });
  });

  it('displays autosave performance rating', async () => {
    // Test excellent performance
    vi.mocked(analyticsService.queryMetrics).mockResolvedValue([
      {
        id: 'm1',
        timestamp: Date.now(),
        category: 'autosave',
        name: 'save.latency',
        value: 50,
        unit: 'ms',
        sessionId: 'session-1',
      },
    ]);

    const { rerender, unmount } = render(<InsightsPanel />);

    await waitFor(() => {
      expect(screen.queryByText((content) => /Excellent/.test(content))).toBeInTheDocument();
    });

    unmount();

    // Test good performance
    vi.mocked(analyticsService.queryMetrics).mockResolvedValue([
      {
        id: 'm1',
        timestamp: Date.now(),
        category: 'autosave',
        name: 'save.latency',
        value: 300,
        unit: 'ms',
        sessionId: 'session-1',
      },
    ]);

    render(<InsightsPanel />);

    await waitFor(() => {
      expect(screen.queryByText((content) => /Good/.test(content))).toBeInTheDocument();
    });

    // Test needs attention - use a new render
    vi.mocked(analyticsService.queryMetrics).mockResolvedValue([
      {
        id: 'm1',
        timestamp: Date.now(),
        category: 'autosave',
        name: 'save.latency',
        value: 600,
        unit: 'ms',
        sessionId: 'session-1',
      },
    ]);

    const { rerender: rerender2 } = render(<InsightsPanel />);

    await waitFor(() => {
      expect(screen.queryByText((content) => /Needs attention/.test(content))).toBeInTheDocument();
    });
  });
});
