-- Purpose: Creates a public 'profiles' table linked to 'auth.users'.
-- This table is often used to store public user data.
-- Many other scripts in this project assume this table (or a similar one) exists.

-- Ensure the extensions schema exists if not already present
CREATE SCHEMA IF NOT EXISTS extensions;
-- Enable pgcrypto for gen_random_uuid if not already available,
-- though gen_random_uuid() is core in PostgreSQL 13+
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Add other profile fields as needed, e.g., email as a non-unique field if needed
  email TEXT,
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 50)
);

COMMENT ON TABLE public.profiles IS 'Stores public user profile information, linked to authentication users.';
COMMENT ON COLUMN public.profiles.id IS 'User ID, references auth.users.id.';

-- Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    -- Attempt to use the part of the email before '@' as username,
    -- or fallback to a unique string if it's too short or taken.
    -- Ensure this logic matches your desired username generation strategy.
    CASE
      WHEN char_length(substring(NEW.email from '^[^@]+')) >= 3 THEN substring(NEW.email from '^[^@]+')
      ELSE 'user_' || substr(NEW.id::text, 1, 8)
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT '000-create-profiles-table.sql executed successfully.' AS status;
