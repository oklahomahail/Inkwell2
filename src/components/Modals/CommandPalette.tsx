// src/components/Modals/CommandPalette.tsx
import { Search, FileText, Settings, BarChart3, Command } from 'lucide-react';
import React, { useState } from 'react';

interface CommandPaletteProps {
  onClose: () => void;
}

const commands = [
  { id: 'new-project', label: 'Create New Project', icon: FileText, shortcut: '⌘N' },
  { id: 'open-settings', label: 'Open Settings', icon: Settings, shortcut: '⌘,' },
  { id: 'view-analytics', label: 'View Analytics', icon: BarChart3, shortcut: '⌘5' },
  { id: 'toggle-focus', label: 'Toggle Focus Mode', icon: Command, shortcut: '⌘F' },
];

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()),
  );

  const handleCommand = (commandId: string) => {
    console.log(`Executing command: ${commandId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
        <div
          className="bg-white rounded-xl shadow-xl ring-1 ring-black/5 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <Search className="w-5 h-5 text-[color:var(--ink-fg-muted)]" />
            <input
              type="text"
              placeholder="Search commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[color:var(--ink-fg)] placeholder:text-[color:var(--ink-fg-muted)] focus:outline-none"
              autoFocus
            />
            <kbd className="text-xs text-[color:var(--ink-fg-muted)] bg-gray-100 px-2 py-1 rounded">
              ESC
            </kbd>
          </div>

          {/* Commands List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => handleCommand(cmd.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <cmd.icon className="w-4 h-4 text-[color:var(--ink-fg-muted)]" />
                  <span className="flex-1 text-[color:var(--ink-fg)]">{cmd.label}</span>
                  <kbd className="text-xs text-[color:var(--ink-fg-muted)] bg-gray-100 px-2 py-1 rounded">
                    {cmd.shortcut}
                  </kbd>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-[color:var(--ink-fg-muted)]">
                No commands found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
