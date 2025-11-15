#!/bin/bash
# Supabase Configuration Check Script
# Automatically checks auth configuration for Inkwell project

set -e

echo "=== Checking Supabase Configuration for Domain Migration ==="
echo ""

# Check if logged in
if ! supabase projects list &>/dev/null; then
  echo "❌ Not logged in to Supabase CLI"
  echo "Run: supabase login"
  exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Your Inkwell project ID (from supabase projects list)
PROJECT_ID="lzurjjorjzeubepnhkgg"

echo "📋 Project: Inkwell (${PROJECT_ID})"
echo ""

# Get project details
echo "=== Project Details ==="
supabase projects list | grep "$PROJECT_ID" || true
echo ""

echo "=== Auth Configuration Status ==="
echo ""
echo "⚠️  The Supabase CLI doesn't expose auth URL configuration commands."
echo "You need to update these settings in the Supabase Dashboard:"
echo ""
echo "🔗 Dashboard URL:"
echo "   https://supabase.com/dashboard/project/${PROJECT_ID}/auth/url-configuration"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ REQUIRED CONFIGURATION:"
echo ""
echo "1️⃣  Site URL (IMPORTANT - Set this first):"
echo "   https://writewithinkwell.com"
echo ""
echo "2️⃣  Redirect URLs (Click 'Add URL' for each):"
echo ""
echo "   New Domain:"
echo "   • https://writewithinkwell.com/*"
echo "   • https://writewithinkwell.com/auth/callback"
echo "   • https://writewithinkwell.com/auth/update-password"
echo ""
echo "   Legacy Domain (Keep for 30-60 days):"
echo "   • https://inkwell.leadwithnexus.com/*"
echo "   • https://inkwell.leadwithnexus.com/auth/callback"
echo "   • https://inkwell.leadwithnexus.com/auth/update-password"
echo ""
echo "   Development (Verify present):"
echo "   • http://localhost:5173/*"
echo "   • http://localhost:5173/auth/callback"
echo "   • http://localhost:5173/auth/update-password"
echo ""
echo "3️⃣  Additional Allowed Origins:"
echo "   • https://writewithinkwell.com"
echo "   • https://www.writewithinkwell.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 Detailed Guide: ./scripts/configure-supabase.md"
echo ""
echo "⏱️  Estimated Time: 5 minutes"
echo ""
echo "After updating, test with:"
echo "  1. Visit https://writewithinkwell.com/sign-in"
echo "  2. Sign in with your account"
echo "  3. Verify no auth errors in browser console"
echo ""
