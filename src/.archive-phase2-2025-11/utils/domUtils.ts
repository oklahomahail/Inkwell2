// src/utils/domUtils.ts

interface WaitForElementOptions {
  timeoutMs?: number;
  checkIntervalMs?: number;
}

/**
 * Waits for an element matching the selector to be present in the DOM.
 * Returns a promise that resolves with the element or rejects on timeout.
 */
export function waitForElement(
  selector: string,
  options: WaitForElementOptions = {},
): Promise<HTMLElement> {
  const { timeoutMs = 6000, checkIntervalMs = 50 } = options;
  const startTime = performance.now();

  return new Promise((resolve, reject) => {
    function check() {
      const element = document.querySelector(selector) as HTMLElement | null;

      if (element) {
        resolve(element);
        return;
      }

      if (performance.now() - startTime > timeoutMs) {
        reject(new Error(`Timeout waiting for element: ${selector}`));
        return;
      }

      setTimeout(check, checkIntervalMs);
    }

    check();
  });
}

/**
 * Scrolls an element into view with proper positioning and behavior
 */
export function scrollIntoViewIfNeeded(element: HTMLElement) {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center',
  });
}
