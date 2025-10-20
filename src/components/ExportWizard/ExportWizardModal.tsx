import { useEffect } from 'react';

import ExportWizard from './ExportWizard';

interface ExportWizardModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
}

export function ExportWizardModal({ isOpen, projectId, onClose }: ExportWizardModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !projectId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl mx-4 max-h-[90vh] overflow-auto">
        <ExportWizard projectId={projectId} onClose={onClose} />
      </div>
    </div>
  );
}

// Default export for compatibility
