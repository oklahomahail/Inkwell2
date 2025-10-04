// src/components/ExportDialog.tsx
import { X, Download, FileText, File, FileImage, Settings } from 'lucide-react';
import React, { useState } from 'react';

import { useToast } from '@/context/toast';
import { exportService, ExportOptions } from '@/services/exportService';
import { ExportFormat } from '@/types/writing';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

interface FormatOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: string; // Change to string identifier instead of component
  recommended?: boolean;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, projectId, projectName }) => {
  const { showToast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.MARKDOWN);
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customTitle, setCustomTitle] = useState(projectName);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeSynopsis, setIncludeSynopsis] = useState(true);
  const [includeCharacterNotes, setIncludeCharacterNotes] = useState(false);

  const formatOptions: FormatOption[] = [
    {
      format: ExportFormat.MARKDOWN,
      label: 'Markdown',
      description: 'Universal format, great for further editing',
      icon: 'FileText',
      recommended: true,
    },
    {
      format: ExportFormat.TXT,
      label: 'Plain Text',
      description: 'Simple text file, compatible everywhere',
      icon: 'File',
    },
    {
      format: ExportFormat.PDF,
      label: 'PDF',
      description: 'Print-ready format for sharing',
      icon: 'FileImage',
    },
    {
      format: ExportFormat.DOCX,
      label: 'Word Document',
      description: 'RTF format compatible with Microsoft Word',
      icon: 'FileText',
    },
  ];

  // Icon mapping
  const getIcon = (iconName: string) => {
    const icons = {
      FileText,
      File,
      FileImage,
    };
    return icons[iconName as keyof typeof icons] || FileText;
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const options: Partial<ExportOptions> = {
        customTitle,
        includeMetadata,
        includeSynopsis,
        includeCharacterNotes,
      };

      const result = await exportService.exportProject(projectId, selectedFormat, options);

      if (result.success) {
        showToast(`Successfully exported ${result.filename}`, 'success');
        onClose();
      } else {
        showToast(`Export failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast('Export failed: Unknown error', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Export Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">{projectName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ready to export in your preferred format
            </p>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Export Format
            </label>
            <div className="grid gap-3">
              {formatOptions.map((option) => {
                const IconComponent = getIcon(option.icon);
                const isSelected = selectedFormat === option.format;

                return (
                  <button
                    key={option.format}
                    onClick={() => setSelectedFormat(option.format)}
                    className={`
                      relative flex items-start p-4 rounded-lg border transition-all
                      ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }
                    `}
                  >
                    <div className="flex-shrink-0">
                      <IconComponent size={20} color={isSelected ? '#2563eb' : '#9ca3af'} />
                    </div>
                    <div className="ml-3 flex-1 text-left">
                      <div className="flex items-center">
                        <span
                          className={`font-medium ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}
                        >
                          {option.label}
                        </span>
                        {option.recommended && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm mt-1 ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                        {option.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Settings size={16} className="mr-2" />
              Advanced Options
              <span className="ml-1 text-xs text-gray-500">
                {showAdvanced ? '(Hide)' : '(Show)'}
              </span>
            </button>

            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {/* Custom Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Export Title
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Custom title for export"
                  />
                </div>

                {/* Include Options */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="include-metadata"
                      type="checkbox"
                      checked={includeMetadata}
                      onChange={(e) => setIncludeMetadata(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="include-metadata"
                      className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      Include title page and metadata
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="include-synopsis"
                      type="checkbox"
                      checked={includeSynopsis}
                      onChange={(e) => setIncludeSynopsis(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="include-synopsis"
                      className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      Include project synopsis
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="include-characters"
                      type="checkbox"
                      checked={includeCharacterNotes}
                      onChange={(e) => setIncludeCharacterNotes(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="include-characters"
                      className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      Include character notes (if available)
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors flex items-center"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
