-- Purpose: Creates tables for tests/quizzes, attempts, and answers.
-- Consolidates logic from various test-related scripts.

-- Tests Table (e.g., ENEM 2023 Simulado, Prova de Português)
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- Changed from SERIAL to UUID for consistency
    title VARCHAR(255) NOT NULL,
    subject_id UUID REFERENCES public.flashcard_subjects(id) ON DELETE SET NULL, -- Optional link to a subject
    description TEXT,
    total_questions INTEGER DEFAULT 0,
    time_allowed_minutes INTEGER, -- e.g., 180 minutes
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.tests IS 'Stores information about tests or quizzes.';

-- Test Attempts Table (A user's attempt at a specific test)
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    score DECIMAL(5,2) DEFAULT 0.00 CHECK (score >= 0 AND score <= 100), -- Percentage score
    total_questions_attempted INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    unanswered_questions INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'abandoned')),
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5), -- Optional rating by user
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.test_attempts IS 'Records each attempt a user makes on a test.';
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_test ON public.test_attempts(user_id, test_id);

-- Test Answers Table (User's answer to a specific question in an attempt)
-- This table assumes questions are defined elsewhere or are part of the test definition (e.g., JSON in tests table)
-- For simplicity, this example doesn't define a separate questions table for tests,
-- but in a full system, you'd likely have one.
CREATE TABLE IF NOT EXISTS public.test_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
    question_identifier TEXT NOT NULL, -- e.g., "q1", "enem_2023_math_q5" or a UUID if questions are in their own table
    question_text_snapshot TEXT, -- Optional: snapshot of question text at time of attempt
    user_answer TEXT, -- Could be 'A', 'B', 'True', 'False', or free text
    correct_answer TEXT, -- Snapshot of correct answer
    is_correct BOOLEAN,
    time_spent_on_question_seconds INTEGER DEFAULT 0,
    subject_area_tag TEXT, -- e.g., 'Algebra', 'Cinematica' for performance analysis
    difficulty_tag TEXT, -- e.g., 'easy', 'medium', 'hard'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.test_answers IS 'Stores user answers for each question in a test attempt.';
CREATE INDEX IF NOT EXISTS idx_test_answers_attempt_id ON public.test_answers(attempt_id);

-- RLS Policies for Tests Schema
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tests are publicly viewable." ON public.tests FOR SELECT USING (true);
CREATE POLICY "Admins can manage tests." ON public.tests FOR ALL USING (true); -- TODO: Refine admin role

ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own test attempts." ON public.test_attempts FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage answers for their own attempts." ON public.test_answers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.test_attempts WHERE id = test_answers.attempt_id AND user_id = auth.uid()));

SELECT '005-create-tests-schema.sql executed successfully.' AS status;
