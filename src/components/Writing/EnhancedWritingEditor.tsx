// src/components/Writing/EnhancedWritingEditor.tsx - Complete with full auto-focus
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import {
  Bold,
  Italic,
  Type,
  Save,
  Wand2,
  RotateCcw,
  RotateCw,
  Sparkles,
  Target,
  Clock,
} from 'lucide-react';
import { useAppContext, View } from '@/context/AppContext';
import { useCommandPalette } from '../CommandPalette/CommandPaletteProvider';
import { Scene, SceneStatus } from '@/types/writing';
import { storageService } from '@/services/storageService';

interface EnhancedWritingEditorProps {
  scene?: Scene;
  onSceneUpdate?: (scene: Scene) => void;
  projectId: string;
}

interface WritingStats {
  words: number;
  characters: number;
  paragraphs: number;
  readingTime: number; // in minutes
}

export const EnhancedWritingEditor: React.FC<EnhancedWritingEditorProps> = ({
  scene,
  onSceneUpdate,
  projectId,
}) => {
  const { claudeActions, setAutoSaveSaving, setAutoSaveSuccess, setAutoSaveError, state } =
    useAppContext();
  const { registerCommand, unregisterCommand } = useCommandPalette();
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [writingStats, setWritingStats] = useState<WritingStats>({
    words: 0,
    characters: 0,
    paragraphs: 0,
    readingTime: 0,
  });

  // Auto-save timer
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your story...',
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount.configure({
        limit: 50000, // 50k character limit per scene
      }),
      Typography.configure({
        openDoubleQuote: '"',
        closeDoubleQuote: '"',
        openSingleQuote: '\u2018', // '
        closeSingleQuote: '\u2019', // '
      }),
    ],
    content: scene?.content || '',
    editorProps: {
      attributes: {
        class: 'writing-editor-content',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      const text = editor.getText();

      // Update stats
      const words = text.split(/\s+/).filter((word) => word.length > 0).length;
      const characters = text.length;
      const paragraphs = content.split('</p>').length - 1;
      const readingTime = Math.ceil(words / 200); // Average reading speed

      setWritingStats({ words, characters, paragraphs, readingTime });

      // Mark as dirty
      setHasUnsavedChanges(true);

      // Clear existing timer and set new one
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }

      autoSaveTimer.current = setTimeout(() => {
        saveScene(content, words);
      }, 2000); // Auto-save after 2 seconds of inactivity
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      setSelectedText(text);
    },
  });

  // 🆕 AUTO-FOCUS HELPER FUNCTION
  const focusEditor = useCallback(() => {
    if (editor && !editor.isDestroyed) {
      try {
        editor.commands.focus();
      } catch (error) {
        // Silently handle focus errors
        console.debug('Editor focus failed:', error);
      }
    }
  }, [editor]);

  // 🆕 AUTO-FOCUS ON EDITOR READY
  useEffect(() => {
    if (editor && state.view === View.Writing) {
      const timer = setTimeout(focusEditor, 100);
      return () => clearTimeout(timer);
    }
  }, [editor, focusEditor, state.view]);

  // 🆕 AUTO-FOCUS ON VIEW CHANGE TO WRITING
  useEffect(() => {
    if (state.view === View.Writing && editor) {
      const timer = setTimeout(focusEditor, 150);
      return () => clearTimeout(timer);
    }
  }, [state.view, editor, focusEditor]);

  // 🆕 AUTO-FOCUS ON PROJECT CHANGE (if in writing view)
  useEffect(() => {
    if (state.view === View.Writing && editor && projectId) {
      const timer = setTimeout(focusEditor, 200);
      return () => clearTimeout(timer);
    }
  }, [projectId, state.view, editor, focusEditor]);

  // 🆕 LISTEN FOR GLOBAL FOCUS EVENTS
  useEffect(() => {
    const handleFocusEvent = () => {
      if (state.view === View.Writing) {
        focusEditor();
      }
    };

    window.addEventListener('focusWritingEditor', handleFocusEvent);
    return () => window.removeEventListener('focusWritingEditor', handleFocusEvent);
  }, [state.view, focusEditor]);

  // 🆕 RESTORE FOCUS AFTER CLAUDE INTERACTIONS
  useEffect(() => {
    // If Claude was just closed/hidden and we're in writing view, restore focus
    if (!state.claude?.isVisible && state.view === View.Writing && editor) {
      const timer = setTimeout(focusEditor, 100);
      return () => clearTimeout(timer);
    }
  }, [state.claude?.isVisible, state.view, editor, focusEditor]);

  // Enhanced save scene function with focus restoration
  const saveScene = useCallback(
    async (content?: string, wordCount?: number) => {
      if (!editor) return;

      const currentContent = content || editor.getHTML();
      const currentWordCount = wordCount || editor.storage.characterCount?.words() || 0;

      const updatedScene: Scene = {
        id: scene?.id || `scene_${Date.now()}`,
        title: scene?.title || `Scene ${Date.now()}`,
        content: currentContent,
        status: scene?.status || SceneStatus.DRAFT,
        order: scene?.order || 0,
        wordCount: currentWordCount,
        wordCountGoal: scene?.wordCountGoal,
        summary: scene?.summary,
        createdAt: scene?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      try {
        setAutoSaveSaving(true);
        await storageService.saveScene(projectId, updatedScene);

        const savedTime = new Date();
        setAutoSaveSuccess(savedTime);
        setLastSaved(savedTime);
        setHasUnsavedChanges(false);
        onSceneUpdate?.(updatedScene);

        // 🆕 RESTORE FOCUS AFTER SAVE
        setTimeout(focusEditor, 50);
      } catch (error) {
        console.error('Failed to save scene:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to save';
        setAutoSaveError(errorMsg);
      }
    },
    [
      editor,
      scene,
      projectId,
      onSceneUpdate,
      setAutoSaveSaving,
      setAutoSaveSuccess,
      setAutoSaveError,
      focusEditor,
    ],
  );

  // Enhanced AI assist with focus restoration
  const handleAIAssist = useCallback(
    async (action: 'continue' | 'improve' | 'analyze') => {
      if (!editor || !selectedText) return;

      setIsLoading(true);
      try {
        let result = '';

        switch (action) {
          case 'continue':
            result = await claudeActions.suggestContinuation(selectedText);
            break;
          case 'improve':
            result = await claudeActions.improveText(selectedText);
            break;
          case 'analyze':
            result = await claudeActions.analyzeWritingStyle(selectedText);
            alert(result);
            // 🆕 RESTORE FOCUS AFTER ALERT
            setTimeout(focusEditor, 100);
            return;
        }

        if (result) {
          const { from, to } = editor.state.selection;
          editor.chain().focus().deleteRange({ from, to }).insertContent(result).run();
          // Focus is maintained through .focus() in the chain
        }
      } catch (error) {
        console.error('AI assist failed:', error);
      } finally {
        setIsLoading(false);
        // 🆕 ENSURE FOCUS IS RESTORED
        setTimeout(focusEditor, 100);
      }
    },
    [editor, selectedText, claudeActions, focusEditor],
  );

  // Register editor-specific commands
  useEffect(() => {
    const commands = [
      {
        id: 'editor-save',
        label: 'Save Scene',
        description: 'Save current scene content',
        category: 'writing' as const,
        shortcut: '⌘S',
        action: () => saveScene(),
        condition: () => !!editor && hasUnsavedChanges,
      },
      {
        id: 'editor-ai-continue',
        label: 'AI: Continue Text',
        description: 'Use AI to continue selected text',
        category: 'ai' as const,
        action: () => handleAIAssist('continue'),
        condition: () => !!selectedText,
      },
      {
        id: 'editor-ai-improve',
        label: 'AI: Improve Text',
        description: 'Use AI to improve selected text',
        category: 'ai' as const,
        action: () => handleAIAssist('improve'),
        condition: () => !!selectedText,
      },
      {
        id: 'editor-ai-analyze',
        label: 'AI: Analyze Style',
        description: 'Get AI analysis of selected text',
        category: 'ai' as const,
        action: () => handleAIAssist('analyze'),
        condition: () => !!selectedText,
      },
      {
        id: 'editor-word-count',
        label: 'Show Word Count',
        description: `Current scene: ${writingStats.words} words`,
        category: 'writing' as const,
        action: () => {
          alert(`
Scene Stats:
• Words: ${writingStats.words.toLocaleString()}
• Characters: ${writingStats.characters.toLocaleString()}
• Paragraphs: ${writingStats.paragraphs}
• Reading time: ~${writingStats.readingTime} min
          `);
          // 🆕 RESTORE FOCUS AFTER ALERT
          setTimeout(focusEditor, 100);
        },
      },
      // 🆕 NEW FOCUS COMMAND
      {
        id: 'editor-focus',
        label: 'Focus Editor',
        description: 'Focus the writing editor',
        category: 'writing' as const,
        shortcut: 'F',
        action: focusEditor,
        condition: () => !!editor,
      },
    ];

    commands.forEach(registerCommand);

    return () => {
      commands.forEach((cmd) => unregisterCommand(cmd.id));
    };
  }, [
    editor,
    selectedText,
    hasUnsavedChanges,
    writingStats,
    registerCommand,
    unregisterCommand,
    saveScene,
    handleAIAssist,
    focusEditor,
  ]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveScene();
      }
      // 🆕 FOCUS SHORTCUT
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && e.shiftKey) {
        e.preventDefault();
        focusEditor();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveScene, focusEditor]);

  // Cleanup auto-save timer
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  if (!editor) {
    return <div className="writing-editor-loading">Loading editor...</div>;
  }

  return (
    <div className="writing-editor">
      {/* Toolbar */}
      <div className="writing-toolbar">
        <div className="toolbar-section">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
            title="Bold (⌘B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
            title="Italic (⌘I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <div className="toolbar-divider" />

          <button
            onClick={() => editor.chain().focus().undo().run()}
            className="toolbar-btn"
            disabled={!editor.can().undo()}
            title="Undo (⌘Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().redo().run()}
            className="toolbar-btn"
            disabled={!editor.can().redo()}
            title="Redo (⌘⇧Z)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* AI Tools */}
        <div className="toolbar-section">
          <button
            onClick={() => handleAIAssist('continue')}
            className="toolbar-btn toolbar-btn-ai"
            disabled={!selectedText || isLoading}
            title="AI: Continue selected text"
          >
            <Wand2 className="w-4 h-4" />
            Continue
          </button>

          <button
            onClick={() => handleAIAssist('improve')}
            className="toolbar-btn toolbar-btn-ai"
            disabled={!selectedText || isLoading}
            title="AI: Improve selected text"
          >
            <Sparkles className="w-4 h-4" />
            Improve
          </button>
        </div>

        {/* Save Status */}
        <div className="toolbar-section">
          <button
            onClick={() => saveScene()}
            className={`toolbar-btn ${hasUnsavedChanges ? 'toolbar-btn-primary' : ''}`}
            title="Save scene (⌘S)"
          >
            <Save className="w-4 h-4" />
            {hasUnsavedChanges ? 'Save' : 'Saved'}
          </button>

          {lastSaved && (
            <span className="toolbar-text">Last saved: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="writing-editor-container">
        <EditorContent editor={editor} />
      </div>

      {/* Enhanced Status Bar */}
      <div className="writing-status-bar">
        <div className="status-section">
          <div className="status-item">
            <Type className="w-4 h-4" />
            <span className="font-medium">{writingStats.words.toLocaleString()}</span>
            <span className="text-slate-500">words</span>
          </div>

          <div className="status-item">
            <Target className="w-4 h-4" />
            <span>{writingStats.characters.toLocaleString()}</span>
            <span className="text-slate-500">chars</span>
          </div>

          <div className="status-item">
            <Clock className="w-4 h-4" />
            <span>~{writingStats.readingTime}</span>
            <span className="text-slate-500">min read</span>
          </div>
        </div>

        {/* Enhanced word goal progress */}
        {scene?.wordCountGoal && (
          <div className="status-section">
            <div className="word-goal-progress">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600 dark:text-slate-400">Goal Progress</span>
                <span className="text-xs font-medium">
                  {writingStats.words} / {scene.wordCountGoal.toLocaleString()}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min((writingStats.words / scene.wordCountGoal) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {Math.round((writingStats.words / scene.wordCountGoal) * 100)}% complete
              </div>
            </div>
          </div>
        )}

        {/* Selected text info */}
        {selectedText && (
          <div className="status-section">
            <span className="selected-text-info">
              {selectedText.split(/\s+/).length} words selected
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
