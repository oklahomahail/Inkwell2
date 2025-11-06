// src/components/Writing/EnhancedWritingPanel.tsx
import {
  FileText,
  Clock,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Zap,
  Eye,
  EyeOff,
  Type,
  Plus,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import AISuggestionBox from '@/components/AI/AISuggestionBox';
import { RealtimeStatus } from '@/components/Chapters/RealtimeStatus';
import { useAppContext, View } from '@/context/AppContext';
import { useSections } from '@/hooks/useSections';
import { SECTION_TYPE_META } from '@/types/section';

interface EnhancedWritingPanelProps {
  className?: string;
}

const EnhancedWritingPanel: React.FC<EnhancedWritingPanelProps> = ({ className }) => {
  const { state: _state, currentProject, dispatch } = useAppContext();
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Section management with hybrid sync
  const {
    sections,
    activeId,
    getActiveSection,
    setActive,
    createSection,
    deleteSection,
    updateContent: updateSectionContent,
    syncing,
    lastSynced,
    syncNow,
    realtimeConnected,
    liveUpdateReceived,
  } = useSections(currentProject?.id || '');

  // Load active section content
  useEffect(() => {
    if (!activeId) return;

    (async () => {
      const section = await getActiveSection();
      if (section) {
        setContent(section.content);
      }
    })();
  }, [activeId, getActiveSection]);

  // Calculate word count
  useEffect(() => {
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  // Auto-save section content (debounced in hook)
  useEffect(() => {
    if (activeId && content) {
      updateSectionContent(activeId, content);
    }
  }, [content, activeId, updateSectionContent]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Section navigation (sorted by order)
  const sortedSections = useMemo(() => [...sections].sort((a, b) => a.order - b.order), [sections]);
  const activeSection = sortedSections.find((s: { id: string }) => s.id === activeId);
  const currentIndex = activeSection ? sortedSections.indexOf(activeSection) : -1;
  const hasNext = currentIndex >= 0 && currentIndex < sortedSections.length - 1;
  const hasPrev = currentIndex > 0;

  const goToNextSection = () => {
    const nextSection = sortedSections[currentIndex + 1];
    if (hasNext && nextSection) {
      setActive(nextSection.id);
    }
  };

  const goToPrevSection = () => {
    const prevSection = sortedSections[currentIndex - 1];
    if (hasPrev && prevSection) {
      setActive(prevSection.id);
    }
  };

  const handleCreateSection = () => {
    createSection('New Chapter', 'chapter');
  };

  const _handleDeleteSection = () => {
    if (activeId && confirm('Delete this section?')) {
      deleteSection(activeId);
    }
  };

  const getReadingTime = () => {
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const getCharCount = () => {
    return content.length;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleFocusMode = () => {
    setFocusMode(!focusMode);
    setShowStats(!focusMode ? false : true);
  };

  const goToDashboard = () => {
    dispatch({ type: 'SET_VIEW', payload: View.Dashboard });
  };

  // Get context text for AI suggestion
  const getContextText = useCallback(() => {
    if (!textareaRef.current) return '';

    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd, value } = textarea;

    // If text is selected, return selection
    if (selectionStart !== selectionEnd) {
      return value.substring(selectionStart, selectionEnd).trim();
    }

    // Otherwise, return current paragraph
    const before = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const after = value.indexOf('\n', selectionEnd);
    const paragraph = value.substring(before, after === -1 ? value.length : after).trim();

    return paragraph;
  }, []);

  // Handle text insertion from AI suggestion
  const handleAIInsert = useCallback((text: string, mode: 'insert' | 'replace') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    let newValue = '';
    let newCursorPos = 0;

    if (mode === 'replace') {
      newValue = value.substring(0, start) + text + value.substring(end);
      newCursorPos = start + text.length;
    } else {
      // Insert with proper spacing
      const beforeInsert = value.substring(0, end);
      const afterInsert = value.substring(end);
      const needsSpaceBefore = beforeInsert && !beforeInsert.endsWith('\n\n');
      const needsSpaceAfter = afterInsert && !afterInsert.startsWith('\n\n');

      const prefix = needsSpaceBefore ? '\n\n' : '';
      const suffix = needsSpaceAfter ? '\n\n' : '';

      newValue = beforeInsert + prefix + text + suffix + afterInsert;
      newCursorPos = (beforeInsert + prefix + text).length;
    }

    setContent(newValue);
    textarea.value = newValue;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape to exit focus mode
      if (event.key === 'Escape' && focusMode) {
        event.preventDefault();
        setFocusMode(false);
        setShowStats(true);
      }

      // Cmd/Ctrl + Shift + G to open AI Suggestion
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'g') {
        event.preventDefault();
        setShowAISuggestion(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  // If no project is selected
  if (!currentProject) {
    return (
      <div className="enhanced-writing-panel">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-heading-lg text-slate-900 dark:text-white mb-4">
            No Project Selected
          </h2>
          <p className="text-body-base text-slate-600 dark:text-slate-400 mb-6">
            Select a project from the dashboard to start writing, or create a new project to begin
            your next story.
          </p>
          <button onClick={goToDashboard} className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`enhanced-writing-panel ${isFullscreen ? 'fullscreen' : ''} ${focusMode ? 'focus-mode' : ''} ${className || ''}`}
    >
      {/* Header */}
      {!focusMode && (
        <div className="writing-header sticky top-0 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={goToDashboard}
                className="btn btn-ghost btn-sm"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-heading-md text-slate-900 dark:text-white">
                  {currentProject.name}
                </h1>
                <p className="text-caption text-slate-500">{currentProject.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Section Navigation */}
              <div
                className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-3 mr-1"
                data-tour="section-nav"
              >
                <button
                  onClick={goToPrevSection}
                  disabled={!hasPrev}
                  className="btn btn-ghost btn-sm"
                  title="Previous section"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-2 text-caption text-slate-600 dark:text-slate-400 min-w-[160px] text-center">
                  {activeSection ? (
                    <>
                      <span className="font-medium">{activeSection.title}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">
                        ({SECTION_TYPE_META[activeSection.type].label})
                      </span>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {currentIndex + 1}/{sortedSections.length}
                      </div>
                    </>
                  ) : (
                    'No section'
                  )}
                </div>
                <button
                  onClick={goToNextSection}
                  disabled={!hasNext}
                  className="btn btn-ghost btn-sm"
                  title="Next section"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCreateSection}
                  className="btn btn-primary btn-sm flex items-center gap-2"
                  title="New section"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Section</span>
                </button>
              </div>

              {/* Actions */}
              <button
                onClick={() => setShowAISuggestion(true)}
                className="btn btn-sm flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white border-none"
                title="Get AI Suggestion (⌘⇧G)"
              >
                <Lightbulb className="w-4 h-4" />
                <span>AI Suggestion</span>
              </button>

              <button
                onClick={() => setShowStats(!showStats)}
                className="btn btn-ghost btn-sm"
                title={showStats ? 'Hide stats' : 'Show stats'}
              >
                {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleFocusMode}
                className="btn btn-ghost btn-sm"
                title="Toggle focus mode"
              >
                <Zap className="w-4 h-4" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="btn btn-ghost btn-sm"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Realtime Status Bar */}
          <RealtimeStatus
            connected={realtimeConnected}
            liveUpdate={liveUpdateReceived}
            syncing={syncing}
            lastSynced={lastSynced}
            onSync={syncNow}
          />
        </div>
      )}

      {/* Stats Bar */}
      {showStats && !focusMode && (
        <div className="stats-bar bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-slate-500" />
                <span className="text-body-sm font-medium text-slate-900 dark:text-white">
                  {wordCount.toLocaleString()}
                </span>
                <span className="text-caption text-slate-500">words</span>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-body-sm font-medium text-slate-900 dark:text-white">
                  {getCharCount().toLocaleString()}
                </span>
                <span className="text-caption text-slate-500">characters</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-body-sm font-medium text-slate-900 dark:text-white">
                  {getReadingTime()}
                </span>
                <span className="text-caption text-slate-500">min read</span>
              </div>
            </div>

            {/* Daily Goal Progress */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-caption text-slate-500">Daily Goal</div>
                <div className="text-body-sm font-medium text-slate-900 dark:text-white">
                  {wordCount} / 1,000
                </div>
              </div>
              <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${Math.min((wordCount / 1000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Writing Area */}
      <div className={`writing-area flex-1 ${focusMode ? 'p-8 max-w-4xl mx-auto' : 'p-6'}`}>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder={
              focusMode
                ? 'Begin your story...'
                : `Start writing "${currentProject.name}"...\n\nTip: Press Ctrl+S to save manually, or just keep writing - we'll save automatically.`
            }
            data-tour="editor"
            className={`
              writing-editor w-full resize-none border-none outline-none
              ${
                focusMode
                  ? 'text-lg leading-relaxed min-h-[600px] bg-transparent'
                  : 'text-base leading-normal min-h-[500px] bg-white dark:bg-slate-800'
              }
              text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              ${focusMode ? '' : 'rounded-lg border border-slate-200 dark:border-slate-700 p-6'}
              transition-all duration-200
              focus:ring-0 focus:border-primary-300 dark:focus:border-primary-600
            `}
            autoFocus
          />

          {/* Focus Mode Overlay Stats */}
          {focusMode && showStats && (
            <div className="absolute bottom-4 right-4 bg-slate-900/80 dark:bg-slate-100/80 text-white dark:text-slate-900 px-3 py-2 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-4 text-sm">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{getReadingTime()}m read</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Focus Mode Toggle */}
      {focusMode && (
        <div className="fixed bottom-6 left-6 z-30">
          <button
            onClick={toggleFocusMode}
            className="btn btn-secondary shadow-lg"
            title="Exit focus mode"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Focus
          </button>
        </div>
      )}

      {/* AI Suggestion Modal */}
      <AISuggestionBox
        isOpen={showAISuggestion}
        onClose={() => setShowAISuggestion(false)}
        context={getContextText()}
        onInsert={handleAIInsert}
      />
    </div>
  );
};

export default EnhancedWritingPanel;
