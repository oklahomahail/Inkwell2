import { useState } from 'react';

import { renderAnalysisSummaryHTML } from '../../export/templates/analysisSummary';
import { renderManuscriptHTML } from '../../export/templates/manuscript';

type TemplateId = 'manuscript' | 'analysis-summary';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  // Data you already have:
  bookData: {
    title: string;
    author?: string;
    chapters: { title: string; text: string }[];
  };
  analysis?: {
    scorecard: {
      structure: number;
      pacing: number;
      scenePurpose: number;
      coverage: number;
      grade: string;
    };
    insights: { finding: string; suggestion: string; affectedChapters: number[] }[];
    pacingSVG?: string; // data URL: "data:image/svg+xml;base64,...."
    arcsSVG?: string; // data URL
  };
}

export function ExportModal({ isOpen, onClose, projectId, bookData, analysis }: ExportModalProps) {
  const [template, setTemplate] = useState<TemplateId>('manuscript');
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  async function handleExport() {
    setDownloading(true);
    try {
      const filename =
        template === 'manuscript'
          ? `${sanitize(bookData.title || 'Manuscript')}.pdf`
          : `${sanitize(bookData.title || 'Analysis')}-summary.pdf`;

      const html =
        template === 'manuscript'
          ? renderManuscriptHTML(bookData)
          : renderAnalysisSummaryHTML({
              title: bookData.title,
              author: bookData.author,
              scorecard: analysis?.scorecard,
              insights: analysis?.insights?.slice(0, 5) ?? [],
              pacingSVG: analysis?.pacingSVG,
              arcsSVG: analysis?.arcsSVG,
            });

      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, meta: { filename } }),
      });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">Export to PDF</h2>

        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="template"
              value="manuscript"
              checked={template === 'manuscript'}
              onChange={() => setTemplate('manuscript')}
            />
            <span>Manuscript Standard</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="template"
              value="analysis-summary"
              checked={template === 'analysis-summary'}
              onChange={() => setTemplate('analysis-summary')}
              disabled={!analysis}
            />
            <span>Analysis Summary (1-pager)</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-md border px-3 py-2" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rounded-md bg-black px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
            onClick={handleExport}
            disabled={downloading}
          >
            {downloading ? 'Generating…' : 'Generate PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

function sanitize(s: string) {
  return s.replace(/[^a-z0-9_\-\.]+/gi, '_').slice(0, 120);
}
