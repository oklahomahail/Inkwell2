// src/components/Providers.tsx
import React from 'react';

import { AppProvider } from '@/context/AppContext';
import { ClaudeProvider } from '@/context/ClaudeProvider';
import { EditorProvider } from '@/context/EditorContext';
import { NavProvider } from '@/context/NavContext';
import { ToastProvider } from '@/context/ToastContext';

import { CommandPaletteProvider } from './CommandPalette/CommandPaletteProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Centralized provider composition to ensure consistent context ordering
 * and prevent provider-related runtime errors.
 *
 * Provider hierarchy (outermost to innermost):
 * 1. ToastProvider - Global notifications
 * 2. NavProvider - Navigation state management
 * 3. EditorProvider - Text editor context
 * 4. ClaudeProvider - AI assistant integration
 * 5. AppProvider - Main application state
 * 6. CommandPaletteProvider - Command palette functionality
 */
export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ToastProvider>
      <NavProvider>
        <EditorProvider>
          <ClaudeProvider>
            <AppProvider>
              <CommandPaletteProvider>{children}</CommandPaletteProvider>
            </AppProvider>
          </ClaudeProvider>
        </EditorProvider>
      </NavProvider>
    </ToastProvider>
  );
};

export default Providers;
