-- Migration: Auto-create profiles on user sign-up
-- This ensures every user has a profile row immediately after authentication
-- and prevents race conditions on first load.
-- Safe to run multiple times (idempotent).

-- 1) Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,                              -- matches auth.users.id
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.touch_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_touch ON public.profiles;
CREATE TRIGGER trg_profiles_touch
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_profiles_updated_at();

-- 3) Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "profiles self select" ON public.profiles;
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
DROP POLICY IF EXISTS "profiles insert (service only)" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- RLS Policies: Users can only read/update their own profile
CREATE POLICY "profiles self select"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles self update"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

-- Only service role can insert (trigger uses SECURITY DEFINER)
CREATE POLICY "profiles insert (service only)"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 4) Backfill for existing users
INSERT INTO public.profiles (id, email, onboarding_completed)
SELECT u.id, COALESCE(u.email, ''), false
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 5) Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6) Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- 7) Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_onboarding_completed_idx ON public.profiles(onboarding_completed);

-- 8) Add helpful comments
COMMENT ON TABLE public.profiles IS 'User profiles - automatically created on sign-up via trigger';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether the user has completed the initial onboarding wizard';
COMMENT ON COLUMN public.profiles.email IS 'User email address (NOT NULL, UNIQUE)';
COMMENT ON COLUMN public.profiles.display_name IS 'Display name set during onboarding';
COMMENT ON COLUMN public.profiles.timezone IS 'User timezone (optional)';
