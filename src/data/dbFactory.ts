// src/data/dbFactory.ts
// Minimal, safe stubs (replace with your real implementation if you have it)

import { useMemo } from 'react';

export interface DB {
  // add methods your code expects
}

export function useMaybeDB(): DB | null {
  // return a memoized DB instance or null in SSR/CI
  return useMemo<DB | null>(() => null, []);
}

export function defineStores(_db: DB | null) {
  // return the store API your services expect, or no-ops in SSR
  return {
    tutorials: {
      get: async (_key: string) => null as any,
      set: async (_key: string, _val: any) => {},
    },
  };
}
