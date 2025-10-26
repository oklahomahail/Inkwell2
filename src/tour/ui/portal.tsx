import React from 'react';
import { createPortal } from 'react-dom';

const PORTAL_ID = 'spotlight-root';

export function ensurePortalRoot(): HTMLElement {
  let root = document.getElementById(PORTAL_ID) as HTMLElement | null;
  if (!root) {
    root = document.createElement('div');
    root.id = PORTAL_ID;
    root.setAttribute('data-inkwell-spotlight-root', 'true');
    Object.assign(root.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '9999',
      pointerEvents: 'none',
    });
    document.body.appendChild(root);
  }
  return root;
}

/**
 * Render children into the Spotlight portal.
 * Usage: SpotlightPortal({ children: <Overlay /> })
 */
export function SpotlightPortal({ children }: { children: React.ReactNode }) {
  const root = ensurePortalRoot();
  return createPortal(children, root);
}
