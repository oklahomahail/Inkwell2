export type ExportFormat = 'markdown' | 'txt' | 'docx' | 'json';

export interface WritingPanelState {
  content: string;
  title: string;
  lastSaved: Date | null;
  isSaving: boolean;
  exportFormat: ExportFormat;
  error: string | null;
  isDirty: boolean;
}

export type WritingAction =
  | { type: 'SET_CONTENT'; payload: string }
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_SAVED'; payload: Date }
  | { type: 'SET_EXPORT_FORMAT'; payload: ExportFormat }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_DIRTY' }
  | { type: 'RESET_STATE' };
