#!/bin/bash

# Usage: ./clean-install-commit.sh "Your commit message"

if [ -z "$1" ]; then
  echo "Please provide a commit message."
  exit 1
fi

echo "Removing node_modules folder..."
rm -rf node_modules

echo "Removing lock files (package-lock.json, yarn.lock) if they exist..."
rm -f package-lock.json yarn.lock

echo "Installing dependencies fresh..."
npm install

echo "Staging all changes (including deletions and untracked files)..."
git add -A

echo "Committing with message: $1"
git commit -m "$1"

echo "Done."
