import { WritingPanelState, WritingAction } from '../types/writing';

export function writingReducer(state: WritingPanelState, action: WritingAction): WritingPanelState {
  switch (action.type) {
    case 'SET_CONTENT':
      return { ...state, content: action.payload, isDirty: true, error: null };
    case 'SET_TITLE':
      return { ...state, title: action.payload, isDirty: true, error: null };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_SAVED':
      return { ...state, lastSaved: action.payload, isSaving: false, isDirty: false, error: null };
    case 'SET_EXPORT_FORMAT':
      return { ...state, exportFormat: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isSaving: false };
    case 'CLEAR_DIRTY':
      return { ...state, isDirty: false };
    case "RESET":
      return {
        content: "",
        title: "",
        wordCount: 0,
        readingTime: 0,
        exportFormat: "markdown",
        isVisible: true,
        isDirty: false,
        isSaving: false,
        lastSaved: null,
        saveCount: 0,
        error: null,
        session: {
          date: new Date().toLocaleDateString(),
          startTime: new Date(),
          wordsAtStart: 0,
          lastActivityTime: new Date(),
        },
      };
    default:      return state;
  }
}
