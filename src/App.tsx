// src/App.tsx - Updated with Command Palette Integration
import React from 'react';
import PlatformLayout from './components/Platform/PlatformLayout';
import ViewSwitcher from './components/ViewSwitcher';
import ToastContainer from './components/ToastContainer';
import ClaudeAssistant from './components/ClaudeAssistant';
import ClaudeErrorBoundary from './components/ClaudeErrorBoundary';
import { CommandPaletteProvider } from './components/CommandPalette/CommandPaletteProvider';
import CommandPaletteUI from './components/CommandPalette/CommandPaletteUI';
import { useAppContext } from './context/AppContext';

const App: React.FC = () => {
  const { claude } = useAppContext();

  return (
    <CommandPaletteProvider>
      <PlatformLayout>
        <ViewSwitcher />
        <ToastContainer />

        {/* Claude Assistant with Error Boundary */}
        {claude.isVisible && (
          <ClaudeErrorBoundary>
            <ClaudeAssistant
              selectedText=""
              onInsertText={(text) => {
                // TODO: Connect this to the current editor
                console.log('Insert text:', text);
              }}
            />
          </ClaudeErrorBoundary>
        )}

        {/* Command Palette UI */}
        <CommandPaletteUI />
      </PlatformLayout>
    </CommandPaletteProvider>
  );
};

export default App;
