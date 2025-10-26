// src/components/Modals/ShortcutsModal.tsx
import { X, Keyboard } from 'lucide-react';
import React from 'react';

import { useAutostartSpotlight } from '@/hooks/useAutostartSpotlight';

interface ShortcutsModalProps {
  onClose: () => void;
}

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { key: '⌘1', description: 'Go to Dashboard' },
      { key: '⌘2', description: 'Go to Writing' },
      { key: '⌘3', description: 'Go to Planning' },
      { key: '⌘4', description: 'Go to Timeline' },
      { key: '⌘5', description: 'Go to Analytics' },
    ],
  },
  {
    category: 'General',
    items: [
      { key: '⌘K', description: 'Open Command Palette' },
      { key: '⌘N', description: 'New Project' },
      { key: '⌘S', description: 'Save' },
      { key: '⌘F', description: 'Toggle Focus Mode' },
      { key: '⌘,', description: 'Open Settings' },
    ],
  },
  {
    category: 'Writing',
    items: [
      { key: '⌘B', description: 'Bold text' },
      { key: '⌘I', description: 'Italic text' },
      { key: '⌘Z', description: 'Undo' },
      { key: '⌘⇧Z', description: 'Redo' },
    ],
  },
];

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  const { restartTour } = useAutostartSpotlight();

  const handleStartTour = () => {
    onClose(); // Close the modal first
    setTimeout(() => restartTour(), 300); // Small delay for smooth transition
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
        <div
          className="bg-white rounded-xl shadow-xl ring-1 ring-black/5 max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Keyboard className="w-6 h-6 text-[color:var(--ink-deep-navy)]" />
              <h2 className="text-lg font-semibold text-[color:var(--ink-fg-strong)]">
                Keyboard Shortcuts
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-[color:var(--ink-fg-muted)] hover:text-[color:var(--ink-fg)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-96">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {shortcuts.map((section) => (
                <div key={section.category}>
                  <h3 className="text-sm font-medium text-[color:var(--ink-fg-strong)] mb-3">
                    {section.category}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((shortcut) => (
                      <div key={shortcut.key} className="flex items-center justify-between">
                        <span className="text-sm text-[color:var(--ink-fg)]">
                          {shortcut.description}
                        </span>
                        <kbd className="text-xs text-[color:var(--ink-fg-muted)] bg-gray-100 px-2 py-1 rounded font-mono">
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[color:var(--ink-fg-muted)]">
                Press <kbd className="bg-white px-1 py-0.5 rounded text-xs">ESC</kbd> to close
              </p>
              <button
                onClick={handleStartTour}
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Start Tour
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
