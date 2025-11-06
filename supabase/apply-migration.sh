#!/bin/bash

# apply-migration.sh
# Helper script to apply database migrations to Supabase

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Supabase Migration Helper${NC}"
echo "================================"
echo ""

# Check if supabase CLI is available
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}Error: pnpm not found${NC}"
    exit 1
fi

# Get the migration file
MIGRATION_FILE="supabase/migrations/20251105000000_add_chapters_columns.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Migration file:${NC} $MIGRATION_FILE"
echo ""
echo "Choose how to apply this migration:"
echo ""
echo "1. Show SQL (copy to Supabase Dashboard)"
echo "2. Apply via Supabase CLI (requires linked project)"
echo "3. Show connection string format"
echo "4. Cancel"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}Copy this SQL to your Supabase Dashboard → SQL Editor:${NC}"
        echo "======================================================================="
        cat "$MIGRATION_FILE"
        echo "======================================================================="
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Go to https://supabase.com/dashboard"
        echo "2. Select your project"
        echo "3. Navigate to SQL Editor"
        echo "4. Paste the above SQL"
        echo "5. Click 'Run'"
        ;;
    2)
        echo ""
        echo -e "${YELLOW}Checking Supabase CLI setup...${NC}"

        # Check if project is linked
        if pnpm exec supabase status &> /dev/null; then
            echo -e "${GREEN}Project is linked!${NC}"
            echo ""
            read -p "Apply migration? [y/N]: " confirm
            if [[ $confirm == [yY] ]]; then
                pnpm exec supabase db push
                echo ""
                echo -e "${GREEN}✓ Migration applied successfully!${NC}"
            else
                echo "Migration cancelled."
            fi
        else
            echo -e "${YELLOW}Project not linked yet.${NC}"
            echo ""
            echo "To link your project, run:"
            echo "  pnpm exec supabase link --project-ref lzurjjorjzeubepnhkgg"
            echo ""
            echo "You'll need your database password (found in Supabase Dashboard → Settings → Database)"
        fi
        ;;
    3)
        echo ""
        echo -e "${GREEN}Database connection string format:${NC}"
        echo ""
        echo "postgresql://postgres:[YOUR-PASSWORD]@lzurjjorjzeubepnhkgg.supabase.co:5432/postgres"
        echo ""
        echo -e "${YELLOW}To apply migration with psql:${NC}"
        echo "  psql \"postgresql://postgres:[PASSWORD]@lzurjjorjzeubepnhkgg.supabase.co:5432/postgres\" \\"
        echo "    -f $MIGRATION_FILE"
        echo ""
        echo -e "${YELLOW}To find your password:${NC}"
        echo "1. Go to https://supabase.com/dashboard"
        echo "2. Select your project"
        echo "3. Settings → Database → Database password"
        ;;
    4)
        echo "Cancelled."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
