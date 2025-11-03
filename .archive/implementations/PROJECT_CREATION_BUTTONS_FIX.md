# Project Creation Buttons Fix - October 28, 2025

## Issue

The "Create Your First Project" button and "+ New Project" button were not functioning. They appeared to do nothing when clicked.

## Root Cause

The buttons were calling inline project creation functions that directly created projects without user input for the project name. According to the PROJECT_NAMING_IMPLEMENTATION.md, these buttons should open a `NewProjectDialog` modal to allow users to name their projects before creation.

## Solution Implemented

### 1. Centralized Dialog State in UIContext

**File**: `src/hooks/useUI.tsx` and `src/hooks/useUI.ts`

Added three new properties to the `UIContextValue` interface:

- `newProjectDialogOpen: boolean` - Tracks whether the dialog is open
- `openNewProjectDialog: () => void` - Opens the dialog
- `closeNewProjectDialog: () => void` - Closes the dialog

This allows any component to trigger the project creation dialog without managing local state.

### 2. Updated Sidebar Component

**File**: `src/components/Sidebar.tsx`

- Removed direct project creation logic from `handleCreateProject`
- Changed button to call `openNewProjectDialog()` instead
- Removed unused imports (`addProject`, `setCurrentProjectId`, `triggerOnProjectCreated`)

### 3. Updated EnhancedDashboard Component

**File**: `src/components/Dashboard/EnhancedDashboard.tsx`

- Replaced local `newProjectDialogOpen` state with shared state from `useUI`
- Removed local `openNewProjectDialog` function
- Removed the `<NewProjectDialog>` component (moved to MainLayout for global access)
- Updated all button click handlers to use shared `openNewProjectDialog()`

### 4. Updated DashboardPanel Component

**File**: `src/components/Panels/DashboardPanel.tsx`

- Replaced `createNewProject` function with `openNewProjectDialog` from `useUI`
- Updated both "Create Your First Project" buttons to call the dialog
- Removed inline project creation logic

### 5. Added Global NewProjectDialog

**File**: `src/components/Layout/MainLayout.tsx`

- Added import for `NewProjectDialog` component
- Added import for `useUI` hook
- Initialized `newProjectDialogOpen` and `closeNewProjectDialog` from `useUI`
- Rendered `<NewProjectDialog>` at the end of the layout, after other modals

## Benefits

1. **Consistent Behavior**: All project creation buttons now open the same modal
2. **Better UX**: Users can name their projects before creation
3. **Single Source of Truth**: Dialog state is managed centrally in UIContext
4. **Proper Architecture**: Follows the pattern documented in PROJECT_NAMING_IMPLEMENTATION.md

## Files Modified

1. `src/hooks/useUI.tsx` - Added dialog state to UIProvider
2. `src/hooks/useUI.ts` - Updated type definition
3. `src/components/Sidebar.tsx` - Use dialog instead of direct creation
4. `src/components/Dashboard/EnhancedDashboard.tsx` - Use shared dialog state
5. `src/components/Panels/DashboardPanel.tsx` - Use shared dialog state
6. `src/components/Layout/MainLayout.tsx` - Render global dialog

## Testing Checklist

- [x] Compile errors resolved
- [ ] "Create Your First Project" button opens dialog (when no projects exist)
- [ ] "+ New Project" button in sidebar opens dialog
- [ ] "New Project" button in dashboard header opens dialog
- [ ] Dialog allows entering project name and description
- [ ] Dialog creates project and navigates to Writing view
- [ ] Dialog can be cancelled with Cancel button or ESC key
- [ ] Dialog can be submitted with Create button or CMD+Enter
