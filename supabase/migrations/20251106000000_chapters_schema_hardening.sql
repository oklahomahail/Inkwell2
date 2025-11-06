-- 20251106000000_chapters_schema_hardening.sql
-- Purpose: Harden chapters table schema with proper constraints and defaults
-- Addresses: Data integrity, order_index management, and consistency

BEGIN;

-- ============================================
-- 1. Schema Verification & Constraints
-- ============================================

-- Ensure columns have proper NOT NULL constraints
ALTER TABLE public.chapters
  ALTER COLUMN order_index SET NOT NULL,
  ALTER COLUMN content SET NOT NULL,
  ALTER COLUMN content SET DEFAULT ''::text,
  ALTER COLUMN summary SET DEFAULT ''::text,
  ALTER COLUMN word_count SET NOT NULL,
  ALTER COLUMN word_count SET DEFAULT 0;

-- Add non-negative word_count constraint
ALTER TABLE public.chapters
  DROP CONSTRAINT IF EXISTS word_count_nonneg;

ALTER TABLE public.chapters
  ADD CONSTRAINT word_count_nonneg CHECK (word_count >= 0);

-- ============================================
-- 2. Backfill Null Values (Safe for older rows)
-- ============================================

UPDATE public.chapters
SET
  content = COALESCE(content, ''),
  summary = COALESCE(summary, ''),
  word_count = COALESCE(word_count, 0)
WHERE content IS NULL OR summary IS NULL OR word_count IS NULL;

-- ============================================
-- 3. Indexing for Performance
-- ============================================

-- Index for ordering queries (project_id + order_index)
CREATE INDEX IF NOT EXISTS idx_chapters_project_order_index
  ON public.chapters(project_id, order_index);

-- ============================================
-- 4. Auto-assign order_index on INSERT
-- ============================================

-- Function to auto-assign order_index
CREATE OR REPLACE FUNCTION public.chapters_assign_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only auto-assign if order_index is NULL or 0
  IF NEW.order_index IS NULL OR NEW.order_index = 0 THEN
    SELECT COALESCE(MAX(order_index) + 1, 0)
    INTO NEW.order_index
    FROM public.chapters
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_chapters_assign_order ON public.chapters;
CREATE TRIGGER trg_chapters_assign_order
  BEFORE INSERT ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.chapters_assign_order();

-- ============================================
-- 5. Status Column Type Safety (Optional)
-- ============================================

-- Note: Keeping as text for now to maintain backward compatibility
-- You can enable this if you want strict enum type:
--
-- DO $$ BEGIN
--   CREATE TYPE chapter_status AS ENUM ('draft', 'revising', 'final');
-- EXCEPTION WHEN duplicate_object THEN NULL;
-- END $$;
--
-- ALTER TABLE public.chapters
--   ALTER COLUMN status TYPE chapter_status
--   USING CASE LOWER(COALESCE(status, 'draft'))
--     WHEN 'draft' THEN 'draft'::chapter_status
--     WHEN 'revising' THEN 'revising'::chapter_status
--     WHEN 'final' THEN 'final'::chapter_status
--     ELSE 'draft'::chapter_status
--   END,
--   ALTER COLUMN status SET DEFAULT 'draft';

-- For now, just add a CHECK constraint for status values
ALTER TABLE public.chapters
  DROP CONSTRAINT IF EXISTS status_valid_values;

ALTER TABLE public.chapters
  ADD CONSTRAINT status_valid_values
  CHECK (status IN ('draft', 'revising', 'final'));

-- Set default if not already set
ALTER TABLE public.chapters
  ALTER COLUMN status SET DEFAULT 'draft';

COMMIT;

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON COLUMN public.chapters.order_index IS 'Chapter ordering within project (0-indexed, auto-assigned if null)';
COMMENT ON COLUMN public.chapters.content IS 'Full chapter text content';
COMMENT ON COLUMN public.chapters.summary IS 'Brief chapter summary or notes';
COMMENT ON COLUMN public.chapters.word_count IS 'Cached word count for the chapter (computed client-side)';
COMMENT ON COLUMN public.chapters.status IS 'Chapter status: draft, revising, or final';
COMMENT ON CONSTRAINT word_count_nonneg ON public.chapters IS 'Ensures word_count is never negative';
COMMENT ON CONSTRAINT status_valid_values ON public.chapters IS 'Restricts status to valid enum values';
