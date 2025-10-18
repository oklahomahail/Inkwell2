#!/bin/bash
# This script checks that .env.example and environment variables are in sync

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the parent directory (project root)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if .env.example exists
ENV_EXAMPLE_FILE="$PROJECT_ROOT/.env.example"
if [ ! -f "$ENV_EXAMPLE_FILE" ]; then
  echo "Error: .env.example file not found at $ENV_EXAMPLE_FILE"
  exit 1
fi

# Compare .env.example with environment variables
echo "Checking for required environment variables..."
echo "Variables in .env.example that are not set in the environment:"
diff <(grep -o '^VITE_[A-Z0-9_]\+=' "$ENV_EXAMPLE_FILE" | sort) \
     <(printenv | grep -o '^VITE_[A-Z0-9_]\+=' | sort) || true

# Exit with code 0 to not fail CI if there are differences
# The above will show the diff for informational purposes
exit 0