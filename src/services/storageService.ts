// src/services/storageService.ts
export interface WritingData {
  content: string;
  title: string;
  lastUpdated: Date;
  wordCount: number;
}

export interface ProjectSettings {
  targetWordCount: number;
  theme: 'light' | 'dark';
  autoSaveInterval: number;
}

export interface WritingSession {
  date: string;
  wordCount: number;
  duration?: number;
}

class StorageService {
  private readonly KEYS = {
    WRITING_CONTENT: 'writing_content',
    TIMELINE_SCENES: 'timeline_scenes',
    WRITING_SESSIONS: 'writing_sessions',
    PROJECT_SETTINGS: 'project_settings',
    RECENT_ACTIVITIES: 'recent_activities',
  } as const;

  // Generic storage methods with error handling
  private setItem<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      return false;
    }
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return defaultValue;
    }
  }

  // Writing content methods
  saveWritingContent(data: WritingData): boolean {
    return this.setItem(this.KEYS.WRITING_CONTENT, {
      ...data,
      lastUpdated: new Date().toISOString(),
    });
  }

  getWritingContent(): WritingData | null {
    const data = this.getItem<any>(this.KEYS.WRITING_CONTENT, null);
    if (!data) return null;

    return {
      ...data,
      lastUpdated: new Date(data.lastUpdated),
    };
  }

  // Writing sessions with automatic cleanup
  saveWritingSession(session: WritingSession): boolean {
    const sessions = this.getWritingSessions();
    const today = new Date().toISOString().split('T')[0];

    // Update or add today's session
    const existingIndex = sessions.findIndex((s) => s.date === today);
    if (existingIndex >= 0) {
      const existingSession = sessions[existingIndex]!;
      sessions[existingIndex] = {
        ...existingSession,
        ...sessions[existingIndex],
        wordCount: sessions[existingIndex]!.wordCount + session.wordCount,
      };
    } else {
      sessions.push(session);
    }

    // Keep only last 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const filtered = sessions.filter((s) => new Date(s.date) >= cutoffDate);

    return this.setItem(this.KEYS.WRITING_SESSIONS, filtered);
  }

  getWritingSessions(): WritingSession[] {
    return this.getItem<WritingSession[]>(this.KEYS.WRITING_SESSIONS, []);
  }

  // Project settings
  saveProjectSettings(settings: ProjectSettings): boolean {
    return this.setItem(this.KEYS.PROJECT_SETTINGS, settings);
  }

  getProjectSettings(): ProjectSettings {
    return this.getItem<ProjectSettings>(this.KEYS.PROJECT_SETTINGS, {
      targetWordCount: 80000,
      theme: 'dark',
      autoSaveInterval: 30000,
    });
  }

  // Batch operations for better performance
  batchSave(operations: Array<() => boolean>): boolean {
    return operations.every((op) => op());
  }

  // Clear all data (for export/reset)
  clearAllData(): boolean {
    try {
      Object.values(this.KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  // Get storage usage info
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      Object.values(this.KEYS).forEach((key) => {
        const item = localStorage.getItem(key);
        if (item) used += item.length;
      });

      // Rough estimate of localStorage limit (5MB in most browsers)
      const available = 5 * 1024 * 1024;
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch (error) {
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}

export const storageService = new StorageService();
