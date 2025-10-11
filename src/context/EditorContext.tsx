// src/context/EditorContext.tsx
import React, { createContext, useContext, useRef, type ReactNode } from 'react';

import type { Editor } from '@tiptap/react';

interface EditorContextValue {
  currentEditor: Editor | null;
  setCurrentEditor: (_editor: Editor | null) => void;
  insertText: (_text: string) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export const useEditorContext = _useEditorContext;

export function _useEditorContext(): EditorContextValue {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
}

export const EditorProvider = _EditorProvider;

export function _EditorProvider({ children }: { children: ReactNode }) {
  const currentEditorRef = useRef<Editor | null>(null);

  const setCurrentEditor = (editor: Editor | null) => {
    currentEditorRef.current = editor;
  };

  const insertText = (text: string) => {
    const editor = currentEditorRef.current;
    if (!editor) {
      console.warn('No active editor available for text insertion');
      return;
    }

    // Get current selection or cursor position
    const { selection } = editor.state;
    const { from, to } = selection;

    // Insert text at current position
    editor.chain().focus().insertContentAt({ from, to }, text).run();
  };

  return (
    <EditorContext.Provider
      value={{
        currentEditor: currentEditorRef.current,
        setCurrentEditor,
        insertText,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}
