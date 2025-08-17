// src/App.tsx - Updated with Export Dialog Integration
import React, { useState } from 'react';
import PlatformLayout from './components/Platform/PlatformLayout';
import ViewSwitcher from './components/ViewSwitcher';
import ToastContainer from './components/ToastContainer';
import ClaudeAssistant from './components/ClaudeAssistant';
import ClaudeErrorBoundary from './components/ClaudeErrorBoundary';
import ExportDialog from './components/ExportDialog';
import { CommandPaletteProvider } from './components/CommandPalette/CommandPaletteProvider';
import CommandPaletteUI from './components/CommandPalette/CommandPaletteUI';
import { useAppContext } from './context/AppContext';

const App: React.FC = () => {
  const { claude, currentProject } = useAppContext();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Export dialog controls
  const openExportDialog = () => setIsExportDialogOpen(true);
  const closeExportDialog = () => setIsExportDialogOpen(false);

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

        {/* Export Dialog */}
        {currentProject && (
          <ExportDialog
            isOpen={isExportDialogOpen}
            onClose={closeExportDialog}
            projectId={currentProject.id}
            projectName={currentProject.name}
          />
        )}

        {/* Command Palette UI */}
        <CommandPaletteUI />

        {/* Global export trigger - you can access this from anywhere */}
        <div style={{ display: 'none' }}>
          <button onClick={openExportDialog} id="global-export-trigger">
            Export
          </button>
        </div>
      </PlatformLayout>
    </CommandPaletteProvider>
  );
};

export default App;