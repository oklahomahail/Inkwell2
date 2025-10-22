import { vi } from 'vitest';

export type AuthChangeListener = (event: string, session: any) => void;

export function createSupabaseMock() {
  const listeners: AuthChangeListener[] = [];
  return {
    auth: {
      signInWithOtp: vi.fn(async (_args: any) => ({ data: {}, error: null })),
      signInWithPassword: vi.fn(async (_args: any) => ({ data: {}, error: null })),
      signUp: vi.fn(async (_args: any) => ({ data: {}, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn((_cb: AuthChangeListener) => {
        listeners.push(_cb);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
    __emitAuth: (event: string, session: any = null) => {
      listeners.forEach((cb) => cb(event, session));
    },
  };
}
