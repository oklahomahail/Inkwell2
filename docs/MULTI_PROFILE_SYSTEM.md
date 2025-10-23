# Multi-Profile Workspace System

**Complete multi-user workspace isolation with seamless profile switching**

The Multi-Profile Workspace System enables Inkwell to support multiple isolated workspaces within a single application instance. Each profile maintains completely separate data, preferences, and project collections with zero data leakage between profiles.

## 🎯 Key Features

### 🔐 Complete Data Isolation

- Each profile gets its own isolated database using prefixed storage keys
- Zero data leakage between profiles - projects, settings, and user data are completely separate
- Profile-specific IndexedDB and localStorage with automatic cleanup

### 🌐 Profile-Based URL Routing

- Clean URL structure: `/p/{profileId}/dashboard`, `/p/{profileId}/writing`, etc.
- Deep linking works with profile context - shareable URLs maintain profile state
- Automatic redirects ensure users always have valid profile access

### 🔄 Seamless Profile Switching

- Header-integrated dropdown for quick profile switching
- No data loss during profile switches - navigation state preserved
- Instant profile switching with loading states and error handling

### 🚀 Smart Profile Creation

- Beautiful onboarding flow with profile picker interface
- Customizable profile colors and avatar support
- Intelligent profile management with creation, editing, and deletion

### 📦 Legacy Data Migration

- Automatic migration of existing single-user data to profile-specific storage
- Preserve existing data when introducing profiles to existing installations
- Migration status tracking and error handling

## 🏗️ Architecture

### Core Components

#### ProfileContext (`src/context/ProfileContext.tsx`)

- React Context provider for profile state management
- Actions: `createProfile`, `setActiveProfile`, `updateProfile`, `deleteProfile`
- Persistent storage using localStorage with error handling
- Profile loading states and error management

```typescript
const { profiles, activeProfile, createProfile, setActiveProfile } = useProfileContext();
```

#### ProfileGate (`src/routes/shell/ProfileGate.tsx`)

- Routing guard ensuring valid profile access
- Automatic redirect to profile picker if no valid profile
- Loading states while profile validation occurs
- Error boundary for profile-related routing issues

#### ProfilePicker (`src/routes/shell/ProfilePicker.tsx`)

- Beautiful profile selection and creation interface
- Support for existing profile selection and new profile creation
- Customizable profile colors with preset color palette
- Form validation and error handling

#### ProfileSwitcher (`src/components/ProfileSwitcher.tsx`)

- Header-integrated dropdown component
- Quick profile switching without navigation loss
- Visual profile indicators with colors and avatars
- "Create new profile" and "Manage profiles" actions

### Data Layer

#### Database Factory (`src/data/dbFactory.ts`)

- Profile-specific database instance factory
- Automatic storage adapter creation with profile prefixing
- Hook-based API: `useDB()` returns current profile's database
- Legacy compatibility layer for gradual migration

```typescript
// Get current profile's database
const db = useDB();

// Get specific profile's database
const profileDb = getDbForProfile(profileId);
```

#### Migration System (`src/data/migrateToProfiles.ts`)

- Automatic detection of legacy data that needs migration
- Safe migration with backup preservation
- Dry-run capability for testing migration before execution
- Detailed migration reports with success/failure tracking

```typescript
// Check if migration is needed
const needsMigration = await needsMigration();

// Perform migration
const result = await migrateLegacyToProfile(profile, {
  dryRun: false,
  preserveLegacyData: true,
});
```

## 🎯 URL Structure

### Profile-Based Routes

| Route                     | Purpose                    | Example                  |
| ------------------------- | -------------------------- | ------------------------ |
| `/`                       | Root redirect              | Redirects to `/profiles` |
| `/profiles`               | Profile selection/creation | Profile picker interface |
| `/p/:profileId/dashboard` | Profile dashboard          | `/p/abc123/dashboard`    |
| `/p/:profileId/writing`   | Writing interface          | `/p/abc123/writing`      |
| `/p/:profileId/timeline`  | Timeline view              | `/p/abc123/timeline`     |
| `/p/:profileId/*`         | All profile routes         | Guarded by ProfileGate   |

### Special Routes (Profile-Independent)

| Route     | Purpose        | Notes                    |
| --------- | -------------- | ------------------------ |
| `/health` | Health check   | CI/CD and monitoring     |
| `/login`  | Authentication | Future auth integration  |
| `*`       | Catch-all      | Redirects to `/profiles` |

## 💾 Data Storage

### Storage Key Patterns

```typescript
// Profile metadata (global)
'inkwell_profiles'; // Array of all profiles
'inkwell_active_profile'; // ID of currently active profile

// Profile-specific data (prefixed)
'profile_{profileId}_inkwell_enhanced_projects';
'profile_{profileId}_timeline_scenes';
'profile_{profileId}_writing_content';
'profile_{profileId}_user_preferences';
'profile_{profileId}_inkwell_writing_chapters_{projectId}';
```

### Migration Strategy

1. **Detection**: Check for legacy keys without profile prefix
2. **Backup**: Preserve original data during migration
3. **Transform**: Copy data to profile-specific keys
4. **Validate**: Verify migration success
5. **Cleanup**: Optionally remove legacy data

## 🔄 Profile Lifecycle

### Profile Creation Flow

1. User visits `/profiles` (ProfilePicker)
2. Clicks "Create New Profile"
3. Enters profile name and selects color
4. Profile created with UUID and stored in localStorage
5. User redirected to `/p/{profileId}/dashboard`
6. ProfileGate validates profile and sets as active

### Profile Switching Flow

1. User clicks ProfileSwitcher in header
2. Selects different profile from dropdown
3. ProfileSwitcher calls `setActiveProfile(newProfileId)`
4. Navigation to `/p/{newProfileId}/dashboard`
5. ProfileGate validates and activates new profile
6. Database factory switches to new profile's storage

### Profile Deletion Flow

1. User accesses profile management (future feature)
2. Confirms deletion with warning about data loss
3. Profile removed from profiles array
4. Profile-specific storage keys deleted
5. If active profile deleted, redirect to profile picker

## 🎨 User Experience

### Visual Design

- **Profile Picker**: Clean gradient background with profile cards
- **Profile Switcher**: Compact dropdown with color-coded profile avatars
- **Loading States**: Smooth transitions with loading indicators
- **Error States**: Helpful error messages with recovery suggestions

### Interaction Patterns

- **First Visit**: Automatic redirect to profile picker
- **Profile Creation**: Guided flow with validation and feedback
- **Profile Switching**: One-click switching with visual confirmation
- **Deep Links**: URLs with profile context work correctly when shared

## 🛡️ Security & Privacy

### Data Isolation

- Each profile's data is completely isolated using prefixed storage keys
- No cross-profile data access possible through the application
- Profile switching requires explicit user action

### Error Handling

- Graceful handling of corrupted profile data
- Automatic redirect to profile picker for invalid profiles
- Error boundaries prevent profile issues from crashing the application

### Privacy Considerations

- All profile data stored locally (IndexedDB/localStorage)
- No external profile tracking or analytics
- User controls all profile creation, management, and deletion

## 🚀 Deployment & Configuration

### Environment Variables

```bash
# Optional: Default to profiles route for new users
APP_ORIGIN=https://inkwell.leadwithnexus.com
```

### Vercel Configuration (`vercel.json`)

```json
{
  "rewrites": [{ "source": "/:path*", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/:path*",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### SEO Configuration

- **Meta Tags**: Comprehensive Open Graph and Twitter Card support
- **Robots.txt**: Blocks private profile routes, allows public pages
- **Sitemap.xml**: Includes profile picker and public routes

## 🧪 Testing Strategy

### Unit Tests

- Profile context state management
- Database factory isolation
- Migration utility functions
- Component rendering and interactions

### Integration Tests

- Profile creation and switching flows
- Data isolation verification
- URL routing and navigation
- Migration from legacy to profile system

### End-to-End Tests

- Complete user journey from profile creation to project work
- Profile switching without data loss
- Deep link functionality with profile context
- Error recovery scenarios

## 📚 Migration Guide

### For New Installations

1. Users automatically redirected to `/profiles`
2. Must create first profile to access application
3. All data automatically profile-specific from start

### For Existing Installations

1. First visit after update redirects to `/profiles`
2. User creates first profile
3. Legacy data migration offered automatically
4. Migration preserves all existing projects and settings
5. User can create additional profiles for separate workspaces

### Developer Migration

1. Replace direct database imports with `useDB()` hook
2. Update any hardcoded storage keys to use profile-specific versions
3. Test data isolation between profiles
4. Update any shared state to be profile-aware

## 🔍 Troubleshooting

### Common Issues

**Profile not found errors**

- Check profile exists in `localStorage['inkwell_profiles']`
- Verify profile ID in URL matches existing profile
- Clear localStorage and recreate profiles if corrupted

**Data not loading**

- Confirm `useDB()` hook is used within ProfileGate
- Check profile-specific storage keys exist
- Verify migration completed successfully

**Profile switching failures**

- Check ProfileSwitcher component state updates
- Verify navigation to new profile URL
- Ensure ProfileGate properly validates new profile

## 🗺️ Future Roadmap

### Phase 1 (Current)

- ✅ Basic profile system with data isolation
- ✅ Profile creation and switching UI
- ✅ Legacy data migration

### Phase 2 (Next)

- 🚧 Profile management interface (edit, delete, export)
- 🚧 Profile backup and restore
- 🚧 Profile import/export for data portability

### Phase 3 (Future)

- 🚧 Cloud sync between devices per profile
- 🚧 Profile sharing and collaboration features
- 🚧 Advanced profile analytics and insights

---

## 📖 Related Documentation

- [Architecture Overview](../ARCHITECTURE_IMPLEMENTATION.md)
- [User Guide](../USER_GUIDE.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Developer Guide](../README.md)
