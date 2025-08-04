// src/components/Panels/WritingPanel.tsx - Enhanced with Claude Integration
import React, { useState, useRef, useEffect, useMemo, useCallback, forwardRef } from 'react';
import { ExportFormat } from '../../types/writing';
import { useToast } from '@/context/ToastContext';
import { useAppContext } from '@/context/AppContext';
import { logActivity } from '@/utils/activityLogger';

const DEFAULT_TITLE = 'Untitled Chapter';

interface WritingPanelProps {
  draftText: string;
  onChangeText: (value: string) => void;
  onTextSelect: () => void;
  selectedText: string;
}

interface WritingSession {
  date: string;
  startTime: Date;
  wordsAtStart: number;
  lastActivityTime: Date;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
  saveCount: number;
}

interface SaveQueueItem {
  content: string;
  title: string;
  timestamp: number;
  type: 'auto' | 'manual' | 'claude';
}

/* ---------------- Toolbar Subcomponent ---------------- */
interface WritingToolbarProps {
  title: string;
  onTitleChange: (value: string) => void;
  onManualSave: () => void;
  onExport: () => void;
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  onClaudeAssist: () => void;
  lastSaved?: Date | null;
  isSaving?: boolean;
}

const WritingToolbar: React.FC<WritingToolbarProps> = ({
  title,
  onTitleChange,
  onManualSave,
  onExport,
  exportFormat,
  setExportFormat,
  onClaudeAssist,
  lastSaved,
  isSaving = false,
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Document title..."
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={onManualSave}
          disabled={isSaving}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onClaudeAssist}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Claude Assist
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="markdown">Markdown (.md)</option>
            <option value="txt">Plain Text (.txt)</option>
            <option value="docx">Word Document (.docx)</option>
          </select>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export
          </button>
        </div>

        {lastSaved && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- Editor Subcomponent ---------------- */
interface WritingEditorProps {
  value: string;
  onChange: (val: string) => void;
  onTextSelect: () => void;
}

const WritingEditor = forwardRef<HTMLTextAreaElement, WritingEditorProps>(
  ({ value, onChange, onTextSelect }, ref) => {
    return (
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={onTextSelect}
        placeholder="Start writing your story..."
        className="w-full h-full p-4 border-0 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          focus:outline-none transition-colors duration-200"
        style={{ minHeight: '500px' }}
      />
    );
  },
);
WritingEditor.displayName = 'WritingEditor';

/* ---------------- Main Panel ---------------- */
const WritingPanel: React.FC<WritingPanelProps> = ({
  draftText,
  onChangeText,
  onTextSelect,
  selectedText,
}) => {
  const [content, setContent] = useState(draftText);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown');
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    isDirty: false,
    saveCount: 0,
  });
  const [session, setSession] = useState<WritingSession>({
    date: new Date().toLocaleDateString(),
    startTime: new Date(),
    wordsAtStart: draftText.trim().split(/\s+/).length,
    lastActivityTime: new Date(),
  });

  const { showToast } = useToast();
  const { claude, currentProject } = useAppContext();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialLoadRef = useRef(false);

  const wordCount = useMemo(() => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  }, [content]);

  const readingTime = useMemo(() => {
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  }, [wordCount]);

  // Initialize draft on mount
  useEffect(() => {
    if (!initialLoadRef.current) {
      setContent(draftText);
      if (currentProject?.name) {
        setTitle(currentProject.name);
      }
      initialLoadRef.current = true;
    }
  }, [draftText, currentProject]);

  // Track edits for autosave
  useEffect(() => {
    setAutoSaveState((prev) => ({ ...prev, isDirty: true }));
    setSession((prev) => ({ ...prev, lastActivityTime: new Date() }));
    onChangeText(content);
  }, [content, onChangeText]);

  const handleAutoSave = useCallback(() => {
    setAutoSaveState((prev) => ({
      isSaving: false,
      isDirty: false,
      lastSaved: new Date(),
      saveCount: prev.saveCount + 1,
    }));
    logActivity('Auto-saved draft', 'writing');
    showToast('Draft auto-saved', 'info');
  }, [showToast]);

  // Auto-save interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoSaveState.isDirty && content.trim()) {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [autoSaveState.isDirty, content, handleAutoSave]);

  const handleManualSave = useCallback(() => {
    setAutoSaveState((prev) => ({
      isSaving: false,
      isDirty: false,
      lastSaved: new Date(),
      saveCount: prev.saveCount + 1,
    }));

    // Save session data for analytics
    const sessionData = {
      date: new Date().toLocaleDateString(),
      wordCount: wordCount,
      duration: Date.now() - session.startTime.getTime(),
    };

    const existingSessions = JSON.parse(
      localStorage.getItem(`sessions-${currentProject?.id}`) || '[]',
    );
    existingSessions.push(sessionData);
    localStorage.setItem(`sessions-${currentProject?.id}`, JSON.stringify(existingSessions));

    logActivity('Manual save', 'writing');
    showToast('Draft saved successfully!', 'success');
  }, [wordCount, session.startTime, currentProject?.id, showToast]);

  const handleClaudeAssist = useCallback(() => {
    claude.toggleVisibility();
    showToast('Claude Assistant opened', 'info');
  }, [claude, showToast]);

  const handleExport = useCallback(() => {
    try {
      let blob: Blob;
      let filename: string;

      switch (exportFormat) {
        case 'markdown':
          blob = new Blob([`# ${title}\n\n${content}`], { type: 'text/markdown' });
          filename = `${title}.md`;
          break;
        case 'txt':
          blob = new Blob([content], { type: 'text/plain' });
          filename = `${title}.txt`;
          break;
        case 'docx':
          // For now, export as plain text - you could integrate a library like docx for real DOCX
          blob = new Blob([content], { type: 'text/plain' });
          filename = `${title}.docx`;
          break;
        default:
          blob = new Blob([content], { type: 'text/plain' });
          filename = `${title}.txt`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Exported as ${exportFormat.toUpperCase()}`, 'success');
      logActivity(`Exported document as ${exportFormat}`, 'writing');
    } catch (error) {
      showToast('Export failed. Please try again.', 'error');
      console.error('Export error:', error);
    }
  }, [content, exportFormat, title, showToast]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <WritingToolbar
        title={title}
        onTitleChange={setTitle}
        onManualSave={handleManualSave}
        onExport={handleExport}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        onClaudeAssist={handleClaudeAssist}
        lastSaved={autoSaveState.lastSaved}
        isSaving={autoSaveState.isSaving}
      />

      <div className="flex-1 overflow-hidden">
        <WritingEditor
          ref={textareaRef}
          value={content}
          onChange={setContent}
          onTextSelect={onTextSelect}
        />
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Words: {wordCount.toLocaleString()}</span>
          <span>Reading time: ~{readingTime} min</span>
          {selectedText && <span>Selected: {selectedText.length} chars</span>}
        </div>
        <div className="flex items-center space-x-4">
          <span>Session: {session.startTime.toLocaleTimeString()}</span>
          {autoSaveState.isDirty && (
            <span className="text-yellow-600 dark:text-yellow-400">Unsaved changes</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingPanel;
