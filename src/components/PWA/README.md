# PWA (Progressive Web App) Implementation

Inkwell includes comprehensive PWA functionality for offline-first writing capabilities.

## Features Implemented

### ✅ Core PWA Features

- **Web App Manifest**: Complete manifest with icons, shortcuts, and metadata
- **Service Worker**: Workbox-powered caching with intelligent cache strategies
- **Offline Support**: Write and edit projects even without internet connection
- **Install Prompt**: Native app-like installation on supported devices
- **Update Management**: Automatic updates with user notification and control

### ✅ Caching Strategies

- **Application Shell**: Precache all critical app assets
- **Font Caching**: Cache Google Fonts and web fonts for 1 year
- **API Responses**: Network-first with 24-hour fallback cache
- **Image Assets**: Cache-first with 30-day expiration
- **Static Assets**: Precache JavaScript, CSS, HTML files

### ✅ Offline Functionality

- **Draft Storage**: Save writing drafts locally when offline
- **Sync Queue**: Queue changes for sync when connection returns
- **Storage Management**: Monitor and manage local storage usage
- **Offline Indicator**: Real-time connection status display

## Components

### 1. PWAInstallButton

Provides installation prompts in three variants:

- `button`: Simple install button
- `banner`: Full-width banner with details
- `fab`: Floating action button (default in app)

```tsx
import { PWAInstallButton } from './components/PWA';

// Use as FAB (default)
<PWAInstallButton variant="fab" />

// Use as banner
<PWAInstallButton
  variant="banner"
  onInstall={(success) => console.log('Install:', success)}
/>
```

### 2. PWAUpdateNotification

Displays update notifications when new versions are available:

- Automatic detection of service worker updates
- User-controlled update with reload
- Dismissible notifications

```tsx
import { PWAUpdateNotification } from './components/PWA';

<PWAUpdateNotification position="top" autoShow={true} />;
```

### 3. PWAOfflineIndicator

Shows connection status and sync information:

- `minimal`: Simple online/offline indicator
- `badge`: Compact badge with sync count
- `detailed`: Full status panel with storage info

```tsx
import { PWAOfflineIndicator } from './components/PWA';

// In header (used in MainLayout)
<PWAOfflineIndicator variant="badge" />

// Detailed status panel
<PWAOfflineIndicator variant="detailed" />
```

## Services

### PWAService

Core PWA functionality management:

```tsx
import { pwaService } from './services/pwaService';

// Listen for install prompt
pwaService.onInstallPromptReady((event) => {
  console.log('Can install PWA');
});

// Check offline status
const isOffline = pwaService.getOfflineStatus();

// Install PWA programmatically
await pwaService.installPWA();
```

### OfflineStorageManager

Manages offline data persistence:

```tsx
import { OfflineStorageManager } from './services/pwaService';

// Save draft for offline editing
OfflineStorageManager.saveDraft(projectId, content);

// Add operation to sync queue
OfflineStorageManager.addToSyncQueue({
  type: 'save',
  projectId: 'project-1',
  data: { content: 'Updated content' },
  timestamp: Date.now(),
});

// Get storage usage info
const storageInfo = await OfflineStorageManager.getStorageInfo();
```

### usePWA Hook

React hook for PWA state:

```tsx
import { usePWA } from './services/pwaService';

function MyComponent() {
  const { isOfflineReady, needsRefresh, updateApp, installApp, canInstall, isOffline } = usePWA();

  return (
    <div>
      {needsRefresh && <button onClick={() => updateApp(true)}>Update App</button>}
      {canInstall && <button onClick={installApp}>Install App</button>}
    </div>
  );
}
```

## Configuration

### Vite PWA Plugin

Configured in `vite.config.ts` with:

- Workbox service worker generation
- Runtime caching strategies
- Web app manifest generation
- Development mode support

### Manifest Configuration

Located in `public/manifest.json` with:

- App metadata and branding
- Icon sets for different platforms
- Application shortcuts
- Display modes and theme colors

## Offline Behavior

### Writing Workflow

1. **Online**: Normal operation with immediate sync
2. **Goes Offline**:
   - User sees offline indicator
   - Changes saved to local drafts
   - Operations queued for sync
3. **Back Online**:
   - Sync queue processed automatically
   - Local drafts reconciled with server
   - User notified of successful sync

### Storage Strategy

- **LocalStorage**: User preferences, UI state
- **IndexedDB**: Project data, writing sessions
- **Cache API**: Static assets, API responses
- **Service Worker Cache**: Application shell

## Browser Support

- **Chrome/Edge**: Full PWA support including install
- **Firefox**: Service worker and offline functionality
- **Safari iOS**: Add to Home Screen, limited install UI
- **Safari macOS**: Service worker support (macOS 11.3+)

## Development

### Testing Offline

1. Open DevTools → Application → Service Workers
2. Check "Offline" to simulate offline mode
3. Test writing functionality without network

### Debugging Cache

1. DevTools → Application → Storage
2. View Cache Storage for cached resources
3. Check IndexedDB for app data

### Build Production

```bash
pnpm build
pnpm preview
```

Service worker only active in production builds.

## Future Enhancements

- **Background Sync**: Retry failed syncs automatically
- **Push Notifications**: Writing reminders and updates
- **Share Target**: Accept shared content from other apps
- **Periodic Sync**: Regular backup of local changes
- **Advanced Caching**: ML-powered cache prediction
