/**
 * Export Dashboard Component (v0.7.0)
 *
 * Main dashboard for visualizing export history and analytics.
 * Displays:
 * - Export statistics summary tiles
 * - Chapter word count distribution chart
 * - Recent exports table
 * - Quick export actions
 */

import { FileDown, FileText, File, Trash2, BookOpen } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { EXPORT_FORMAT } from '@/consts/writing';
import { useToast } from '@/context/toast';
import { exportHistory } from '@/services/exportHistory';
import { exportService } from '@/services/exportService';
import type { ExportHistoryStats, ExportRecord } from '@/types/export';
import type { Chapter } from '@/types/project';

import { ChapterDistributionChart } from './ChapterDistributionChart';
import { ExportsTable } from './ExportsTable';
import { ExportStats } from './ExportStats';

interface ExportDashboardProps {
  projectId: string;
  projectName?: string;
  chapters: Chapter[];
  onClose?: () => void;
}

export default function ExportDashboard({
  projectId,
  projectName = 'Project',
  chapters,
  onClose,
}: ExportDashboardProps) {
  const { showToast } = useToast();
  const [stats, setStats] = useState<ExportHistoryStats | null>(null);
  const [records, setRecords] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  // Load export history
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, recordsData] = await Promise.all([
        exportHistory.getStats(projectId),
        exportHistory.list(projectId, 50), // Show last 50 exports
      ]);

      setStats(statsData);
      setRecords(recordsData);
    } catch (error) {
      console.error('Failed to load export history:', error);
      showToast('Failed to load export history', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Quick export handlers
  const handleExportPDF = useCallback(async () => {
    if (chapters.length === 0) {
      showToast('No chapters to export', 'error');
      return;
    }

    setExporting('pdf');
    try {
      showToast('Preparing PDF export...', 'info', 2000);
      const result = await exportService.exportPDFWithChapters(projectId, chapters, {
        format: EXPORT_FORMAT.PDF,
        includeMetadata: true,
        includeSynopsis: true,
        customTitle: projectName,
      });

      if (result.success) {
        showToast('PDF export ready - check print dialog', 'success', 4000);
        // Reload history to show new export
        await loadHistory();
      } else {
        showToast(result.error || 'PDF export failed', 'error');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      showToast('Failed to export PDF', 'error');
    } finally {
      setExporting(null);
    }
  }, [projectId, projectName, chapters, showToast, loadHistory]);

  const handleExportDOCX = useCallback(async () => {
    if (chapters.length === 0) {
      showToast('No chapters to export', 'error');
      return;
    }

    setExporting('docx');
    try {
      showToast('Preparing DOCX export...', 'info', 2000);
      const result = await exportService.exportDOCXWithChapters(projectId, chapters, {
        format: EXPORT_FORMAT.DOCX,
        includeMetadata: true,
        includeSynopsis: true,
        customTitle: projectName,
      });

      if (result.success) {
        showToast(`Downloaded ${result.filename}`, 'success', 4000);
        // Reload history to show new export
        await loadHistory();
      } else {
        showToast(result.error || 'DOCX export failed', 'error');
      }
    } catch (error) {
      console.error('DOCX export error:', error);
      showToast('Failed to export DOCX', 'error');
    } finally {
      setExporting(null);
    }
  }, [projectId, projectName, chapters, showToast, loadHistory]);

  const handleCopyMarkdown = useCallback(async () => {
    if (chapters.length === 0) {
      showToast('No chapters to export', 'error');
      return;
    }

    setExporting('markdown');
    try {
      const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
      const markdown = sortedChapters
        .map((ch, idx) => {
          const header = `# Chapter ${idx + 1}: ${ch.title}\n\n`;
          const summary = ch.summary ? `> ${ch.summary}\n\n` : '';
          const content = ch.content || '_[No content yet]_';
          const meta = `\n\n---\n_${ch.wordCount.toLocaleString()} words • Status: ${ch.status}_\n\n`;
          return header + summary + content + meta;
        })
        .join('\n');

      const fullMarkdown = `# ${projectName}\n\n---\n\n${markdown}`;

      await navigator.clipboard.writeText(fullMarkdown);
      showToast(
        `Copied ${chapters.length} chapters (${chapters.reduce((sum, ch) => sum + ch.wordCount, 0).toLocaleString()} words) to clipboard`,
        'success',
        4000,
      );

      // Log to history
      await exportService.exportMarkdownWithChapters(projectId, chapters, {
        format: EXPORT_FORMAT.MARKDOWN,
        includeMetadata: true,
        includeSynopsis: true,
        customTitle: projectName,
      });

      // Reload history
      await loadHistory();
    } catch (error) {
      console.error('Markdown copy error:', error);
      showToast('Failed to copy markdown', 'error');
    } finally {
      setExporting(null);
    }
  }, [projectId, projectName, chapters, showToast, loadHistory]);

  const handleExportEPUB = useCallback(async () => {
    if (chapters.length === 0) {
      showToast('No chapters to export', 'error');
      return;
    }

    setExporting('epub');
    try {
      showToast('Preparing EPUB export...', 'info', 2000);
      const result = await exportService.exportEPUBWithChapters(projectId, chapters, {
        format: EXPORT_FORMAT.EPUB,
        includeMetadata: true,
        includeSynopsis: true,
        customTitle: projectName,
      });

      if (result.success) {
        showToast(`Downloaded ${result.filename}`, 'success', 4000);
        // Reload history to show new export
        await loadHistory();
      } else {
        showToast(result.error || 'EPUB export failed', 'error');
      }
    } catch (error) {
      console.error('EPUB export error:', error);
      showToast('Failed to export EPUB', 'error');
    } finally {
      setExporting(null);
    }
  }, [projectId, projectName, chapters, showToast, loadHistory]);

  const handleClearHistory = useCallback(async () => {
    if (!confirm('Clear all export history for this project? This cannot be undone.')) {
      return;
    }

    try {
      await exportHistory.clear(projectId);
      showToast('Export history cleared', 'success');
      await loadHistory();
    } catch (error) {
      console.error('Failed to clear history:', error);
      showToast('Failed to clear history', 'error');
    }
  }, [projectId, showToast, loadHistory]);

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Export Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track export history and analytics for {projectName}
            </p>
            {chapters.length === 0 && (
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                ⚠️ No chapters found. Create chapters in the Writing Panel to enable exports.
              </p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Close
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleExportPDF}
            disabled={exporting !== null || chapters.length === 0}
            className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            title={chapters.length === 0 ? 'No chapters available to export' : 'Export as PDF'}
          >
            <FileText className="w-5 h-5 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-gray-900 dark:text-white">
              {exporting === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}
            </span>
          </button>

          <button
            onClick={handleExportDOCX}
            disabled={exporting !== null || chapters.length === 0}
            className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <FileDown className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-gray-900 dark:text-white">
              {exporting === 'docx' ? 'Exporting DOCX...' : 'Export DOCX'}
            </span>
          </button>

          <button
            onClick={handleExportEPUB}
            disabled={exporting !== null || chapters.length === 0}
            className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-gray-900 dark:text-white">
              {exporting === 'epub' ? 'Exporting EPUB...' : 'Export EPUB'}
            </span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            disabled={exporting !== null || chapters.length === 0}
            className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <File className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-gray-900 dark:text-white">
              {exporting === 'markdown' ? 'Copying...' : 'Copy Markdown'}
            </span>
          </button>
        </div>

        {/* Stats */}
        {stats && <ExportStats stats={stats} loading={loading} />}

        {/* Chapter Distribution and Exports Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChapterDistributionChart chapters={chapters} loading={loading} />

          <div className="space-y-4">
            <ExportsTable records={records.slice(0, 10)} loading={loading} />

            {records.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="w-full flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">Clear Export History</span>
              </button>
            )}
          </div>
        </div>

        {/* Full Exports Table */}
        {records.length > 10 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              All Exports
            </h3>
            <ExportsTable records={records} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}
