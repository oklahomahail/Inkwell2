import { useState, useCallback } from 'react';

export interface UseExportWizardReturn {
  isOpen: boolean;
  openWizard: (_projectId: string) => void;
  closeWizard: () => void;
  currentProjectId: string | null;
}

/**
 * Hook for managing Export Wizard state
 * Provides a consistent way to open/close the export wizard across the app
 */
export function useExportWizard(): UseExportWizardReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const openWizard = useCallback((projectId: string) => {
    setCurrentProjectId(projectId);
    setIsOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setIsOpen(false);
    // Clear project ID after a delay to allow closing animation
    setTimeout(() => setCurrentProjectId(null), 300);
  }, []);

  return {
    isOpen,
    openWizard,
    closeWizard,
    currentProjectId,
  };
}

// Optional: Global export wizard state (if you want to share state across components)
let globalExportWizard: UseExportWizardReturn | null = null;

export function useGlobalExportWizard(): UseExportWizardReturn {
  // Always create a new instance to avoid conditional hook calls
  // In a real implementation, we would use a more sophisticated state management approach
  const localInstance = useExportWizard();

  // If a global instance exists, return it
  if (globalExportWizard) {
    return globalExportWizard;
  }

  // Otherwise, use the local instance
  return localInstance;
}
