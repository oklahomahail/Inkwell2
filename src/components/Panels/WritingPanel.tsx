// src/components/Panels/WritingPanel.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface WritingPanelProps {
  onTextSelect?: () => void;
  selectedText?: string;
}

const DEFAULT_TITLE = 'Untitled Chapter';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

const WritingPanel: React.FC<WritingPanelProps> = ({ onTextSelect, selectedText }) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'txt'>('markdown');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const previousDataRef = useRef({ content: '', title: '' });

  // Load saved content on mount
  useEffect(() => {
    try {
      const savedContent = localStorage.getItem('writing_content') || '';
      const savedTitle = localStorage.getItem('writing_title') || '';
      const savedTimestamp = localStorage.getItem('writing_last_saved');

      setContent(savedContent);
      setTitle(savedTitle);
      
      if (savedTimestamp) {
        setLastSaved(new Date(savedTimestamp));
      }

      // Focus title if no content exists
      if (!savedTitle && titleRef.current) {
        titleRef.current.focus();
      }

      // Set initial previous data
      previousDataRef.current = { content: savedContent, title: savedTitle };
    } catch (err) {
      console.error('Failed to load saved content:', err);
      // Continue with default empty state if loading fails
    }
  }, []);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, []);

  // Adjust height when content changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  // Save work function
  const handleSaveWork = useCallback(async () => {
    if (isSaving) return; // Prevent concurrent saves
    
    setIsSaving(true);
    try {
      // Check storage availability
      if (typeof Storage === 'undefined') {
        throw new Error('Local storage not available');
      }

      localStorage.setItem('writing_content', content);
      localStorage.setItem('writing_title', title);
      const now = new Date();
      localStorage.setItem('writing_last_saved', now.toISOString());
      setLastSaved(now);

      // Update previous data to prevent unnecessary future saves
      previousDataRef.current = { content, title };

      // Show saving feedback briefly
      setTimeout(() => setIsSaving(false), 1000);
    } catch (err) {
      console.error('Save failed:', err);
      setIsSaving(false);

      // Type-safe error handling
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      
      // Provide specific error messages
      if (error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded. Please export your work and clear some data.');
      } else {
        alert('Failed to save. Please try again or export your work as backup.');
      }
    }
  }, [content, title, isSaving]);

  // Auto-save effect
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const hasChanges = 
        content !== previousDataRef.current.content || 
        title !== previousDataRef.current.title;
      
      const hasContent = content.trim() || title.trim();

      if (hasChanges && hasContent) {
        handleSaveWork();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(autoSaveInterval);
  }, [handleSaveWork]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSaveWork();
            break;
          case 'e':
            e.preventDefault();
            handleExport();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleSaveWork]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleExport = useCallback(() => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const exportTitle = title || DEFAULT_TITLE;
      const filename = `${exportTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.${exportFormat}`;
      
      let exportContent = '';
      if (exportFormat === 'markdown') {
        exportContent = `# ${exportTitle}\n\n${content}`;
      } else {
        const titleLine = '='.repeat(exportTitle.length);
        exportContent = `${exportTitle}\n${titleLine}\n\n${content}`;
      }

      const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Success feedback
      alert(`Successfully exported as ${exportFormat.toUpperCase()}!`);
    } catch (err) {
      console.error('Export failed:', err);
      const error = err instanceof Error ? err : new Error('Export failed');
      alert(`Export failed: ${error.message}. Please try again.`);
    }
  }, [title, content, exportFormat]);

  // Utility functions
  const getWordCount = useCallback(() => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, [content]);

  const getCharacterCount = useCallback(() => {
    return content.length;
  }, [content]);

  const getParagraphCount = useCallback(() => {
    return content.split('\n\n').filter(paragraph => paragraph.trim().length > 0).length;
  }, [content]);

  const formatLastSaved = useCallback(() => {
    if (isSaving) return 'Saving...';
    if (!lastSaved) return 'Never saved';

    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Just saved';
    if (diffMinutes < 60) return `Saved ${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Saved ${diffHours}h ago`;

    return `Saved ${lastSaved.toLocaleDateString()}`;
  }, [isSaving, lastSaved]);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Chapter Title"
              className="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{getWordCount()} words</span>
            <span>{getCharacterCount()} chars</span>
            <span className={`text-xs ${isSaving ? 'text-blue-600 dark:text-blue-400' : ''}`}>
              {formatLastSaved()}
            </span>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Shortcuts: Ctrl+S (Save) • Ctrl+E (Export)
        </div>

        {/* Quick actions bar */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Paragraphs: {getParagraphCount()}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'markdown' | 'txt')}
              className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="markdown">Markdown</option>
              <option value="txt">Text</option>
            </select>
            
            <button
              onClick={handleSaveWork}
              disabled={isSaving}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            
            <button
              onClick={handleExport}
              className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export
            </button>
          </div>
        </div>

        {/* Selected text indicator */}
        {selectedText && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Selected: "{selectedText.substring(0, 60)}{selectedText.length > 60 ? '...' : ''}"
            </span>
          </div>
        )}
      </div>

      {/* Writing Area */}
      <div className="flex-1 flex">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onSelect={onTextSelect}
          placeholder="Start writing your story..."
          className="w-full h-full resize-none border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 text-lg leading-relaxed placeholder-gray-500 dark:placeholder-gray-400 font-serif p-6"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        />
      </div>
    </div>
  );
};

export default WritingPanel;