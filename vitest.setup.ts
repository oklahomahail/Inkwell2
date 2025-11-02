import '@testing-library/jest-dom';
import { beforeAll, afterAll } from 'vitest';

// Fail tests on console.error to catch regressions early.
// But allow expected errors from error handling tests.
const originalError = console.error;

// Patterns for expected/intentional errors that shouldn't fail tests
const EXPECTED_ERROR_PATTERNS = [
  /Failed to save project:/,
  /Failed to save inkwell_enhanced_projects:/,
  /Failed to load projects:/,
  /Failed to create snapshot:/,
  /Failed to restore snapshot:/,
  /Failed to get snapshots:/,
  /Error in connectivity listener:/,
  /Error in status change callback:/,
  /Invalid callback provided to onStatusChange/,
  /Failed to save offline queue:/,
  /Failed to load offline queue:/,
  /❌ Claude API Error:/,
  /\[Auth\] Sign-in failed:/,
  /\[Inkwell\] Failed to request persistent storage:/,
  /ReactDOMTestUtils\.act.*is deprecated/,
  /An update to.*inside a test was not wrapped in act/,
  /ReferenceError: localStorage is not defined/,
  /\[EnhancedChapterEditor\] Failed to autosave:/,
];

function isExpectedError(message: string): boolean {
  return EXPECTED_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    originalError(...args);
    const message = String(args[0]);

    // Don't throw for expected errors
    if (!isExpectedError(message)) {
      throw new Error(`Console error during tests: ${message}`);
    }
  };
});

afterAll(() => {
  console.error = originalError;
});
