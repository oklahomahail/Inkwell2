// src/export/templates/__tests__/analysisSummary.spec.ts
import { describe, it, expect } from 'vitest';

import { renderAnalysisSummaryHTML } from '../analysisSummary';

describe('analysis summary template', () => {
  it('includes grades, insights, and charts placeholders', () => {
    const html = renderAnalysisSummaryHTML({
      title: 'My Book',
      scorecard: { structure: 90, pacing: 80, scenePurpose: 80, coverage: 95, grade: 'A' },
      insights: [
        { finding: 'Open stronger', suggestion: 'Do X', affectedChapters: [1] },
        { finding: 'Tighten mid-act pacing', suggestion: 'Do Y', affectedChapters: [2, 3] },
      ],
      pacingSVG: 'data:image/svg+xml;base64,PHN2Zy8+',
      arcsSVG: 'data:image/svg+xml;base64,PHN2Zy8+',
    } as any);

    expect(html).toContain('My Book');
    expect(html).toContain('Grade A');
    expect(html).toContain('Open stronger');
    expect(html).toContain('Pacing');
    expect(html).toContain('Arcs');
  });
});
