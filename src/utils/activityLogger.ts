// src/utils/activityLogger.ts
export function logActivity(message: string, type: string = 'general') {
  console.log(`[${new Date().toISOString()}] [${type.toUpperCase()}] ${message}`);
  // Later, this can integrate with DashboardPanel or analytics storage
}
