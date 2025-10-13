export type ToolbarPosition = 'panel' | 'popup' | 'relative';
export type PopupPosition = 'top' | 'bottom' | 'left' | 'right';

export interface ClaudeToolbarProps {
  /** Selected text to process with Claude */
  selectedText?: string;
  /** Callback when Claude wants to insert text */
  onInsertText: (text: string, replaceSelection?: boolean) => void;
  /** Title of the current scene for context */
  sceneTitle?: string;
  /** Current content for context */
  currentContent?: string;
  /** How the toolbar should be positioned */
  position: ToolbarPosition;
  /** If position is popup, where the popup should be located */
  popupPosition?: PopupPosition;
  /** Callback when the toolbar should be closed */
  onClose?: () => void;
  /** Additional CSS classes */
  className?: string;
}
