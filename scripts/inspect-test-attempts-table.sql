-- This script will inspect the test_attempts table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'test_attempts'
ORDER BY ordinal_position;

-- Check if the table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'test_attempts'
);

-- Create the table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'test_attempts'
  ) THEN
    CREATE TABLE public.test_attempts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      test_id INTEGER NOT NULL,
      test_title TEXT NOT NULL,
      subject TEXT NOT NULL,
      score DECIMAL(5,2) NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      incorrect_answers INTEGER NOT NULL,
      unanswered_questions INTEGER DEFAULT 0,
      time_spent INTEGER NOT NULL,
      time_allowed INTEGER NOT NULL,
      completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      user_rating INTEGER
    );
    
    CREATE INDEX idx_test_attempts_user_id ON public.test_attempts(user_id);
    CREATE INDEX idx_test_attempts_completed_at ON public.test_attempts(completed_at DESC);
  END IF;
END
$$;
