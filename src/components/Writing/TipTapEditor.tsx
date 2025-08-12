import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import { cn } from '@/utils/cn';

type Props = {
  value: string;
  onChange: (html: string) => void;
  onWordCountChange?: (count: number) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
};

export default function TipTapEditor({
  value,
  onChange,
  onWordCountChange,
  placeholder = 'Start writing…',
  readOnly = false,
  className,
}: Props) {
  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Typography,
      CharacterCount.configure({ limit: 0 }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      if (onWordCountChange) {
        const text = editor.getText();
        const count = text.trim() ? text.trim().split(/\s+/).length : 0;
        onWordCountChange(count);
      }
    },
  });

  // Keep external value in sync
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
      // v3 API: pass an options object instead of boolean
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={cn('prose max-w-none', className)}>
      <EditorContent editor={editor} />
    </div>
  );
}
