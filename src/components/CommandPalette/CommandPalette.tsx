import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  placeholder = "Search commands..." 
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter and group commands
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    
    const searchTerm = search.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(searchTerm) ||
      cmd.description?.toLowerCase().includes(searchTerm) ||
      cmd.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
    );
  }, [commands, search]);

  const groupedCommands = useMemo(() => {
    const groups: CommandGroup[] = [];
    const categories = [...new Set(filteredCommands.map(cmd => cmd.category))];
    
    categories.forEach(category => {
      const categoryCommands = filteredCommands.filter(cmd => cmd.category === category);
      if (categoryCommands.length > 0) {
        groups.push({
          category,
          label: category.charAt(0).toUpperCase() + category.slice(1),
          commands: categoryCommands
        });
      }
    });
    
    return groups;
  }, [filteredCommands]);

  const flatCommands = useMemo(() => {
    return groupedCommands.flatMap(group => group.commands);
  }, [groupedCommands]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, flatCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          const selectedCommand = flatCommands[selectedIndex];
          if (selectedCommand) {
            executeCommand(selectedCommand);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatCommands, selectedIndex, onClose]);

  // Auto-scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const executeCommand = async (command: Command) => {
    try {
      await command.action();
      onClose();
    } catch (error) {
      console.error('Command execution failed:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      navigation: '🧭',
      writing: '✍️',
      claude: '🤖',
      project: '📁',
      export: '📤'
    };
    return icons[category as keyof typeof icons] || '⚡';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-32">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-96 overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 text-lg bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
          />
        </div>

        {/* Commands List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {groupedCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>No commands found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            groupedCommands.map((group, groupIndex) => (
              <div key={group.category}>
                {/* Group Header */}
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <span className="flex items-center gap-2">
                    <span>{getCategoryIcon(group.category)}</span>
                    {group.label}
                  </span>
                </div>
                
                {/* Commands in Group */}
                {group.commands.map((command, commandIndex) => {
                  const globalIndex = flatCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;
                  
                  return (
                    <button
                      key={command.id}
                      onClick={() => executeCommand(command)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {command.icon && <span className="text-lg">{command.icon}</span>}
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
