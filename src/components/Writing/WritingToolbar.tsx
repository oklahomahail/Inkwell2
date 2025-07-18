import React, { useCallback } from 'react';
import { ExportFormat } from '../../types/writing';
import { exportFormats } from '../../utils/exportFormats';

interface WritingToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  titleRef: React.RefObject<HTMLInputElement | null>; // <-- allow null here
  content: string;
  lastSaved: string;
  isSaving: boolean;
  onSave: () => void;
  exportFormat: ExportFormat;
  onExportFormatChange: (format: ExportFormat) => void;
  defaultTitle: string;
  isDirty: boolean;
}

const WritingToolbar: React.FC<WritingToolbarProps> = ({
  title,
  onTitleChange,
  titleRef,
  content,
  lastSaved,
  isSaving,
  onSave,
  exportFormat,
  onExportFormatChange,
  defaultTitle,
  isDirty,
}) => {
  const handleExport = useCallback(async () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const exportTitle = title || defaultTitle;
      const sanitizedTitle = exportTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
      const config = exportFormats[exportFormat];
      const filename = `${sanitizedTitle}-${timestamp}.${config.ext}`;

      const exportContent = config.formatter(exportTitle, content);
      const blob = new Blob([exportContent], { type: `${config.mime};charset=utf-8` });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  }, [title, content, exportFormat, defaultTitle]);

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Chapter Title"
          className="flex-1 text-2xl font-bold bg-transparent outline-none text-gray-900 dark:text-gray-100"
        />
        <div className="text-sm text-gray-500 dark:text-gray-400 ml-4">
          {isSaving ? 'Saving...' : isDirty ? 'Unsaved changes' : lastSaved}
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-3">
        <select
          value={exportFormat}
          onChange={(e) => onExportFormatChange(e.target.value as ExportFormat)}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value="markdown">Markdown</option>
          <option value="txt">Plain Text</option>
          <option value="docx">Word</option>
        </select>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={handleExport}
          disabled={!content.trim() && !title.trim()}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Export
        </button>
      </div>
    </div>
  );
};

export default WritingToolbar;
