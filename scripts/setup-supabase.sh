#!/bin/bash

# Supabase Setup Helper Script
# Run this to quickly set up Supabase integration for Inkwell

set -e

echo "🚀 Inkwell Supabase Setup (Local-First + Cloud Sync)"
echo "====================================================="
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local already exists"
    echo ""
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping environment setup"
    else
        CREATE_ENV=true
    fi
else
    CREATE_ENV=true
fi

if [ "$CREATE_ENV" = true ]; then
    echo ""
    echo "📝 Let's configure your environment variables"
    echo ""
    echo "Go to: https://app.supabase.com/project/_/settings/api"
    echo ""
    read -p "Enter your Supabase URL (https://xxxxx.supabase.co): " SUPABASE_URL
    read -p "Enter your Supabase Anon Key: " SUPABASE_KEY
    
    # Create .env.local
    cat > .env.local << EOF
# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_KEY

# Feature Flags
VITE_ENABLE_SUPABASE_SYNC=false

# Clerk (existing)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_
EOF
    
    echo "✅ Created .env.local"
fi

echo ""
echo "📦 Checking Supabase CLI..."
if npx supabase --version > /dev/null 2>&1; then
    echo "✅ Supabase CLI available via npx"
else
    echo "❌ Supabase CLI not available"
    exit 1
fi

echo ""
echo "🔗 Ready to link your project?"
echo ""
read -p "Enter your Supabase Project Reference ID (or press Enter to skip): " PROJECT_REF

if [ ! -z "$PROJECT_REF" ]; then
    echo "Linking to project..."
    npx supabase link --project-ref "$PROJECT_REF"
    
    echo ""
    echo "🚀 Push migrations?"
    echo ""
    echo "This will apply 8 migration files:"
    echo "  1. Core schema (tables + RLS)"
    echo "  2. Auto-touch updated_at triggers"
    echo "  3. Profile auto-creation on signup"
    echo "  4. Soft-delete helpers (views + RPC)"
    echo "  5. Role-based write guards"
    echo "  6. Bulk upsert RPCs for sync"
    echo "  7. Performance indexes"
    echo "  8. Seed data (optional, can skip)"
    echo ""
    read -p "Do you want to push all migrations now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Pushing migrations..."
        npx supabase db push
        echo ""
        echo "✅ Migrations pushed!"
        echo ""
        echo "📋 Verifying setup..."
        echo "Go to: https://app.supabase.com/project/$PROJECT_REF/editor"
        echo ""
        echo "Expected tables:"
        echo "  • profiles, projects, project_members"
        echo "  • chapters, characters, notes"
        echo ""
        echo "Expected views:"
        echo "  • projects_active, chapters_active"
        echo "  • characters_active, notes_active"
        echo ""
        echo "Expected functions:"
        echo "  • touch_updated_at(), handle_new_user()"
        echo "  • can_access_project(), can_write_project()"
        echo "  • soft_delete(), bulk_upsert_*"
    fi
    
    echo ""
    echo "🔧 Generate TypeScript types?"
    read -p "Generate types for better DX? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > src/types/supabase.ts
        echo "✅ Types generated at src/types/supabase.ts"
    fi
else
    echo "⏭️  Skipped project linking"
    echo ""
    echo "You can run these commands later:"
    echo "  npx supabase link --project-ref YOUR_PROJECT_ID"
    echo "  npx supabase db push"
    echo "  npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/types/supabase.ts"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Configure auth redirect URLs in Supabase Dashboard"
echo "   → https://app.supabase.com/project/_/auth/url-configuration"
echo ""
echo "   Site URL:"
echo "   • Development: http://localhost:5173"
echo "   • Production: https://writewithinkwell.com"
echo ""
echo "   Redirect URLs (add all):"
echo "   • http://localhost:5173"
echo "   • http://localhost:5173/auth/callback"
echo "   • http://localhost:5173/auth/update-password"
echo "   • https://writewithinkwell.com"
echo "   • https://writewithinkwell.com/auth/callback"
echo "   • https://writewithinkwell.com/auth/update-password"
echo "   • https://inkwell.leadwithnexus.com (legacy - keep during migration)"
echo "   • https://inkwell.leadwithnexus.com/auth/callback"
echo "   • https://inkwell.leadwithnexus.com/auth/update-password"
echo ""
echo "2. Verify tables in Supabase Dashboard → Table Editor"
echo "   Expected tables: projects, project_members, chapters, characters, notes, profiles"
echo ""
echo "3. Check RLS policies enabled"
echo "   → Supabase Dashboard → Authentication → Policies"
echo ""
echo "4. Start your dev server:"
echo "   → npm run dev"
echo ""
echo "5. Test the integration:"
echo "   • Sign up/in with a test user"
echo "   • Create a project (should sync to Supabase)"
echo "   • Check Table Editor → projects for new row"
echo ""
echo "📖 For more help, see:"
echo "   - SUPABASE_QUICKSTART.md (5-minute guide)"
echo "   - SUPABASE_SETUP_GUIDE.md (detailed guide)"
echo "   - SUPABASE_INTEGRATION_CHECKLIST.md (full checklist)"
echo ""
echo "💡 Note: Cloud sync is OFF by default (local-first mode)"
echo "   Enable in Settings when ready to test sync"
echo ""
