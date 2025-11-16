// src/components/Writing/EnhancedWritingPanel.tsx
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  BookOpen,
  Menu,
  GripVertical,
  Trash2,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import AISuggestionBox from '@/components/AI/AISuggestionBox';
import { RealtimeStatus } from '@/components/Chapters/RealtimeStatus';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Logo } from '@/components/ui/Logo';
import { InlineFormattingToolbar } from '@/components/Writing/InlineFormattingToolbar';
import { useAppContext, View } from '@/context/AppContext';
import { FormattingProvider, useFormatting } from '@/context/FormattingContext';
import { useToast } from '@/context/toast';
import { useProjectAnalytics } from '@/hooks/useProjectAnalytics';
import { useSections } from '@/hooks/useSections';
import { Chapters } from '@/services/chaptersService';
import { SECTION_TYPE_META } from '@/types/section';
import devLog from '@/utils/devLog';

interface EnhancedWritingPanelProps {
  className?: string;
}

interface SortableSectionItemProps {
  section: {
    id: string;
    title: string;
    type: string;
    wordCount?: number;
  };
  isActive: boolean;
  isEditing: boolean;
  editingValue: string;
  onSetActive: () => void;
  onStartEditing: () => void;
  onEditingChange: (value: string) => void;
  onSaveTitle: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onDelete: () => void;
  sectionTypeMeta: { label: string };
}

const SortableSectionItem: React.FC<SortableSectionItemProps> = ({
  section,
  isActive,
  isEditing,
  editingValue,
  onSetActive,
  onStartEditing,
  onEditingChange,
  onSaveTitle,
  onKeyDown,
  onDelete,
  sectionTypeMeta,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group w-full px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
          : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0"
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {isEditing ? (
              <input
                type="text"
                value={editingValue}
                onChange={(e) => onEditingChange(e.target.value)}
                onBlur={onSaveTitle}
                onKeyDown={onKeyDown}
                className="flex-1 bg-white dark:bg-slate-700 border border-primary-400 dark:border-primary-500 rounded px-2 py-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetActive();
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onStartEditing();
                }}
                className="flex-1 text-left min-w-0"
              >
                <span className="font-medium text-sm truncate block">{section.title}</span>
              </button>
            )}
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {sectionTypeMeta.label}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                title="Delete section"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {section.wordCount || 0} words
          </div>
        </div>
      </div>
    </div>
  );
};

// Inner component that uses FormattingContext
const EnhancedWritingPanelInner: React.FC<EnhancedWritingPanelProps> = ({ className }) => {
  const { state: _state, currentProject, dispatch } = useAppContext();
  const { showToast } = useToast();
  const { formatting } = useFormatting();
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deletedSection, setDeletedSection] = useState<{
    section: any;
    index: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Session tracking refs
  const sessionStarted = useRef<boolean>(false);
  const sessionStartTime = useRef<Date | null>(null);
  const sessionStartWordCount = useRef<number>(0);

  // Section management with hybrid sync
  const {
    sections,
    activeId,
    getActiveSection,
    setActive,
    createSection,
    deleteSection,
    renameSection,
    reorderSections,
    updateContent: updateSectionContent,
    syncing,
    lastSynced,
    syncNow,
    realtimeConnected,
    liveUpdateReceived,
  } = useSections(currentProject?.id || '');

  // Project-level analytics for daily goal tracking
  const analytics = useProjectAnalytics(currentProject?.id || '');

  // Track previous activeId to save content before switching
  const prevActiveIdRef = useRef<string | null>(null);
  // Flag to track if we're initializing a new section (to prevent content overwrite)
  const isInitializingNewSection = useRef(false);

  // Auto-create initial section when panel mounts with no sections
  // StrictMode guard: use ref to prevent double-creation in React StrictMode
  const initialSectionCreated = useRef(false);
  useEffect(() => {
    if (
      sections.length === 0 &&
      !activeId &&
      !isCreatingSection &&
      !initialSectionCreated.current
    ) {
      initialSectionCreated.current = true; // Set immediately to prevent double-creation
      (async () => {
        try {
          isInitializingNewSection.current = true;
          await createSection('Chapter 1', 'chapter');
        } finally {
          // Reset flag after a short delay to allow the section to be fully initialized
          setTimeout(() => {
            isInitializingNewSection.current = false;
          }, 1000);
        }
      })();
    }

    // Cleanup function for StrictMode: reset flag if component unmounts
    return () => {
      // Only reset if we're still in initial state (no sections created yet)
      if (sections.length === 0) {
        initialSectionCreated.current = false;
      }
    };
  }, [sections.length, activeId, isCreatingSection, createSection]);

  // Load active section content
  useEffect(() => {
    if (!activeId) return;

    (async () => {
      // Save content from previous section before switching
      if (prevActiveIdRef.current && prevActiveIdRef.current !== activeId && content) {
        updateSectionContent(prevActiveIdRef.current, content);
      }

      // Load new section content
      const section = await getActiveSection();
      if (section) {
        // CRITICAL: Don't overwrite content if user has already started typing
        // This prevents the race condition where:
        // 1. User creates new section or types in empty panel
        // 2. Section becomes active
        // 3. User types content (updates local state)
        // 4. This effect loads empty content from DB, overwriting user input
        if (isInitializingNewSection.current && content) {
          // User has typed content during initialization - preserve it
          // and save it to the new section immediately
          updateSectionContent(activeId, content);
        } else {
          // Normal case: load content from DB
          setContent(section.content || '');
        }
      }

      // Update the previous ID ref
      prevActiveIdRef.current = activeId;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]); // Only depend on activeId, not getActiveSection

  // Calculate word count
  useEffect(() => {
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  // Auto-save section content (debounced in hook)
  // Only save when content changes, not when activeId changes
  useEffect(() => {
    if (activeId && content) {
      updateSectionContent(activeId, content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]); // Only run when content changes, not when activeId changes

  // Writing session tracking
  useEffect(() => {
    if (!currentProject) return;

    const projectId = currentProject.id;

    // Session saving logic
    const saveSession = () => {
      if (!sessionStarted.current || !projectId) return;

      const today = new Date().toISOString().split('T')[0] || '';
      if (!today) return;

      // Calculate total project word count from all sections
      const totalProjectWords = sections.reduce((sum, s) => sum + (s.wordCount || 0), 0);
      const wordsWritten = Math.max(0, totalProjectWords - sessionStartWordCount.current);

      if (wordsWritten === 0) return; // Don't save if no words written

      const duration = sessionStartTime.current
        ? Math.round((new Date().getTime() - sessionStartTime.current.getTime()) / 60000)
        : 0;

      // Load existing sessions
      const sessionsKey = `sessions-${projectId}`;
      const existingSessions: Array<{
        date: string;
        wordCount: number;
        duration?: number;
        startWords?: number;
        endWords?: number;
      }> = JSON.parse(localStorage.getItem(sessionsKey) || '[]');

      // Find or create today's session
      const todaySessionIndex = existingSessions.findIndex((s) => s.date === today);

      if (todaySessionIndex >= 0) {
        // Update existing session
        const existingSession = existingSessions[todaySessionIndex];
        if (existingSession) {
          existingSessions[todaySessionIndex] = {
            date: today,
            wordCount: Math.max(existingSession.wordCount, wordsWritten),
            duration: Math.max(existingSession.duration || 0, duration),
            startWords: sessionStartWordCount.current,
            endWords: totalProjectWords,
          };
        }
      } else {
        // Create new session
        existingSessions.push({
          date: today,
          wordCount: wordsWritten,
          duration,
          startWords: sessionStartWordCount.current,
          endWords: totalProjectWords,
        });
      }

      // Save sessions to localStorage
      localStorage.setItem(sessionsKey, JSON.stringify(existingSessions));
    };

    // Save session periodically (every 10 seconds)
    const saveInterval = setInterval(saveSession, 10000);

    // Save session on unmount/page unload
    const handleBeforeUnload = () => {
      saveSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveSession(); // Save on unmount
    };
  }, [currentProject, sections]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Mark session as started on first content change
    if (!sessionStarted.current && currentProject) {
      sessionStarted.current = true;
      sessionStartTime.current = new Date();
      // Record total project word count at session start
      const totalProjectWords = sections.reduce((sum, s) => sum + (s.wordCount || 0), 0);
      sessionStartWordCount.current = totalProjectWords;
    }
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

  // Calculate project-level daily goal progress
  const todayWordsWritten = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return analytics.sessions
      .filter((s) => {
        if (!s.startedAt && !s.date) return false;
        const sessionDate = new Date(s.startedAt || s.date).toISOString().slice(0, 10);
        return sessionDate === todayStr;
      })
      .reduce((sum, s) => {
        const wordsWritten = Math.max(
          0,
          (s.endWords ?? s.wordCount ?? s.startWords ?? 0) - (s.startWords ?? 0),
        );
        return sum + wordsWritten;
      }, 0);
  }, [analytics.sessions]);

  // Get daily goal from project or user's default setting
  const getDefaultDailyGoal = () => {
    try {
      const savedSettings = localStorage.getItem('inkwell_app_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return parsed.defaultDailyGoal || 1000;
      }
    } catch {
      // Ignore errors
    }
    return 1000;
  };

  const dailyGoal = (currentProject as any)?.dailyGoal ?? getDefaultDailyGoal();
  const dailyGoalProgress = Math.min((todayWordsWritten / dailyGoal) * 100, 100);

  // Track last creation time to prevent rapid double-creation
  const lastCreateTime = useRef<number>(0);

  const handleCreateSection = async () => {
    // Guard against double-clicks and rapid successive calls (e.g., from StrictMode)
    const now = Date.now();
    if (isCreatingSection || now - lastCreateTime.current < 1000) {
      devLog.debug('[EnhancedWritingPanel] Ignoring duplicate create section call');
      return;
    }

    try {
      lastCreateTime.current = now;
      setIsCreatingSection(true);

      // CRITICAL: Save current section content before creating new one
      if (activeId && content) {
        // Force immediate save by calling the debounced function AND Chapters.saveDoc directly
        updateSectionContent(activeId, content);

        // Also save directly to ensure it's persisted immediately
        try {
          const chapter = await Chapters.get(activeId);
          const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
          await Chapters.saveDoc({
            id: activeId,
            content,
            version: chapter.version + 1,
            scenes: chapter.scenes,
          });
          await Chapters.updateMeta({ id: activeId, wordCount } as any);
        } catch (err) {
          console.warn(
            '[EnhancedWritingPanel] Direct save failed, relying on debounced save:',
            err,
          );
        }

        // Wait a bit longer to ensure save completes
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Clear content state to prevent it from being written to new section
      setContent('');

      // Create new section
      await createSection('New Section', 'chapter');
    } catch (error) {
      console.error('[EnhancedWritingPanel] Failed to create section:', error);
      showToast('Failed to create section', 'error');
    } finally {
      setIsCreatingSection(false);
    }
  };

  const handleStartEditingTitle = (sectionId: string, currentTitle: string) => {
    setEditingTitleId(sectionId);
    setEditingTitleValue(currentTitle);
  };

  const handleSaveTitle = async (sectionId: string) => {
    if (editingTitleValue.trim()) {
      await renameSection(sectionId, editingTitleValue.trim());
    }
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const handleCancelEditingTitle = () => {
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent, sectionId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle(sectionId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditingTitle();
    }
  };

  const handleRequestDelete = (sectionId: string) => {
    setPendingDelete(sectionId);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      // Find the section before deleting
      const sectionToDelete = sections.find((s) => s.id === pendingDelete);
      const sectionIndex = sections.findIndex((s) => s.id === pendingDelete);

      if (sectionToDelete) {
        // Store for undo
        setDeletedSection({
          section: sectionToDelete,
          index: sectionIndex,
        });

        // Delete the section
        await deleteSection(pendingDelete);

        // Show success toast with undo option
        showToast('Section deleted', 'success', 5000);
      }
    } catch (error) {
      console.error('[EnhancedWritingPanel] Failed to delete section:', error);
      showToast('Failed to delete section', 'error');
    } finally {
      setPendingDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setPendingDelete(null);
  };

  // Undo delete functionality (for future implementation)
  const _handleUndoDelete = async () => {
    if (!deletedSection) return;

    try {
      // Recreate the section with the same data
      const { section } = deletedSection;
      await createSection(section.title, section.type);

      // Note: The section will be added at the end, not at the original index
      // A more sophisticated implementation would preserve the exact order
      showToast('Section restored', 'success');
      setDeletedSection(null);
    } catch (error) {
      console.error('[EnhancedWritingPanel] Failed to restore section:', error);
      showToast('Failed to restore section', 'error');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedSections.findIndex((s) => s.id === active.id);
      const newIndex = sortedSections.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSections(oldIndex, newIndex);
      }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
  );

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

  // Handle scene separator insertion
  const handleInsertSceneSeparator = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const value = textarea.value;

    // Scene separator with proper spacing
    const separator = '\n\n***\n\n';

    const newValue = value.substring(0, start) + separator + value.substring(start);
    const newCursorPos = start + separator.length;

    setContent(newValue);

    // Update textarea and trigger change event for autosave
    textarea.value = newValue;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();

    // Trigger input event for autosave
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
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
              {/* Inkwell Logo */}
              <Logo size={32} className="flex-shrink-0" />
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
                  disabled={isCreatingSection}
                  className="btn btn-primary btn-sm flex items-center gap-2"
                  title={isCreatingSection ? 'Creating section...' : 'New section'}
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreatingSection ? 'Creating...' : 'New Section'}</span>
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
                  {todayWordsWritten.toLocaleString()} / {dailyGoal.toLocaleString()}
                </div>
              </div>
              <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${dailyGoalProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Chapter Sidebar */}
        {!focusMode && (
          <div
            className={`border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-y-auto transition-all duration-200 flex-shrink-0 ${
              showSidebar ? 'w-64' : 'w-14'
            }`}
          >
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between min-h-[52px]">
              {showSidebar ? (
                <>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                      Chapters
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors shrink-0"
                    title="Hide chapter list"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="w-full p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors flex items-center justify-center"
                  title="Show chapter list"
                >
                  <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              )}
            </div>
            {showSidebar && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedSections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="p-2 space-y-1">
                    {sortedSections.map((section) => (
                      <SortableSectionItem
                        key={section.id}
                        section={section}
                        isActive={section.id === activeId}
                        isEditing={editingTitleId === section.id}
                        editingValue={editingTitleValue}
                        onSetActive={() => setActive(section.id)}
                        onStartEditing={() => handleStartEditingTitle(section.id, section.title)}
                        onEditingChange={setEditingTitleValue}
                        onSaveTitle={() => handleSaveTitle(section.id)}
                        onKeyDown={(e) => handleTitleKeyDown(e, section.id)}
                        onDelete={() => handleRequestDelete(section.id)}
                        sectionTypeMeta={SECTION_TYPE_META[section.type]}
                      />
                    ))}

                    {/* Add New Section Button */}
                    <button
                      onClick={handleCreateSection}
                      disabled={isCreatingSection}
                      className="w-full text-left px-3 py-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2 text-slate-600 dark:text-slate-400"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">
                        {isCreatingSection ? 'Creating...' : 'New Section'}
                      </span>
                    </button>
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}

        {/* Writing Area */}
        <div className={`writing-area flex-1 flex flex-col overflow-hidden`}>
          {/* Inline Formatting Toolbar */}
          {!focusMode && (
            <InlineFormattingToolbar onInsertSceneSeparator={handleInsertSceneSeparator} />
          )}

          <div className={`flex-1 ${focusMode ? 'p-8 max-w-4xl mx-auto' : 'p-6'} overflow-auto`}>
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
                style={{
                  fontFamily: formatting.fontFamily,
                  fontSize: `${formatting.fontSize}rem`,
                  lineHeight: formatting.lineHeight,
                  textIndent: formatting.firstLineIndent ? `${formatting.firstLineIndent}rem` : '0',
                  paddingLeft: formatting.firstLineIndent
                    ? `${formatting.firstLineIndent}rem`
                    : undefined,
                }}
                className={`
                  writing-editor w-full resize-none border-none outline-none
                  ${
                    focusMode
                      ? 'min-h-[600px] bg-transparent'
                      : 'min-h-[500px] bg-white dark:bg-slate-800'
                  }
                  text-slate-900 dark:text-slate-100
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  ${focusMode ? '' : 'rounded-lg border border-slate-200 dark:border-slate-700 p-6'}
                  transition-all duration-200
                  focus:ring-0 focus:border-primary-300 dark:focus:border-primary-600
                  ${formatting.firstLineIndent && formatting.firstLineIndent > 0 ? 'indent-enabled' : ''}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this section?"
        description="This action cannot be undone. The section and all its content will be permanently removed."
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

// Wrapper component that provides FormattingContext
const EnhancedWritingPanel: React.FC<EnhancedWritingPanelProps> = (props) => {
  const { currentProject } = useAppContext();

  // Always wrap with FormattingProvider (uses null projectId if no project)
  return (
    <FormattingProvider projectId={currentProject?.id ?? null}>
      <EnhancedWritingPanelInner {...props} />
    </FormattingProvider>
  );
};

export default EnhancedWritingPanel;
