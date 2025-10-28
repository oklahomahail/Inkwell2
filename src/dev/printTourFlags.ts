import devLog from "@/utils/devLog";
/**
 * Tour Flags DevTools Helper
 * Quick visibility into tour feature flags during canary rollout
 *
 * Usage (in browser console):
 *   import { printTourFlags } from '@/dev/printTourFlags';
 *   printTourFlags();
 */

/**
 * Print current tour feature flag state in a readable table
 */
export function printTourFlags(): void {
  const read = (k: string) => localStorage.getItem(k);

  const rows = [
    ['tour_simpleTour', read('ff:tour_simpleTour')],
    ['tour_export', read('ff:tour_export')],
    ['tour_aiTools', read('ff:tour_aiTools')],
    ['tour:kill', read('tour:kill')],
  ];

  devLog.debug('\n🎯 Tour Feature Flags Status\n');
  console.table(
    rows.map(([flag, value]) => ({
      flag,
      value: value ?? '(default)',
      status: value === 'off' || value === '1' ? '❌ DISABLED' : '✅ ENABLED',
    })),
  );

  // Also check main feature flag service
  try {
    const mainFlags = JSON.parse(localStorage.getItem('inkwell_feature_flags') || '{}');
    if (mainFlags.flags) {
      devLog.debug('\n📋 Main Feature Flags:\n');
      console.table(
        Object.entries(mainFlags.flags)
          .filter(([key]) => key.startsWith('tour_'))
          .map(([key, value]) => ({
            flag: key,
            enabled: value ? '✅ YES' : '❌ NO',
          })),
      );
    }
  } catch (error) {
    console.warn('Could not read main feature flags:', error);
  }
}

/**
 * Quick enable/disable shortcuts
 */
export const tourFlagHelpers = {
  enableAll(): void {
    localStorage.removeItem('tour:kill');
    localStorage.removeItem('ff:tour_simpleTour');
    localStorage.removeItem('ff:tour_export');
    localStorage.removeItem('ff:tour_aiTools');
    devLog.debug('✅ All tour flags enabled (using defaults)');
    printTourFlags();
  },

  disableAll(): void {
    localStorage.setItem('tour:kill', '1');
    devLog.debug('❌ All tours disabled via kill switch');
    printTourFlags();
  },

  enableCore(): void {
    localStorage.removeItem('ff:tour_simpleTour');
    devLog.debug('✅ Core tour enabled');
    printTourFlags();
  },

  disableCore(): void {
    localStorage.setItem('ff:tour_simpleTour', 'off');
    devLog.debug('❌ Core tour disabled');
    printTourFlags();
  },

  enableExport(): void {
    localStorage.removeItem('ff:tour_export');
    devLog.debug('✅ Export tour enabled');
    printTourFlags();
  },

  disableExport(): void {
    localStorage.setItem('ff:tour_export', 'off');
    devLog.debug('❌ Export tour disabled');
    printTourFlags();
  },

  enableAITools(): void {
    localStorage.removeItem('ff:tour_aiTools');
    devLog.debug('✅ AI Tools tour enabled');
    printTourFlags();
  },

  disableAITools(): void {
    localStorage.setItem('ff:tour_aiTools', 'off');
    devLog.debug('❌ AI Tools tour disabled');
    printTourFlags();
  },

  reset(): void {
    localStorage.removeItem('tour:kill');
    localStorage.removeItem('ff:tour_simpleTour');
    localStorage.removeItem('ff:tour_export');
    localStorage.removeItem('ff:tour_aiTools');
    localStorage.removeItem('inkwell_feature_flags');
    devLog.debug('🔄 All tour flags reset to defaults');
    printTourFlags();
  },
};

// Expose globally in development
if (import.meta.env.DEV) {
  (window as any).tourFlags = {
    print: printTourFlags,
    ...tourFlagHelpers,
  };

  devLog.debug('💡 Tour flag helpers available: window.tourFlags');
}
