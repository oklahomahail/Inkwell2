// src/hooks/useCommandPalette.ts

// If your provider exports a context, use it here. Otherwise this is a safe no-op shim.
type CommandPaletteAPI = {
  openPalette: () => void;
  closePalette?: () => void;
  togglePalette?: () => void;
};

// Try to import your provider context if it exists; otherwise fall back to a no-op
let useFromProvider: (() => CommandPaletteAPI | undefined) | undefined;
try {
  // If you already have a provider with a hook, you can re-export it here instead.
  // Example (uncomment if you have it):
  // const real = require('@/components/CommandPalette/CommandPaletteProvider') as any;
  // useFromProvider = real.useCommandPalette as any;
} catch {
  /* ignore */
}

export function useCommandPalette(): CommandPaletteAPI {
  const provided = useFromProvider?.();
  if (provided) return provided;
  return {
    openPalette: () => {},
    closePalette: () => {},
    togglePalette: () => {},
  };
}
