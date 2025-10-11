import { useState, useCallback } from 'react';

import { useCommands } from './useCommands';

export function _useCommandPalette(selectedText?: string) {
  const [isOpen, setIsOpen] = useState(false);

  const commands = useCommands(_selectedText, (commandId) => {
    console.log(`Executed command: ${commandId}`);
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
