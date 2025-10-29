#!/bin/bash
# Verification script for "Create Your First Project" button fix

echo "🔍 Verifying Create Project Button Fix"
echo "========================================"
echo ""

# Check 1: UIProvider import exists
echo "1. Checking UIProvider import in AppProviders.tsx..."
if grep -q "import { UIProvider } from './hooks/useUI'" src/AppProviders.tsx; then
  echo "   ✅ UIProvider import found"
else
  echo "   ❌ UIProvider import missing"
  exit 1
fi

# Check 2: UIProvider is used in the component
echo "2. Checking UIProvider usage in AppProviders.tsx..."
if grep -q "<UIProvider>" src/AppProviders.tsx; then
  echo "   ✅ UIProvider is used in component tree"
else
  echo "   ❌ UIProvider not found in component tree"
  exit 1
fi

# Check 3: DashboardPanel uses openNewProjectDialog
echo "3. Checking DashboardPanel uses openNewProjectDialog..."
if grep -q "openNewProjectDialog" src/components/Panels/DashboardPanel.tsx; then
  echo "   ✅ DashboardPanel imports and uses openNewProjectDialog"
else
  echo "   ❌ DashboardPanel doesn't use openNewProjectDialog"
  exit 1
fi

# Check 4: NewProjectDialog exists
echo "4. Checking NewProjectDialog component exists..."
if [ -f "src/components/Projects/NewProjectDialog.tsx" ]; then
  echo "   ✅ NewProjectDialog component exists"
else
  echo "   ❌ NewProjectDialog component missing"
  exit 1
fi

# Check 5: MainLayout renders NewProjectDialog
echo "5. Checking MainLayout renders NewProjectDialog..."
if grep -q "<NewProjectDialog" src/components/Layout/MainLayout.tsx; then
  echo "   ✅ MainLayout renders NewProjectDialog"
else
  echo "   ❌ MainLayout doesn't render NewProjectDialog"
  exit 1
fi

echo ""
echo "========================================"
echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm dev' to start the development server"
echo "2. Navigate to the dashboard (with no projects)"
echo "3. Click 'Create Your First Project' button"
echo "4. Dialog should open and allow project creation"
