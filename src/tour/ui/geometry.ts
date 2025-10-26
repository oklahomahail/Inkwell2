export type Viewport = { w: number; h: number };

export function rafThrottle<T extends (...args: any[]) => void>(fn: T): T {
  let raf = 0;
  let lastArgs: any[] | null = null;
  const wrapped = ((...args: any[]) => {
    lastArgs = args;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const a = lastArgs;
      lastArgs = null;
      if (a) fn(...a);
    });
  }) as T;
  return wrapped;
}

export function getAnchorRect(el: Element): DOMRect {
  // getBoundingClientRect gives viewport-relative rect
  const r = el.getBoundingClientRect();
  // Normalize to a true DOMRect for consistent fields
  return new DOMRect(r.x, r.y, r.width, r.height);
}

export function rectWithPadding(rect: DOMRect, pad: number): DOMRect {
  return new DOMRect(
    Math.max(rect.x - pad, 0),
    Math.max(rect.y - pad, 0),
    Math.min(rect.width + pad * 2, window.innerWidth),
    Math.min(rect.height + pad * 2, window.innerHeight),
  );
}

export function isInViewport(rect: DOMRect, margin = 8): boolean {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return (
    rect.right > -margin &&
    rect.bottom > -margin &&
    rect.left < vw + margin &&
    rect.top < vh + margin
  );
}

export function getNearestScrollContainer(el: Element | null): Element | Window {
  if (!el) return window;
  let node: Element | null = el as Element;
  const overflowScrollRegex = /(auto|scroll|overlay)/;

  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;
    if (overflowScrollRegex.test(overflowY) || overflowScrollRegex.test(overflowX)) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}

export function scrollIntoViewIfNeeded(
  el: Element,
  opts: ScrollIntoViewOptions & { block?: ScrollLogicalPosition } = {
    behavior: 'smooth',
    block: 'center',
  },
) {
  const container = getNearestScrollContainer(el);
  if (container === window) {
    (el as HTMLElement).scrollIntoView(opts);
    return;
  }
  // Compute minimal scroll to reveal element inside container
  const cRect = (container as Element).getBoundingClientRect();
  const eRect = el.getBoundingClientRect();

  const topDiff = eRect.top - cRect.top;
  const bottomDiff = eRect.bottom - cRect.bottom;

  let dy = 0;
  if (topDiff < 0) dy = topDiff;
  else if (bottomDiff > 0) dy = bottomDiff;

  // Horizontal if needed
  const leftDiff = eRect.left - cRect.left;
  const rightDiff = eRect.right - cRect.right;

  let dx = 0;
  if (leftDiff < 0) dx = leftDiff;
  else if (rightDiff > 0) dx = rightDiff;

  if (dx !== 0 || dy !== 0) {
    (container as Element).scrollBy({ top: dy, left: dx, behavior: opts.behavior ?? 'smooth' });
  }
}

export function viewport(): Viewport {
  return { w: window.innerWidth, h: window.innerHeight };
}
