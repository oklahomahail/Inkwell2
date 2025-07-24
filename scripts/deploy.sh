#!/bin/bash

# Kill any process running on port 3000
kill -9 $(lsof -ti :3000) 2>/dev/null || true

# Clean old Vite cache and any node_modules cache
rm -rf node_modules/.vite node_modules/.cache

# Reinstall dependencies and build
npm install
npm run build

# Stage and commit all changes automatically
git add -A
git commit -m "Auto-build & push" || echo "No changes to commit"

# Tag the commit with a timestamp
TAG="v1.0.1-$(date +%Y%m%d%H%M%S)"
git tag $TAG

# Push commits and tags to GitHub
git push origin main --tags

# Start the development server unless --no-dev flag is provided
if [[ "$1" != "--no-dev" ]]; then
  npm run dev
else
  echo "Skipped starting dev server (use './scripts/deploy.sh' without --no-dev to run it)."
fi
