// src/context/CommandPaletteContext.ts
import { createContext, useContext } from 'react';

export interface CommandPaletteContextValue {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (q: string) => void;
  executeCommand: (cmd: any) => void | Promise<void>;
  registerCommand: (cmd: any) => void;
  unregisterCommand: (id: string) => void;
  filteredCommands: any[];
}

export const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPaletteContext() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error('useCommandPaletteContext must be used within CommandPaletteProvider');
  return ctx;
}
