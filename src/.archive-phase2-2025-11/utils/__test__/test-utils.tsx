// Test utilities for React components
import { render as rtlRender } from '@testing-library/react';
import React, { ReactNode } from 'react';

/**
 * Custom render function that wraps components with necessary providers
 */
export function _render(ui: ReactNode, { ...options } = {}) {
  return rtlRender(<>{ui}</>, options);
}

/**
 * Create a wrapper component that renders children with necessary providers
 */
export function _createWrapper() {
  return ({ children }: { children: ReactNode }) => {
    return <>{children}</>;
  };
}
