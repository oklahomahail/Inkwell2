// src/components/Providers.tsx
import React from 'react';

import { AppProvider } from '@/context/AppContext';
import { ClaudeProvider } from '@/context/ClaudeProvider';
import { EditorProvider } from '@/context/EditorContext';
import { NavProvider } from '@/context/NavContext';
import { ProfileProvider } from '@/context/ProfileContext';
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
 * 2. ProfileProvider - Profile state management (must be early for data isolation)
 * 3. NavProvider - Navigation state management
 * 4. EditorProvider - Text editor context
 * 5. ClaudeProvider - AI assistant integration
 * 6. TourProvider - Tour and onboarding system
 * 7. FeatureDiscoveryProvider - Contextual hints
 * 8. AppProvider - Main application state
 * 9. CommandPaletteProvider - Command palette functionality
 */
export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ToastProvider>
      <ProfileProvider>
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
      </ProfileProvider>
    </ToastProvider>
  );
};

export default Providers;
