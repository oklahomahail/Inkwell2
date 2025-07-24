const DEFAULT_TITLE = "Untitled Chapter";

// Enhanced Writing Panel Component
const EnhancedWritingPanel: React.FC<WritingPanelProps> = ({
  draftText,
  onChangeText,
  onTextSelect,
  selectedText,
}) => {
  const [content, setContent] = useState(draftText);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("markdown");
  const [lastActivityLog, setLastActivityLog] = useState(0);
  
  const { showToast } = useToastContext();
  const titleRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialLoadRef = useRef(false);
  
  const wordCount = useMemo(() => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  }, [content]);
  
  // Use centralized session management with persistence
  const { currentSession, startSession, updateActivity, endSession } = useWritingSession(wordCount);
  
  // Enhanced save function with session sync
  const performSave = useCallback(async (isAuto: boolean) => {
    try {
      const saveData = { title, content };
      localStorage.setItem("writing_content", JSON.stringify(saveData));
      
      // Smart activity logging - reduce noise
      if (!isAuto) {
        logActivity("writing", `Manually saved "${title}" (${wordCount.toLocaleString()} words)`);
      }
      
      showToast({
        message: isAuto ? "Draft autosaved" : "Draft saved",
        type: "success",
        duration: isAuto ? 2000 : 3000,
      });
    } catch (error) {
      console.error("Save failed:", error);
      showToast({
        message: "Failed to save draft",
        type: "error",
      });
      throw error;
    }
  }, [title, content, wordCount, showToast]);
  
  // Use smart auto-save with content change detection
  const { autoSaveState, manualSave, claudeSave } = useSmartAutoSave(title, content, performSave);
  
  // Export functionality
  const { exportDocument } = useExportFunctionality(title, content, wordCount);
  
  // Enhanced content change handler
  const handleContentChange = useCallback((text: string) => {
    setContent(text);
    onChangeText(text);
    
    const newWordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    // Start or update session on meaningful content changes
    if (newWordCount > wordCount) {
      if (!currentSession) {
        startSession();
      }
      updateActivity();
    }
    
    // Log significant progress (reduced frequency to avoid noise)
    if (newWordCount - lastActivityLog >= 150) { // Increased threshold
      const wordsAdded = newWordCount - lastActivityLog;
      logActivity("writing", `Writing progress: +${wordsAdded} words (${newWordCount.toLocaleString()} total)`);
      setLastActivityLog(newWordCount);
    }
  }, [onChangeText, wordCount, currentSession, startSession, updateActivity, lastActivityLog]);
  
  // Load saved draft with session restoration
  useEffect(() => {
    if (initialLoadRef.current) return;
    
    try {
      const stored = localStorage.getItem("writing_content");
      if (stored) {
        const { title: savedTitle, content: savedContent } = JSON.parse(stored);
        
        if (savedTitle && savedTitle !== DEFAULT_TITLE) {
          setTitle(savedTitle);
        }
        
        if (savedContent) {
          setContent(savedContent);
          onChangeText(savedContent);
          
          const savedWordCount = savedContent.trim() ? savedContent.trim().split(/\s+/).length : 0;
          setLastActivityLog(savedWordCount);
          
          // Only log if there's substantial content
          if (savedWordCount > 50) {
            logActivity("writing", `Loaded "${savedTitle || 'draft'}" (${savedWordCount.toLocaleString()} words)`);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load writing content:", error);
      showToast({
        message: "Could not load previous draft",
        type: "info",
      });
    } finally {
      initialLoadRef.current = true;
    }
  }, [onChangeText, showToast]);
  
  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S for manual save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        manualSave();
      }
      
      // Ctrl/Cmd + E for export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportDocument(exportFormat);
      }
      
      // Ctrl/Cmd + Shift + E for export format selection
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        // Cycle through export formats
        const formats: ExportFormat[] = ['markdown', 'txt'];
        const currentIndex = formats.indexOf(exportFormat);
        const nextFormat = formats[(currentIndex + 1) % formats.length];
        setExportFormat(nextFormat);
        showToast({
          message: `Export format: ${nextFormat.toUpperCase()}`,
          type: "info",
          duration: 2000,
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [manualSave, exportDocument, exportFormat, showToast]);
  
  // Handle page unload - end session gracefully
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSession) {
        endSession();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentSession, endSession]);
  
  // Enhanced writing status with session info
  const writingStatus = useMemo(() => {
    if (autoSaveState.isSaving) return "Saving...";
    if (autoSaveState.isDirty) return "Unsaved changes";
    if (autoSaveState.lastSaved) {
      const timeSince = Math.round((new Date().getTime() - autoSaveState.lastSaved.getTime()) / 1000);
      if (timeSince < 60) return "Saved just now";
      if (timeSince < 3600) return `Saved ${Math.round(timeSince / 60)}m ago`;
      return `Saved at ${autoSaveState.lastSaved.toLocaleTimeString()}`;
    }
    return "Never saved";
  }, [autoSaveState]);
  
  return (
    <div className="h-full bg-[#0A0F1C] text-gray-100 flex flex-col">
      {/* Enhanced Header with Session Info */}
      <div className="flex-shrink-0 p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Writing Panel</h2>
            <p className="text-gray-400 text-sm mt-1">{writingStatus}</p>
          </div>
          
          {/* Enhanced Session Status */}
          {currentSession && (
            <div className="text-right">
              <div className="text-sm text-green-400 font-medium flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Active Session
              </div>
              <div className="text-xs text-gray-400">
                {Math.round((new Date().getTime() - currentSession.startTime.getTime()) / 60000)}m • 
                +{Math.max(0, wordCount - currentSession.wordsAtStart)} words
              </div>
            </div>
          )}
        </div>
        
        <WritingToolbar
          title={title}
          onTitleChange={setTitle}
          titleRef={titleRef}
          content={content}
          lastSaved={autoSaveState.lastSaved?.toLocaleTimeString() || "Never"}
          isSaving={autoSaveState.isSaving}
          onSave={manualSave}
          exportFormat={exportFormat}
          onExportFormatChange={setExportFormat}
          defaultTitle={DEFAULT_TITLE}
          isDirty={autoSaveState.isDirty}
        />
      </div>
      
      {/* Enhanced Claude Toolbar */}
      <div className="flex-shrink-0 px-6 py-4 bg-[#1A2233] border-b border-gray-700">
        <ClaudeToolbar
          selectedText={selectedText}
          content={content}
          onInsertText={(text) => {
            const newContent = selectedText && content.includes(selectedText)
              ? content.replace(selectedText, text)
              : content ? `${content}\n\n${text}` : text;
            handleContentChange(newContent);
            claudeSave(); // Trigger Claude-specific save
          }}
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <WritingEditor
            content={content}
            onContentChange={handleContentChange}
            onTextSelect={onTextSelect}
            textareaRef={textareaRef}
          />
        </div>
        
        {/* Enhanced Session Stats Panel */}
        <SessionStatsPanel 
          content={content}
          title={title}
          currentSession={currentSession}
        />
      </div>
      
      {/* Claude Integration Handler */}
      <ClaudeIntegrationHandler
        content={content}
        selectedText={selectedText}
        onContentChange={handleContentChange}
        onClaudeSave={claudeSave}
      />
      
      {/* Keyboard Shortcuts Helper */}
      <div className="flex-shrink-0 px-6 py-2 bg-[#0A0F1C] border-t border-gray-800 text-xs text-gray-500">
        <div className="flex justify-center space-x-6">
          <span>Ctrl+S: Save</span>
          <span>Ctrl+E: Export</span>
          <span>Ctrl+Shift+E: Change Export Format</span>
        </div>
      </div>
    </div>
  );
};import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import WritingToolbar from "../Writing/WritingToolbar";
import WritingEditor from "../Writing/WritingEditor";
import { ExportFormat } from "../../types/writing";
import { useToastContext } from "@/context/ToastContext";
import { logActivity } from "../Panels/DashboardPanel";

interface WritingPanelProps {
  draftText: string;
  onChangeText: (value: string) => void;
  onTextSelect: () => void;
  selectedText: string;
}

interface WritingSession {
  date: string;
  startTime: Date;
  wordsAtStart: number;
  lastActivityTime: Date;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
  saveCount: number;
}

interface SaveQueueItem {
  content: string;
  title: string;
  timestamp: number;
  type: 'auto' | 'manual' | 'claude';
}

// Centralized Session Management Hook with Persistence
const useWritingSession = (wordCount: number) => {
  const [currentSession, setCurrentSession] = useState<WritingSession | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const SESSION_TIMEOUT = 300000; // 5 minutes
  
  // Load persisted session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("current_writing_session");
      if (stored) {
        const sessionData = JSON.parse(stored);
        const session: WritingSession = {
          ...sessionData,
          startTime: new Date(sessionData.startTime),
          lastActivityTime: new Date(sessionData.lastActivityTime),
        };
        
        // Only resume if session is from today and recent (within 30 minutes)
        const now = new Date();
        const timeSinceLastActivity = now.getTime() - session.lastActivityTime.getTime();
        const isToday = session.date === now.toISOString().split('T')[0];
        
        if (isToday && timeSinceLastActivity < 1800000) { // 30 minutes
          setCurrentSession(session);
          logActivity("writing", "Resumed writing session");
        } else {
          localStorage.removeItem("current_writing_session");
        }
      }
    } catch (error) {
      console.warn("Failed to load session", error);
      localStorage.removeItem("current_writing_session");
    }
  }, []);
  
  // Persist session changes
  useEffect(() => {
    if (currentSession) {
      localStorage.setItem("current_writing_session", JSON.stringify(currentSession));
    } else {
      localStorage.removeItem("current_writing_session");
    }
  }, [currentSession]);
  
  const updateWritingSessions = useCallback((session: WritingSession, endWordCount: number) => {
    try {
      const stored = localStorage.getItem("writing_sessions");
      const sessions = stored ? JSON.parse(stored) : [];
      
      const duration = Math.round((new Date().getTime() - session.startTime.getTime()) / 60000);
      const wordsAdded = Math.max(0, endWordCount - session.wordsAtStart);
      
      // Find existing session for today or create new one
      const existingIndex = sessions.findIndex((s: any) => s.date === session.date);
      
      if (existingIndex >= 0) {
        // Update existing session
        sessions[existingIndex].wordCount += wordsAdded;
        sessions[existingIndex].duration = (sessions[existingIndex].duration || 0) + duration;
      } else {
        // Create new session entry
        sessions.push({
          date: session.date,
          wordCount: wordsAdded,
          duration,
        });
      }
      
      localStorage.setItem("writing_sessions", JSON.stringify(sessions));
    } catch (error) {
      console.warn("Failed to update writing sessions", error);
    }
  }, []);
  
  const endSession = useCallback(() => {
    if (currentSession) {
      const duration = Math.round((new Date().getTime() - currentSession.startTime.getTime()) / 60000);
      const wordsAdded = Math.max(0, wordCount - currentSession.wordsAtStart);
      
      // Update writing sessions for dashboard sync
      updateWritingSessions(currentSession, wordCount);
      
      if (duration > 0 && wordsAdded > 0) {
        logActivity("writing", `Session completed: ${wordsAdded} words in ${duration} minutes`);
      }
      
      setCurrentSession(null);
    }
  }, [currentSession, wordCount, updateWritingSessions]);
  
  const startSession = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    if (!currentSession || currentSession.date !== today) {
      const newSession: WritingSession = {
        date: today,
        startTime: now,
        wordsAtStart: wordCount,
        lastActivityTime: now,
      };
      setCurrentSession(newSession);
      logActivity("writing", "Started new writing session");
      return newSession;
    }
    
    return currentSession;
  }, [currentSession, wordCount]);
  
  const updateActivity = useCallback(() => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        lastActivityTime: new Date()
      } : null);
    }
    
    // Reset timeout
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    sessionTimeoutRef.current = setTimeout(endSession, SESSION_TIMEOUT);
  }, [currentSession, endSession]);
  
  useEffect(() => {
    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);
  
  return { currentSession, startSession, updateActivity, endSession };
};

// Smart Auto-Save Hook with Content Change Detection
const useSmartAutoSave = (
  title: string, 
  content: string, 
  onSave: (isAuto: boolean) => Promise<void>
) => {
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    isDirty: false,
    saveCount: 0,
  });
  
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const saveQueue = useRef<SaveQueueItem[]>([]);
  const isProcessingQueue = useRef(false);
  const lastWordCount = useRef(0);
  const lastSavedContent = useRef("");
  const lastSavedTitle = useRef("");
  
  const wordCount = useMemo(() => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  }, [content]);
  
  const hasContentChanged = useCallback(() => {
    return content !== lastSavedContent.current || title !== lastSavedTitle.current;
  }, [content, title]);
  
  const processSaveQueue = useCallback(async () => {
    if (isProcessingQueue.current || saveQueue.current.length === 0) return;
    
    isProcessingQueue.current = true;
    const latestSave = saveQueue.current[saveQueue.current.length - 1];
    saveQueue.current = []; // Clear queue
    
    try {
      setAutoSaveState(prev => ({ ...prev, isSaving: true }));
      await onSave(latestSave.type !== 'manual');
      
      // Update saved content references
      lastSavedContent.current = latestSave.content;
      lastSavedTitle.current = latestSave.title;
      
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        isDirty: false,
        saveCount: prev.saveCount + 1,
      }));
    } catch (error) {
      setAutoSaveState(prev => ({ ...prev, isSaving: false }));
      throw error;
    } finally {
      isProcessingQueue.current = false;
    }
  }, [onSave]);
  
  const queueSave = useCallback((type: 'auto' | 'manual' | 'claude' = 'auto') => {
    // Only save if content has actually changed
    if (!hasContentChanged() && type === 'auto') {
      return;
    }
    
    const saveItem: SaveQueueItem = {
      content,
      title,
      timestamp: Date.now(),
      type,
    };
    
    saveQueue.current.push(saveItem);
    setAutoSaveState(prev => ({ ...prev, isDirty: true }));
    
    // Clear existing timer for new saves
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    // Different delays for different save types
    const delay = type === 'manual' ? 0 : type === 'claude' ? 2000 : 5000;
    
    autoSaveTimer.current = setTimeout(processSaveQueue, delay);
  }, [content, title, hasContentChanged, processSaveQueue]);
  
  // Smart trigger conditions with change detection
  useEffect(() => {
    const wordDiff = wordCount - lastWordCount.current;
    
    // Only trigger save on significant additions (not deletions unless crossing threshold)
    if (wordDiff >= 50 || (Math.abs(wordDiff) >= 50 && hasContentChanged())) {
      queueSave('auto');
      lastWordCount.current = wordCount;
    }
  }, [wordCount, queueSave, hasContentChanged]);
  
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);
  
  return { 
    autoSaveState, 
    queueSave, 
    manualSave: () => queueSave('manual'),
    claudeSave: () => queueSave('claude'),
  };
};

// Real-Time Stats Card Component
const RealTimeStatsCard: React.FC<{ 
  wordCount: number; 
  content: string; 
  currentSession: WritingSession | null;
  dailyGoal?: number;
  todayWordCount?: number;
}> = ({ wordCount, content, currentSession, dailyGoal = 800, todayWordCount = 0 }) => {
  const stats = useMemo(() => {
    const chars = content.length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    const readingTime = Math.ceil(wordCount / 250);
    
    return { wordCount, charCount: chars, sentences, paragraphs, readingTime };
  }, [content, wordCount]);
  
  const sessionStats = useMemo(() => {
    if (!currentSession) return null;
    
    const duration = Math.round((new Date().getTime() - currentSession.startTime.getTime()) / 60000);
    const wordsThisSession = Math.max(0, wordCount - currentSession.wordsAtStart);
    const pace = duration > 0 ? Math.round(wordsThisSession / duration) : 0;
    
    return { duration, wordsThisSession, pace };
  }, [currentSession, wordCount]);
  
  const dailyProgress = Math.min((todayWordCount / dailyGoal) * 100, 100);
  
  return (
    <div className="space-y-4">
      {/* Daily Goal Progress */}
      <div className="bg-[#0F1419] rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">Daily Goal</span>
          <span className="text-sm text-gray-400">{Math.round(dailyProgress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${dailyProgress}%` }}
          />
        </div>
        <div className="text-xs text-gray-400">
          {todayWordCount} / {dailyGoal} words today
        </div>
      </div>
      
      {/* Main Word Count */}
      <div className="bg-[#0F1419] rounded-lg p-4">
        <div className="text-2xl font-bold text-[#0073E6] mb-1">
          {stats.wordCount.toLocaleString()}
        </div>
        <div className="text-sm text-gray-400">words total</div>
      </div>
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0F1419] rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-white">{stats.sentences}</div>
          <div className="text-xs text-gray-400">sentences</div>
        </div>
        <div className="bg-[#0F1419] rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-white">{stats.paragraphs}</div>
          <div className="text-xs text-gray-400">paragraphs</div>
        </div>
      </div>
      
      <div className="bg-[#0F1419] rounded-lg p-3 text-center">
        <div className="text-lg font-semibold text-yellow-400">{stats.readingTime}m</div>
        <div className="text-xs text-gray-400">reading time</div>
      </div>
      
      {/* Active Session Stats */}
      {sessionStats && sessionStats.wordsThisSession > 0 && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <h4 className="text-green-400 font-medium mb-2">Active Session</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Words added:</span>
              <span className="text-green-400 font-semibold">+{sessionStats.wordsThisSession}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Duration:</span>
              <span className="text-green-400 font-semibold">{sessionStats.duration}m</span>
            </div>
            {sessionStats.pace > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-300">Pace:</span>
                <span className="text-green-400 font-semibold">{sessionStats.pace} wpm</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Session Stats Panel Component
const SessionStatsPanel: React.FC<{
  content: string;
  title: string;
  currentSession: WritingSession | null;
}> = ({ content, title, currentSession }) => {
  const [dailyGoal, setDailyGoal] = useState(800);
  const [todayWordCount, setTodayWordCount] = useState(0);
  
  const wordCount = useMemo(() => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  }, [content]);
  
  // Load daily goal and today's progress
  useEffect(() => {
    try {
      const targetWords = localStorage.getItem("target_word_count");
      if (targetWords) {
        const yearlyTarget = parseInt(targetWords);
        setDailyGoal(Math.ceil(yearlyTarget / 365));
      }
      
      const sessions = localStorage.getItem("writing_sessions");
      if (sessions) {
        const sessionData = JSON.parse(sessions);
        const today = new Date().toISOString().split('T')[0];
        const todaySession = sessionData.find((s: any) => s.date === today);
        setTodayWordCount(todaySession ? todaySession.wordCount : 0);
      }
    } catch (error) {
      console.warn("Failed to load session data", error);
    }
  }, []);
  
  return (
    <div className="w-80 bg-[#1A2233] border-l border-gray-700 flex-shrink-0 overflow-y-auto">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Writing Stats</h3>
        <RealTimeStatsCard 
          wordCount={wordCount}
          content={content}
          currentSession={currentSession}
          dailyGoal={dailyGoal}
          todayWordCount={todayWordCount}
        />
      </div>
    </div>
  );
};

// Claude Integration Handler Component
const ClaudeIntegrationHandler: React.FC<{
  content: string;
  selectedText: string;
  onContentChange: (content: string) => void;
  onClaudeSave: () => void;
}> = ({ content, selectedText, onContentChange, onClaudeSave }) => {
  const { showToast } = useToastContext();
  
  useEffect(() => {
    const handleInsert = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        const insertedText = custom.detail;
        let newContent: string;
        
        if (selectedText && content.includes(selectedText)) {
          // Replace selected text
          newContent = content.replace(selectedText, insertedText);
        } else {
          // Append to content
          newContent = content ? `${content}\n\n${insertedText}` : insertedText;
        }
        
        onContentChange(newContent);
        
        // Log Claude assistance
        const wordsAdded = insertedText.trim().split(/\s+/).length;
        logActivity("writing", `Claude assisted: +${wordsAdded} words`);
        
        showToast({ 
          message: `Claude added ${wordsAdded} words to your draft`, 
          type: "success" 
        });
        
        // Queue Claude-triggered save with longer delay
        setTimeout(onClaudeSave, 2000);
      }
    };
    
    window.addEventListener("claude-insert-text", handleInsert as EventListener);
    return () => {
      window.removeEventListener("claude-insert-text", handleInsert as EventListener);
    };
  }, [content, selectedText, onContentChange, onClaudeSave, showToast]);
  
  return null; // This is a logic-only component
};

// Enhanced Claude Toolbar Component with Integration
const ClaudeToolbar: React.FC<{
  selectedText: string;
  content: string;
  onInsertText: (text: string) => void;
}> = ({ selectedText, content, onInsertText }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToastContext();
  
  const handleClaudePrompt = async (promptType: string) => {
    setIsProcessing(true);
    
    try {
      let prompt = "";
      let context = "";
      
      switch (promptType) {
        case "continue":
          context = content.slice(-500); // Last 500 characters for context
          prompt = `Continue this story scene with more detail and dialogue. Here's the current text:\n\n${context}`;
          break;
        case "improve":
          if (selectedText) {
            prompt = `Improve this text to be more engaging and vivid:\n\n${selectedText}`;
          } else {
            // Get last paragraph as context
            const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
            const lastParagraph = paragraphs[paragraphs.length - 1] || "";
            prompt = `Improve this paragraph to be more engaging:\n\n${lastParagraph}`;
          }
          break;
        case "dialogue":
          context = content.slice(-300); // Last 300 characters for context
          prompt = `Add realistic dialogue to bring this scene to life. Current scene:\n\n${context}`;
          break;
        default:
          return;
      }
      
      // TODO: Replace with actual Claude API integration
      // For now, simulate Claude response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response based on prompt type
      let mockResponse = "";
      switch (promptType) {
        case "continue":
          mockResponse = 'Sarah looked up from her book, the afternoon light casting shadows across the page. "Did you hear that?" she whispered, her voice barely audible above the rustling leaves outside.';
          break;
        case "improve":
          if (selectedText) {
            mockResponse = selectedText.replace(/\b(said|walked|looked)\b/g, (match) => {
              const alternatives = {
                'said': 'whispered',
                'walked': 'strode',
                'looked': 'gazed'
              };
              return alternatives[match as keyof typeof alternatives] || match;
            });
          } else {
            mockResponse = "The improved paragraph would appear here with more vivid descriptions and stronger word choices.";
          }
          break;
        case "dialogue":
          mockResponse = '"I think we should be careful," Marcus said, his hand instinctively moving to the weapon at his side. "Something doesn\'t feel right about this place."';
          break;
      }
      
      if (mockResponse) {
        onInsertText(mockResponse);
        showToast({
          message: "Claude has enhanced your writing!",
          type: "success"
        });
      }
      
    } catch (error) {
      console.error("Claude integration error:", error);
      showToast({
        message: "Failed to get Claude assistance",
        type: "error"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm font-medium text-gray-300">Claude Assist:</span>
      <div className="flex space-x-2">
        <button
          onClick={() => handleClaudePrompt("continue")}
          disabled={isProcessing}
          className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-lg text-sm hover:bg-purple-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "..." : "Continue Scene"}
        </button>
        <button
          onClick={() => handleClaudePrompt("improve")}
          disabled={isProcessing}
          className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-lg text-sm hover:bg-blue-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "..." : "Improve Text"}
        </button>
        <button
          onClick={() => handleClaudePrompt("dialogue")}
          disabled={isProcessing}
          className="px-3 py-1 bg-green-600/20 text-green-300 rounded-lg text-sm hover:bg-green-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "..." : "Add Dialogue"}
        </button>
      </div>
      {isProcessing && (
        <div className="text-xs text-gray-400 animate-pulse">
          Claude is thinking...
        </div>
      )}
    </div>
  );
};

// Export utility functions
const exportToMarkdown = (title: string, content: string): string => {
  return `# ${title}\n\n${content}`;
};

const exportToPlainText = (title: string, content: string): string => {
  return `${title}\n${'='.repeat(title.length)}\n\n${content}`;
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Enhanced export function
const useExportFunctionality = (title: string, content: string, wordCount: number) => {
  const { showToast } = useToastContext();
  
  const exportDocument = useCallback(async (format: ExportFormat) => {
    try {
      const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'untitled';
      const timestamp = new Date().toISOString().split('T')[0];
      
      switch (format) {
        case 'markdown':
          const markdownContent = exportToMarkdown(title, content);
          downloadFile(markdownContent, `${safeTitle}_${timestamp}.md`, 'text/markdown');
          break;
          
        case 'txt':
          const textContent = exportToPlainText(title, content);
          downloadFile(textContent, `${safeTitle}_${timestamp}.txt`, 'text/plain');
          break;
          
        case 'markdown':
          const jsonContent = JSON.stringify({
            title,
            content,
            wordCount,
            exportDate: new Date().toISOString(),
            metadata: {
              sentences: content.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
              paragraphs: content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
              characters: content.length,
            }
          }, null, 2);
          downloadFile(jsonContent, `${safeTitle}_${timestamp}.json`, 'application/json');
          break;
          
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      logActivity("writing", `Exported "${title}" as ${format.toUpperCase()} (${wordCount} words)`);
      showToast({
        message: `Document exported as ${format.toUpperCase()}`,
        type: "success",
      });
      
    } catch (error) {
      console.error("Export failed:", error);
      showToast({
        message: "Export failed. Please try again.",
        type: "error",
      });
    }
  }, [title, content, wordCount, showToast]);
  
  return { exportDocument };
};

// Main Writing Panel Component
const WritingPanel: React.FC<WritingPanelProps> = ({
  draftText,
  onChangeText,
  onTextSelect,
  selectedText,
}) => {
  const [content, setContent] = useState(draftText);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("markdown");
  const [lastActivityLog, setLastActivityLog] = useState(0);
  
  const { showToast } = useToastContext();
  const titleRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialLoadRef = useRef(false);
  
  const wordCount = useMemo(() => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  }, [content]);
  
  // Use centralized session management
  const { currentSession, startSession, updateActivity } = useWritingSession(wordCount);
  
  // Enhanced save function
  const performSave = useCallback(async (isAuto: boolean) => {
    try {
      const saveData = { title, content };
      localStorage.setItem("writing_content", JSON.stringify(saveData));
      
      // Smart activity logging
      if (!isAuto) {
        logActivity("writing", `Manually saved draft (${wordCount.toLocaleString()} words)`);
      }
      
      showToast({
        message: isAuto ? "Draft autosaved" : "Draft saved",
        type: "success",
        duration: isAuto ? 2000 : 3000,
      });
    } catch (error) {
      console.error("Save failed:", error);
      showToast({
        message: "Failed to save draft",
        type: "error",
      });
      throw error;
    }
  }, [title, content, wordCount, showToast]);
  
  // Use smart auto-save
  const { autoSaveState, manualSave, claudeSave } = useSmartAutoSave(title, content, performSave);
  
  // Enhanced content change handler
  const handleContentChange = useCallback((text: string) => {
    setContent(text);
    onChangeText(text);
    
    const newWordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    // Start or update session on content changes
    if (newWordCount > wordCount) {
      if (!currentSession) {
        startSession();
      }
      updateActivity();
    }
    
    // Log significant progress
    if (newWordCount - lastActivityLog >= 100) {
      const wordsAdded = newWordCount - lastActivityLog;
      logActivity("writing", `Writing progress: +${wordsAdded} words (${newWordCount.toLocaleString()} total)`);
      setLastActivityLog(newWordCount);
    }
  }, [onChangeText, wordCount, currentSession, startSession, updateActivity, lastActivityLog]);
  
  // Load saved draft
  useEffect(() => {
    if (initialLoadRef.current) return;
    
    try {
      const stored = localStorage.getItem("writing_content");
      if (stored) {
        const { title: savedTitle, content: savedContent } = JSON.parse(stored);
        
        if (savedTitle && savedTitle !== DEFAULT_TITLE) {
          setTitle(savedTitle);
        }
        
        if (savedContent) {
          setContent(savedContent);
          onChangeText(savedContent);
          
          const savedWordCount = savedContent.trim() ? savedContent.trim().split(/\s+/).length : 0;
          setLastActivityLog(savedWordCount);
          
          if (savedWordCount > 0) {
            logActivity("writing", `Loaded draft with ${savedWordCount.toLocaleString()} words`);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load writing content:", error);
      showToast({
        message: "Failed to load previous draft",
        type: "info",
      });
    } finally {
      initialLoadRef.current = true;
    }
  }, [onChangeText, showToast]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        manualSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [manualSave]);
  
  // Writing status
  const writingStatus = useMemo(() => {
    if (autoSaveState.isSaving) return "Saving...";
    if (autoSaveState.isDirty) return "Unsaved changes";
    if (autoSaveState.lastSaved) {
      const timeSince = Math.round((new Date().getTime() - autoSaveState.lastSaved.getTime()) / 1000);
      if (timeSince < 60) return "Saved just now";
      if (timeSince < 3600) return `Saved ${Math.round(timeSince / 60)}m ago`;
      return `Saved at ${autoSaveState.lastSaved.toLocaleTimeString()}`;
    }
    return "Never saved";
  }, [autoSaveState]);
  
  return (
    <div className="h-full bg-[#0A0F1C] text-gray-100 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Writing Panel</h2>
            <p className="text-gray-400 text-sm mt-1">{writingStatus}</p>
          </div>
          
          {currentSession && (
            <div className="text-right">
              <div className="text-sm text-green-400 font-medium">✍️ Active Session</div>
              <div className="text-xs text-gray-400">
                {Math.round((new Date().getTime() - currentSession.startTime.getTime()) / 60000)}m active
              </div>
            </div>
          )}
        </div>
        
        <WritingToolbar
          title={title}
          onTitleChange={setTitle}
          titleRef={titleRef}
          content={content}
          lastSaved={autoSaveState.lastSaved?.toLocaleTimeString() || "Never"}
          isSaving={autoSaveState.isSaving}
          onSave={manualSave}
          exportFormat={exportFormat}
          onExportFormatChange={setExportFormat}
          defaultTitle={DEFAULT_TITLE}
          isDirty={autoSaveState.isDirty}
        />
      </div>
      
      {/* Claude Toolbar */}
      <div className="flex-shrink-0 px-6 py-4 bg-[#1A2233] border-b border-gray-700">
        <ClaudeToolbar
          selectedText={selectedText}
          onInsertText={() => { } } // Handled by ClaudeIntegrationHandler
          content={""}        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <WritingEditor
            content={content}
            onContentChange={handleContentChange}
            onTextSelect={onTextSelect}
            textareaRef={textareaRef}
          />
        </div>
        
        <SessionStatsPanel 
          content={content}
          title={title}
          currentSession={currentSession}
        />
      </div>
      
      {/* Claude Integration Handler */}
      <ClaudeIntegrationHandler
        content={content}
        selectedText={selectedText}
        onContentChange={handleContentChange}
        onClaudeSave={claudeSave}
      />
    </div>
  );
};

export default EnhancedWritingPanel;