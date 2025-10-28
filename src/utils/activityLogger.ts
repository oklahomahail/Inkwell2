import devLog from "@/utils/devLog";
// src/utils/activityLogger.ts - Fixed with proper exports
interface ActivityLog {
  id: string;
  message: string;
  category: string;
  timestamp: Date;
}

class ActivityLogger {
  private logs: ActivityLog[] = [];
  private readonly STORAGE_KEY = 'inkwell_activity_logs';
  private readonly MAX_LOGS = 100;

  constructor() {
    this.loadLogs();
  }

  private loadLogs(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.logs = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
    } catch (error) {
      console.warn('Failed to load activity logs:', error);
      this.logs = [];
    }
  }

  private saveLogs(): void {
    try {
      // Keep only the most recent logs
      const recentLogs = this.logs.slice(-this.MAX_LOGS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentLogs));
      this.logs = recentLogs;
    } catch (error) {
      console.warn('Failed to save activity logs:', error);
    }
  }

  log(message: string, category: string = 'general'): void {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      message,
      category,
      timestamp: new Date(),
    };

    this.logs.push(newLog);
    this.saveLogs();

    // Also log to console in development
    if (import.meta.env?.DEV) {
      devLog.debug(`[${category.toUpperCase()}] ${message}`);
    }
  }

  getLogs(category?: string): ActivityLog[] {
    if (category) {
      return this.logs.filter((log) => log.category === category);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    this.saveLogs();
  }
}

// Create singleton instance
const activityLogger = new ActivityLogger();

// Export the main functions
export const logActivity = _logActivity;

export function _logActivity(message: string, category: string = 'general'): void {
  activityLogger.log(message, category);
}

export const getActivityLogs = _getActivityLogs;

export function _getActivityLogs(category?: string): ActivityLog[] {
  return activityLogger.getLogs(category);
}

export const clearActivityLogs = _clearActivityLogs;

export function _clearActivityLogs(): void {
  activityLogger.clearLogs();
}

// Export types
export type { ActivityLog };
