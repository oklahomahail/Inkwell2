// Component test setup - React Testing Library + headless utilities
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import * as rtl from '@testing-library/react';
import { vi } from 'vitest';

// Setup mock browser APIs that UI components need
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Polyfill requestAnimationFrame
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
}

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Helper for basic smoke test of a React component
export function smokeTest(
  Component: React.ComponentType<any>,
  props: Record<string, any> = {}
) {
  it('renders without crashing', () => {
    const { container } = rtl.render(<Component {...props} />);
    expect(container).toBeInTheDocument();
  });
}

// Helper to wait for async updates
export async function waitForChanges() {
  await rtl.waitFor(() => new Promise(resolve => setTimeout(resolve, 0)));
}