import '@testing-library/jest-dom';
import { beforeAll, afterAll } from 'vitest';

// Mock Worker API for Node.js test environment
class WorkerMock {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  // Allow tests to control worker behavior
  static shouldAutoError = true;
  static mockResponse: any = null;

  constructor(stringUrl: string | URL) {
    this.url = typeof stringUrl === 'string' ? stringUrl : stringUrl.toString();

    // Simulate worker initialization failure in test environment (if enabled)
    // This ensures services fall back to main thread immediately
    if (WorkerMock.shouldAutoError) {
      setTimeout(() => {
        if (this.onerror) {
          const errorEvent = new ErrorEvent('error', {
            message: 'Worker not supported in test environment',
          });
          this.onerror(errorEvent);
        }
      }, 0);
    }
  }

  postMessage(message: unknown) {
    // If mock response is configured, simulate worker response
    if (WorkerMock.mockResponse && this.onmessage) {
      setTimeout(() => {
        if (this.onmessage) {
          const event = new MessageEvent('message', {
            data: WorkerMock.mockResponse(message),
          });
          this.onmessage(event);
        }
      }, 0);
    }
  }

  terminate() {
    // Mock implementation - does nothing in tests
  }

  addEventListener(_type: string, _listener: EventListenerOrEventListenerObject) {
    // Mock implementation - does nothing in tests
  }

  removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject) {
    // Mock implementation - does nothing in tests
  }

  dispatchEvent(_event: Event): boolean {
    return true;
  }
}

// Add Worker to global scope for tests
(globalThis as any).Worker = WorkerMock;

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
  /\[WelcomeProject\] Error checking creation eligibility:/,
  /\[WelcomeProject\] Error creating welcome project:/,
  /\[WelcomeProject\] Error deleting welcome project:/,
  /\[WelcomeProject\] Error reconciling pointer:/,
  /\[sessionUtils\] Error cleaning sessions:/,
  /Failed to load formatting:/,
  /Failed to save formatting:/,
  /\[AutosaveWorker\] Worker error:/,
  /\[SearchService\] Worker error:/,
  /\[Hydration\] Hydration failed:/,
  /\[Hydration\] Table .* failed:/,
  /\[SyncQueue\] Operation failed/,
  /\[SyncQueue\] Failed to/,
  /\[Hydration\] Bootstrap failed:/,
  /\[DeadLetterQueue\] Operation failed permanently/,
  /\[ChapterSynopsis\] Generation failed:/,
  /\[SceneClassification\] Classification failed:/,
  /\[PublishingTools\] Generation failed:/,
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
