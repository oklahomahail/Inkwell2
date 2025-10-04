// src/components/Search/SmartSearchTrigger.tsx
import { Search, Sparkles } from 'lucide-react';
import React from 'react';

import { cn } from '@/utils/cn';

interface SmartSearchTriggerProps {
  onClick: () => void;
  variant?: 'button' | 'input' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  shortcut?: string[];
  disabled?: boolean;
  className?: string;
  showAI?: boolean;
}

export const SmartSearchTrigger: React.FC<SmartSearchTriggerProps> = ({
  onClick,
  variant = 'input',
  size = 'md',
  placeholder = 'Search your project...',
  shortcut = ['⌘', '⇧', 'F'],
  disabled = false,
  className = '',
  showAI = true,
}) => {
  const baseClasses = cn(
    'transition-all duration-200 focus:outline-none',
    disabled && 'opacity-50 cursor-not-allowed',
  );

  if (variant === 'button') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          baseClasses,
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600',
          'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300',
          'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
          'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          size === 'sm' && 'text-sm px-3 py-1.5',
          size === 'lg' && 'text-lg px-6 py-3',
          className,
        )}
      >
        <Search
          className={cn(
            'text-gray-400',
            size === 'sm' && 'w-3 h-3',
            size === 'md' && 'w-4 h-4',
            size === 'lg' && 'w-5 h-5',
          )}
        />
        <span>Search</span>
        {showAI && (
          <Sparkles
            className={cn(
              'text-blue-500',
              size === 'sm' && 'w-3 h-3',
              size === 'md' && 'w-3 h-3',
              size === 'lg' && 'w-4 h-4',
            )}
          />
        )}
        {shortcut && shortcut.length > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            {shortcut.map((key, index) => (
              <kbd
                key={index}
                className={cn(
                  'px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600',
                  size === 'sm' && 'px-1 py-0.5 text-[10px]',
                  size === 'lg' && 'px-2 py-1 text-sm',
                )}
              >
                {key}
              </kbd>
            ))}
          </div>
        )}
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          baseClasses,
          'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700',
          'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
          className,
        )}
        title={`Search (${shortcut.join('')})`}
      >
        <Search
          className={cn(
            size === 'sm' && 'w-4 h-4',
            size === 'md' && 'w-5 h-5',
            size === 'lg' && 'w-6 h-6',
          )}
        />
      </button>
    );
  }

  // Default: input variant
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600',
        'bg-white dark:bg-gray-800 text-left',
        'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
        'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        size === 'sm' && 'px-3 py-2 text-sm',
        size === 'lg' && 'px-5 py-3 text-lg',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Search
          className={cn(
            'text-gray-400',
            size === 'sm' && 'w-3 h-3',
            size === 'md' && 'w-4 h-4',
            size === 'lg' && 'w-5 h-5',
          )}
        />
        {showAI && (
          <Sparkles
            className={cn(
              'text-blue-500',
              size === 'sm' && 'w-3 h-3',
              size === 'md' && 'w-3 h-3',
              size === 'lg' && 'w-4 h-4',
            )}
          />
        )}
      </div>

      <span className="flex-1 text-gray-500 dark:text-gray-400">{placeholder}</span>

      {shortcut && shortcut.length > 0 && (
        <div className="flex items-center gap-1">
          {shortcut.map((key, index) => (
            <kbd
              key={index}
              className={cn(
                'px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600',
                size === 'sm' && 'px-1 py-0.5 text-[10px]',
                size === 'lg' && 'px-2 py-1 text-sm',
              )}
            >
              {key === '⌘' && '⌘'}
              {key === '⇧' && '⇧'}
              {key === '⌃' && '⌃'}
              {key === '⌥' && '⌥'}
              {!['⌘', '⇧', '⌃', '⌥'].includes(key) && key}
            </kbd>
          ))}
        </div>
      )}
    </button>
  );
};

// Quick search button with command palette style
export const QuickSearchButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ onClick, disabled = false, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md',
        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
        'border border-gray-200 dark:border-gray-600',
        'hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-200',
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      title="Smart Search"
    >
      <Search className="w-4 h-4" />
      <span className="hidden sm:inline">Search</span>
      <Sparkles className="w-3 h-3 text-blue-500" />
    </button>
  );
};

// Search shortcut hint for empty states
export const SearchHint: React.FC<{
  onClick: () => void;
  className?: string;
}> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400',
        'hover:text-gray-700 dark:hover:text-gray-300 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg',
        className,
      )}
    >
      <Search className="w-4 h-4" />
      <span>Press</span>
      <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600">
        ⌘⇧F
      </kbd>
      <span>to search</span>
      <Sparkles className="w-3 h-3 text-blue-500" />
    </button>
  );
};

export default SmartSearchTrigger;
