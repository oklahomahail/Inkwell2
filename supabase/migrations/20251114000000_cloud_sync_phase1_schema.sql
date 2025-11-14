-- Cloud Sync Phase 1: Schema Alignment & Infrastructure
-- Date: 2025-11-14
-- Purpose: Align Supabase schema with IndexedDB structure for always-on sync
-- Safe to run multiple times (idempotent)

-- ============================================================================
-- PART 1: Extend Projects Table
-- Add fields that exist in IndexedDB but missing in Supabase
-- ============================================================================

-- Add project metadata fields
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS genre TEXT,
  ADD COLUMN IF NOT EXISTS target_word_count INT,
  ADD COLUMN IF NOT EXISTS current_word_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claude_context JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS story_template_id TEXT,
  ADD COLUMN IF NOT EXISTS story_template_version TEXT,
  ADD COLUMN IF NOT EXISTS beat_mapping JSONB,
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS creation_mode TEXT CHECK (creation_mode IN ('writing', 'planning'));

-- Add comments for documentation
COMMENT ON COLUMN public.projects.genre IS 'Story genre (fantasy, scifi, romance, etc.)';
COMMENT ON COLUMN public.projects.target_word_count IS 'Author goal for total word count';
COMMENT ON COLUMN public.projects.current_word_count IS 'Current total words across all chapters';
COMMENT ON COLUMN public.projects.claude_context IS 'Claude context settings (includeCharacters, maxCharacters, etc.)';
COMMENT ON COLUMN public.projects.story_template_id IS 'ID of story template (Save the Cat, Hero Journey, etc.)';
COMMENT ON COLUMN public.projects.beat_mapping IS 'Mapping of template beats to chapters';
COMMENT ON COLUMN public.projects.is_demo IS 'Tutorial/demo project - excluded from analytics';
COMMENT ON COLUMN public.projects.creation_mode IS 'How project was created (writing-first or planning-first)';

-- ============================================================================
-- PART 2: Extend Chapters Table
-- Add fields for enhanced chapter metadata
-- ============================================================================

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'first-draft', 'revised', 'completed')),
  ADD COLUMN IF NOT EXISTS word_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_word_count INT,
  ADD COLUMN IF NOT EXISTS characters_in_chapter TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS plot_points_resolved TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

COMMENT ON COLUMN public.chapters.summary IS 'Brief summary of chapter events';
COMMENT ON COLUMN public.chapters.status IS 'Chapter lifecycle status';
COMMENT ON COLUMN public.chapters.word_count IS 'Current word count (auto-calculated)';
COMMENT ON COLUMN public.chapters.target_word_count IS 'Author target for this chapter';
COMMENT ON COLUMN public.chapters.characters_in_chapter IS 'Array of character IDs appearing in this chapter';
COMMENT ON COLUMN public.chapters.plot_points_resolved IS 'Array of plot note IDs resolved in this chapter';
COMMENT ON COLUMN public.chapters.notes IS 'Author notes about this chapter';

-- ============================================================================
-- PART 3: Create Sections Table
-- Chapters can have subsections (scenes within chapters)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Section',
  content TEXT NOT NULL DEFAULT '',
  order_in_chapter INT NOT NULL DEFAULT 0,
  word_count INT DEFAULT 0,

  -- Sync metadata
  client_rev BIGINT NOT NULL DEFAULT 0,
  client_hash TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT unique_section_order UNIQUE (chapter_id, order_in_chapter)
);

-- Indexes for sections
CREATE INDEX IF NOT EXISTS idx_sections_chapter
  ON public.sections (chapter_id, order_in_chapter);

CREATE INDEX IF NOT EXISTS idx_sections_project_updated
  ON public.sections (project_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_sections_deleted
  ON public.sections (deleted_at) WHERE deleted_at IS NULL;

-- Hydration optimization index
CREATE INDEX IF NOT EXISTS idx_sections_hydration
  ON public.sections (project_id, updated_at DESC, id);

COMMENT ON TABLE public.sections IS 'Subsections within chapters (scenes, breaks, etc.)';

-- ============================================================================
-- PART 4: Create Project Settings Table
-- Per-project user preferences (font, theme, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_settings (
  project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Typography
  font_family TEXT DEFAULT 'Georgia, serif',
  font_size INT DEFAULT 16 CHECK (font_size >= 10 AND font_size <= 32),
  line_height NUMERIC DEFAULT 1.6 CHECK (line_height >= 1.0 AND line_height <= 3.0),

  -- Formatting
  indent_paragraphs BOOLEAN DEFAULT false,

  -- Theme
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'sepia')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.project_settings IS 'Per-project writing preferences and formatting settings';

-- ============================================================================
-- PART 5: Add Composite Indexes for Hydration Performance
-- Optimize cloud → local sync queries
-- ============================================================================

-- Chapters hydration (project_id + updated_at + id for pagination)
CREATE INDEX IF NOT EXISTS idx_chapters_hydration
  ON public.chapters (project_id, updated_at DESC, id)
  WHERE deleted_at IS NULL;

-- Characters hydration
CREATE INDEX IF NOT EXISTS idx_characters_hydration
  ON public.characters (project_id, updated_at DESC, id)
  WHERE deleted_at IS NULL;

-- Notes hydration
CREATE INDEX IF NOT EXISTS idx_notes_hydration
  ON public.notes (project_id, updated_at DESC, id)
  WHERE deleted_at IS NULL;

-- Projects hydration (for user's project list)
CREATE INDEX IF NOT EXISTS idx_projects_hydration
  ON public.projects (owner_id, updated_at DESC, id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PART 6: RLS Policies for New Tables
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_settings ENABLE ROW LEVEL SECURITY;

-- Sections policies (inherit project access)
DROP POLICY IF EXISTS "sections_read" ON public.sections;
CREATE POLICY "sections_read" ON public.sections
  FOR SELECT USING (public.can_access_project(project_id));

DROP POLICY IF EXISTS "sections_insert" ON public.sections;
CREATE POLICY "sections_insert" ON public.sections
  FOR INSERT WITH CHECK (public.can_access_project(project_id));

DROP POLICY IF EXISTS "sections_update" ON public.sections;
CREATE POLICY "sections_update" ON public.sections
  FOR UPDATE USING (public.can_access_project(project_id));

DROP POLICY IF EXISTS "sections_delete" ON public.sections;
CREATE POLICY "sections_delete" ON public.sections
  FOR DELETE USING (public.can_access_project(project_id));

-- Project settings policies (owner only)
DROP POLICY IF EXISTS "project_settings_read" ON public.project_settings;
CREATE POLICY "project_settings_read" ON public.project_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_settings.project_id
        AND public.can_access_project(p.id)
    )
  );

DROP POLICY IF EXISTS "project_settings_insert" ON public.project_settings;
CREATE POLICY "project_settings_insert" ON public.project_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_settings.project_id
        AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "project_settings_update" ON public.project_settings;
CREATE POLICY "project_settings_update" ON public.project_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_settings.project_id
        AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "project_settings_delete" ON public.project_settings;
CREATE POLICY "project_settings_delete" ON public.project_settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_settings.project_id
        AND p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 7: Triggers for Auto-Update Timestamps
-- Apply existing touch_updated_at trigger to new tables
-- ============================================================================

-- Sections trigger
DROP TRIGGER IF EXISTS touch_sections_updated_at ON public.sections;
CREATE TRIGGER touch_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- Project settings trigger
DROP TRIGGER IF EXISTS touch_project_settings_updated_at ON public.project_settings;
CREATE TRIGGER touch_project_settings_updated_at
  BEFORE UPDATE ON public.project_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================================
-- PART 8: Enable Realtime for Cloud Sync
-- Add all tables to realtime publication
-- ============================================================================

-- Note: This may require superuser permissions
-- Run these commands manually in Supabase SQL Editor if they fail:

DO $$
BEGIN
  -- Add tables to realtime publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'projects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'chapters'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chapters;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'sections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sections;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'characters'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'project_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_settings;
  END IF;
END $$;

-- ============================================================================
-- VALIDATION QUERIES (for manual testing)
-- Run these to verify migration succeeded
-- ============================================================================

-- Check new columns exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'genre') = 1,
    'projects.genre column missing';

  ASSERT (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_name = 'sections') = 1,
    'sections table missing';

  ASSERT (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_name = 'project_settings') = 1,
    'project_settings table missing';

  RAISE NOTICE 'Migration validation: All checks passed ✓';
END $$;

-- Check realtime publications
SELECT
  schemaname,
  tablename,
  'Added to realtime' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
ORDER BY tablename;
