# Storage Services Developer Guide

> **Multi-profile data isolation, IndexedDB persistence, and robust backup systems for Inkwell.**

## Overview

The Inkwell Storage System provides comprehensive data persistence with complete profile isolation, automatic migrations, and robust backup/recovery capabilities. The system is designed for scalability, data integrity, and seamless multi-user workspace management.

## Architecture

```
Storage System
├── 🏭 dbFactory.ts              # Profile-specific database factory
├── 💾 storageService.ts         # Core data persistence layer
├── 🔄 migrateToProfiles.ts      # Legacy data migration utilities
├── 🛡️ backupService.ts         # Backup and recovery system
├── 📁 profileStorage.ts         # Profile-aware storage wrapper
└── 🔍 searchService.ts          # Full-text search with indexing
```

## Core Storage Services

### 🏭 Database Factory

**Location**: `src/data/dbFactory.ts`

Creates profile-isolated database instances with automatic schema management.

```typescript
import { dbFactory } from '@/data/dbFactory';

// Get database for specific profile
const db = await dbFactory.getDatabase('profile-123');

// Save project data
await db.saveProject({
  id: 'project-1',
  name: 'My Story',
  content: 'Once upon a time...',
});

// Load projects for this profile
const projects = await db.loadProjects();
```

**Key Features:**

- **Profile Isolation**: Each profile gets completely separate data
- **Automatic Schema**: Database schema created on first access
- **Migration Support**: Seamless upgrades between schema versions
- **Connection Pooling**: Efficient database connection management

### 💾 Storage Service

**Location**: `src/services/storageService.ts`

Core data persistence layer with IndexedDB and localStorage fallbacks.

```typescript
import { storageService } from '@/services/storageService';

// Profile-aware storage
const profileStorage = storageService.forProfile('profile-123');

// Save data with automatic serialization
await profileStorage.setItem('user-preferences', {
  theme: 'dark',
  fontSize: 16,
});

// Load with type safety
const preferences = await profileStorage.getItem('user-preferences');

// Bulk operations
await profileStorage.setBulk({
  'setting-1': 'value1',
  'setting-2': 'value2',
});

// Clear profile data (careful!)
await profileStorage.clear();
```

**Storage Hierarchy:**

1. **IndexedDB**: Primary storage for large datasets
2. **localStorage**: Fallback for simple key-value data
3. **Memory**: Session-only cache for performance

### 🔄 Profile Migration

**Location**: `src/data/migrateToProfiles.ts`

Handles migration from single-user to multi-profile data structure.

```typescript
import { migrateToProfiles } from '@/data/migrateToProfiles';

// Check if migration is needed
if (await migrateToProfiles.needsMigration()) {
  console.log('Legacy data found, migrating...');

  // Perform migration to first profile
  const result = await migrateToProfiles.migrate('first-profile-id');

  if (result.success) {
    console.log(`Migrated ${result.itemCount} items`);
  } else {
    console.error('Migration failed:', result.error);
  }
}

// Get migration status
const status = await migrateToProfiles.getStatus();
console.log('Migration status:', status);
```

**Migration Process:**

1. **Detection**: Automatically detect legacy data format
2. **Backup**: Create backup before migration
3. **Transform**: Convert data to profile-specific keys
4. **Validation**: Verify migration integrity
5. **Cleanup**: Remove legacy keys after successful migration

### 🛡️ Backup Service

**Location**: `src/services/backupService.ts`

Comprehensive backup and recovery system with versioning.

```typescript
import { backupService } from '@/services/backupService';

// Create full backup
const backup = await backupService.createFullBackup('profile-123');
console.log(`Backup created: ${backup.id} (${backup.sizeKB} KB)`);

// Create incremental backup
const incrementalBackup = await backupService.createIncrementalBackup('profile-123');

// List available backups
const backups = await backupService.listBackups('profile-123');

// Restore from backup
await backupService.restoreFromBackup('profile-123', backup.id);

// Export backup to file
const exportData = await backupService.exportBackup(backup.id);
downloadFile('inkwell-backup.json', exportData);

// Import backup from file
const imported = await backupService.importBackup(fileData, 'profile-123');
```

**Backup Features:**

- **Full Backups**: Complete profile data snapshot
- **Incremental Backups**: Only changed data since last backup
- **Versioning**: Multiple backup versions with automatic cleanup
- **Export/Import**: Portable backup files for data portability
- **Validation**: Backup integrity checking

### 🔍 Search Service

**Location**: `src/services/searchService.ts`

Full-text search with automatic indexing and profile isolation.

```typescript
import { searchService } from '@/services/searchService';

// Initialize search for a project
await searchService.initializeProject('project-123');

// Search across all content
const results = await searchService.search('magical forest', {
  limit: 10,
  types: ['scene', 'character'],
  minScore: 0.5,
});

// Update document in search index
await searchService.updateDocument('scene-1', {
  title: 'The Enchanted Forest',
  content: 'Deep in the magical forest...',
});

// Get search performance metrics
const stats = searchService.getSearchStats();
console.log(`${stats.totalQueries} searches, avg ${stats.avgResponseTime}ms`);
```

**Search Features:**

- **Full-Text Indexing**: Automatic indexing of all content
- **Fuzzy Search**: Typo-tolerant search with scoring
- **Type Filtering**: Search specific content types
- **Performance Tracking**: Query performance monitoring
- **Profile Isolation**: Search index per profile

## Data Structure

### Profile Storage Keys

All data is prefixed with profile ID for complete isolation:

```
profile_{profileId}_projects          # Project metadata and content
profile_{profileId}_settings          # User preferences and settings
profile_{profileId}_search_index      # Search index data
profile_{profileId}_backup_metadata   # Backup tracking
profile_{profileId}_tutorial_progress # Tutorial and onboarding state
```

### Project Data Schema

```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  chapters: Chapter[];
  characters: Character[];
  beatSheet: BeatSheetItem[];
  tags: string[];
  genre?: string;
  wordCount?: number;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  scenes: Scene[];
}
```

## Development Workflow

### 1. Setting Up Storage

```bash
# Clone and install dependencies
git clone https://github.com/oklahomahail/Inkwell2
cd Inkwell2
pnpm install

# Storage works out-of-the-box with IndexedDB
pnpm dev
```

### 2. Working with Profile Data

```typescript
// Always use profile-aware storage
const profileId = 'current-profile-id';
const db = await dbFactory.getDatabase(profileId);

// Save project data
const project = {
  id: generateId(),
  name: 'New Story',
  content: 'Chapter 1...',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

await db.saveProject(project);

// Load and modify
const loaded = await db.loadProject(project.id);
loaded.content += '\nChapter 2...';
loaded.updatedAt = Date.now();
await db.saveProject(loaded);
```

### 3. Implementing New Data Types

1. **Define Schema**: Add TypeScript interfaces
2. **Extend Database**: Add methods to `dbFactory.ts`
3. **Add Storage Keys**: Define profile-prefixed keys
4. **Update Migrations**: Handle data format changes
5. **Add Search Support**: Extend search indexing if needed

```typescript
// Example: Adding a new "Notes" data type
interface Note {
  id: string;
  title: string;
  content: string;
  projectId?: string;
  tags: string[];
  createdAt: number;
}

// Add to database factory
class ProfileDatabase {
  async saveNote(note: Note): Promise<void> {
    const key = `profile_${this.profileId}_note_${note.id}`;
    await this.storage.setItem(key, note);
  }

  async loadNotes(): Promise<Note[]> {
    const prefix = `profile_${this.profileId}_note_`;
    return await this.storage.getItemsByPrefix(prefix);
  }
}
```

### 4. Testing Storage Systems

```typescript
// Test profile isolation
describe('Profile Storage', () => {
  it('should isolate data between profiles', async () => {
    const db1 = await dbFactory.getDatabase('profile-1');
    const db2 = await dbFactory.getDatabase('profile-2');

    await db1.saveProject({ id: 'test', name: 'Project 1' });
    await db2.saveProject({ id: 'test', name: 'Project 2' });

    const projects1 = await db1.loadProjects();
    const projects2 = await db2.loadProjects();

    expect(projects1[0].name).toBe('Project 1');
    expect(projects2[0].name).toBe('Project 2');
  });
});

// Test migration
describe('Profile Migration', () => {
  it('should migrate legacy data', async () => {
    // Set up legacy data
    localStorage.setItem('projects', JSON.stringify([{ id: '1', name: 'Legacy Project' }]));

    // Run migration
    const result = await migrateToProfiles.migrate('new-profile');

    expect(result.success).toBe(true);
    expect(result.itemCount).toBeGreaterThan(0);
  });
});
```

## Performance Optimization

### Caching Strategy

```typescript
// Implement intelligent caching
class CachedStorage {
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();

  async getItem(key: string, ttl = 5000) {
    // Check cache first
    if (this.cache.has(key) && Date.now() < this.cacheExpiry.get(key)!) {
      return this.cache.get(key);
    }

    // Load from storage
    const value = await this.storage.getItem(key);

    // Cache with TTL
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + ttl);

    return value;
  }
}
```

### Batch Operations

```typescript
// Batch multiple operations for better performance
class BatchedStorage {
  private batch: Array<{ key: string; value: any }> = [];

  queueSet(key: string, value: any) {
    this.batch.push({ key, value });
  }

  async flushBatch() {
    if (this.batch.length === 0) return;

    // Use IndexedDB transaction for atomic batch
    const transaction = this.db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');

    for (const { key, value } of this.batch) {
      store.put({ key, value });
    }

    await transaction.complete;
    this.batch = [];
  }
}
```

## Data Integrity

### Validation

```typescript
// Validate data before storage
import { z } from 'zod';

const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  content: z.string(),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
});

async function saveProject(project: unknown) {
  // Validate before saving
  const validated = ProjectSchema.parse(project);
  await db.saveProject(validated);
}
```

### Backup Verification

```typescript
// Verify backup integrity
async function verifyBackup(backupId: string) {
  const backup = await backupService.getBackup(backupId);

  // Check data consistency
  for (const project of backup.projects) {
    ProjectSchema.parse(project); // Throws if invalid
  }

  // Verify relationships
  for (const chapter of backup.chapters) {
    const projectExists = backup.projects.some((p) => p.id === chapter.projectId);
    if (!projectExists) {
      throw new Error(`Orphaned chapter: ${chapter.id}`);
    }
  }
}
```

## Error Handling

### Storage Failures

```typescript
// Robust error handling for storage operations
async function safeStorageOperation<T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('Storage operation failed:', error);

    if (fallback) {
      console.log('Attempting fallback...');
      return await fallback();
    }

    throw new Error('Storage operation failed and no fallback available');
  }
}

// Usage
const projects = await safeStorageOperation(
  () => db.loadProjects(),
  () => loadProjectsFromLocalStorage(), // Fallback
);
```

### Data Recovery

```typescript
// Automatic data recovery
class DataRecoveryService {
  async recoverCorruptedData(profileId: string) {
    console.log('Starting data recovery...');

    // Try to recover from most recent backup
    const backups = await backupService.listBackups(profileId);
    if (backups.length > 0) {
      const latest = backups[0];
      await backupService.restoreFromBackup(profileId, latest.id);
      return { success: true, method: 'backup_restore' };
    }

    // Try to recover from localStorage fallback
    const fallbackData = await this.loadFromLocalStorage(profileId);
    if (fallbackData) {
      await this.restoreFromFallback(fallbackData);
      return { success: true, method: 'localStorage_recovery' };
    }

    return { success: false, method: 'no_recovery_available' };
  }
}
```

## Troubleshooting

### Common Issues

**Storage Quota Exceeded**

```typescript
// Monitor and manage storage quota
async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usedMB = (estimate.usage || 0) / (1024 * 1024);
    const quotaMB = (estimate.quota || 0) / (1024 * 1024);

    if (usedMB / quotaMB > 0.8) {
      console.warn('Storage quota nearly full, consider cleanup');
      await cleanupOldBackups();
    }
  }
}
```

**Profile Data Corruption**

```typescript
// Detect and handle data corruption
async function validateProfileData(profileId: string) {
  try {
    const projects = await db.loadProjects();

    // Validate each project
    for (const project of projects) {
      ProjectSchema.parse(project);
    }

    return { valid: true };
  } catch (error) {
    console.error('Data corruption detected:', error);

    // Attempt recovery
    const recovery = await dataRecoveryService.recoverCorruptedData(profileId);
    return { valid: false, recovered: recovery.success };
  }
}
```

**Migration Failures**

```typescript
// Handle migration failures gracefully
async function safeMigration(profileId: string) {
  // Create backup before migration
  const backupId = await backupService.createBackup(profileId, 'pre-migration');

  try {
    await migrateToProfiles.migrate(profileId);
  } catch (error) {
    console.error('Migration failed, restoring backup:', error);
    await backupService.restoreFromBackup(profileId, backupId);
    throw error;
  }
}
```

This comprehensive storage system ensures reliable, scalable, and maintainable data persistence for Inkwell's multi-profile architecture.
