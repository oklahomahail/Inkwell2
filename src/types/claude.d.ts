// src/types/claude.d.ts
declare global {
  interface Window {
    claude?: {
      complete: (prompt: string) => Promise<string>;
    };
  }
}

export {};