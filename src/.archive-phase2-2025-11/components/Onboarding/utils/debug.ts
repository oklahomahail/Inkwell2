import devLog from '@/utils/devLog';
export const debugTour = (evt: string, data?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  // Keep noise down; switch to console.log if you want it always visible.
  devLog.debug(`[tour] ${evt}`, data ?? {});
};
