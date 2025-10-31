# Data Persistence Layer - Quick Start Guide

## What Was Implemented

A complete, production-ready data persistence system that:

- ✅ Eliminates "storage not persistent" browser warnings
- ✅ Provides real-time storage health monitoring
- ✅ Shows non-intrusive error notifications
- ✅ Enables manual cloud sync (foundation for auto-sync)
- ✅ Offers emergency cleanup when storage is low

## For Users

### Storage Status Indicator (Footer)

Look at the bottom-right of the screen. You'll see a badge showing:

- **"Persisted ✓ 10%"** (green) - Storage is safe, 10% used
- **"Persisted ⚠ 85%"** (yellow) - Storage getting full
- **"Temporary ⚠ 96%"** (red) - Storage critical or not persistent

Click the badge to see:

- Detailed quota usage with progress bar
- Available storage features (IndexedDB, localStorage, persistence)
- Errors and warnings
- **"Request Persistent Storage"** button (if not granted)
- **"Free Up Space"** button (if storage is low)

### Error Notifications

When something fails (save error, quota exceeded, sync failure):

- Non-intrusive toast appears in bottom-right corner
- Shows clear error message
- Lists 2-3 suggested actions
- Auto-dismisses after 10 seconds (for recoverable errors)
- Can be manually dismissed anytime

### What Happens Automatically

On first app load:

1. App requests persistent storage from browser
2. Storage health check runs
3. If granted: Footer shows "Persisted ✓"
4. If denied: Footer shows "Temporary ⚠" with option to retry

Every 5 minutes:

- Storage health is re-checked
- Quota usage is updated
- Status badge updates if needed

## For Developers

### Quick Integration

The persistence layer is already integrated! Just use the existing storage services:

```typescript
// Use quota-aware storage for saves
import { quotaAwareStorage } from '@/utils/quotaAwareStorage';

const result = await quotaAwareStorage.safeSetItem('key', data);
if (!result.success) {
  // Error already logged and user notified
  console.error('Save failed:', result.error);
}

// Check storage health anytime
import { storageManager } from '@/services/storageManager';

const health = await storageManager.getHealthStatus();
console.log('Health score:', health.healthScore); // 0-100
console.log('Persistent:', health.isPersistent);
console.log('Quota:', health.quota?.percentUsed);
```

### Manual Cloud Sync

```typescript
import { supabaseSyncService } from '@/services/supabaseSync';

// Check if user is authenticated
const isAuthed = await supabaseSyncService.isAuthenticated();

// Push to cloud
if (isAuthed) {
  const result = await supabaseSyncService.pushToCloud({
    projects: myProjects,
    chapters: myChapters,
    characters: myCharacters,
  });

  console.log('Synced:', result.itemsProcessed);
  console.log('Errors:', result.errors);
}

// Pull from cloud
const data = await supabaseSyncService.pullFromCloud();
console.log('Downloaded:', data.projects.length, 'projects');
```

### Logging Storage Errors

```typescript
import { storageErrorLogger } from '@/services/storageErrorLogger';

try {
  await saveMyData();
} catch (error) {
  // Log the error - user will see toast notification
  storageErrorLogger.logSaveFailure('my_data_key', error);
}

// Or log custom errors
storageErrorLogger.logError({
  type: 'save',
  severity: 'error',
  message: 'Failed to save project',
  canRecover: true,
  suggestedActions: ['Try again', 'Export as backup'],
});
```

### Listen to Storage Events

```typescript
// Listen to health changes
const unsubscribe = storageManager.onHealthUpdate((status) => {
  if (status.quota?.isCritical) {
    alert('Storage critically low!');
  }
});

// Listen to storage errors
storageErrorLogger.onError((entry) => {
  if (entry.event.severity === 'critical') {
    // Send to analytics, etc.
  }
});

// Cleanup
unsubscribe();
```

## New Files Created

### Services

- `src/services/storageManager.ts` - Core persistence manager
- `src/services/supabaseSync.ts` - Cloud sync service
- `src/services/storageErrorLogger.ts` - Error logging

### Components

- `src/components/Storage/StorageStatusIndicator.tsx` - Status UI
- `src/components/Storage/StorageErrorToast.tsx` - Error notifications

### Tests

- `src/services/__tests__/storageManager.test.ts` - Unit tests

### Documentation

- `DATA_PERSISTENCE_IMPLEMENTATION_SUMMARY.md` - Full details
- `DATA_PERSISTENCE_QUICKSTART.md` - This file

## Testing in Development

### 1. Test Persistence Request

1. Open app in incognito/private mode
2. Check footer - should show "Temporary ⚠"
3. Click badge → "Request Persistent Storage"
4. Browser may show permission prompt
5. After granting (or denying), badge updates

### 2. Test Quota Warnings

```javascript
// In browser console:
const { storageManager } = await import('./src/services/storageManager');
const status = await storageManager.getHealthStatus();
console.log('Current usage:', status.quota?.percentUsed);
```

### 3. Test Error Notifications

```javascript
// In browser console:
const { storageErrorLogger } = await import('./src/services/storageErrorLogger');

storageErrorLogger.logError({
  type: 'save',
  severity: 'error',
  message: 'Test error notification',
  canRecover: true,
  suggestedActions: ['Action 1', 'Action 2'],
});

// Toast should appear in bottom-right
```

### 4. Test Cloud Sync

1. Ensure you're signed in
2. Open browser console:

```javascript
const { supabaseSyncService } = await import('./src/services/supabaseSync');

// Check authentication
await supabaseSyncService.isAuthenticated(); // true

// Get current status
await supabaseSyncService.getStatus();
```

## Production Deployment

### Environment Variables

```bash
# .env.production
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ENABLE_CLOUD_SYNC=true
```

### Feature Flags

No additional configuration needed. The system:

- Automatically requests persistence on boot
- Only shows cloud sync options if user is authenticated
- Gracefully degrades if browser doesn't support features

### Monitoring

Check these metrics in production:

1. **Persistence Grant Rate**: How many users get persistent storage?
2. **Health Scores**: Distribution of health scores (0-100)
3. **Error Rates**: Which storage errors are most common?
4. **Quota Usage**: Average usage percentage

Access via:

```javascript
// In browser console on production site
const { storageManager, storageErrorLogger } = await import('./src/services/storageManager');

// Get health
const health = await storageManager.getHealthStatus();

// Get errors
const errors = storageErrorLogger.getErrorLog();
```

## Common Issues

### "Temporary" Badge Won't Change to "Persisted"

**Cause**: Browser denied persistence or doesn't support API

**Solutions**:

1. Clear browser data and try again
2. Check browser settings (don't clear on exit)
3. Try a different browser
4. Use cloud sync instead of local-only

### Toast Notifications Not Showing

**Check**:

1. `<StorageErrorToast />` is mounted in App.tsx ✓ (already done)
2. Browser console shows errors (should always log)
3. No CSS z-index conflicts (toast is z-50)

### Sync Failing

**Check**:

1. Internet connection
2. User authentication: `await supabaseSyncService.isAuthenticated()`
3. Supabase env variables are set
4. Browser console for detailed error

## Next Steps

### Phase 2 Features (Planned)

- Background auto-sync when online
- Conflict resolution UI
- Sync queue with retry logic
- Offline change tracking

### Phase 3 Features (Future)

- Version history
- Real-time collaborative editing
- Selective sync (choose projects)
- Cloud storage quota management

### Phase 4 Features (Future)

- End-to-end encryption
- Local storage encryption
- Secure key management

## Support

For issues or questions:

1. Check browser console for detailed error logs
2. Review [DATA_PERSISTENCE_IMPLEMENTATION_SUMMARY.md](DATA_PERSISTENCE_IMPLEMENTATION_SUMMARY.md)
3. Create GitHub issue with:
   - Browser + version
   - Error logs from console
   - Health status: `await storageManager.getHealthStatus()`
