import { useEffect } from 'react';

export interface UseTabShortcutsOptions {
  onNextTab?: () => void;
  onPrevTab?: () => void;
  // Optionally disable the hook (e.g., when modals are open)
  disabled?: boolean;
}

/**
 * Binds keyboard shortcuts for switching tabs.
 * - Ctrl/Cmd + ]  → next tab
 * - Ctrl/Cmd + [  → previous tab
 */
export default function _useTabShortcuts(options: UseTabShortcutsOptions = {}) {
  const { onNextTab, onPrevTab, disabled } = options;

  useEffect(() => {
    if (disabled) return;

    const handler = (_e: KeyboardEvent) => {
      // Ignore when user types in inputs/textareas/contentEditable
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isTyping) return;

      const metaOrCtrl = e.metaKey || e.ctrlKey;
      if (!metaOrCtrl) return;

      // Cmd/Ctrl + ] → next
      if (e.key === ']' && onNextTab) {
        e.preventDefault();
        onNextTab();
        return;
      }
      // Cmd/Ctrl + [ → prev
      if (e.key === '[' && onPrevTab) {
        e.preventDefault();
        onPrevTab();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNextTab, onPrevTab, disabled]);
}
