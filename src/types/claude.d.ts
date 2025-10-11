// src/types/claude.d.ts declare global { interface Window { claude?: { complete: (_prompt: string) => Promise<string>; }; } } export {};
