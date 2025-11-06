// src/components/Sections/MigrationBanner.tsx
import { Loader2, CheckCircle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useMigrationStatus } from '@/hooks/useMigrationStatus';
import { migrateChaptersToSections } from '@/services/sectionMigration';

interface MigrationBannerProps {
  projectId: string;
}

/**
 * Migration Banner Component
 *
 * Displays a non-blocking banner when a project is being migrated
 * to the section system. Shows progress and completion status.
 */
export default function MigrationBanner({ projectId }: MigrationBannerProps) {
  const { isMigrated, isChecking } = useMigrationStatus(projectId);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migratedCount, setMigratedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Auto-trigger migration if not migrated
  useEffect(() => {
    if (!isMigrated && !isChecking && !isMigrating && !dismissed) {
      const runMigration = async () => {
        setIsMigrating(true);
        setError(null);

        try {
          const result = await migrateChaptersToSections(projectId);

          if (result.success) {
            setMigratedCount(result.migratedCount);
            // Auto-dismiss after 3 seconds if successful
            if (result.migratedCount === 0) {
              setDismissed(true);
            } else {
              setTimeout(() => setDismissed(true), 3000);
            }
          } else {
            setError(result.error || 'Migration failed');
          }
        } catch (err: any) {
          setError(err.message || 'Unknown migration error');
        } finally {
          setIsMigrating(false);
        }
      };

      runMigration();
    }
  }, [isMigrated, isChecking, isMigrating, dismissed, projectId]);

  // Don't show banner if dismissed or already migrated
  if (dismissed || isMigrated) {
    return null;
  }

  // Don't show banner while checking
  if (isChecking) {
    return null;
  }

  return (
    <div className="bg-blue-900/20 border-l-4 border-blue-400 p-3 mb-4 rounded-r-md">
      <div className="flex items-start gap-3">
        {isMigrating ? (
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
        ) : error ? (
          <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          {isMigrating && (
            <>
              <div className="text-sm font-medium text-blue-300 mb-1">
                Upgrading Project Structure...
              </div>
              <div className="text-xs text-slate-400">
                Migrating chapters to the new section system. This won't take long.
              </div>
            </>
          )}

          {!isMigrating && !error && migratedCount > 0 && (
            <>
              <div className="text-sm font-medium text-green-300 mb-1">Migration Complete</div>
              <div className="text-xs text-slate-400">
                Successfully upgraded {migratedCount} {migratedCount === 1 ? 'chapter' : 'chapters'}{' '}
                to the new section system.
              </div>
            </>
          )}

          {error && (
            <>
              <div className="text-sm font-medium text-amber-300 mb-1">Migration Warning</div>
              <div className="text-xs text-slate-400 mb-2">{error}</div>
              <button
                onClick={() => setDismissed(true)}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Dismiss
              </button>
            </>
          )}
        </div>

        {!isMigrating && !error && (
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-300 transition-colors"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
