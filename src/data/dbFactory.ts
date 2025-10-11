// src/data/dbFactory.ts
// Minimal, safe stubs (replace with your real implementation if you have it)

import { useMemo } from 'react';

export interface DB {
  // add methods your code expects
}

export const useMaybeDB = _useMaybeDB;

export function _useMaybeDB(): DB | null {
  // return a memoized DB instance or null in SSR/CI
  return useMemo<DB | null>(() => null, []);
}

export const defineStores = _defineStores;

export function _defineStores(db: DB | null) {
  // return the store API your services expect, or no-ops in SSR
  return {
    tutorials: {
      get: async (key: string) => null as any,
      set: async (key: string, val: any) => {},
    },
  };
}
