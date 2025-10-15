import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import ExportReadyBadge from './ExportReadyBadge';

describe('ExportReadyBadge', () => {
  let mockCheckExportReadiness;
  let mockReadiness;

  beforeEach(() => {
    mockReadiness = {
      ready: {
        isReady: true,
        score: 100,
        criteria: {
          hasTitle: true,
          hasContent: true,
          hasChapters: true,
          minWordCount: true,
          chaptersHaveTitles: true,
          noBlockingIssues: true,
        },
        recommendations: [],
      },
      notReady: {
        isReady: false,
        score: 60,
        criteria: {
          hasTitle: false,
          hasContent: true,
          hasChapters: true,
          minWordCount: false,
          chaptersHaveTitles: false,
          noBlockingIssues: true,
        },
        recommendations: ['Add a title to your project', 'Add titles to your chapters'],
      },
    };

    mockCheckExportReadiness = vi.fn((projectId) =>
      projectId === 'test-1' ? mockReadiness.ready : mockReadiness.notReady,
    );
  });

  // Test basic behavior with ready state
  describe('Badge Variant', () => {
    beforeEach(() => {
      mockCheckExportReadiness = vi.fn(() => mockReadiness.ready);
    });

    it('renders export ready badge', () => {
      mockCheckExportReadiness = vi.fn(() => mockReadiness.ready);
      render(
        <ExportReadyBadge projectId="any-id" checkExportReadiness={mockCheckExportReadiness} />,
      );
      const badge = screen.getByText('Export Ready');
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('triggers export callback when clicked', () => {
      const onExportClick = vi.fn();
      render(
        <ExportReadyBadge
          projectId="any-id"
          onExportClick={onExportClick}
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      fireEvent.click(screen.getByText('Export Ready'));
      expect(onExportClick).toHaveBeenCalled();
    });
  });

  describe('Not Ready State', () => {
    beforeEach(() => {
      mockReadiness.notReady.recommendations = ['Fix missing data'];
      mockCheckExportReadiness = vi.fn(() => mockReadiness.notReady);
    });

    it('does not render badge variant', () => {
      mockCheckExportReadiness = vi.fn(() => mockReadiness.notReady);
      render(
        <ExportReadyBadge projectId="test-2" checkExportReadiness={mockCheckExportReadiness} />,
      );
      expect(screen.queryByText('Export Ready')).not.toBeInTheDocument();
    });

    it('shows not ready banner with correct status', () => {
      mockCheckExportReadiness = vi.fn(() => ({
        ...mockReadiness.notReady,
        score: 60,
        recommendations: ['Add a title to your project'],
      }));
      render(
        <ExportReadyBadge
          projectId="test-2"
          variant="banner"
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      expect(screen.getByText(/60%/)).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows recommendations in card view', () => {
      const notReadyWithRecs = {
        ...mockReadiness.notReady,
        recommendations: ['Add a title to your project', 'Add titles to your chapters'],
      };
      mockCheckExportReadiness = vi.fn(() => notReadyWithRecs);

      render(
        <ExportReadyBadge
          projectId="test-2"
          variant="card"
          showDetails
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      notReadyWithRecs.recommendations.forEach((rec) => {
        expect(screen.getByText(rec)).toBeInTheDocument();
      });
    });

    it('shows incomplete criteria states', () => {
      const notReadyCheck = {
        ...mockReadiness.notReady,
        score: 40,
        criteria: {
          hasTitle: false,
          hasContent: true,
          hasChapters: false,
          minWordCount: false,
          chaptersHaveTitles: false,
          noBlockingIssues: true,
        },
      };
      mockCheckExportReadiness = vi.fn(() => notReadyCheck);

      const { getAllByText } = render(
        <ExportReadyBadge
          projectId="test-2"
          variant="card"
          showDetails
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );

      const titleItems = getAllByText('Has project title');
      const hasIncompleteCriteria = titleItems.some((item) =>
        item.className.includes('text-gray-600'),
      );
      expect(hasIncompleteCriteria).toBe(true);

      const chapterItems = getAllByText('Has chapters with content');
      const hasCompleteCriteria = chapterItems.some((item) =>
        item.className.includes('text-gray-900'),
      );
      expect(hasCompleteCriteria).toBe(true);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockCheckExportReadiness = vi.fn(() => mockReadiness.ready);
    });

    it('renders progress bar with correct ARIA attributes', () => {
      render(
        <ExportReadyBadge
          projectId="any-id"
          variant="card"
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('shows correct progress bar color based on score', () => {
      const notReadyCheck = {
        ...mockReadiness.notReady,
        score: 60,
        criteria: {
          ...mockReadiness.notReady.criteria,
        },
      };
      mockCheckExportReadiness = vi.fn(() => notReadyCheck);

      render(
        <ExportReadyBadge
          projectId="any-id"
          variant="card"
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('bg-amber-500');
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing criteria gracefully', () => {
      const criteriaMissing = {
        isReady: false,
        score: 0,
        criteria: {},
        recommendations: ['Fix missing data'],
      };
      mockCheckExportReadiness = vi.fn(() => criteriaMissing);

      render(
        <ExportReadyBadge
          projectId="test-error"
          variant="card"
          showDetails
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      expect(screen.getByText('Fix missing data')).toBeInTheDocument();
    });

    it('handles edge case score of 80% (threshold)', () => {
      mockCheckExportReadiness = vi.fn(() => ({
        isReady: true,
        score: 80,
        criteria: { ...mockReadiness.ready.criteria },
        recommendations: [],
      }));

      render(
        <ExportReadyBadge
          projectId="test-threshold"
          variant="card"
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('bg-green-500');
    });

    it('shows custom className in all variants', () => {
      const customClass = 'test-custom-class';

      const { rerender } = render(
        <ExportReadyBadge
          projectId="test-1"
          className={customClass}
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      const badgeElement = screen.getByText('Export Ready')?.closest('div');
      expect(badgeElement).toHaveClass(customClass);

      rerender(
        <ExportReadyBadge
          projectId="test-1"
          variant="banner"
          className={customClass}
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      const root = screen
        .getByText('Your manuscript is ready for export!')
        ?.closest('div[class*="flex items-center"]')?.parentElement;
      expect(root).toHaveClass(customClass);

      rerender(
        <ExportReadyBadge
          projectId="test-1"
          variant="card"
          className={customClass}
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      const cardRoot = screen.getByText('Export Readiness')?.closest('.bg-white');
      expect(cardRoot).toHaveClass(customClass);
    });
  });

  describe('Banner Variant', () => {
    it('renders ready banner with export button', () => {
      mockCheckExportReadiness = vi.fn(() => mockReadiness.ready);
      const onExportClick = vi.fn();
      render(
        <ExportReadyBadge
          projectId="any-id"
          variant="banner"
          onExportClick={onExportClick}
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      expect(screen.getByText('Your manuscript is ready for export!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Export Now' })).toBeInTheDocument();
      expect(screen.getByText(/Export readiness: \d+%/)).toBeInTheDocument();
    });

    it('handles export button click in ready state', () => {
      mockCheckExportReadiness = vi.fn(() => mockReadiness.ready);
      const onExportClick = vi.fn();
      render(
        <ExportReadyBadge
          projectId="any-id"
          variant="banner"
          onExportClick={onExportClick}
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Export Now' }));
      expect(onExportClick).toHaveBeenCalled();
    });
  });

  describe('Card Variant', () => {
    it('renders full card with ready state', () => {
      mockCheckExportReadiness = vi.fn(() => mockReadiness.ready);
      render(
        <ExportReadyBadge
          projectId="any-id"
          variant="card"
          showDetails
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      expect(screen.getByText('Export Readiness')).toBeInTheDocument();
      expect(screen.getByText('Your manuscript meets all export requirements')).toBeInTheDocument();
      expect(screen.getByText(/\d+%/)).toBeInTheDocument();
      expect(screen.getByText('Ready Score')).toBeInTheDocument();

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      expect(progressBar).toHaveClass('bg-green-500');
    });

    it('shows criteria checklist when showDetails is true', () => {
      mockCheckExportReadiness = vi.fn(() => mockReadiness.ready);
      render(
        <ExportReadyBadge
          projectId="any-id"
          variant="card"
          showDetails
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      expect(screen.getByText('Has project title')).toBeInTheDocument();
      expect(screen.getByText('Has chapters with content')).toBeInTheDocument();
      expect(screen.getByText('Minimum word count (1,000+)')).toBeInTheDocument();
      expect(screen.getByText('Chapter titles added')).toBeInTheDocument();
    });

    it('shows export button when ready and callback provided', () => {
      mockCheckExportReadiness = vi.fn(() => mockReadiness.ready);
      const onExportClick = vi.fn();
      render(
        <ExportReadyBadge
          projectId="any-id"
          variant="card"
          showDetails
          onExportClick={onExportClick}
          checkExportReadiness={mockCheckExportReadiness}
        />,
      );
      const exportButton = screen.getByRole('button', { name: 'Export Manuscript' });
      expect(exportButton).toBeInTheDocument();
      fireEvent.click(exportButton);
      expect(onExportClick).toHaveBeenCalled();
    });
  });
});
