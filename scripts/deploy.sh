#!/bin/bash
set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Inkwell deployment process...${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please run from project root."
    exit 1
fi

# Kill any process running on port 5173 (Vite default)
print_status "Stopping any running dev servers..."
kill -9 $(lsof -ti :5173) 2>/dev/null || true
kill -9 $(lsof -ti :3000) 2>/dev/null || true

# Clean caches for fresh build
print_status "Cleaning build caches..."
rm -rf node_modules/.vite node_modules/.cache dist

# Install dependencies
print_status "Installing dependencies..."
pnpm install --frozen-lockfile

# Run quality checks
print_status "Running type checking..."
pnpm typecheck

print_status "Running tests..."
pnpm test:run

print_status "Building production bundle..."
pnpm build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not created"
    exit 1
fi

print_status "Build completed successfully!"

# Git operations (only if changes exist)
if [[ -n $(git status --porcelain) ]]; then
    print_status "Staging changes for commit..."
    git add -A
    
    # Generate commit message
    COMMIT_MSG="Production build $(date '+%Y-%m-%d %H:%M:%S')"
    if [[ $1 == "-m" && -n $2 ]]; then
        COMMIT_MSG="$2"
    fi
    
    git commit -m "$COMMIT_MSG" || print_warning "Nothing new to commit"
    
    # Create tag
    TAG="v1.0.1-$(date +%Y%m%d%H%M%S)"
    git tag $TAG
    print_status "Created tag: $TAG"
    
    # Push to remote
    print_status "Pushing to remote repository..."
    git push origin main --tags
else
    print_warning "No changes to commit"
fi

# Display bundle analysis
echo -e "\n${BLUE}📊 Build Analysis:${NC}"
ls -lh dist/assets/ | grep -E '\.(js|css)$' || true

# Deployment options
echo -e "\n${BLUE}🌍 Deployment Options:${NC}"
echo "1. Auto-deploy with Vercel CLI: vercel --prod"
echo "2. Manual upload: Upload 'dist' folder contents"
echo "3. Git-based deploy: Push triggers auto-deployment"

if command -v vercel &> /dev/null; then
    echo -e "\n${YELLOW}Deploy now with Vercel? (y/n)${NC}"
    read -r deploy_now
    if [[ $deploy_now =~ ^[Yy]$ ]]; then
        print_status "Deploying to Vercel..."
        vercel --prod
    fi
else
    print_warning "Vercel CLI not found. Install with: npm i -g vercel"
fi

# Start dev server option
if [[ "$1" != "--no-dev" ]]; then
    echo -e "\n${YELLOW}Start development server? (y/n)${NC}"
    read -r start_dev
    if [[ $start_dev =~ ^[Yy]$ ]]; then
        print_status "Starting development server..."
        pnpm dev
    fi
fi

echo -e "\n${GREEN}🎉 Deployment process completed!${NC}"
