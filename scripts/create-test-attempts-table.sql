-- Create test_attempts table with the correct structure
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  test_id INTEGER NOT NULL,
  test_title TEXT NOT NULL,
  subject TEXT,
  score DECIMAL(5,2) NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  incorrect_answers INTEGER NOT NULL,
  unanswered_questions INTEGER DEFAULT 0,
  time_spent INTEGER NOT NULL,
  time_allowed INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_rating INTEGER,
  CONSTRAINT score_range CHECK (score >= 0 AND score <= 100),
  CONSTRAINT rating_range CHECK (user_rating >= 1 AND user_rating <= 5)
);

-- Create test_answers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.test_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER DEFAULT 0,
  subject_area TEXT,
  difficulty TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON public.test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_completed_at ON public.test_attempts(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_answers_attempt_id ON public.test_answers(attempt_id);

-- Enable Row Level Security
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for test_attempts
DROP POLICY IF EXISTS "Users can view their own test attempts" ON public.test_attempts;
CREATE POLICY "Users can view their own test attempts" ON public.test_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own test attempts" ON public.test_attempts;
CREATE POLICY "Users can insert their own test attempts" ON public.test_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own test attempts" ON public.test_attempts;
CREATE POLICY "Users can update their own test attempts" ON public.test_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for test_answers
DROP POLICY IF EXISTS "Users can view their own test answers" ON public.test_answers;
CREATE POLICY "Users can view their own test answers" ON public.test_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_attempts ta 
      WHERE ta.id = test_answers.attempt_id 
      AND ta.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own test answers" ON public.test_answers;
CREATE POLICY "Users can insert their own test answers" ON public.test_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_attempts ta 
      WHERE ta.id = test_answers.attempt_id 
      AND ta.user_id = auth.uid()
    )
  );

-- Show the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'test_attempts'
ORDER BY ordinal_position;
