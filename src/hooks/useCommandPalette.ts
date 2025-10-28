import { useState, useCallback } from 'react';

import devLog from "@/utils/devLog";

import { useCommands } from './useCommands';

export function useCommandPalette(selectedText?: string) {
  const [isOpen, setIsOpen] = useState(false);

  const commands = useCommands(selectedText, (commandId) => {
    devLog.debug(`Executed command: ${commandId}`);
  });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    commands,
  };
}
