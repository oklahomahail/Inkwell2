#!/bin/bash

# Vercel Domain Configuration Script
# This script helps configure writewithinkwell.com as the primary domain
# Requires: Vercel CLI (pnpm add -g vercel)

set -e

echo "🌐 Inkwell Domain Migration - Vercel Configuration"
echo "=================================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found"
    echo ""
    echo "Install it with:"
    echo "  pnpm add -g vercel"
    echo ""
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Not logged in to Vercel. Logging in..."
    vercel login
fi

echo "✅ Logged in to Vercel"
echo ""

# Get project info
PROJECT_NAME="inkwell"
echo "📋 Project: $PROJECT_NAME"
echo ""

# Add domains
echo "➕ Adding domains to project..."
echo ""

echo "Adding writewithinkwell.com..."
vercel domains add writewithinkwell.com "$PROJECT_NAME" || echo "⚠️  Domain may already exist"

echo "Adding www.writewithinkwell.com..."
vercel domains add www.writewithinkwell.com "$PROJECT_NAME" || echo "⚠️  Domain may already exist"

echo ""
echo "✅ Domains added"
echo ""

# Set environment variables
echo "🔧 Setting environment variables..."
echo ""

# Production environment
vercel env add VITE_BASE_URL production <<< "https://writewithinkwell.com"

echo ""
echo "✅ Environment variables set"
echo ""

# List current domains
echo "📋 Current domains for project:"
vercel domains ls "$PROJECT_NAME"

echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo ""
echo "1. Go to Vercel Dashboard: https://vercel.com/dashboard"
echo "   → Select 'inkwell' project"
echo "   → Go to Settings → Domains"
echo ""
echo "2. Set writewithinkwell.com as PRIMARY domain:"
echo "   → Find writewithinkwell.com in the list"
echo "   → Click the '...' menu"
echo "   → Select 'Set as Primary Domain'"
echo ""
echo "3. Verify DNS configuration in Porkbun:"
echo "   → CNAME: www → cname.vercel-dns.com"
echo "   → A: @ → 76.76.21.21"
echo ""
echo "4. Wait for DNS propagation (5-60 minutes)"
echo "   → Check status: dig writewithinkwell.com"
echo ""
echo "📖 For detailed instructions, see MIGRATION_GUIDE.md"
echo ""
