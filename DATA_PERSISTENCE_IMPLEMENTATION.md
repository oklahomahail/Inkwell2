# User-Defined Data Persistence Implementation

## Overview

Inkwell now supports **user-defined data persistence**, giving users complete control over where and how their writing data is stored. This feature enhances trust, control, and flexibility while maintaining a local-first architecture.

## Features

### Persistence Modes

Users can choose from three persistence modes:

#### 1. **Local Only** 🔒

- All data stored exclusively on the user's device
- Uses IndexedDB and LocalStorage
- Complete privacy - data never leaves the device
- Works offline
- No account required
- ⚠️ Data may be lost if browser cache is cleared

**Best for:**

- Privacy-conscious users
- Offline-only workflows
- Testing and experimentation
- Users who don't want cloud services

#### 2. **Cloud Sync** ☁️

- Data synchronized to Supabase cloud storage
- Local cache for offline access
- Access from multiple devices
- Automatic backups
- Real-time collaboration (future)
- Requires authentication

**Best for:**

- Multi-device access
- Automatic backup needs
- Collaboration
- Users who prioritize accessibility

#### 3. **Hybrid** 🔄 (Recommended)

- Local-first with optional cloud backups
- Works offline immediately
- Cloud backups for safety
- User controls backup frequency
- Best of both worlds

**Best for:**

- Most users
- Balance of privacy and safety
- Flexibility
- Controlled cloud usage

## Architecture

### Service Layer

**`userPersistenceService.ts`**

- Central service managing persistence preferences
- Handles mode switching and migrations
- Tracks sync/backup status
- Publishes events for UI updates

**Key Methods:**

```typescript
getSettings() → PersistenceSettings
updateSettings(updates) → Promise<void>
setMode(mode) → Promise<void>
getStatus() → Promise<PersistenceStatus>
getCapabilities() → Promise<PersistenceCapabilities>
triggerSync() → Promise<void>
triggerBackup() → Promise<void>
```

### React Integration

**`useUserPersistence()` Hook**

```typescript
const {
  settings, // Current settings
  status, // Sync/storage status
  capabilities, // Device capabilities
  loading, // Loading state
  error, // Error state
  updateSettings, // Update settings
  setMode, // Change mode
  triggerSync, // Manual sync
  triggerBackup, // Manual backup
} = useUserPersistence();
```

### UI Components

#### `PersistenceModeSelector`

- Visual mode selection
- Shows benefits/limitations of each mode
- Indicates availability based on device capabilities
- Recommends best mode for user's situation

#### `PersistenceAdvancedSettings`

- Fine-grained control over sync intervals
- Backup frequency configuration
- Manual sync/backup triggers
- Storage usage display
- Encryption settings (coming soon)

#### `DataPersistenceSettingsPage`

- Complete settings page
- Current status dashboard
- Mode selector
- Advanced settings
- Privacy information
- System information

## User Experience Flow

### First-Time User

1. **Default:** Local Only mode
2. **Onboarding:** Prompt to choose persistence mode
3. **Recommendation:** Hybrid mode (if cloud available)
4. **Setup:** Guide through authentication if needed

### Mode Switching

1. User selects new mode
2. System checks capabilities
3. Validation and warnings if applicable
4. Migration process (if data exists)
5. Confirmation and success feedback

### Migration

When switching modes, the system:

- **Local → Cloud:** Uploads all local data to cloud
- **Cloud → Local:** Downloads all cloud data locally
- **To/From Hybrid:** Adjusts sync/backup settings

All migrations:

- Show progress
- Are cancellable
- Provide rollback on error
- Preserve data integrity

## Technical Details

### Storage Capabilities Detection

```typescript
interface PersistenceCapabilities {
  supportsLocalOnly: boolean; // IndexedDB or LocalStorage available
  supportsCloudSync: boolean; // Cloud accessible + authenticated
  supportsHybrid: boolean; // Both local and cloud available
  hasIndexedDB: boolean; // IndexedDB API available
  hasLocalStorage: boolean; // LocalStorage available
  localQuota: number | null; // Estimated storage quota
  isPrivateMode: boolean; // Private/incognito detected
  isPersistent: boolean; // Storage persistence granted
  cloudAuthAvailable: boolean; // Supabase configured
  cloudAccessible: boolean; // Cloud reachable
}
```

### Settings Structure

```typescript
interface PersistenceSettings {
  mode: 'local-only' | 'cloud-sync' | 'hybrid';
  autoSync: boolean;
  syncInterval: number; // milliseconds
  lastSyncAt: number | null;
  cloudBackupEnabled: boolean;
  backupInterval: number; // milliseconds
  lastBackupAt: number | null;
  exportPreference: 'local' | 'cloud' | 'both';
  localEncryption: boolean; // future
  cloudEncryption: boolean; // future
}
```

### Status Tracking

```typescript
interface PersistenceStatus {
  mode: PersistenceMode;
  isSyncing: boolean;
  lastSyncStatus: 'success' | 'error' | 'pending' | null;
  lastSyncError: string | null;
  localStorageUsed: number;
  localStorageAvailable: number;
  cloudStorageUsed: number | null;
  cloudStorageAvailable: number | null;
  pendingSyncItems: number;
  isCloudConnected: boolean;
  isAuthenticated: boolean;
}
```

## Integration Points

### App Context

Add persistence status to global app state:

```typescript
import { userPersistenceService } from '@/services/userPersistenceService';

// In AppProvider
const persistenceSettings = userPersistenceService.getSettings();
```

### Settings Page

Add to main settings navigation:

```typescript
import { DataPersistenceSettingsPage } from '@/components/Settings/DataPersistenceSettingsPage';

// In settings routes
{
  path: '/settings/data-persistence',
  component: DataPersistenceSettingsPage,
  label: 'Data & Persistence',
  icon: <HardDrive />
}
```

### Storage Services

Update existing storage services to respect persistence mode:

```typescript
// In enhancedStorageService.ts
const mode = userPersistenceService.getMode();

if (mode === 'cloud-sync') {
  // Prioritize cloud operations
} else if (mode === 'local-only') {
  // Only local operations
} else if (mode === 'hybrid') {
  // Local operations with background cloud backup
}
```

## Security & Privacy

### Data Protection

- **Local Only:** No network transmission
- **Cloud Sync:** HTTPS encryption in transit
- **All Modes:** Supabase RLS for access control

### Future Enhancements

- [ ] End-to-end encryption option
- [ ] Zero-knowledge architecture
- [ ] Client-side encryption keys
- [ ] Encrypted local storage
- [ ] Encrypted cloud backups

## Testing

### Test Scenarios

1. **Mode switching**
   - Local → Cloud
   - Cloud → Local
   - Local → Hybrid
   - Hybrid → Cloud

2. **Offline handling**
   - Sync queue when offline
   - Resume sync when back online
   - Conflict resolution

3. **Error handling**
   - Network failures
   - Authentication failures
   - Quota exceeded
   - Migration failures

4. **Private mode**
   - Detection
   - Warnings
   - Fallback behavior

### Manual Testing Checklist

- [ ] Select Local Only mode
- [ ] Create project in Local Only mode
- [ ] Switch to Cloud Sync
- [ ] Verify data migrated to cloud
- [ ] Switch to Hybrid
- [ ] Configure backup settings
- [ ] Trigger manual sync
- [ ] Trigger manual backup
- [ ] Test offline behavior
- [ ] Test private mode warning

## Future Enhancements

### Phase 2: Advanced Sync

- [ ] Conflict resolution UI
- [ ] Selective sync (choose what to sync)
- [ ] Bandwidth throttling
- [ ] Delta sync (only changes)
- [ ] Compression

### Phase 3: Collaboration

- [ ] Real-time sync
- [ ] Multiplayer editing
- [ ] Share projects
- [ ] Permission management

### Phase 4: Self-Hosted

- [ ] Custom server URL
- [ ] Self-hosted Supabase
- [ ] Alternative backends (Firebase, etc.)
- [ ] Custom S3 storage

## Deployment

### Environment Variables

```env
# Cloud Sync
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENABLE_SUPABASE_SYNC=true

# Default Mode
VITE_DEFAULT_PERSISTENCE_MODE=hybrid  # local-only | cloud-sync | hybrid
```

### Database Migrations

Ensure Supabase tables exist:

- `projects`
- `chapters`
- `characters`
- `notes`

With RLS policies for user isolation.

## Documentation for Users

### Help Articles

1. **"Choosing Your Data Storage Mode"**
   - Explains each mode
   - Decision guide
   - Use cases

2. **"Switching Between Storage Modes"**
   - How to switch
   - What happens to data
   - Migration process

3. **"Data Safety and Backups"**
   - Backup strategies
   - Export options
   - Recovery procedures

4. **"Privacy and Security"**
   - What data is stored where
   - Encryption status
   - Privacy guarantees

### In-App Tips

- First-time setup wizard
- Mode recommendation based on device
- Private mode detection notice
- Storage quota warnings
- Sync failure notifications

## Success Metrics

- **Adoption:** % of users who choose each mode
- **Satisfaction:** User feedback on persistence
- **Reliability:** Sync success rate
- **Performance:** Sync/backup speed
- **Trust:** User confidence in data safety

## Summary

This implementation gives users:

✅ **Control** - Choose where data lives
✅ **Flexibility** - Switch modes anytime
✅ **Safety** - Backups and sync options
✅ **Privacy** - Local-only option
✅ **Trust** - Transparent data handling
✅ **Portability** - Export anytime

All while maintaining Inkwell's local-first architecture and excellent offline performance.
