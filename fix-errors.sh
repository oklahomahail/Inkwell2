#!/bin/bash

echo "Fixing TypeScript errors..."

# Comment out problematic imports temporarily
sed -i '' 's/import { useCommandPalette }/\/\/ import { useCommandPalette }/' src/components/CompleteWritingPlatform.tsx

# Fix timeline service
sed -i '' 's/start: startTimes\[0\]/start: startTimes[0] ?? 0/' src/services/timelineService.ts
sed -i '' 's/end: endTimes\[endTimes.length - 1\]/end: endTimes[endTimes.length - 1] ?? 0/' src/services/timelineService.ts

# Comment out eventBus import
sed -i '' 's/import eventBus/\/\/ import eventBus/' src/utils/legacyEventAdapter.ts

echo "Errors temporarily fixed. Run 'pnpm dev' to test."
