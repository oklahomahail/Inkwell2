// src/components/Providers.tsx
import React from 'react';

import { AppProvider } from '@/context/AppContext';
import { ClaudeProvider } from '@/context/ClaudeProvider';
import { EditorProvider } from '@/context/EditorContext';
import { NavProvider } from '@/context/NavContext';
import { ToastProvider } from '@/context/ToastContext';

import { CommandPaletteProvider } from './CommandPalette/CommandPaletteProvider';
import { FeatureDiscoveryProvider } from './Onboarding/FeatureDiscovery';
import { TourProvider } from './Onboarding/TourProvider';

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
 * 5. TourProvider - Tour and onboarding system
 * 6. FeatureDiscoveryProvider - Contextual hints
 * 7. AppProvider - Main application state
 * 8. CommandPaletteProvider - Command palette functionality
 */
export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ToastProvider>
      <NavProvider>
        <EditorProvider>
          <ClaudeProvider>
            <TourProvider>
              <FeatureDiscoveryProvider>
                <AppProvider>
                  <CommandPaletteProvider>{children}</CommandPaletteProvider>
                </AppProvider>
              </FeatureDiscoveryProvider>
            </TourProvider>
          </ClaudeProvider>
        </EditorProvider>
      </NavProvider>
    </ToastProvider>
  );
};

export default Providers;
