// src/components/Writing/EnhancedWritingEditor.tsx - Complete version
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import {
  Save,
  Eye,
  EyeOff,
  Target,
  Clock,
  PanelLeftOpen,
  PanelLeftClose,
  Focus,
  Bot,
} from 'lucide-react';

import ClaudeToolbar from './ClaudeToolbar'; // Using your existing component name
import SceneNavigationPanel from './SceneNavigationPanel';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { storageService } from '@/services/storageService';
import { Scene, Chapter } from '@/types/writing';
import { focusWritingEditor } from '@/utils/focusUtils';

interface EnhancedWritingEditorProps {
  className?: string;
}

const EnhancedWritingEditor: React.FC<EnhancedWritingEditorProps> = ({ className = '' }) => {
  const { currentProject, state } = useAppContext();
  const { showToast } = useToast();

  // State
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [showScenePanel, setShowScenePanel] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showWordGoal, setShowWordGoal] = useState(false);
  const [wordGoal, setWordGoal] = useState(500);
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [showPopupToolbar, setShowPopupToolbar] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return "What's the title?";
          }
          return 'Start writing your scene...';
        },
      }),
      CharacterCount.configure({
        limit: 100000,
      }),
      Typography,
    ],
    content: currentScene?.content || '',
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      const text = editor.getText();
      const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;

      // Update current scene content
      if (currentScene) {
        const updatedScene = {
          ...currentScene,
          content,
          wordCount,
          updatedAt: new Date(),
        };
        setCurrentScene(updatedScene);

        // Auto-save
        debouncedSave(updatedScene);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');

      if (text.trim() && text.length > 10) {
        setSelectedText(text);

        // Get cursor position for popup toolbar
        const { view } = editor;
        const start = view.coordsAtPos(from);

        setToolbarPosition({
          x: start.left,
          y: start.top - 80,
        });

        // Show popup toolbar after a short delay to avoid flickering
        setTimeout(() => setShowPopupToolbar(true), 300);
      } else {
        setSelectedText('');
        setShowPopupToolbar(false);
      }
    },
    editorProps: {
      attributes: {
        class: `
          prose prose-lg dark:prose-invert max-w-none focus:outline-none
          prose-headings:font-bold prose-p:leading-relaxed
          prose-strong:text-gray-900 dark:prose-strong:text-white
          prose-em:text-gray-700 dark:prose-em:text-gray-300
        `,
        'data-testid': 'writing-editor',
      },
    },
    immediatelyRender: false,
  });

  // Auto-save functionality
  const saveScene = useCallback(
    async (scene: Scene) => {
      if (!currentProject) return;

      try {
        await storageService.saveScene(currentProject.id, scene);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save scene:', error);
        showToast('Failed to save scene', 'error');
      }
    },
    [currentProject, showToast],
  );

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((scene: Scene) => saveScene(scene), 2000),
    [saveScene],
  );

  // Load initial scene
  useEffect(() => {
    const loadInitialScene = async () => {
      if (!currentProject) return;

      try {
        const chapters = await storageService.loadWritingChapters(currentProject.id);
        if (chapters.length > 0) {
          const firstChapter = chapters[0];
          if (firstChapter && firstChapter.scenes.length > 0) {
            const firstScene = firstChapter.scenes[0];
            if (firstScene) {
              setCurrentScene(firstScene);
              setCurrentChapter(firstChapter);
              editor?.commands.setContent(firstScene.content || '');
            }
          }
        }
      } catch (error) {
        console.error('Failed to load scenes:', error);
        showToast('Failed to load scenes', 'error');
      }
    };

    loadInitialScene();
  }, [currentProject, editor]);

  // Handle scene selection
  const handleSceneSelect = (scene: Scene, chapter: Chapter) => {
    // Save current scene first
    if (currentScene && editor) {
      const content = editor.getHTML();
      const text = editor.getText();
      const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;

      const updatedScene = {
        ...currentScene,
        content,
        wordCount,
        updatedAt: new Date(),
      };

      saveScene(updatedScene);
    }

    // Switch to new scene
    setCurrentScene(scene);
    setCurrentChapter(chapter);
    editor?.commands.setContent(scene.content || '');

    // Focus editor
    setTimeout(() => {
      focusWritingEditor();
    }, 100);

    showToast(`Switched to ${scene.title}`, 'success');
  };

  // Handle scene creation
  const handleSceneCreate = (chapterId: string) => {
    // Refresh scene list by reloading
    showToast('Scene created! Refreshing...', 'success');
  };

  // AI Toolbar handlers
  const handleInsertText = (text: string, replaceSelection: boolean = false) => {
    if (!editor) return;

    if (replaceSelection && selectedText) {
      const { from, to } = editor.state.selection;
      editor.chain().focus().deleteRange({ from, to }).insertContent(text).run();
    } else {
      editor.chain().focus().insertContent(`\n\n${text}`).run();
    }

    setShowPopupToolbar(false);
    setSelectedText('');
  };

  // Manual save
  const handleManualSave = async () => {
    if (!currentScene || !editor) return;

    const content = editor.getHTML();
    const text = editor.getText();
    const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;

    const updatedScene = {
      ...currentScene,
      content,
      wordCount,
      updatedAt: new Date(),
    };

    await saveScene(updatedScene);
    showToast('Scene saved', 'success');
  };

  // Focus mode toggle
  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
    if (!isFocusMode) {
      showToast('Focus mode enabled', 'success');
    } else {
      showToast('Focus mode disabled', 'success');
    }
  };

  // Calculate word goal progress
  const wordCount = currentScene?.wordCount || 0;
  const wordGoalProgress = Math.min((wordCount / wordGoal) * 100, 100);

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
          <p className="text-sm">Select a project to start writing</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex ${isFocusMode ? 'bg-gray-50 dark:bg-gray-900' : ''} ${className}`}>
      {/* Scene Navigation Panel */}
      {showScenePanel && !isFocusMode && (
        <div className="w-80 border-r border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
          <SceneNavigationPanel
            currentSceneId={currentScene?.id}
            onSceneSelect={handleSceneSelect}
            onSceneCreate={handleSceneCreate}
            className="h-full"
          />
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Toolbar */}
        {!isFocusMode && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-4">
              {/* Panel toggles */}
              <button
                onClick={() => setShowScenePanel(!showScenePanel)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title={showScenePanel ? 'Hide scene panel' : 'Show scene panel'}
              >
                {showScenePanel ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              </button>

              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title={showAIPanel ? 'Hide AI panel' : 'Show AI panel'}
              >
                <Bot size={18} />
              </button>

              {/* Current scene info */}
              {currentScene && (
                <div className="flex items-center space-x-2">
                  <h2 className="font-medium text-gray-900 dark:text-white">
                    {currentScene.title}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    in {currentChapter?.title}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Word count and goal */}
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>{wordCount.toLocaleString()} words</span>
                </div>

                {showWordGoal && (
                  <div className="flex items-center space-x-2">
                    <Target size={14} />
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${wordGoalProgress}%` }}
                      />
                    </div>
                    <span className="text-xs">{wordGoal}</span>
                  </div>
                )}

                <button
                  onClick={() => setShowWordGoal(!showWordGoal)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Toggle word goal"
                >
                  {showWordGoal ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Save indicator */}
              {state.autoSave.isSaving ? (
                <div className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                  <span>Saving...</span>
                </div>
              ) : lastSaved ? (
                <div className="text-sm text-green-600 dark:text-green-400">
                  Saved {formatTime(lastSaved)}
                </div>
              ) : null}

              {/* Manual save */}
              <button
                onClick={handleManualSave}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title="Save scene"
              >
                <Save size={16} />
              </button>

              {/* Focus mode */}
              <button
                onClick={toggleFocusMode}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title="Toggle focus mode"
              >
                <Focus size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Editor */}
          <div className={`flex-1 overflow-y-auto ${showAIPanel ? 'pr-4' : ''}`}>
            <div
              className={`
              max-w-none mx-auto p-8
              ${isFocusMode ? 'max-w-4xl pt-16' : 'max-w-4xl'}
            `}
            >
              {currentScene ? (
                <div ref={editorRef} className="min-h-full">
                  <EditorContent editor={editor} className="min-h-full focus-within:outline-none" />
                </div>
              ) : (
                <div className="text-center py-16">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Scene Selected
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Select a scene from the navigation panel to start writing
                  </p>
                  {!showScenePanel && (
                    <button
                      onClick={() => setShowScenePanel(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                      Show Scene Panel
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Panel */}
          {showAIPanel && !isFocusMode && (
            <div className="w-96 border-l border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-y-auto">
              <div className="p-4">
                <ClaudeToolbar
                  selectedText={selectedText}
                  onInsertText={handleInsertText}
                  sceneTitle={currentScene?.title || ''}
                  currentContent={editor?.getText() || ''}
                  position="panel"
                  className="border-0 bg-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Focus mode exit hint */}
        {isFocusMode && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={toggleFocusMode}
              className="px-3 py-1 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-sm rounded opacity-75 hover:opacity-100 transition-opacity"
            >
              Exit Focus Mode
            </button>
          </div>
        )}
      </div>

      {/* Popup AI Toolbar on Selection */}
      {showPopupToolbar && selectedText && !showAIPanel && (
        <ClaudeToolbar
          selectedText={selectedText}
          onInsertText={handleInsertText}
          sceneTitle={currentScene?.title || ''}
          currentContent={editor?.getText() || ''}
          position="popup"
          popupPosition={toolbarPosition}
          onClose={() => {
            setShowPopupToolbar(false);
            setSelectedText('');
          }}
        />
      )}
    </div>
  );
};

// Utility functions
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout>; // ✅ Correct type
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (seconds < 30) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default EnhancedWritingEditor;
