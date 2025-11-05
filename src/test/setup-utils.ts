// Pure function test setup - no DOM or React dependencies
import { afterEach } from 'vitest';

// Reset any module mocks after each test
afterEach(() => {
  vi.restoreAllMocks();
});

// Global test utilities for pure functions
export function mockDate(isoDate: string) {
  const realDate = Date;

  class MockDate extends realDate {
    constructor() {
      super();
      return new realDate(isoDate);
    }

    static now() {
      return new realDate(isoDate).getTime();
    }
  }

  global.Date = MockDate as DateConstructor;
  return () => {
    global.Date = realDate;
  };
}

// Test helpers for common utils cases
export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

export function expectTypeOf<T>(value: T) {
  return value;
}
