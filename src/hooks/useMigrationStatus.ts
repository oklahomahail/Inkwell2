// src/hooks/useMigrationStatus.ts
/**
 * Migration Status Hook
 *
 * Provides UI components with migration status information
 * for displaying banners, progress indicators, etc.
 */

import { useState, useEffect } from 'react';

import { isMigrated } from '@/services/sectionMigration';

export interface MigrationStatus {
  isMigrated: boolean;
  isChecking: boolean;
}

/**
 * Check if a project has been migrated to the section system
 *
 * @param projectId - The project ID to check
 * @returns Migration status object
 */
export function useMigrationStatus(projectId: string | null): MigrationStatus {
  const [status, setStatus] = useState<MigrationStatus>({
    isMigrated: false,
    isChecking: true,
  });

  useEffect(() => {
    if (!projectId) {
      setStatus({ isMigrated: false, isChecking: false });
      return;
    }

    // Check migration status
    const checkStatus = async () => {
      try {
        const migrated = isMigrated(projectId);
        setStatus({ isMigrated: migrated, isChecking: false });
      } catch (error) {
        console.error('[useMigrationStatus] Failed to check migration status:', error);
        setStatus({ isMigrated: false, isChecking: false });
      }
    };

    checkStatus();
  }, [projectId]);

  return status;
}
