// src/test-utils/invariants.ts
export function assertExists<T>(
  value: T,
  msg = 'Expected value to be defined',
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) throw new Error(msg);
}
