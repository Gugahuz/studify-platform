-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tests table to store information about each test
CREATE TABLE IF NOT EXISTS tests (
    id INT PRIMARY KEY, -- Using the ID from mock data (e.g., 1, 2, 3)
    title TEXT NOT NULL,
    subject TEXT,
    description TEXT,
    duration_minutes INT, -- Original duration from mock data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create test_attempts table to store user's attempts
CREATE TABLE IF NOT EXISTS test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    test_id INT REFERENCES tests(id) ON DELETE SET NULL, -- Link to the specific test
    score FLOAT NOT NULL, -- Percentage score, e.g., 85.5
    total_questions INT NOT NULL,
    correct_answers INT NOT NULL,
    incorrect_answers INT NOT NULL,
    unanswered_questions INT DEFAULT 0,
    time_spent_seconds INT, -- Time spent by the user in seconds
    time_allowed_seconds INT, -- Total time allowed for the test in seconds
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_rating INT CHECK (user_rating >= 1 AND user_rating <= 5), -- Optional rating (1-5 stars)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create test_answers table for detailed storage of each answer in an attempt
CREATE TABLE IF NOT EXISTS test_answers (
    id SERIAL PRIMARY KEY,
    attempt_id UUID REFERENCES test_attempts(id) ON DELETE CASCADE NOT NULL,
    question_id INT, -- Identifier for the question within its test (e.g., 1, 2, ...)
    question_text TEXT, -- The actual text of the question
    user_answer TEXT, -- The answer text selected/provided by the user
    correct_answer TEXT, -- The correct answer text
    is_correct BOOLEAN,
    time_spent_on_question_seconds INT, -- Optional: time spent on this specific question
    subject_area TEXT, -- e.g., 'Português', 'Matemática'
    difficulty TEXT, -- e.g., 'Fácil', 'Médio', 'Difícil'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_test_answers_attempt_id ON test_answers(attempt_id);

-- Function to update 'updated_at' column
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update 'updated_at' on table updates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_tests') THEN
    CREATE TRIGGER set_timestamp_tests
    BEFORE UPDATE ON tests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_test_attempts') THEN
    CREATE TRIGGER set_timestamp_test_attempts
    BEFORE UPDATE ON test_attempts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END $$;

-- Note: No trigger for test_answers as they are typically immutable once created.

COMMENT ON TABLE tests IS 'Stores definitions of available tests/simulados.';
COMMENT ON COLUMN tests.id IS 'Client-side defined ID for the test (e.g., from mock data).';
COMMENT ON COLUMN tests.duration_minutes IS 'Official duration of the test in minutes.';

COMMENT ON TABLE test_attempts IS 'Records each attempt a user makes on a test.';
COMMENT ON COLUMN test_attempts.score IS 'Overall score as a percentage (0-100).';
COMMENT ON COLUMN test_attempts.time_spent_seconds IS 'Actual time user spent on the test.';
COMMENT ON COLUMN test_attempts.time_allowed_seconds IS 'Maximum time allowed for the test.';

COMMENT ON TABLE test_answers IS 'Stores individual answers for each question within a test attempt.';
COMMENT ON COLUMN test_answers.question_id IS 'Identifier for the question within the original test structure.';
