// src/components/ui/KeyboardHints.tsx
import { Command } from 'lucide-react';
import React from 'react';

// ==========================================
// KEYBOARD SHORTCUT DISPLAY COMPONENTS
// ==========================================

interface KeyboardShortcutProps {
  keys: string[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'prominent';
}

export const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({
  keys,
  className = '',
  size = 'md',
  variant = 'default',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5',
    md: 'text-xs px-2 py-1 min-w-[1.5rem] h-6',
    lg: 'text-sm px-2.5 py-1.5 min-w-[2rem] h-8',
  };

  const variantClasses = {
    default:
      'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600',
    subtle:
      'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    prominent:
      'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <kbd
            className={`
            inline-flex items-center justify-center font-mono font-medium rounded
            shadow-sm transition-colors
            ${sizeClasses[size]}
            ${variantClasses[variant]}
          `}
          >
            {key}
          </kbd>
          {index < keys.length - 1 && (
            <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ==========================================
// SHORTCUT TOOLTIPS
// ==========================================

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  shortcut?: string[];
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const ShortcutTooltip: React.FC<TooltipProps> = ({
  children,
  content,
  shortcut,
  className = '',
  side = 'bottom',
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const sideClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-800 dark:border-t-slate-200',
    bottom:
      'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-800 dark:border-b-slate-200',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-800 dark:border-l-slate-200',
    right:
      'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-800 dark:border-r-slate-200',
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          className={`
          absolute z-50 px-3 py-2 text-sm text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800
          rounded-lg shadow-lg whitespace-nowrap pointer-events-none
          ${sideClasses[side]}
        `}
        >
          <div className="flex items-center gap-3">
            <span>{content}</span>
            {shortcut && (
              <KeyboardShortcut keys={shortcut} size="sm" variant="subtle" className="opacity-75" />
            )}
          </div>

          {/* Tooltip arrow */}
          <div
            className={`
            absolute w-0 h-0 border-4
            ${arrowClasses[side]}
          `}
          />
        </div>
      )}
    </div>
  );
};

// ==========================================
// COMMAND PALETTE HINT
// ==========================================

interface CommandPaletteHintProps {
  className?: string;
  onClick?: () => void;
  variant?: 'input' | 'button' | 'subtle';
}

export const CommandPaletteHint: React.FC<CommandPaletteHintProps> = ({
  className = '',
  onClick,
  variant = 'input',
}) => {
  const variantStyles = {
    input:
      'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-400',
    button:
      'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 text-sm text-slate-700 dark:text-slate-300 transition-colors cursor-pointer',
    subtle: 'text-slate-500 dark:text-slate-400 text-sm',
  };

  const content = (
    <div className={`flex items-center justify-between ${variantStyles[variant]} ${className}`}>
      <div className="flex items-center gap-2">
        <Command className="w-4 h-4" />
        <span>Search commands...</span>
      </div>
      <KeyboardShortcut keys={['⌘', 'K']} size="sm" variant="subtle" />
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return content;
};

// ==========================================
// NAVIGATION SHORTCUTS PANEL
// ==========================================

interface NavigationShortcut {
  label: string;
  shortcut: string[];
  description?: string;
}

interface NavigationShortcutsPanelProps {
  shortcuts: NavigationShortcut[];
  className?: string;
}

export const NavigationShortcutsPanel: React.FC<NavigationShortcutsPanelProps> = ({
  shortcuts,
  className = '',
}) => (
  <div
    className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 ${className}`}
  >
    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
      Keyboard Shortcuts
    </h3>
    <div className="space-y-2">
      {shortcuts.map((shortcut, index) => (
        <div key={index} className="flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-700 dark:text-slate-300">{shortcut.label}</span>
            {shortcut.description && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {shortcut.description}
              </div>
            )}
          </div>
          <KeyboardShortcut keys={shortcut.shortcut} size="sm" />
        </div>
      ))}
    </div>
  </div>
);

// ==========================================
// HELP OVERLAY
// ==========================================

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<HelpOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Navigation',
      shortcuts: [
        { label: 'Dashboard', shortcut: ['⌘', '1'] },
        { label: 'Writing', shortcut: ['⌘', '2'] },
        { label: 'Timeline', shortcut: ['⌘', '3'] },
        { label: 'Analytics', shortcut: ['⌘', '4'] },
        { label: 'Settings', shortcut: ['⌘', ','] },
      ],
    },
    {
      title: 'Commands',
      shortcuts: [
        { label: 'Command Palette', shortcut: ['⌘', 'K'] },
        { label: 'Quick Export', shortcut: ['⌘', '⇧', 'E'] },
        { label: 'New Chapter', shortcut: ['⌘', 'N'] },
        { label: 'Save', shortcut: ['⌘', 'S'] },
      ],
    },
    {
      title: 'Writing',
      shortcuts: [
        { label: 'Focus Mode', shortcut: ['⌘', '⇧', 'F'] },
        { label: 'Word Count', shortcut: ['⌘', '⇧', 'W'] },
        { label: 'AI Assist', shortcut: ['⌘', '⇧', 'A'] },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shortcutGroups.map((group, index) => (
              <div key={index}>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  {group.title}
                </h3>
                <div className="space-y-3">
                  {group.shortcuts.map((shortcut, shortcutIndex) => (
                    <div key={shortcutIndex} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {shortcut.label}
                      </span>
                      <KeyboardShortcut keys={shortcut.shortcut} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>Press</span>
              <KeyboardShortcut keys={['?']} size="sm" />
              <span>to open this help anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
