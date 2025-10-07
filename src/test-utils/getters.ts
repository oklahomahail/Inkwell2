// src/test-utils/getters.ts
import { assertExists } from './invariants';

export function getOrThrow<T>(value: T | undefined | null, msg: string): T {
  assertExists(value, msg);
  return value;
}
