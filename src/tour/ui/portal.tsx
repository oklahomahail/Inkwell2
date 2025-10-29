import React from 'react';
import { createPortal } from 'react-dom';

import devLog from '@/utils/devLog';

const PORTAL_ID = 'spotlight-root';

export function ensurePortalRoot(): HTMLElement {
  // Ensure document.body exists before creating portal
  if (!document.body) {
    throw new Error('ensurePortalRoot: document.body is not available');
  }

  let root = document.getElementById(PORTAL_ID) as HTMLElement | null;
  if (!root) {
    root = document.createElement('div');
    root.id = PORTAL_ID;
    root.setAttribute('data-inkwell-spotlight-root', 'true');
    Object.assign(root.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '10000', // Higher than modals (50) and topbar (30)
      pointerEvents: 'none', // Let clicks through the container
    });
    document.body.appendChild(root);
  }

  // Always ensure pointer-events is none on the root - children can override
  root.style.pointerEvents = 'none';

  return root;
}

/**
 * Render children into the Spotlight portal.
 * Usage: SpotlightPortal({ children: <Overlay /> })
 */
export function SpotlightPortal({ children }: { children: React.ReactNode }) {
  // Guard: Don't try to create portal if body doesn't exist (SSR or early boot)
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  try {
    const root = ensurePortalRoot();
    return createPortal(children, root);
  } catch (error) {
    devLog.warn('[SpotlightPortal] Failed to create portal:', error);
    return null;
  }
}
