/// <reference types="vite/client" />
/// <reference types="vitest" />
/// <reference types="vitest/globals" />

// Narrow Node-style process.env to string|undefined without bringing Node types
declare const process: {
  env: Record<string, string | undefined>;
};

// Browser globals used across the app/tests
declare global {
  interface Window {
    debugSearch?: unknown;
    __INKWELL_TRACE__?: boolean;
  }
}

export {};
