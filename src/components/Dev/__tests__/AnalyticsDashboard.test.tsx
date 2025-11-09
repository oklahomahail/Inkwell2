/**
 * Analytics Dashboard Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsDashboard } from '../AnalyticsDashboard';
import { analyticsService } from '@/services/analytics';
import type { AnalyticsSummary, AnalyticsEvent, AnalyticsMetric } from '@/services/analytics/types';

// Mock analytics service
vi.mock('@/services/analytics', () => ({
  analyticsService: {
    getSummary: vi.fn(),
    queryEvents: vi.fn(),
    queryMetrics: vi.fn(),
    destroy: vi.fn(),
    initialize: vi.fn(),
  },
}));

// Mock export functions
vi.mock('@/dev/analyticsExport', () => ({
  downloadAnalyticsJSON: vi.fn(),
  downloadAnalyticsCSV: vi.fn(),
}));

describe('AnalyticsDashboard', () => {
  const mockSummary: AnalyticsSummary = {
    totalEvents: 150,
    totalSessions: 5,
    averageSessionDuration: 300000, // 5 minutes
    categories: {
      writing: 50,
      autosave: 30,
      ai: 20,
      storage: 25,
      ui: 15,
      editor: 10,
      export: 0,
      timeline: 0,
      performance: 0,
    },
    topActions: [
      { action: 'session.start', count: 25 },
      { action: 'autosave.success', count: 20 },
      { action: 'ai.request', count: 15 },
    ],
    dateRange: {
      start: Date.now() - 24 * 60 * 60 * 1000,
      end: Date.now(),
    },
  };

  const mockEvents: AnalyticsEvent[] = [
    {
      id: '1',
      timestamp: Date.now(),
      category: 'writing',
      action: 'session.start',
      sessionId: 'session-1',
    },
    {
      id: '2',
      timestamp: Date.now(),
      category: 'autosave',
      action: 'save.success',
      label: 'auto',
      value: 123,
      sessionId: 'session-1',
    },
  ];

  const mockMetrics: AnalyticsMetric[] = [
    {
      id: 'm1',
      timestamp: Date.now(),
      category: 'autosave',
      name: 'save.latency',
      value: 123,
      unit: 'ms',
      sessionId: 'session-1',
    },
    {
      id: 'm2',
      timestamp: Date.now(),
      category: 'autosave',
      name: 'save.latency',
      value: 145,
      unit: 'ms',
      sessionId: 'session-1',
    },
    {
      id: 'm3',
      timestamp: Date.now(),
      category: 'ai',
      name: 'request.latency',
      value: 2500,
      unit: 'ms',
      sessionId: 'session-1',
    },
  ];

  beforeEach(() => {
    vi.mocked(analyticsService.getSummary).mockResolvedValue(mockSummary);
    vi.mocked(analyticsService.queryEvents).mockResolvedValue(mockEvents);
    vi.mocked(analyticsService.queryMetrics).mockResolvedValue(mockMetrics);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard header and title', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Privacy-first analytics insights')).toBeInTheDocument();
    });
  });

  it('loads and displays summary data', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total events
      expect(screen.getByText('5')).toBeInTheDocument(); // Total sessions
    });
  });

  it('displays category filters', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('All Categories')).toBeInTheDocument();
    });
  });

  it('displays time range filters', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Time Range')).toBeInTheDocument();
      expect(screen.getByText('Last 24 Hours')).toBeInTheDocument();
    });
  });

  it('switches between tabs', async () => {
    const user = userEvent.setup();
    render(<AnalyticsDashboard />);

    // Wait for dashboard to load fully
    await waitFor(() => {
      expect(screen.getByText('Total Events')).toBeInTheDocument();
    });

    // Click Events tab
    const eventsTab = screen.getByText('Events');
    await user.click(eventsTab);

    await waitFor(() => {
      expect(screen.getByText(/Events \(/)).toBeInTheDocument();
    });

    // Click Metrics tab
    const metricsTab = screen.getByText('Metrics');
    await user.click(metricsTab);

    await waitFor(() => {
      expect(screen.getByText('Metric Statistics')).toBeInTheDocument();
    });

    // Click Performance tab
    const performanceTabs = screen.getAllByText('Performance');
    await user.click(performanceTabs[0]); // Click the first one (the tab button)

    await waitFor(() => {
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    });
  });

  it('filters data by category', async () => {
    const user = userEvent.setup();
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    const categorySelects = screen.getAllByRole('combobox');
    const categorySelect = categorySelects[0]; // First combobox is the category select
    await user.selectOptions(categorySelect, 'autosave');

    await waitFor(() => {
      expect(analyticsService.queryEvents).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'autosave' }),
      );
    });
  });

  it('filters data by time range', async () => {
    const user = userEvent.setup();
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Time Range')).toBeInTheDocument();
    });

    const timeRangeSelects = screen.getAllByRole('combobox');
    const timeRangeSelect = timeRangeSelects[1]; // Second combobox is the time range select
    await user.selectOptions(timeRangeSelect, '1h');

    await waitFor(() => {
      expect(analyticsService.queryEvents).toHaveBeenCalledWith(
        expect.objectContaining({ startTime: expect.any(Number) }),
      );
    });
  });

  it('displays metric statistics correctly', async () => {
    const user = userEvent.setup();
    render(<AnalyticsDashboard />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Total Events')).toBeInTheDocument();
    });

    // Switch to Metrics tab
    const metricsTab = screen.getByText('Metrics');
    await user.click(metricsTab);

    await waitFor(() => {
      expect(screen.getByText('save.latency')).toBeInTheDocument();
      expect(screen.getByText('request.latency')).toBeInTheDocument();
    });
  });

  it('exports JSON when export button clicked', async () => {
    const user = userEvent.setup();
    const { downloadAnalyticsJSON } = await import('@/dev/analyticsExport');

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /export json/i });
    await user.click(exportButton);

    expect(downloadAnalyticsJSON).toHaveBeenCalled();
  });

  it('exports CSV when export button clicked', async () => {
    const user = userEvent.setup();
    const { downloadAnalyticsCSV } = await import('@/dev/analyticsExport');

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Export Events CSV')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /export events csv/i });
    await user.click(exportButton);

    expect(downloadAnalyticsCSV).toHaveBeenCalledWith('events', expect.any(Object));
  });

  it('clears data with confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Clear Data')).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: /clear data/i });
    await user.click(clearButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(analyticsService.destroy).toHaveBeenCalled();
    expect(analyticsService.initialize).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('does not clear data when confirmation cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Clear Data')).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: /clear data/i });
    await user.click(clearButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(analyticsService.destroy).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('refreshes data when refresh button clicked', async () => {
    const user = userEvent.setup();
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    vi.clearAllMocks();

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(analyticsService.getSummary).toHaveBeenCalled();
      expect(analyticsService.queryEvents).toHaveBeenCalled();
      expect(analyticsService.queryMetrics).toHaveBeenCalled();
    });
  });

  it('displays events with pagination', async () => {
    const user = userEvent.setup();
    const manyEvents: AnalyticsEvent[] = Array.from({ length: 60 }, (_, i) => ({
      id: `event-${i}`,
      timestamp: Date.now() - i * 1000,
      category: 'writing',
      action: 'test.action',
      sessionId: 'session-1',
    }));

    vi.mocked(analyticsService.queryEvents).mockResolvedValue(manyEvents);

    render(<AnalyticsDashboard />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Total Events')).toBeInTheDocument();
    });

    // Switch to Events tab
    const eventsTab = screen.getByText('Events');
    await user.click(eventsTab);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });

    // Click next page
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(analyticsService.getSummary).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<AnalyticsDashboard />);

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('handles errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(analyticsService.getSummary).mockRejectedValue(new Error('Failed to load'));

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '[AnalyticsDashboard] Failed to load data:',
        expect.any(Error),
      );
    });

    consoleError.mockRestore();
  });
});
