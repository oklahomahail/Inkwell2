export function assertDefined<T>(
  v: T,
  msg = 'Expected value to be defined',
): asserts v is NonNullable<T> {
  if (v == null) throw new Error(msg);
}

export function isDefined<T>(v: T): v is NonNullable<T> {
  return v != null;
}

export function first<T>(arr: readonly T[] | null | undefined): T | undefined {
  return Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined;
}

export function last<T>(arr: readonly T[] | null | undefined): T | undefined {
  return Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : undefined;
}

export function nonEmpty<T>(arr: readonly T[] | null | undefined): arr is [T, ...T[]] {
  return Array.isArray(arr) && arr.length > 0;
}

export function coalesce<T>(...vals: (T | null | undefined)[]): T | undefined {
  for (const v of vals) if (v != null) return v;
  return undefined;
}

export function safeJSONParse<T = unknown>(raw: string | null | undefined): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}
