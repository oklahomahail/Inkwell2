#!/bin/bash
# Script to set up branch protection rules for main branch

# Check for gh CLI
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please install it first:"
    echo "https://cli.github.com/manual/installation"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Please authenticate with GitHub first using: gh auth login"
    exit 1
fi

# Get the owner and repo from the git remote
REMOTE_URL=$(git remote get-url origin)
OWNER_REPO=$(echo $REMOTE_URL | sed -n 's/.*github.com[:/]\(.*\).git/\1/p')

if [ -z "$OWNER_REPO" ]; then
    echo "Could not determine owner/repo. Please set them manually in the script."
    echo "Current format: $REMOTE_URL"
    read -p "Enter owner/repo (e.g., oklahomahail/Inkwell2): " OWNER_REPO
fi

echo "Setting up branch protection for $OWNER_REPO main branch..."

# Require PRs, 1 approval, linear history, block force pushes, restrict deletions
echo "Setting up basic branch protection rules..."
gh api --method PUT "repos/$OWNER_REPO/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  -f required_linear_history.enabled=true \
  -f allow_force_pushes.enabled=false \
  -f allow_deletions.enabled=false \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -f required_pull_request_reviews.dismiss_stale_reviews=true \
  -f enforce_admins.enabled=true

# Require status checks
echo "Setting up required status checks..."
gh api --method PATCH "repos/$OWNER_REPO/branches/main/protection/required_status_checks" \
  -H "Accept: application/vnd.github+json" \
  -f strict=true \
  -F checks[0][context]=lint \
  -F checks[1][context]=typecheck \
  -F checks[2][context]=test \
  -F checks[3][context]=build

echo "✅ Branch protection setup complete"
echo
echo "Note: To require deployments to succeed, set it in the GitHub UI."
echo "The environment name must match your Vercel environment label exactly."