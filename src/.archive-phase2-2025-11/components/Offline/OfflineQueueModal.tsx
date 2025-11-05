// OfflineQueueModal.tsx - Modal for handling offline operations
import React from 'react';

interface OfflineQueueModalProps {
  onDisable: () => void;
  onSave: (json: Record<string, unknown>, type: string, scope: string) => void;
}

function _OfflineQueueModal({ onDisable: _onDisable, onSave: _onSave }: OfflineQueueModalProps) {
  return (
    <div className="offline-queue-modal">
      <h2>Offline Queue</h2>
      {/* Modal content */}
    </div>
  );
}

export const OfflineQueueModal = _OfflineQueueModal;
