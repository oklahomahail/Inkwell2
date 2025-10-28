import devLog from '@/utils/devLog';
// Error logging utilities
export const logError = (error: unknown, context?: Record<string, unknown>): void => {
  devLog.error('[inkwell]', error, context);
};

export const logStorageError = (error: unknown, operation?: string): void => {
  logError(error, { component: 'storage', operation });
};
