import { useEffect, useState } from 'react';

import type { StorageHealth } from '@/utils/storage/storageHealth';
import { getStorageHealth, watchStorageHealth } from '@/utils/storage/storageHealth';

/**
 * Hook that provides real-time storage health monitoring
 * Returns the current storage health report and updates when it changes
 */
export function useStorageHealth() {
  const [report, setReport] = useState<StorageHealth | null>(null);

  useEffect(() => {
    let stop: (() => void) | undefined;

    (async () => {
      // Get initial health report
      const initial = await getStorageHealth();
      setReport(initial);

      // Watch for changes
      stop = watchStorageHealth((next) => setReport(next));
    })();

    return () => {
      if (stop) stop();
    };
  }, []);

  return report;
}
