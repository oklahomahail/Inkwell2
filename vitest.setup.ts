import '@testing-library/jest-dom';

// Fail tests on console.error to catch regressions early.
const originalError = console.error;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    originalError(...args);
    throw new Error(`Console error during tests: ${String(args[0])}`);
  };
});

afterAll(() => {
  console.error = originalError;
});
