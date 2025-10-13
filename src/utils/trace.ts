type Timings = { start: number; end?: number; durationMs?: number };
type Span = {
  end: () => void;
  annotate: (k: string, v: unknown) => void;
  timings: Timings;
};

const enabled = typeof window !== 'undefined' && !!window.__INKWELL_TRACE__;

export function performanceNow(): number {
  if (typeof performance !== 'undefined' && performance.now) return performance.now();
  return Date.now();
}

export function startSpan(name: string, meta?: Record<string, unknown>): Span {
  const span: Span = {
    timings: { start: performanceNow() },
    end: () => {
      span.timings.end = performanceNow();
      span.timings.durationMs = span.timings.end! - span.timings.start;
      if (enabled) console.debug(`[trace] ${name}`, { ...meta, ...span.timings });
    },
    annotate: () => void 0,
  };
  if (enabled) console.debug(`[trace:start] ${name}`, meta ?? {});
  return span;
}
