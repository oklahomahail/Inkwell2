// src/components/Writing/WritingEditor.tsx
import React, { useEffect } from 'react';

// src/components/Writing/WritingEditor.tsx
interface WritingEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onTextSelect?: () => void;
  onScroll?: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>; // <-- allow null
}

const WritingEditor: React.FC<WritingEditorProps> = ({
  content,
  onContentChange,
  onTextSelect,
  onScroll,
  textareaRef
}) => {
  // Trigger onTextSelect when the selection changes
  useEffect(() => {
    const handleSelection = () => {
      if (onTextSelect) onTextSelect();
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('mouseup', handleSelection);
      textarea.addEventListener('keyup', handleSelection);
    }

    return () => {
      if (textarea) {
        textarea.removeEventListener('mouseup', handleSelection);
        textarea.removeEventListener('keyup', handleSelection);
      }
    };
  }, [onTextSelect, textareaRef]);

  return (
    <div className="flex-1 p-4 overflow-auto">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        onScroll={onScroll}
        className="w-full h-full resize-none border-none outline-none text-lg leading-relaxed text-gray-900 dark:text-gray-100 bg-transparent font-serif"
        placeholder="Start writing your chapter here..."
        spellCheck={true}
      />
    </div>
  );
};

export default WritingEditor;
