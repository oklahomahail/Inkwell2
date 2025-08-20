// src/components/Writing/TipTapEditor.tsx
import React, { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import History from '@tiptap/extension-history';

import { cn } from '@/utils/cn';
import { useAdvancedFocusMode } from '@/hooks/useAdvancedFocusMode';

type Props = {
  value: string;
  onChange: (html: string) => void;
  onWordCountChange?: (count: number) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  sceneId?: string;
  wordCountGoal?: number;
};

export default function TipTapEditor({
  value,
  onChange,
  onWordCountChange,
  placeholder = 'Start writing…',
  readOnly = false,
  className,
  sceneId,
  wordCountGoal,
}: Props) {
  const { isFocusMode, settings, sprint, updateSprintWordCount } = useAdvancedFocusMode();

  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const currentWordCount = useRef(0);

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // (Do NOT place history here — use the History extension below)
      }),
      History.configure({
        depth: 100,
        newGroupDelay: 500,
      }),
      Typography,
      CharacterCount.configure({ limit: 0 }),
      Placeholder.configure({
        placeholder:
          isFocusMode && settings.typewriterMode
            ? 'Write with focus and intention...'
            : placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);

      // Calculate word count from plain text
      const text = editor.getText();
      const count = text.trim() ? text.trim().split(/\s+/).length : 0;
      currentWordCount.current = count;

      onWordCountChange?.(count);

      // Update sprint word count if sprint is active
      if (sprint.isActive) {
        updateSprintWordCount(count);
      }
    },
    editorProps: {
      attributes: {
        class: cn('prose prose-lg dark:prose-invert max-w-none focus:outline-none', {
          'typewriter-editor': settings.typewriterMode,
          'zen-editor': settings.zenMode,
        }),
        'data-scene-id': sceneId || '',
      },
    },
  });

  // Keep external `value` in sync
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  // Typewriter mode: center current paragraph & highlight it
  useEffect(() => {
    if (!editor || !settings.typewriterMode || !isFocusMode) return;

    const handleUpdate = () => {
      const wrapperEl = editorWrapperRef.current;
      if (!wrapperEl) return;

      const editorEl = wrapperEl.querySelector('.ProseMirror') as HTMLElement | null;
      if (!editorEl) return;

      // Current selection
      const selection = editor.state.selection;
      const currentPos = selection.$anchor.pos;

      // Paragraphs and current paragraph index
      const paragraphEls = editorEl.querySelectorAll('p');
      let currentParagraphIndex = 0;
      let found = false;

      editor.state.doc.descendants((node, pos) => {
        if (found) return false;
        if (node.type.name === 'paragraph') {
          if (pos <= currentPos && currentPos <= pos + node.nodeSize) {
            found = true;
            return false;
          }
          currentParagraphIndex++;
        }
        return true;
      });

      // Highlight active paragraph
      paragraphEls.forEach((p, idx) => {
        p.classList.toggle('is-editor-focused', idx === currentParagraphIndex);
      });

      // Center the active paragraph in viewport
      const activeP = paragraphEls[currentParagraphIndex] as HTMLElement | undefined;
      if (activeP) {
        const paragraphRect = activeP.getBoundingClientRect();
        const paragraphCenter = paragraphRect.top + paragraphRect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const scrollOffset = paragraphCenter - viewportCenter;

        if (Math.abs(scrollOffset) > 50) {
          editorEl.scrollBy({ top: scrollOffset, behavior: 'smooth' });
        }
      }
    };

    // Debounce to avoid excessive scrolling
    let scrollTimeout: number | undefined;
    const debounced = () => {
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(handleUpdate, 100);
    };

    editor.on('selectionUpdate', debounced);
    editor.on('update', debounced);

    return () => {
      editor.off('selectionUpdate', debounced);
      editor.off('update', debounced);
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
    };
  }, [editor, settings.typewriterMode, isFocusMode]);

  // Focus mode class toggles and focus behavior
  useEffect(() => {
    if (!editor) return;

    const wrapperEl = editorWrapperRef.current;
    const editorEl = wrapperEl?.querySelector('.ProseMirror') as HTMLElement | null;
    if (!editorEl) return;

    if (isFocusMode) {
      editorEl.classList.add('focus-mode-editor');
      if (settings.typewriterMode) editorEl.classList.add('typewriter-mode');
      if (settings.zenMode) editorEl.classList.add('zen-mode');

      editor.commands.focus();
    } else {
      editorEl.classList.remove('focus-mode-editor', 'typewriter-mode', 'zen-mode');

      // Clear paragraph highlight
      editorEl.querySelectorAll('p.is-editor-focused').forEach((p) => {
        p.classList.remove('is-editor-focused');
      });
    }

    return () => {
      editorEl.classList.remove('focus-mode-editor', 'typewriter-mode', 'zen-mode');
    };
  }, [editor, isFocusMode, settings.typewriterMode, settings.zenMode]);

  // Keep sprint word count in sync when active
  useEffect(() => {
    if (sprint.isActive && currentWordCount.current > 0) {
      updateSprintWordCount(currentWordCount.current);
    }
  }, [sprint.isActive, updateSprintWordCount]);

  if (!editor) return null;

  return (
    <div
      ref={editorWrapperRef}
      className={cn(
        'relative',
        {
          'typewriter-container': isFocusMode && settings.typewriterMode,
          'zen-mode-container': isFocusMode && settings.zenMode,
        },
        className,
      )}
    >
      {/* Progress indicator for word goals (only when not in focus mode) */}
      {wordCountGoal && currentWordCount.current > 0 && !isFocusMode && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{
              width: `${Math.min((currentWordCount.current / wordCountGoal) * 100, 100)}%`,
            }}
          />
        </div>
      )}

      {/* Sprint progress overlay (only in focus mode) */}
      {isFocusMode && sprint.isActive && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Sprint: {sprint.remainingTime}s</span>
          </div>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={cn('prose prose-lg dark:prose-invert max-w-none', {
          'focus:outline-none': true,
          'min-h-[500px]': isFocusMode,
        })}
      />

      {/* Word count display */}
      {(!isFocusMode || settings.showWordCount) && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
          {currentWordCount.current} words{wordCountGoal ? ` / ${wordCountGoal}` : ''}
        </div>
      )}
    </div>
  );
}
