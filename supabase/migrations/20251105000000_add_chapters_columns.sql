-- 20251105000000_add_chapters_columns.sql
-- Purpose: Add missing columns to chapters table to align with chaptersSyncService expectations
-- Addresses: column chapters.order_index does not exist error

BEGIN;

-- 1. Add order_index column (rename from index_in_project for consistency)
-- First, add the new column if it doesn't exist
ALTER TABLE public.chapters
ADD COLUMN IF NOT EXISTS order_index integer;

-- Copy data from old column if it exists and order_index is null
UPDATE public.chapters
SET order_index = index_in_project
WHERE order_index IS NULL AND index_in_project IS NOT NULL;

-- Set default for any remaining nulls
UPDATE public.chapters
SET order_index = 0
WHERE order_index IS NULL;

-- Make it NOT NULL after backfilling
ALTER TABLE public.chapters
ALTER COLUMN order_index SET NOT NULL;

-- Set default for future inserts
ALTER TABLE public.chapters
ALTER COLUMN order_index SET DEFAULT 0;

-- 2. Add content column (separate from body for chapter content)
ALTER TABLE public.chapters
ADD COLUMN IF NOT EXISTS content text;

-- Backfill content from body if needed
UPDATE public.chapters
SET content = COALESCE(body, '')
WHERE content IS NULL;

-- Make it NOT NULL after backfilling
ALTER TABLE public.chapters
ALTER COLUMN content SET NOT NULL;

ALTER TABLE public.chapters
ALTER COLUMN content SET DEFAULT '';

-- 3. Add summary column
ALTER TABLE public.chapters
ADD COLUMN IF NOT EXISTS summary text;

-- 4. Add word_count column
ALTER TABLE public.chapters
ADD COLUMN IF NOT EXISTS word_count integer NOT NULL DEFAULT 0;

-- 5. Add status column with check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'chapters'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.chapters
    ADD COLUMN status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'revising', 'final'));
  END IF;
END $$;

-- 6. Create index for ordering queries
CREATE INDEX IF NOT EXISTS idx_chapters_order_index
ON public.chapters(project_id, order_index);

-- 7. Optional: Create trigger to auto-increment order_index for new chapters
CREATE OR REPLACE FUNCTION public.set_chapter_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-set if order_index is 0 or null
  IF NEW.order_index IS NULL OR NEW.order_index = 0 THEN
    NEW.order_index := COALESCE(
      (SELECT MAX(order_index) + 1 FROM public.chapters WHERE project_id = NEW.project_id),
      0
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_chapter_order ON public.chapters;
CREATE TRIGGER trg_set_chapter_order
BEFORE INSERT ON public.chapters
FOR EACH ROW
EXECUTE FUNCTION public.set_chapter_order();

-- 8. Update the existing index to use order_index instead of updated_at for sorting
DROP INDEX IF EXISTS idx_chapters_project_updated;
CREATE INDEX IF NOT EXISTS idx_chapters_project_order
ON public.chapters(project_id, order_index, updated_at DESC);

COMMIT;

-- Comments
COMMENT ON COLUMN public.chapters.order_index IS 'Chapter ordering within project (0-indexed)';
COMMENT ON COLUMN public.chapters.content IS 'Full chapter text content';
COMMENT ON COLUMN public.chapters.summary IS 'Brief chapter summary or notes';
COMMENT ON COLUMN public.chapters.word_count IS 'Cached word count for the chapter';
COMMENT ON COLUMN public.chapters.status IS 'Chapter status: draft, revising, or final';
