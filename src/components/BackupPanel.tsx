// src/components/BackupPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { BackupManager } from '@/services/backupCore';
import { debounce } from 'lodash';

interface BackupPanelProps {
  performBackup: () => Promise<void>;
}

export default function BackupPanel({ performBackup }: BackupPanelProps) {
  const [message, setMessage] = useState<{ text: string; type: string }>({
    text: '',
    type: 'info',
  });
  const backupManagerRef = useRef<BackupManager | null>(null);
  const [backupStatus, setBackupStatus] = useState<
    'idle' | 'saving' | 'success' | 'error' | 'retrying'
  >('idle');

  // Notification callback for BackupManager
  const notify = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setMessage({ text, type });
    // Update backup status for button state, etc.
    if (text.toLowerCase().includes('backup successful')) setBackupStatus('success');
    else if (text.toLowerCase().includes('backup failed')) setBackupStatus('error');
    else if (text.toLowerCase().includes('retrying')) setBackupStatus('retrying');
    else if (text.toLowerCase().includes('starting backup')) setBackupStatus('saving');
    else if (text.toLowerCase().includes('already in progress')) setBackupStatus('saving');
  };

  useEffect(() => {
    if (!backupManagerRef.current) {
      backupManagerRef.current = new BackupManager(performBackup, notify);
    }
  }, [performBackup]);

  // Debounced auto-save trigger (e.g., on user typing)
  const debouncedBackup = useRef(
    debounce(() => {
      backupManagerRef.current?.backup();
    }, 3000),
  ).current;

  // Call this in your text change handler:
  function onUserInputChange() {
    debouncedBackup();
  }

  const manualBackup = () => {
    backupManagerRef.current?.backup();
  };

  return (
    <div className="p-4 border rounded shadow-md max-w-md mx-auto">
      <h2 className="text-lg font-semibold font-semibold font-semibold font-semibold font-medium font-semibold mb-2">
        Backup & Auto-Save
      </h2>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={manualBackup}
        disabled={backupStatus === 'saving' || backupStatus === 'retrying'}
        aria-live="polite"
      >
        {backupStatus === 'saving' || backupStatus === 'retrying' ? 'Backing up...' : 'Save Now'}
      </button>

      <p
        className={`mt-3 font-medium ${
          message.type === 'success'
            ? 'text-green-600'
            : message.type === 'error'
              ? 'text-red-600'
              : 'text-gray-700'
        }`}
        role="status"
        aria-live="polite"
      >
        {message.text}
      </p>

      {/* Example textarea to simulate user input */}
      <textarea
        className="w-full mt-4 p-2 border rounded"
        rows={4}
        placeholder="Type here to auto-save..."
        onChange={onUserInputChange}
        aria-label="Content editor with auto-save"
      />
    </div>
  );
}
