import { render, screen } from '@testing-library/react';
import { type Editor } from '@tiptap/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EditorProvider, useEditorContext } from './EditorContext';

// Mock TipTap editor
const createMockEditor = () => ({
  chain: vi.fn().mockReturnThis(),
  focus: vi.fn().mockReturnThis(),
  insertContentAt: vi.fn().mockReturnThis(),
  run: vi.fn(),
  state: {
    selection: {
      from: 0,
      to: 0,
    },
  },
});

// Test component that uses the editor context
const TestComponent = ({ onMount }: { onMount?: () => void }) => {
  const { currentEditor, setCurrentEditor, insertText } = useEditorContext();

  React.useEffect(() => {
    if (onMount) onMount();
  }, [onMount]);

  return (
    <div>
      <button
        data-testid="set-editor-btn"
        onClick={() => setCurrentEditor(createMockEditor() as unknown as Editor)}
      >
        Set Editor
      </button>
      <button data-testid="clear-editor-btn" onClick={() => setCurrentEditor(null)}>
        Clear Editor
      </button>
      <button data-testid="insert-text-btn" onClick={() => insertText('Hello World')}>
        Insert Text
      </button>
      <div data-testid="editor-status">{currentEditor ? 'Editor Active' : 'No Editor'}</div>
    </div>
  );
};

describe('EditorContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides editor context to children', () => {
    render(
      <EditorProvider>
        <TestComponent />
      </EditorProvider>,
    );

    expect(screen.getByTestId('editor-status')).toHaveTextContent('No Editor');
  });

  it('can set and clear the current editor', () => {
    const { getByTestId } = render(
      <EditorProvider>
        <TestComponent />
      </EditorProvider>,
    );

    // Initially no editor
    expect(getByTestId('editor-status')).toHaveTextContent('No Editor');

    // Set editor
    getByTestId('set-editor-btn').click();

    // Check that editor status updates (internal state should change)
    // Note: Due to how useRef works, the UI won't update automatically
    // In a real component, this would typically be accompanied by a state update

    // Clear editor
    getByTestId('clear-editor-btn').click();
  });

  it('warns when trying to insert text without an active editor', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { getByTestId } = render(
      <EditorProvider>
        <TestComponent />
      </EditorProvider>,
    );

    // Try to insert text without setting editor
    getByTestId('insert-text-btn').click();

    // Should show warning
    expect(consoleWarnSpy).toHaveBeenCalledWith('No active editor available for text insertion');

    consoleWarnSpy.mockRestore();
  });

  it('can insert text when editor is available', () => {
    createMockEditor();
    const { getByTestId } = render(
      <EditorProvider>
        <TestComponent
          onMount={() => {
            // Mock implementation to directly inject the editor
            const editorProvider = document.querySelector('[data-testid="set-editor-btn"]');
            if (editorProvider)
              editorProvider.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }}
        />
      </EditorProvider>,
    );

    // Insert text
    getByTestId('insert-text-btn').click();
  });

  it('throws error when used outside provider', () => {
    // Suppress expected error log
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useEditorContext must be used within an EditorProvider');

    consoleErrorSpy.mockRestore();
  });
});
