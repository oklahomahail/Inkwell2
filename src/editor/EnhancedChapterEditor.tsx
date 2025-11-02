/**
 * EnhancedChapterEditor
 *
 * TipTap-based chapter editor with autosave integration for v0.8.0 Phase 1.
 *
 * Features:
 * - Rich text editing via TipTap
 * - Automatic save scheduling on content change
 * - Per-chapter document persistence
 * - onChange event emission for parent components
 */

import { useState, useEffect, useCallback } from 'react';

import useAutoSave from '../hooks/useAutoSave';
import { wrapSaveWithTelemetry } from '../services/saveWithTelemetry';

interface EnhancedChapterEditorProps {
  chapterId: string;
  initialContent: string;
  saveFn: (id: string, content: string) => Promise<{ checksum: string }>;
  onSaved?: () => void;
  className?: string;
}

export default function EnhancedChapterEditor({
  chapterId,
  initialContent,
  saveFn,
  onSaved,
  className = '',
}: EnhancedChapterEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [checksum, setChecksum] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // When chapter ID changes, reset content and status for new chapter
  useEffect(() => {
    setContent(initialContent);
    setChecksum(undefined);
    setStatus('idle');
  }, [chapterId, initialContent]);

  const handleSave = useCallback(
    async (latest: string) => {
      try {
        const wrappedSave = wrapSaveWithTelemetry(async (id: string, body: string) => {
          const res = await saveFn(id, body);
          return res;
        });
        const { checksum: next } = await wrappedSave(chapterId, latest);
        setChecksum(next);
        setStatus('saved');
        onSaved?.();
      } catch (e) {
        console.error('[EnhancedChapterEditor] Failed to autosave:', e);
        throw e;
      }
    },
    [chapterId, saveFn, onSaved],
  );

  useAutoSave({
    value: content,
    delay: 750,
    onSave: handleSave,
    onBeforeSave: () => setStatus('saving'),
    onError: () => setStatus('error'),
    flushOnUnmount: true,
  });

  // TODO: Wire TipTap editor here
  // For now, use a simple textarea as placeholder
  return (
    <div
      className={`enhanced-chapter-editor ${className}`}
      data-editor="enhanced"
      data-chapter-id={chapterId}
    >
      <header className="flex items-center gap-3 px-3 py-2">
        <span data-testid="autosave-indicator" className="text-xs opacity-70">
          {status === 'saving' && 'Saving…'}
          {status === 'saved' && 'Saved'}
          {status === 'error' && 'Save failed'}
        </span>
      </header>
      <textarea
        className="w-full h-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your chapter..."
        data-testid="editor-textarea"
      />
    </div>
  );
}
