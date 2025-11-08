import '@testing-library/jest-dom/vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { expect, afterEach, afterAll, vi } from 'vitest';

// Mock fetch globally to prevent network calls in tests
global.fetch = vi.fn((url: string | URL | Request, _init?: RequestInit) => {
  const urlString = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

  // Mock Supabase endpoints
  if (urlString.includes('127.0.0.1:54321') || urlString.includes('localhost:54321')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: [], error: null }),
      text: async () => '{"data":[],"error":null}',
      blob: async () => new Blob(),
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => new FormData(),
      clone: function () {
        return this;
      },
      body: null,
      bodyUsed: false,
      redirected: false,
      type: 'basic' as ResponseType,
      url: urlString,
    } as Response);
  }

  // Default mock for other URLs
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({}),
    text: async () => '{}',
    blob: async () => new Blob(),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    clone: function () {
      return this;
    },
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType,
    url: urlString,
  } as Response);
}) as any;

// Add matchMedia polyfill for components that need it
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(), // legacy
      removeListener: vi.fn(), // legacy
      dispatchEvent: vi.fn(),
    }),
  });
}

// Add ResizeObserver mock for Headless UI components
if (!global.ResizeObserver) {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

expect.extend(matchers);

// --- Make JSDOM behave for idle callbacks so timers get cleared ---
if (!('requestIdleCallback' in globalThis)) {
  // schedule on a timeout so vi.clearAllTimers() can clean it
  // @ts-ignore
  globalThis.requestIdleCallback = (cb: any) =>
    setTimeout(
      () =>
        cb({
          didTimeout: false,
          timeRemaining: () => 50,
        }),
      0,
    );
  // @ts-ignore
  globalThis.cancelIdleCallback = (id: number) => clearTimeout(id);
}

// --- Track and auto-clean intervals (silent hang culprit #1) ---
const activeIntervals = new Set<number>();
const _setInterval = globalThis.setInterval;
const _clearInterval = globalThis.clearInterval;
globalThis.setInterval = ((handler: TimerHandler, timeout?: number, ...rest: any[]) => {
  // @ts-ignore
  const id = _setInterval(handler as any, timeout as any, ...rest);
  // @ts-ignore
  activeIntervals.add(id);
  // @ts-ignore
  return id;
}) as any;
globalThis.clearInterval = ((id: any) => {
  activeIntervals.delete(id as number);
  _clearInterval(id);
}) as any;

// ------------ BroadcastChannel: idempotent stub ------------
declare global {
  // simple flag so we don't re-declare the stub if setupFiles are loaded twice
  // (can happen with watch/hmr or misconfig)

  var __HAS_BC_STUB__: boolean | undefined;
}

if (!globalThis.__HAS_BC_STUB__) {
  // Only create the class once in this module scope
  class BCStub {
    name: string;
    onmessage: ((ev: MessageEvent) => any) | null = null;
    constructor(name: string) {
      this.name = name;
    }
    postMessage(_msg: unknown) {}
    close() {}
    addEventListener(_t?: any, _l?: any) {}
    removeEventListener(_t?: any, _l?: any) {}
  }

  // If the environment already has a BC, don't overwrite unless you want to force the stub.
  // Most jsdom envs won't have it; this sets it exactly once.
  // @ts-ignore
  if (typeof globalThis.BroadcastChannel !== 'function') {
    // @ts-ignore
    globalThis.BroadcastChannel = BCStub as any;
  }

  globalThis.__HAS_BC_STUB__ = true;
}

// runs a cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  try {
    vi.useRealTimers();
  } catch {}
  vi.clearAllTimers();
  // hard stop any leftover intervals
  Array.from(activeIntervals).forEach((id) => {
    try {
      _clearInterval(id);
    } catch {}
    activeIntervals.delete(id);
  });
  cleanup();
});

afterAll(() => {
  // Flush any dangling promises or async iterators
  return new Promise((resolve) => {
    setImmediate(() => {
      if ((global as any).gc) {
        try {
          (global as any).gc();
        } catch {}
      }
      resolve(true);
    });
  });
});

afterAll(async () => {
  await Promise.resolve();
  try {
    vi.useRealTimers();
  } catch {}
  vi.clearAllTimers();
  expect(activeIntervals.size).toBe(0); // if this fails, you've found the leaker
});
