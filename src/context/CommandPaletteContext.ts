// src/context/CommandPaletteContext.ts
import { createContext, useContext } from 'react';

export interface CommandPaletteContextValue {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (_q: string) => void;
  executeCommand: (_cmd: any) => void | Promise<void>;
  registerCommand: (_cmd: any) => void;
  unregisterCommand: (_id: string) => void;
  filteredCommands: any[];
}

export const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function _useCommandPaletteContext() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error('useCommandPaletteContext must be used within CommandPaletteProvider');
  return ctx;
}
