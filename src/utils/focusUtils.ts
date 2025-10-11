/**
 * Focus utils for managing focus in the application
 */

/**
 * Focus the first interactive element in a container
 */
export function _focusFirstInteractive(root?: HTMLElement | null) {
  const el = root?.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  el?.focus();
}

/**
 * Focus the writing editor
 */
export function _focusWritingEditor() {
  window.dispatchEvent(new CustomEvent('focusWritingEditor'));
}

/**
 * Restore focus to a previously focused element
 */
export function _restoreFocus(previousElement?: HTMLElement | null) {
  previousElement?.focus();
}
