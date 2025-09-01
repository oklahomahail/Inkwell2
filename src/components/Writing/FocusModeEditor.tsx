// src/components/Writing/FocusModeEditor.tsx
import { Editor } from '@tiptap/react';
import React, { useEffect, useRef, useState } from 'react';
import { useAdvancedFocusMode } from '../../hooks/useAdvancedFocusMode';

interface FocusModeEditorProps {
  editor: Editor | null;
  content: string;
  onContentChange: (content: string) => void;
  wordCount: number;
}

export const FocusModeEditor: React.FC<FocusModeEditorProps> = ({
  editor,
  content,
  onContentChange,
  wordCount,
}) => {
  const {
    isFocusMode,
    settings,
    sprint,
    sprintProgress,
    wordsProgress,
    formatTime,
    enableFocusMode,
    disableFocusMode,
    startSprint,
    pauseSprint,
    resumeSprint,
    stopSprint,
    updateSprintWordCount,
    isMuted,
    toggleMute,
  } = useAdvancedFocusMode();

  const editorRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [lastUserActivity, setLastUserActivity] = useState(Date.now());

  // Auto-hide controls in zen mode
  useEffect(() => {
    if (!settings.zenMode) return;

    const handleActivity = () => {
      setLastUserActivity(Date.now());
      setShowControls(true);
    };

    const handleInactivity = () => {
      const timeSinceActivity = Date.now() - lastUserActivity;
      if (timeSinceActivity > 3000 && settings.zenMode) {
        setShowControls(false);
      }
    };

    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);

    const inactivityTimer = setInterval(handleInactivity, 1000);

    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      clearInterval(inactivityTimer);
    };
  }, [settings.zenMode, lastUserActivity]);

  // Update sprint word count
  useEffect(() => {
    if (sprint.isActive) {
      updateSprintWordCount(wordCount);
    }
  }, [wordCount, sprint.isActive, updateSprintWordCount]);

  // Typewriter mode scroll management
  useEffect(() => {
    if (!editor || !settings.typewriterMode) return;

    const handleUpdate = () => {
      if (!editorRef.current) return;

      const editorElement = editorRef.current.querySelector('.ProseMirror');
      if (!editorElement) return;

      const selection = editor.state.selection;
      const currentPos = selection.$anchor.pos;
      const resolvedPos = editor.state.doc.resolve(currentPos);
      const currentNode = resolvedPos.parent;

      // Find the current paragraph element
      const paragraphElements = editorElement.querySelectorAll('p');
      let currentParagraphIndex = 0;

      // Calculate which paragraph the cursor is in
      let nodePos = 0;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'paragraph') {
          if (pos <= currentPos && currentPos <= pos + node.nodeSize) {
            return false; // Found the current paragraph
          }
          currentParagraphIndex++;
        }
        nodePos = pos;
      });

      const currentParagraph = paragraphElements[currentParagraphIndex];
      if (currentParagraph) {
        // Remove previous highlights
        paragraphElements.forEach((p) => p.classList.remove('is-editor-focused'));

        // Highlight current paragraph
        currentParagraph.classList.add('is-editor-focused');

        // Scroll to center the current line
        const editorRect = editorElement.getBoundingClientRect();
        const paragraphRect = currentParagraph.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        const paragraphCenter = paragraphRect.top + paragraphRect.height / 2;
        const scrollOffset = paragraphCenter - viewportCenter;

        editorElement.scrollBy({
          top: scrollOffset,
          behavior: 'smooth',
        });
      }
    };

    editor.on('selectionUpdate', handleUpdate);
    editor.on('update', handleUpdate);

    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('update', handleUpdate);
    };
  }, [editor, settings.typewriterMode]);

  // Keyboard shortcuts for focus mode
  useEffect(() => {
    if (!isFocusMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Exit focus mode with Escape
      if (event.key === 'Escape') {
        event.preventDefault();
        disableFocusMode();
        return;
      }

      // Sprint controls
      if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
        switch (event.key) {
          case 'S':
            event.preventDefault();
            if (!sprint.isActive) {
              startSprint(wordCount);
            } else if (sprint.isPaused) {
              resumeSprint();
            } else {
              pauseSprint();
            }
            break;
          case 'X':
            event.preventDefault();
            stopSprint();
            break;
          case 'M':
            event.preventDefault();
            toggleMute();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isFocusMode,
    sprint,
    wordCount,
    disableFocusMode,
    startSprint,
    pauseSprint,
    resumeSprint,
    stopSprint,
    toggleMute,
  ]);

  if (!isFocusMode) {
    return null;
  }

  const wordsWritten = sprint.isActive ? wordCount - sprint.wordsAtStart : 0;
  const isSprintUrgent = sprint.isActive && sprint.remainingTime <= 300; // Last 5 minutes

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Ambient Sound Visualizer */}
      {!isMuted && settings.ambientSound !== 'none' && <div className="ambient-visualizer" />}

      {/* Top Controls Bar */}
      <div
        className={`absolute top-0 left-0 right-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-500 z-10 ${
          showControls || !settings.zenMode
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          {/* Sprint Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!sprint.isActive) {
                  startSprint(wordCount);
                } else if (sprint.isPaused) {
                  resumeSprint();
                } else {
                  pauseSprint();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 focus-button"
            >
              {!sprint.isActive ? (
                <>
                  <Play className="w-4 h-4" />
                  Start Sprint
                </>
              ) : sprint.isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              )}
            </button>

            {sprint.isActive && (
              <button
                onClick={stopSprint}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            )}

            {/* Audio Toggle */}
            <button
              onClick={toggleMute}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Status Display */}
          <div className="flex items-center gap-6 text-white">
            {sprint.isActive && (
              <div
                className={`flex items-center gap-2 ${isSprintUrgent ? 'sprint-timer urgent' : ''}`}
              >
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg">{formatTime(sprint.remainingTime)}</span>
              </div>
            )}

            {settings.showWordCount && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="font-mono">
                  {sprint.isActive ? `+${wordsWritten}` : wordCount}
                  {sprint.isActive && ` / ${sprint.target}`}
                </span>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={disableFocusMode}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Exit Focus
            </button>
          </div>
        </div>

        {/* Sprint Progress */}
        {sprint.isActive && (
          <div className="px-4 pb-4">
            <div className="bg-black bg-opacity-30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3 text-white">
                <span className="font-medium">
                  Sprint Progress
                  {sprint.isPaused && <span className="ml-2 text-yellow-400">(Paused)</span>}
                </span>
                <span className="text-sm opacity-75">
                  {wordsWritten} / {sprint.target} words ({Math.round(wordsProgress)}%)
                </span>
              </div>

              {/* Time Progress Bar */}
              <div className="mb-2">
                <div className="bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isSprintUrgent ? 'bg-red-500 sprint-progress-bar' : 'bg-purple-500'
                    }`}
                    style={{ width: `${sprintProgress}%` }}
                  />
                </div>
              </div>

              {/* Words Progress Bar */}
              <div>
                <div className="bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(wordsProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex items-center justify-center p-8 pt-32">
        <div
          ref={editorRef}
          className={`w-full max-w-4xl mx-auto transition-all duration-300 ${
            settings.typewriterMode ? 'typewriter-mode' : ''
          }`}
        >
          <div className="min-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
            {/* Editor will be rendered here by your existing TipTap setup */}
            <div className="h-full focus-mode-editor">
              {editor && (
                <div className="prose prose-lg dark:prose-invert max-w-none p-8 h-full overflow-y-auto">
                  {/* Your TipTap editor renders here */}
                  <div className="ProseMirror-focused-editor" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      {!settings.zenMode && (
        <div
          className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-30 backdrop-blur-sm p-3 transition-all duration-500 ${
            showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
        >
          <div className="flex items-center justify-center gap-8 text-white text-sm">
            <span>Focus Mode Active</span>
            {sprint.isActive && <span>Sprint: {formatTime(sprint.remainingTime)} remaining</span>}
            <span className="opacity-75">Press Esc to exit</span>
          </div>
        </div>
      )}

      {/* Sprint Completion Celebration */}
      {sprint.isActive && sprint.remainingTime === 0 && (
        <SprintCompletionModal
          wordsWritten={wordsWritten}
          target={sprint.target}
          onClose={stopSprint}
          onNewSprint={() => startSprint(wordCount)}
        />
      )}
    </div>
  );
};

// Sprint Completion Modal
interface SprintCompletionModalProps {
  wordsWritten: number;
  target: number;
  onClose: () => void;
  onNewSprint: () => void;
}

const SprintCompletionModal: React.FC<SprintCompletionModalProps> = ({
  wordsWritten,
  target,
  onClose,
  onNewSprint,
}) => {
  const completionPercentage = Math.round((wordsWritten / target) * 100);
  const exceeded = wordsWritten > target;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4 sprint-complete">
        <div className="text-center">
          <div className="text-6xl mb-4">
            {exceeded ? '🎉' : completionPercentage >= 80 ? '👏' : '💪'}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sprint Complete!
          </h2>

          <div className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            <div>
              You wrote <strong>{wordsWritten}</strong> words
            </div>
            <div>
              Target was <strong>{target}</strong> words
            </div>
            <div
              className={`mt-2 ${exceeded ? 'text-green-600' : completionPercentage >= 80 ? 'text-blue-600' : 'text-yellow-600'}`}
            >
              {exceeded
                ? `${completionPercentage}% - Exceeded target!`
                : completionPercentage >= 80
                  ? `${completionPercentage}% - Great job!`
                  : `${completionPercentage}% - Good effort!`}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onNewSprint}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              New Sprint
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Continue Writing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Import required icons
import { Play, Pause, Square, Clock, FileText, VolumeX, Volume2 } from 'lucide-react';
