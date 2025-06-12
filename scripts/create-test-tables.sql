-- Function to create test tables if they don't exist
CREATE OR REPLACE FUNCTION create_test_tables_if_not_exist()
RETURNS void AS $$
BEGIN
  -- Create test_attempts table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_attempts') THEN
    CREATE TABLE public.test_attempts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      test_id INTEGER NOT NULL,
      test_title TEXT NOT NULL,
      test_subject TEXT NOT NULL, -- Using test_subject instead of subject
      score DECIMAL(5,2) NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      incorrect_answers INTEGER NOT NULL,
      unanswered_questions INTEGER NOT NULL DEFAULT 0,
      time_spent INTEGER NOT NULL, -- in seconds
      time_allowed INTEGER NOT NULL, -- in seconds
      completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      user_rating INTEGER, -- 1-5 star rating
      CONSTRAINT score_range CHECK (score >= 0 AND score <= 100)
    );
    
    -- Create indexes
    CREATE INDEX idx_test_attempts_user_id ON public.test_attempts(user_id);
    CREATE INDEX idx_test_attempts_completed_at ON public.test_attempts(completed_at DESC);
    
    -- Enable RLS
    ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can view their own test attempts" ON public.test_attempts
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own test attempts" ON public.test_attempts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Create test_answers table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_answers') THEN
    CREATE TABLE public.test_answers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      user_answer TEXT,
      correct_answer TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      time_spent INTEGER DEFAULT 0, -- in seconds
      subject_area TEXT,
      difficulty TEXT
    );
    
    -- Create index
    CREATE INDEX idx_test_answers_attempt_id ON public.test_answers(attempt_id);
    
    -- Enable RLS
    ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can view their own test answers" ON public.test_answers
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.test_attempts ta 
          WHERE ta.id = test_answers.attempt_id 
          AND ta.user_id = auth.uid()
        )
      );
    
    CREATE POLICY "Users can insert their own test answers" ON public.test_answers
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.test_attempts ta 
          WHERE ta.id = test_answers.attempt_id 
          AND ta.user_id = auth.uid()
        )
      );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get column names of a table
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE (column_name text, data_type text) AS $$
BEGIN
  RETURN QUERY
  SELECT c.column_name::text, c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  AND c.table_name = table_name
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to ensure tables exist
SELECT create_test_tables_if_not_exist();
