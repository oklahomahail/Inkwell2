# Quick Integration Guide

## Using the New Project Dialog

### In any component that needs to create projects:

```tsx
import { useState } from 'react';
import NewProjectDialog from '@/components/Projects/NewProjectDialog';

function MyComponent() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button onClick={() => setDialogOpen(true)}>New Project</button>

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
```

## Using the Header Project Title (Rename)

### In Dashboard, Topbar, or any project header:

```tsx
import { HeaderProjectTitle } from '@/components/Projects/HeaderProjectTitle';
import { useAppContext } from '@/context/AppContext';

function ProjectHeader() {
  const { currentProject } = useAppContext();

  if (!currentProject) return null;

  return (
    <div className="project-header">
      <HeaderProjectTitle projectId={currentProject.id} />
    </div>
  );
}
```

## Using the Storage Badge

### For custom storage indicators:

```tsx
import { StorageBadge } from '@/components/Storage/StorageBadge';
import { isStoragePersisted, getStorageQuota } from '@/utils/storage/persistence';
import { useEffect, useState } from 'react';

function CustomStorageIndicator() {
  const [persisted, setPersisted] = useState(false);
  const [usedPercent, setUsedPercent] = useState(0);

  useEffect(() => {
    async function checkStorage() {
      const isPersisted = await isStoragePersisted();
      const quota = await getStorageQuota();

      setPersisted(isPersisted);
      setUsedPercent((quota.usage / quota.quota) * 100);
    }
    checkStorage();
  }, []);

  return <StorageBadge persisted={persisted} usedPercent={usedPercent} />;
}
```

## Starting the Tour from Settings

### Already integrated in TourReplayButton:

```tsx
import { startDefaultTourFromSettings } from '@/tour/tourEntry';

// In your Settings component:
<Button onClick={startDefaultTourFromSettings}>Start Tour</Button>;
```

## Keyboard Shortcuts Reference

- **Create Project Dialog**: Cmd/Ctrl+Enter to submit
- **Rename Project**: Enter to save, Escape to cancel
- **Close Dialog**: Escape

## Context Methods Available

### From `useAppContext()`:

```tsx
const {
  updateProject, // Update project details (including name)
  addProject, // Add new project (used internally by NewProjectDialog)
  currentProject, // Get current project
  state, // Access full app state
} = useAppContext();

// Update a project:
updateProject({
  ...project,
  name: 'New Name',
  updatedAt: Date.now(),
});
```

## Brand Asset Paths

All brand assets should reference:

- `/assets/brand/inkwell-lockup-dark.svg`
- `/assets/brand/inkwell-lockup-horizontal.svg`
- `/assets/brand/inkwell-wordmark.svg`
- `/assets/brand/inkwell-logo-icon-192.png`
- `/assets/brand/inkwell-logo-icon-512.png`
