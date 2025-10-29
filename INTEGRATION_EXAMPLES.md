/\*\*

- Integration Example: Adding Persistence Settings to Existing Settings Page
-
- This file shows how to integrate the new persistence settings
- into your existing settings infrastructure.
  \*/

// ============================================
// OPTION 1: Add as a new settings section
// ============================================

// In your main Settings component:
import { DataPersistenceSettingsPage } from '@/components/Settings/DataPersistenceSettingsPage';

function SettingsPage() {
const [activeSection, setActiveSection] = useState('general');

return (
<div className="flex">
{/_ Sidebar Navigation _/}
<nav className="w-64 border-r">
<button onClick={() => setActiveSection('general')}>General</button>
<button onClick={() => setActiveSection('appearance')}>Appearance</button>
<button onClick={() => setActiveSection('data')}>Data & Storage</button> {/_ NEW _/}
<button onClick={() => setActiveSection('account')}>Account</button>
</nav>

      {/* Content Area */}
      <div className="flex-1 p-6">
        {activeSection === 'general' && <GeneralSettings />}
        {activeSection === 'appearance' && <AppearanceSettings />}
        {activeSection === 'data' && <DataPersistenceSettingsPage />} {/* NEW */}
        {activeSection === 'account' && <AccountSettings />}
      </div>
    </div>

);
}

// ============================================
// OPTION 2: Add as inline section
// ============================================

// In your existing Settings component:
import { PersistenceModeSelector } from '@/components/Settings/PersistenceModeSelector';
import { PersistenceAdvancedSettings } from '@/components/Settings/PersistenceAdvancedSettings';

function SettingsPage() {
return (
<div className="max-w-4xl mx-auto space-y-8">
{/_ Existing sections _/}
<GeneralSettingsSection />
<AppearanceSettingsSection />

      {/* NEW: Data Storage Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Data Storage</h2>
        <PersistenceModeSelector />

        <div className="mt-6">
          <PersistenceAdvancedSettings />
        </div>
      </section>

      {/* More existing sections */}
      <AccountSettingsSection />
    </div>

);
}

// ============================================
// OPTION 3: Use hook for custom UI
// ============================================

// Build your own custom UI with the hook:
import { useUserPersistence } from '@/hooks/useUserPersistence';

function CustomPersistenceSettings() {
const { settings, status, setMode, triggerSync } = useUserPersistence();

return (
<div>
<h3>Storage Mode: {settings.mode}</h3>
<p>Connected: {status?.isCloudConnected ? 'Yes' : 'No'}</p>

      <button onClick={() => setMode('local-only')}>Local Only</button>
      <button onClick={() => setMode('cloud-sync')}>Cloud Sync</button>
      <button onClick={() => setMode('hybrid')}>Hybrid</button>

      {settings.mode !== 'local-only' && <button onClick={triggerSync}>Sync Now</button>}
    </div>

);
}

// ============================================
// OPTION 4: Add to app initialization
// ============================================

// In your App.tsx or main component:
import { useEffect } from 'react';
import { userPersistenceService } from '@/services/userPersistenceService';
import { useToast } from '@/context/toast';

function App() {
const { showToast } = useToast();

useEffect(() => {
// Check capabilities on app load
userPersistenceService.getCapabilities().then((capabilities) => {
// Warn if in private mode
if (capabilities.isPrivateMode) {
showToast('Private mode detected. Data may be lost when you close this window.', 'warning');
}

      // Warn if storage not persistent
      if (!capabilities.isPersistent) {
        showToast(
          'Storage persistence not granted. Consider enabling it in browser settings.',
          'info',
        );
      }
    });

    // Subscribe to sync events
    const unsubscribe = userPersistenceService.subscribeSyncEvents((event) => {
      if (event.type === 'sync-complete') {
        showToast('Sync completed successfully', 'success');
      } else if (event.type === 'sync-error') {
        showToast(`Sync failed: ${event.error}`, 'error');
      }
    });

    return unsubscribe;

}, []);

return <YourAppContent />;
}

// ============================================
// OPTION 5: Update existing storage service
// ============================================

// In your enhancedStorageService.ts:
import { userPersistenceService } from './userPersistenceService';

export class EnhancedStorageService {
static async saveProject(project: EnhancedProject): Promise<void> {
const mode = userPersistenceService.getMode();

    // Always save locally first (local-first architecture)
    await this.saveToLocal(project);

    // Then handle cloud operations based on mode
    if (mode === 'cloud-sync') {
      // In cloud-sync mode, immediately sync to cloud
      await this.saveToCloud(project);
    } else if (mode === 'hybrid') {
      // In hybrid mode, queue for background cloud backup
      await this.queueForCloudBackup(project);
    }
    // In local-only mode, do nothing more

}

static async loadProject(id: string): Promise<EnhancedProject | null> {
const mode = userPersistenceService.getMode();

    if (mode === 'local-only') {
      // Load only from local storage
      return this.loadFromLocal(id);
    } else if (mode === 'cloud-sync') {
      // Try cloud first, fall back to local cache
      const cloudProject = await this.loadFromCloud(id);
      return cloudProject || this.loadFromLocal(id);
    } else if (mode === 'hybrid') {
      // Load from local (faster), optionally refresh from cloud in background
      const localProject = await this.loadFromLocal(id);
      this.refreshFromCloudInBackground(id); // Don't await
      return localProject;
    }

}
}

// ============================================
// OPTION 6: Add to onboarding flow
// ============================================

// In your onboarding component:
import { PersistenceModeSelector } from '@/components/Settings/PersistenceModeSelector';

function OnboardingFlow() {
const [step, setStep] = useState(0);

const steps = [
<WelcomeStep />,
<AccountSetupStep />,
<PersistenceModeSelectionStep />, // NEW STEP
<PreferencesStep />,
<CompleteStep />,
];

return <div>{steps[step]}</div>;
}

function PersistenceModeSelectionStep() {
return (
<div className="max-w-2xl mx-auto">
<h2 className="text-2xl font-bold mb-4">Choose Your Storage Preference</h2>
<p className="text-gray-600 mb-6">
How would you like Inkwell to store your writing? You can change this anytime.
</p>
<PersistenceModeSelector />
</div>
);
}

// ============================================
// OPTION 7: Add status indicator to header
// ============================================

// In your app header/navbar:
import { useUserPersistence } from '@/hooks/useUserPersistence';
import { Cloud, HardDrive, Network } from 'lucide-react';

function AppHeader() {
const { settings, status } = useUserPersistence();

const getModeIcon = () => {
switch (settings.mode) {
case 'local-only':
return <HardDrive className="w-4 h-4" />;
case 'cloud-sync':
return <Cloud className="w-4 h-4" />;
case 'hybrid':
return <Network className="w-4 h-4" />;
}
};

return (
<header className="flex items-center justify-between p-4">
<div>Inkwell</div>

      {/* Storage status indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {getModeIcon()}
        {status?.isSyncing && <span className="animate-pulse">Syncing...</span>}
        {status?.lastSyncError && <span className="text-red-600">Sync error</span>}
      </div>
    </header>

);
}

// ============================================
// OPTION 8: Add to context menu
// ============================================

// Add quick actions to context menu:
import { useUserPersistence } from '@/hooks/useUserPersistence';

function ProjectContextMenu({ project }) {
const { settings, triggerSync, triggerBackup } = useUserPersistence();

return (
<Menu>
<MenuItem>Open</MenuItem>
<MenuItem>Rename</MenuItem>
{settings.mode !== 'local-only' && (
<>
<MenuDivider />
<MenuItem onClick={triggerSync}>Sync Now</MenuItem>
{settings.mode === 'hybrid' && (
<MenuItem onClick={triggerBackup}>Backup to Cloud</MenuItem>
)}
</>
)}
<MenuDivider />
<MenuItem>Delete</MenuItem>
</Menu>
);
}
