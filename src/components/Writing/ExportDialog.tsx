// src/components/Writing/ExportDialog.tsx - NEW FILE
import { X, Download, FileText, Globe, FileDown, File } from 'lucide-react';
import React, { useState } from 'react';

import { useToast } from '@/context/toast';
import { Scene, Chapter } from '@/types/writing';
import { ExportFormat, ExportOptions, performExport } from '@/utils/exportUtils';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'scene' | 'chapter';
  data: Scene | Chapter;
  title: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, type, data, title }) => {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeWordCounts, setIncludeWordCounts] = useState(true);
  const [separateScenes, setSeparateScenes] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const { showToast } = useToast();

  const formatOptions = [
    {
      value: 'markdown',
      label: 'Markdown',
      icon: FileText,
      description: 'Great for GitHub, Notion, or other markdown editors',
    },
    {
      value: 'html',
      label: 'HTML',
      icon: Globe,
      description: 'Formatted web page you can open in any browser',
    },
    {
      value: 'txt',
      label: 'Plain Text',
      icon: File,
      description: 'Simple text file compatible with everything',
    },
    {
      value: 'docx',
      label: 'Word Document',
      icon: FileDown,
      description: 'Rich text format for Microsoft Word',
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        includeMetadata,
        includeWordCounts,
        separateScenes: separateScenes && type === 'chapter',
      };

      performExport(type, data, options);

      showToast(`${type === 'scene' ? 'Scene' : 'Chapter'} exported successfully!`, 'success');
      onClose();
    } catch (error) {
      showToast('Export failed. Please try again.', 'error');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Export {type === 'scene' ? 'Scene' : 'Chapter'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* What's being exported */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">{title}</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {type === 'scene'
                ? `${(data as Scene).wordCount} words`
                : `${(data as Chapter).scenes.length} scenes • ${(data as Chapter).totalWordCount} words`}
            </p>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      format === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={option.value}
                      checked={format === option.value}
                      onChange={(e) => setFormat(e.target.value as ExportFormat)}
                      className="mt-1"
                    />
                    <Icon className="w-5 h-5 mt-0.5 text-gray-600 dark:text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Options
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include metadata (status, dates, summaries)
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeWordCounts}
                  onChange={(e) => setIncludeWordCounts(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include word counts and goals
                </span>
              </label>

              {type === 'chapter' && (
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={separateScenes}
                    onChange={(e) => setSeparateScenes(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Add scene separators
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
