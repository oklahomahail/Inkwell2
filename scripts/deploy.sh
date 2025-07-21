#!/bin/bash

# Kill anything on port 3000
kill -9 $(lsof -ti :3000) 2>/dev/null || true

# Clear old build cache
rm -rf node_modules/.vite

# Reinstall, build, and commit
npm install
npm run build

# Commit changes
git add -A
git commit -m "Auto-build & push"

# Create a timestamped tag
TAG="v1.0.1-$(date +%Y%m%d%H%M%S)"
git tag $TAG

# Push changes and tags to GitHub
git push origin main --tags

# Start the dev server
npm run dev

