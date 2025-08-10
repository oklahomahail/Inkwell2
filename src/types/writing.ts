export interface WritingPanelState {
  content: string;
  wordCount: number;
  isVisible: boolean;
  title: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  exportFormat: string;
  error: string | null;
}

export type WritingAction =
  | { type: 'SET_CONTENT'; payload: string }
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_IS_SAVING'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: Date | null }
  | { type: 'SET_EXPORT_FORMAT'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_DIRTY' }
  | { type: 'RESET' }
  | { type: 'UPDATE_WORD_COUNT'; payload: number }
  | { type: 'TOGGLE_VISIBILITY' }
  | { type: string; payload?: any };

export type ExportFormat = 'markdown' | 'txt' | 'docx' | 'pdf' | 'html';
