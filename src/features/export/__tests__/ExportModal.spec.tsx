// src/features/export/__tests__/ExportModal.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ExportModal } from '../ExportModal';

vi.mock('../../preview/analytics', () => ({
  track: vi.fn(),
}));

vi.mock('../../../export/templates/manuscript', () => ({
  renderManuscriptHTML: vi.fn(() => '<html></html>'),
}));
vi.mock('../../../export/templates/analysisSummary', () => ({
  renderAnalysisSummaryHTML: vi.fn(() => '<html></html>'),
}));

// Mock fetch to return a blob
global.fetch = vi.fn(async () => ({
  ok: true,
  blob: async () => new Blob(['ok'], { type: 'application/pdf' }),
})) as any;

describe('ExportModal', () => {
  it('renders and allows template selection', () => {
    const onClose = vi.fn();
    render(
      <ExportModal
        isOpen={true}
        onClose={onClose}
        projectId="p1"
        bookData={{ title: 'T', chapters: [] }}
      />,
    );

    const manuscript = screen.getByRole('radio', { name: /manuscript/i });
    expect(manuscript).toBeTruthy();

    fireEvent.click(manuscript);

    const exportBtn = screen.getByRole('button', { name: /Generate PDF/i });
    expect(exportBtn).toBeTruthy();
  });

  it('closes when cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <ExportModal
        isOpen={true}
        onClose={onClose}
        projectId="p1"
        bookData={{ title: 'T', chapters: [] }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
