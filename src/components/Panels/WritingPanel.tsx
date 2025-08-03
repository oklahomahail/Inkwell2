import React, { useState, useRef, useEffect, useMemo, useCallback, forwardRef } from 'react';
import { ExportFormat } from '../../types/writing';
import { useToast } from '@/context/ToastContext';
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
}

const WritingToolbar: React.FC<WritingToolbarProps> = ({
  title,
  onTitleChange,
  onManualSave,
  onExport,
  exportFormat,
  setExportFormat,
  onClaudeAssist,
}) => {
  return (
    <div className="flex items-center gap-3 mb-3">
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="px-3 py-1 border rounded text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-200"
      />
      <button
        onClick={onManualSave}
        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save
      </button>
      <select
        value={exportFormat}
        onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
        className="px-2 py-1 border rounded text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-200"
      >
        <option value="markdown">Markdown</option>
        <option value="txt">Text</option>
        <option value="docx">DOCX</option>
      </select>
      <button
        onClick={onExport}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Export
      </button>
      <button
        onClick={onClaudeAssist}
        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Claude Assist
      </button>
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
        className="w-full h-full p-3 border rounded resize-none dark:bg-gray-800 dark:text-gray-200"
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
  const [saveQueue, setSaveQueue] = useState<SaveQueueItem[]>([]);
  const [claudeResponse, setClaudeResponse] = useState<string>('');

  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialLoadRef = useRef(false);

  const wordCount = useMemo(() => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  }, [content]);

  // Initialize draft on mount
  useEffect(() => {
    if (!initialLoadRef.current) {
      setContent(draftText);
      initialLoadRef.current = true;
    }
  }, [draftText]);

  // Track edits for autosave
  useEffect(() => {
    setAutoSaveState((prev) => ({ ...prev, isDirty: true }));
    setSession((prev) => ({ ...prev, lastActivityTime: new Date() }));
  }, [content]);

  const handleAutoSave = useCallback(() => {
    const newItem: SaveQueueItem = {
      content,
      title,
      timestamp: Date.now(),
      type: 'auto',
    };
    setSaveQueue((prev) => [...prev, newItem]);
    setAutoSaveState((prev) => ({
      isSaving: false,
      isDirty: false,
      lastSaved: new Date(),
      saveCount: prev.saveCount + 1,
    }));
    logActivity('Auto-saved draft', 'writing');
    showToast('Draft auto-saved', 'info');
  }, [content, title, showToast]);

  // Auto-save interval - Fixed dependency array
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoSaveState.isDirty) {
        handleAutoSave();
      }
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [autoSaveState.isDirty, handleAutoSave]); // Include handleAutoSave in dependencies

  const handleManualSave = useCallback(() => {
    const newItem: SaveQueueItem = {
      content,
      title,
      timestamp: Date.now(),
      type: 'manual',
    };
    setSaveQueue((prev) => [...prev, newItem]);
    setAutoSaveState((prev) => ({
      isSaving: false,
      isDirty: false,
      lastSaved: new Date(),
      saveCount: prev.saveCount + 1,
    }));
    logActivity('Manual save', 'writing');
    showToast('Draft saved!', 'success');
  }, [content, title, showToast]);

  const handleClaudeAssist = useCallback(() => {
    const mockReply =
      selectedText.trim() === ''
        ? 'Claude suggests tightening this section for clarity and flow.'
        : `Claude suggestion for "${selectedText}": simplify and make more engaging.`;
    setClaudeResponse(mockReply);
    logActivity('Claude generated suggestion', 'ai');
    showToast('Claude provided a suggestion', 'info');
  }, [selectedText, showToast]);

  const handleExport = useCallback(() => {
    let blob: Blob;
    if (exportFormat === 'markdown' || exportFormat === 'txt') {
      blob = new Blob([content], { type: 'text/plain' });
    } else {
      blob = new Blob([content], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.${exportFormat === 'markdown' ? 'md' : exportFormat === 'txt' ? 'txt' : 'docx'}`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported as ${exportFormat}`, 'success');
  }, [content, exportFormat, title, showToast]);

  return (
    <div className="flex flex-col h-full p-4 bg-gray-50 dark:bg-gray-900">
      <WritingToolbar
        title={title}
        onTitleChange={setTitle}
        onManualSave={handleManualSave}
        onExport={handleExport}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        onClaudeAssist={handleClaudeAssist}
      />
      <div className="flex-1">
        <WritingEditor
          ref={textareaRef}
          value={content}
          onChange={(val) => {
            setContent(val);
            onChangeText(val);
          }}
          onTextSelect={onTextSelect}
        />
      </div>
      <div className="flex justify-between items-center text-sm text-gray-600 mt-2 text-gray-600 dark:text-gray-400">
        <div>Words: {wordCount}</div>
        <div>
          Last saved:{' '}
          {autoSaveState.lastSaved ? autoSaveState.lastSaved.toLocaleTimeString() : 'Not yet'}
        </div>
        <div>Session start: {session.startTime.toLocaleTimeString()}</div>
      </div>
      {claudeResponse && (
        <div className="mt-3 p-2 border rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
          {claudeResponse}
        </div>
      )}
    </div>
  );
};

export default WritingPanel;
