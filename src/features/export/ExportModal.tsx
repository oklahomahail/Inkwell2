import { useState, useEffect } from 'react';

import { AIDisclosureSection } from '@/components/export/AIDisclosureSection';
import {
  ExportAIDisclosure,
  loadDisclosurePreferences,
  saveDisclosurePreferences,
  getDisclosureText,
} from '@/types/aiDisclosure';

import { renderAnalysisSummaryHTML } from '../../export/templates/analysisSummary';
import { renderManuscriptHTML } from '../../export/templates/manuscript';
import { retrieveCapturedCharts } from '../../export/utils/svgCapture';

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
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [aiDisclosure, setAIDisclosure] = useState<ExportAIDisclosure>(loadDisclosurePreferences());

  // Save preferences when they change
  useEffect(() => {
    saveDisclosurePreferences(aiDisclosure);
  }, [aiDisclosure]);

  if (!isOpen) return null;

  async function handleExport() {
    const startTime = performance.now();
    setDownloading(true);
    setProgressMessage('Rendering PDF...');

    // Telemetry: export started
    try {
      (window as any).gtag?.('event', 'export_started', {
        template_id: template,
        project_id: projectId,
      });
    } catch {}

    try {
      const filename =
        template === 'manuscript'
          ? `${sanitize(bookData.title || 'Manuscript')}.pdf`
          : `${sanitize(bookData.title || 'Analysis')}-summary.pdf`;

      // Retrieve captured SVG charts for analysis export
      const capturedCharts = retrieveCapturedCharts(projectId);

      let html =
        template === 'manuscript'
          ? renderManuscriptHTML(bookData)
          : renderAnalysisSummaryHTML({
              title: bookData.title,
              author: bookData.author,
              scorecard: analysis?.scorecard,
              insights: analysis?.insights?.slice(0, 5) ?? [],
              pacingSVG: analysis?.pacingSVG || capturedCharts.pacing || undefined,
              arcsSVG: analysis?.arcsSVG || capturedCharts.arcs || undefined,
            });

      // Add AI disclosure if enabled
      if (aiDisclosure.enabled) {
        const disclosureText = getDisclosureText(aiDisclosure.style);
        const disclosureHTML = `<div style="border-top: 1px solid #ddd; margin-top: 3em; padding-top: 1em; font-size: 0.9em; color: #666; font-style: italic; page-break-before: auto;"><p>${disclosureText}</p></div>`;

        if (aiDisclosure.placement === 'front') {
          html = html.replace(
            /<body([^>]*)>/,
            `<body$1>\n${disclosureHTML.replace('border-top', 'border-bottom').replace('margin-top', 'margin-bottom').replace('padding-top', 'padding-bottom')}`,
          );
        } else {
          html = html.replace('</body>', `${disclosureHTML}</body>`);
        }
      }

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

      // Show success message
      setProgressMessage('Download ready!');
      setTimeout(() => setProgressMessage(''), 2000);

      // Telemetry: export succeeded
      const duration = Math.round(performance.now() - startTime);
      try {
        (window as any).gtag?.('event', 'export_succeeded', {
          template_id: template,
          project_id: projectId,
          duration_ms: duration,
          file_size_kb: Math.round(blob.size / 1024),
        });
      } catch {}
    } catch (e) {
      console.error(e);

      // Telemetry: export failed
      const duration = Math.round(performance.now() - startTime);
      try {
        (window as any).gtag?.('event', 'export_failed', {
          template_id: template,
          project_id: projectId,
          duration_ms: duration,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      } catch {}

      setProgressMessage('Export failed');
      setTimeout(() => setProgressMessage(''), 3000);
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
              data-tour-id="export-template"
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

        {/* AI Disclosure Section */}
        <AIDisclosureSection
          value={aiDisclosure}
          onChange={setAIDisclosure}
          disabled={downloading}
        />

        {/* Progress indicator */}
        {progressMessage && (
          <div className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {progressMessage}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-md border px-3 py-2" onClick={onClose} disabled={downloading}>
            Cancel
          </button>
          <button
            data-tour-id="export-run"
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
