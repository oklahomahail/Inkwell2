// src/components/CommandPalette/CommandPaletteUI.tsx
import {
  Search,
  X,
  ArrowRight,
  Zap,
  Navigation,
  Edit3,
  Brain,
  FolderOpen,
  Settings,
} from 'lucide-react';
import React, { useEffect, useRef } from 'react';

// ⬇️ import directly from the context
import { useCommandPaletteContext as useCommandPalette } from '@/context/CommandPaletteContext';

const CommandPaletteUI: React.FC = () => {
  const {
    isOpen,
    query,
    selectedIndex,
    close, // was closePalette
    setQuery,
    executeCommand,
    filteredCommands,
  } = useCommandPalette();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation':
        return Navigation;
      case 'writing':
        return Edit3;
      case 'ai':
        return Brain;
      case 'project':
        return FolderOpen;
      case 'settings':
        return Settings;
      default:
        return Zap;
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'navigation':
        return 'text-blue-500';
      case 'writing':
        return 'text-green-500';
      case 'ai':
        return 'text-purple-500';
      case 'project':
        return 'text-orange-500';
      case 'settings':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  // Group commands by category (light typing to avoid `any`)
  const grouped = filteredCommands.reduce<Record<string, typeof filteredCommands>>((acc, cmd) => {
    const category = (cmd as { category: string }).category;
    (acc[category] ||= []).push(cmd);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-32"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none text-lg"
          />
          <button
            onClick={close}
            className="ml-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(grouped).map(([category, commands]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                    {category}
                  </div>

                  {/* Category Commands */}
                  {commands.map((command) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = globalIndex === selectedIndex;
                    const IconComponent = getCategoryIcon(
                      (command as { category: string }).category,
                    );

                    return (
                      <button
                        key={(command as { id: string }).id}
                        onClick={() => executeCommand(command as any)}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/50 border-r-2 border-blue-500'
                            : ''
                        }`}
                      >
                        <div className="flex items-center min-w-0 flex-1">
                          <div
                            className={`mr-3 ${getCategoryColor(
                              (command as { category: string }).category,
                            )}`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {(command as { label: string }).label}
                            </div>
                            {(command as { description?: string }).description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {(command as { description?: string }).description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center ml-4 space-x-2">
                          {(command as { shortcut?: string }).shortcut && (
                            <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded border">
                              {(command as { shortcut?: string }).shortcut}
                            </kbd>
                          )}
                          {isSelected && <ArrowRight className="w-4 h-4 text-blue-500" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded mr-1">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded mr-1">⏎</kbd>
                Select
              </span>
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded mr-1">Esc</kbd>
                Close
              </span>
            </div>
            <div>
              {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPaletteUI;
