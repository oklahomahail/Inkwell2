let lastFocused: Element | null = null;
let teardownFocusTrap: (() => void) | null = null;
let liveRegionEl: HTMLElement | null = null;

function getFocusable(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([type="hidden"]):not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(selectors));
  // Only visible and actually focusable
  return nodes.filter((el) => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return (
      style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
    );
  });
}

/**
 * Trap keyboard focus within a container until cleanup is called.
 * Returns a cleanup function.
 */
export function trapFocus(container: HTMLElement): () => void {
  // If an existing trap is active, clear it first
  if (teardownFocusTrap) teardownFocusTrap();

  lastFocused = document.activeElement;
  const focusables = getFocusable(container);
  const first = focusables[0] ?? container;
  const last = focusables[focusables.length - 1] ?? container;

  // Move focus in
  (first as HTMLElement).focus();

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const current = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (current === first || current === container) {
        e.preventDefault();
        (last as HTMLElement).focus();
      }
    } else {
      if (current === last) {
        e.preventDefault();
        (first as HTMLElement).focus();
      }
    }
  };

  document.addEventListener('keydown', onKeyDown, true);

  teardownFocusTrap = () => {
    document.removeEventListener('keydown', onKeyDown, true);
    // Restore focus to previously focused element if still in the document
    if (lastFocused instanceof HTMLElement && document.contains(lastFocused)) {
      lastFocused.focus();
    }
    lastFocused = null;
    teardownFocusTrap = null;
  };

  return teardownFocusTrap;
}

/**
 * Restore focus if a trap is active. No-op if none.
 */
export function restoreFocus(): void {
  if (teardownFocusTrap) {
    teardownFocusTrap();
  }
}

/**
 * Announce a short message to screen readers via a hidden aria-live region.
 */
export function announceLive(message: string): void {
  if (!liveRegionEl) {
    liveRegionEl = document.createElement('div');
    liveRegionEl.setAttribute('aria-live', 'polite');
    liveRegionEl.setAttribute('aria-atomic', 'true');
    liveRegionEl.style.position = 'fixed';
    liveRegionEl.style.width = '1px';
    liveRegionEl.style.height = '1px';
    liveRegionEl.style.margin = '-1px';
    liveRegionEl.style.border = '0';
    liveRegionEl.style.padding = '0';
    liveRegionEl.style.overflow = 'hidden';
    liveRegionEl.style.clip = 'rect(0 0 0 0)';
    liveRegionEl.style.clipPath = 'inset(50%)';
    document.body.appendChild(liveRegionEl);
  }
  // Clear then set to ensure announcement
  liveRegionEl.textContent = '';
  // A tiny timeout helps some screen readers detect changes reliably
  setTimeout(() => {
    if (liveRegionEl) liveRegionEl.textContent = message;
  }, 10);
}
