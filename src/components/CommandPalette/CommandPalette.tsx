// src/components/CommandPalette/CommandPalette.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react';
import { Command, CommandGroup } from '@/types/commands';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  placeholder?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  commands,
  placeholder = 'Search commands...',
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // For accessibility
  const listboxId = useId();

  // 1) Filter by search
  const filteredCommands = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return commands;

    return commands.filter((cmd) => {
      const inLabel = cmd.label.toLowerCase().includes(term);
      const inDesc = cmd.description?.toLowerCase().includes(term);
      const inKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(term));
      return inLabel || !!inDesc || !!inKeywords;
    });
  }, [commands, search]);

  // 2) Group by category (kept for UI)
  const groupedCommands = useMemo<CommandGroup[]>(() => {
    const categories = Array.from(new Set(filteredCommands.map((c) => c.category)));
    return categories
      .map((category) => {
        const items = filteredCommands.filter((c) => c.category === category);
        if (items.length === 0) return null;
        return {
          category,
          label: category.charAt(0).toUpperCase() + category.slice(1),
          commands: items,
        } as CommandGroup;
      })
      .filter(Boolean) as CommandGroup[];
  }, [filteredCommands]);

  // 3) Flat index for keyboard selection
  const flatCommands = useMemo(() => {
    return groupedCommands.flatMap((g) => g.commands);
  }, [groupedCommands]);

  // Build a map id -> global index to avoid O(n^2) lookups
  const indexMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    for (const g of groupedCommands) {
      for (const c of g.commands) {
        map.set(c.id, idx++);
      }
    }
    return map;
  }, [groupedCommands]);

  // Reset when opened
  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setSelectedIndex(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  // Auto-scroll currently selected command into view
  useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-index="${selectedIndex}"]`);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, isOpen]);

  const executeCommand = useCallback(
    async (command: Command) => {
      try {
        await command.action();
        onClose();
      } catch (err) {
        console.error('Command execution failed:', err);
      }
    },
    [onClose],
  );

  // Keyboard navigation (document-level works well for overlays)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatCommands.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = flatCommands[selectedIndex];
        if (selected) void executeCommand(selected);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [isOpen, flatCommands, selectedIndex, executeCommand, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getCategoryIcon = useCallback((category: string) => {
    const icons: Record<string, string> = {
      navigation: '🧭',
      writing: '✍️',
      claude: '🤖',
      project: '📁',
      export: '📤',
    };
    return icons[category] ?? '⚡';
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-32"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${listboxId}-label`}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-96 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 text-lg font-semibold bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
            aria-label="Search commands"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {/* List */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto"
          role="listbox"
          aria-activedescendant={`${listboxId}-option-${selectedIndex}`}
          id={listboxId}
        >
          {groupedCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>No commands found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            groupedCommands.map((group) => (
              <div key={group.category}>
                {/* Group header */}
                <div
                  className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
                  id={`${listboxId}-group-${group.category}`}
                >
                  <span className="flex items-center gap-2">
                    <span>{getCategoryIcon(group.category)}</span>
                    {group.label}
                  </span>
                </div>

                {/* Group items */}
                {group.commands.map((command) => {
                  const globalIndex = indexMap.get(command.id)!;
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <button
                      key={command.id}
                      role="option"
                      aria-selected={isSelected}
                      id={`${listboxId}-option-${globalIndex}`}
                      data-cmd-index={globalIndex}
                      onClick={() => void executeCommand(command)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={[
                        'w-full px-4 py-3 text-left transition-colors',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500'
                          : '',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {command.icon && (
                            <span className="text-lg font-semibold" aria-hidden="true">
                              {command.icon}
                            </span>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {command.label}
                            </div>
                            {command.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {command.description}
                              </div>
                            )}
                          </div>
                        </div>
                        {command.shortcut && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {command.shortcut}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
