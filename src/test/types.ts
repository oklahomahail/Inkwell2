// @ts-nocheck
// File: src/test/types.ts
// Types for test utilities and mocks

/**
 * Extended Web Storage mock that exposes internal data
 * for testing purposes.
 */
import type { Mock } from 'vitest';

export interface MockStorage extends Storage {
  /** Internal data store */
  data: Record<string, string>;
  /** Mock function implementations */
  clear: Mock;
  getItem: Mock;
  setItem: Mock;
  removeItem: Mock;
  key: Mock;
}

declare global {
  /** Promise-based sleep function for tests */
  function sleep(ms: number): Promise<void>;
  /** Mock system time to a specific date */
  function mockDate(isoDate: string): Date;
  /** Mock current time to a fixed value */
  function mockNow(): number;
}
