/**
 * Lightweight performance measurement utilities for dev/CI
 * Usage:
 *   mark('app:boot')
 *   // ... some work ...
 *   measure('tti:dashboard', 'app:boot')
 */

export function mark(name: string): void {
  try {
    performance.mark(name);
  } catch (e) {
    // Silently fail in environments without performance API
  }
}

export function measure(label: string, start: string, end?: string): number | null {
  try {
    if (end) performance.mark(end);
    performance.measure(label, start, end);
    const entry = performance.getEntriesByName(label)[0];
    return entry?.duration ?? null;
  } catch {
    return null;
  }
}

export function clearMarks(prefix?: string): void {
  try {
    if (prefix) {
      const marks = performance.getEntriesByType('mark');
      marks.filter((m) => m.name.startsWith(prefix)).forEach((m) => performance.clearMarks(m.name));
    } else {
      performance.clearMarks();
    }
  } catch {
    // Ignore
  }
}

export function clearMeasures(prefix?: string): void {
  try {
    if (prefix) {
      const measures = performance.getEntriesByType('measure');
      measures
        .filter((m) => m.name.startsWith(prefix))
        .forEach((m) => performance.clearMeasures(m.name));
    } else {
      performance.clearMeasures();
    }
  } catch {
    // Ignore
  }
}

/**
 * Get all measures matching a pattern
 */
export function getMeasures(pattern?: string): PerformanceEntry[] {
  try {
    const all = performance.getEntriesByType('measure');
    if (!pattern) return all;
    return all.filter((m) => m.name.includes(pattern));
  } catch {
    return [];
  }
}
