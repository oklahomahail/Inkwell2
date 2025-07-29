// src/utils/backupUtils.ts
import CryptoJS from 'crypto-js'; // npm install crypto-js @types/crypto-js

export interface StorageInfo {
  used: number;
  available: number;
  percentage: number;
  nearLimit: boolean;
}

export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Calculate secure checksum using SHA-256
 */
export function calculateSecureChecksum(data: any): string {
  try {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    return CryptoJS.SHA256(jsonString).toString();
  } catch (error) {
    console.error('Failed to calculate checksum:', error);
    return '';
  }
}

/**
 * Calculate lightweight checksum (faster, less secure)
 */
export function calculateLightChecksum(data: any): string {
  try {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  } catch (error) {
    console.error('Failed to calculate light checksum:', error);
    return '';
  }
}

/**
 * Calculate size of data in bytes
 */
export function calculateDataSize(data: any): number {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch (error) {
    return 0;
  }
}

/**
 * Format bytes to human-readable format
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Check available storage and usage
 */
export async function checkStorageInfo(): Promise<StorageInfo> {
  try {
    // Try navigator.storage.estimate first (modern browsers)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const available = estimate.quota || 0;
      const percentage = available > 0 ? Math.round((used / available) * 100) : 0;
      
      return {
        used,
        available,
        percentage,
        nearLimit: percentage > 85
      };
    }
    
    // Fallback: estimate localStorage usage
    let localStorageSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        localStorageSize += localStorage.getItem(key)?.length || 0;
      }
    }
    
    // Rough estimate: most browsers allow 5-10MB for localStorage
    const estimatedQuota = 5 * 1024 * 1024; // 5MB
    const percentage = Math.round((localStorageSize / estimatedQuota) * 100);
    
    return {
      used: localStorageSize,
      available: estimatedQuota,
      percentage,
      nearLimit: percentage > 85
    };
  } catch (error) {
    console.error('Failed to check storage info:', error);
    return { used: 0, available: 0, percentage: 0, nearLimit: false };
  }
}

/**
 * Validate backup data structure and integrity
 */
export function validateBackupData(backup: any, useSecureChecksum = false): BackupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Basic structure validation
    if (!backup || typeof backup !== 'object') {
      errors.push('Invalid backup format');
      return { isValid: false, errors, warnings };
    }

    if (!backup.metadata) errors.push('Missing metadata');
    if (!backup.version) errors.push('Missing version');
    if (!backup.createdAt) errors.push('Missing creation date');

    // Metadata validation
    if (backup.metadata) {
      if (!backup.metadata.id) errors.push('Missing backup ID');
      if (!backup.metadata.timestamp) errors.push('Missing timestamp');
      if (typeof backup.metadata.size !== 'number') errors.push('Invalid size field');
      if (!backup.metadata.checksum) errors.push('Missing checksum');
    }

    // Data structure validation
    if (backup.documents && !Array.isArray(backup.documents)) {
      errors.push('Documents must be an array');
    }
    if (backup.sessions && !Array.isArray(backup.sessions)) {
      errors.push('Sessions must be an array');
    }
    if (backup.goals && !Array.isArray(backup.goals)) {
      errors.push('Goals must be an array');
    }

    // Checksum verification
    if (backup.metadata?.checksum && errors.length === 0) {
      const dataToVerify = {
        documents: backup.documents,
        sessions: backup.sessions,
        goals: backup.goals,
        settings: backup.settings,
        version: backup.version,
        createdAt: backup.createdAt,
      };

      const expectedChecksum = useSecureChecksum 
        ? calculateSecureChecksum(dataToVerify)
        : calculateLightChecksum(dataToVerify);

      if (expectedChecksum !== backup.metadata.checksum) {
        errors.push('Checksum verification failed - backup may be corrupted');
      }
    }

    // Size validation
    if (backup.metadata?.size) {
      const actualSize = calculateDataSize(backup);
      const sizeDifference = Math.abs(actualSize - backup.metadata.size);
      
      if (sizeDifference > actualSize * 0.1) { // 10% tolerance
        warnings.push('Backup size differs significantly from metadata');
      }
    }

    // Age warnings
    if (backup.metadata?.timestamp) {
      const age = Date.now() - new Date(backup.metadata.timestamp).getTime();
      const daysOld = age / (1000 * 60 * 60 * 24);
      
      if (daysOld > 30) {
        warnings.push(`Backup is ${Math.round(daysOld)} days old`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  } catch (error) {
    return { 
      isValid: false, 
      errors: ['Validation process failed'], 
      warnings: [] 
    };
  }
}

/**
 * Compress backup data (simple JSON compression)
 */
export function compressBackupData(data: any): string {
  try {
    // Simple compression: remove unnecessary whitespace and sort keys
    return JSON.stringify(data, Object.keys(data).sort());
  } catch (error) {
    console.error('Failed to compress backup data:', error);
    return JSON.stringify(data);
  }
}

/**
 * Create differential backup (only changes since last backup)
 */
export function createDifferentialBackup(
  currentData: any, 
  lastBackupData: any
): { isDifferential: boolean; changes: any; size: number } {
  try {
    // This is a simplified diff - in production, you might use a library like 'deep-diff'
    const changes: any = {};
    let hasChanges = false;

    // Compare documents
    if (currentData.documents && lastBackupData.documents) {
      const newDocs = currentData.documents.filter((doc: any) => 
        !lastBackupData.documents.some((oldDoc: any) => 
          oldDoc.id === doc.id && oldDoc.content === doc.content
        )
      );
      
      if (newDocs.length > 0) {
        changes.documents = newDocs;
        hasChanges = true;
      }
    } else if (currentData.documents) {
      changes.documents = currentData.documents;
      hasChanges = true;
    }

    // Compare sessions (always include recent sessions)
    if (currentData.sessions) {
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
      const recentSessions = currentData.sessions.filter((session: any) => 
        new Date(session.date).getTime() > cutoffTime
      );
      
      if (recentSessions.length > 0) {
        changes.sessions = recentSessions;
        hasChanges = true;
      }
    }

    // Include goals and settings if they exist
    if (currentData.goals) {
      changes.goals = currentData.goals;
    }
    if (currentData.settings) {
      changes.settings = currentData.settings;
    }

    return {
      isDifferential: hasChanges,
      changes: hasChanges ? changes : currentData,
      size: calculateDataSize(hasChanges ? changes : currentData)
    };
  } catch (error) {
    console.error('Failed to create differential backup:', error);
    return {
      isDifferential: false,
      changes: currentData,
      size: calculateDataSize(currentData)
    };
  }
}

/**
 * Generate backup filename with timestamp
 */
export function generateBackupFilename(
  projectName?: string, 
  backupType?: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const project = projectName ? `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_` : '';
  const type = backupType ? `_${backupType}` : '';
  
  return `${project}backup${type}_${timestamp}.json`;
}

/**
 * Estimate backup completion time based on size
 */
export function estimateBackupTime(sizeInBytes: number): { seconds: number; description: string } {
  // Rough estimates based on localStorage write speeds
  const bytesPerSecond = 50000; // ~50KB/s average for localStorage operations
  const seconds = Math.ceil(sizeInBytes / bytesPerSecond);
  
  let description = '';
  if (seconds < 1) description = 'Less than a second';
  else if (seconds < 60) description = `About ${seconds} second${seconds !== 1 ? 's' : ''}`;
  else description = `About ${Math.ceil(seconds / 60)} minute${Math.ceil(seconds / 60) !== 1 ? 's' : ''}`;
  
  return { seconds, description };
}

/**
 * Clean up corrupted or invalid backup entries
 */
export function cleanupCorruptedBackups(backups: Record<string, any>): {
  cleaned: Record<string, any>;
  removedCount: number;
  errors: string[];
} {
  const cleaned: Record<string, any> = {};
  const errors: string[] = [];
  let removedCount = 0;

  for (const [id, backup] of Object.entries(backups)) {
    try {
      const validation = validateBackupData(backup);
      
      if (validation.isValid) {
        cleaned[id] = backup;
      } else {
        removedCount++;
        errors.push(`Removed corrupted backup ${id}: ${validation.errors.join(', ')}`);
      }
    } catch (error) {
      removedCount++;
      errors.push(`Removed invalid backup ${id}: parsing failed`);
    }
  }

  return { cleaned, removedCount, errors };
}

/**
 * Create backup metadata with all required fields
 */
export function createBackupMetadata(
  data: any,
  type: 'manual' | 'auto' | 'emergency',
  description?: string,
  useSecureChecksum = false
): any {
  const size = calculateDataSize(data);
  const checksum = useSecureChecksum 
    ? calculateSecureChecksum(data) 
    : calculateLightChecksum(data);

  return {
    id: generateBackupId(),
    timestamp: new Date(),
    version: '1.0',
    size,
    type,
    description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} backup`,
    checksum,
    isCorrupted: false,
    restoreCount: 0,
    useSecureChecksum
  };
}

/**
 * Generate unique backup ID
 */
function generateBackupId(): string {
  return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if storage is near capacity and suggest cleanup
 */
export async function getStorageRecommendations(): Promise<{
  needsCleanup: boolean;
  recommendations: string[];
  storageInfo: StorageInfo;
}> {
  const storageInfo = await checkStorageInfo();
  const recommendations: string[] = [];
  let needsCleanup = false;

  if (storageInfo.percentage > 90) {
    needsCleanup = true;
    recommendations.push('Critical: Storage almost full. Export and delete old backups immediately.');
  } else if (storageInfo.percentage > 75) {
    needsCleanup = true;
    recommendations.push('Warning: Storage is getting full. Consider exporting old backups.');
  }

  if (storageInfo.percentage > 60) {
    recommendations.push('Enable backup compression to save space.');
    recommendations.push('Reduce the number of backups to keep.');
  }

  if (storageInfo.nearLimit) {
    recommendations.push('Consider using differential backups to reduce size.');
  }

  return { needsCleanup, recommendations, storageInfo };
}