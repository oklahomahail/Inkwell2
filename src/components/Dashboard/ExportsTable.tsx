/**
 * Exports Table Component (v0.7.0)
 *
 * Displays recent export records in a table format with:
 * - Timestamp
 * - Export type (PDF, DOCX, Markdown)
 * - Chapters included
 * - Word count
 * - Duration
 * - Status (success/fail)
 */

import { FileText, FileDown, File, CheckCircle, XCircle, Clock } from 'lucide-react';
import React from 'react';

import type { ExportRecord } from '@/types/export';

interface ExportsTableProps {
  records: ExportRecord[];
  loading?: boolean;
  _onDelete?: (recordId: string) => void;
}

export function ExportsTable({ records, loading = false }: ExportsTableProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return FileText;
      case 'docx':
        return FileDown;
      case 'markdown':
        return File;
      default:
        return File;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'docx':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'markdown':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDateTime = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleString();
  };

  const formatDateShort = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <FileDown className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No exports yet</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Export your chapters to PDF, DOCX, or Markdown to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Exports</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {records.length} export{records.length !== 1 ? 's' : ''} in history
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Chapters
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Words
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {records.map((record) => {
              const TypeIcon = getTypeIcon(record.type);
              const typeColor = getTypeColor(record.type);

              return (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDateShort(record.createdAt)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(record.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-md ${typeColor}`}>
                      <TypeIcon className="w-3.5 h-3.5 mr-1.5" />
                      <span className="text-xs font-medium uppercase">{record.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {record.chaptersIncluded.length} chapter
                      {record.chaptersIncluded.length !== 1 ? 's' : ''}
                    </div>
                    {record.chaptersIncluded.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {record.chaptersIncluded.map((ch) => ch.title).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {record.totalWordCount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {formatDuration(record.durationMs)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.result === 'success' ? (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        <span className="text-sm font-medium">Success</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4 mr-1.5" />
                        <span className="text-sm font-medium">Failed</span>
                      </div>
                    )}
                    {record.errorMessage && (
                      <div className="text-xs text-red-500 dark:text-red-400 mt-1 max-w-xs truncate">
                        {record.errorMessage}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
