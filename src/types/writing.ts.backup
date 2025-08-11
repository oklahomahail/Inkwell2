export interface WritingPanelState {
  content: string;
  title: string;
  wordCount: number;
  readingTime: number;
  exportFormat: ExportFormat;
  isVisible: boolean;
  // Auto-save state
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  saveCount: number;
  // Error handling
  error: string | null;
  // Session tracking
  session: WritingSession;
}

export interface WritingSession {
  date: string;
  startTime: Date;
  wordsAtStart: number;
  lastActivityTime: Date;
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
  saveCount: number;
}

export type WritingAction =
  | { type: 'SET_CONTENT'; payload: string }
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_WORD_COUNT'; payload: number }
  | { type: 'SET_READING_TIME'; payload: number }
  | { type: 'SET_EXPORT_FORMAT'; payload: ExportFormat }
  | { type: 'SET_IS_SAVING'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: Date | null }
  | { type: 'SET_SAVE_COUNT'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'CLEAR_DIRTY' }
  | { type: 'UPDATE_SESSION'; payload: Partial<WritingSession> }
  | { type: 'RESET' }
  | { type: 'TOGGLE_VISIBILITY' }
  | { type: string; payload?: any };

export type ExportFormat = 'markdown' | 'txt' | 'docx' | 'pdf' | 'html';

// Additional interfaces for better type safety
export interface SaveQueueItem {
  content: string;
  title: string;
  timestamp: number;
  type: 'auto' | 'manual' | 'claude';
}

export interface WritingMetrics {
  wordsPerMinute: number;
  productivity: number;
  focusTime: number;
  sessionsToday: number;
}

export interface ProjectAnalytics {
  totalWords: number;
  sessionsCount: number;
  averageSessionLength: number;
  lastModified: Date;
}
