-- Fix the test_attempts table to match the expected schema
-- This script will ensure the table has the correct structure

-- First, let's check if the table exists and what columns it has
DO $$
BEGIN
  -- Check if test_attempts table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_attempts') THEN
    RAISE NOTICE 'test_attempts table exists, checking structure...';
    
    -- Add missing columns if they don't exist
    
    -- Add test_subject column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'test_attempts' 
                   AND column_name = 'test_subject') THEN
      ALTER TABLE public.test_attempts ADD COLUMN test_subject TEXT DEFAULT 'Geral';
      RAISE NOTICE 'Added test_subject column';
    END IF;
    
    -- Add test_title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'test_attempts' 
                   AND column_name = 'test_title') THEN
      ALTER TABLE public.test_attempts ADD COLUMN test_title TEXT DEFAULT 'Simulado';
      RAISE NOTICE 'Added test_title column';
    END IF;
    
    -- Add unanswered_questions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'test_attempts' 
                   AND column_name = 'unanswered_questions') THEN
      ALTER TABLE public.test_attempts ADD COLUMN unanswered_questions INTEGER DEFAULT 0;
      RAISE NOTICE 'Added unanswered_questions column';
    END IF;
    
    -- Add user_rating column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'test_attempts' 
                   AND column_name = 'user_rating') THEN
      ALTER TABLE public.test_attempts ADD COLUMN user_rating INTEGER;
      RAISE NOTICE 'Added user_rating column';
    END IF;
    
  ELSE
    -- Create the table if it doesn't exist
    RAISE NOTICE 'Creating test_attempts table...';
    
    CREATE TABLE public.test_attempts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      test_id INTEGER NOT NULL,
      test_title TEXT NOT NULL DEFAULT 'Simulado',
      test_subject TEXT NOT NULL DEFAULT 'Geral',
      score DECIMAL(5,2) NOT NULL DEFAULT 0,
      total_questions INTEGER NOT NULL DEFAULT 0,
      correct_answers INTEGER NOT NULL DEFAULT 0,
      incorrect_answers INTEGER NOT NULL DEFAULT 0,
      unanswered_questions INTEGER NOT NULL DEFAULT 0,
      time_spent INTEGER NOT NULL DEFAULT 0,
      time_allowed INTEGER NOT NULL DEFAULT 0,
      completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      user_rating INTEGER,
      CONSTRAINT score_range CHECK (score >= 0 AND score <= 100),
      CONSTRAINT rating_range CHECK (user_rating >= 1 AND user_rating <= 5)
    );
    
    -- Create indexes
    CREATE INDEX idx_test_attempts_user_id ON public.test_attempts(user_id);
    CREATE INDEX idx_test_attempts_completed_at ON public.test_attempts(completed_at DESC);
    
    RAISE NOTICE 'test_attempts table created successfully';
  END IF;
  
  -- Check if test_answers table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_answers') THEN
    RAISE NOTICE 'Creating test_answers table...';
    
    CREATE TABLE public.test_answers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      user_answer TEXT,
      correct_answer TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      time_spent INTEGER DEFAULT 0,
      subject_area TEXT,
      difficulty TEXT
    );
    
    -- Create index
    CREATE INDEX idx_test_answers_attempt_id ON public.test_answers(attempt_id);
    
    RAISE NOTICE 'test_answers table created successfully';
  END IF;
  
  -- Enable RLS if not already enabled
  ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
  
  -- Create or update RLS policies for test_attempts
  DROP POLICY IF EXISTS "Users can view their own test attempts" ON public.test_attempts;
  CREATE POLICY "Users can view their own test attempts" ON public.test_attempts
    FOR SELECT USING (auth.uid()::text = user_id::text);
  
  DROP POLICY IF EXISTS "Users can insert their own test attempts" ON public.test_attempts;
  CREATE POLICY "Users can insert their own test attempts" ON public.test_attempts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
  
  DROP POLICY IF EXISTS "Users can update their own test attempts" ON public.test_attempts;
  CREATE POLICY "Users can update their own test attempts" ON public.test_attempts
    FOR UPDATE USING (auth.uid()::text = user_id::text);
  
  -- Create or update RLS policies for test_answers
  DROP POLICY IF EXISTS "Users can view their own test answers" ON public.test_answers;
  CREATE POLICY "Users can view their own test answers" ON public.test_answers
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.test_attempts ta 
        WHERE ta.id = test_answers.attempt_id 
        AND ta.user_id::text = auth.uid()::text
      )
    );
  
  DROP POLICY IF EXISTS "Users can insert their own test answers" ON public.test_answers;
  CREATE POLICY "Users can insert their own test answers" ON public.test_answers
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.test_attempts ta 
        WHERE ta.id = test_answers.attempt_id 
        AND ta.user_id::text = auth.uid()::text
      )
    );
  
  RAISE NOTICE 'RLS policies updated successfully';
  
END $$;

-- Show the final table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'test_attempts'
ORDER BY ordinal_position;
