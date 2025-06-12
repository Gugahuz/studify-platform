-- First, let's check what tables and columns currently exist
DO $$
BEGIN
    RAISE NOTICE 'Checking current database schema...';
END $$;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or update tests table
DO $$
BEGIN
    -- Create tests table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tests') THEN
        CREATE TABLE tests (
            id INT PRIMARY KEY,
            title TEXT NOT NULL,
            subject TEXT,
            description TEXT,
            duration_minutes INT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created tests table';
    ELSE
        RAISE NOTICE 'Tests table already exists';
    END IF;

    -- Add missing columns to tests table
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'duration_minutes') THEN
        ALTER TABLE tests ADD COLUMN duration_minutes INT;
        RAISE NOTICE 'Added duration_minutes column to tests table';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'created_at') THEN
        ALTER TABLE tests ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column to tests table';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'updated_at') THEN
        ALTER TABLE tests ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to tests table';
    END IF;
END $$;

-- Create or update test_attempts table
DO $$
BEGIN
    -- Create test_attempts table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_attempts') THEN
        CREATE TABLE test_attempts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            test_id INT,
            score FLOAT NOT NULL,
            total_questions INT NOT NULL,
            correct_answers INT NOT NULL,
            incorrect_answers INT NOT NULL,
            unanswered_questions INT DEFAULT 0,
            time_spent_seconds INT,
            time_allowed_seconds INT,
            completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            user_rating INT CHECK (user_rating >= 1 AND user_rating <= 5),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created test_attempts table';
    ELSE
        RAISE NOTICE 'Test_attempts table already exists';
    END IF;

    -- Add missing columns to test_attempts table
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'time_spent_seconds') THEN
        ALTER TABLE test_attempts ADD COLUMN time_spent_seconds INT;
        RAISE NOTICE 'Added time_spent_seconds column to test_attempts table';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'time_allowed_seconds') THEN
        ALTER TABLE test_attempts ADD COLUMN time_allowed_seconds INT;
        RAISE NOTICE 'Added time_allowed_seconds column to test_attempts table';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'user_rating') THEN
        ALTER TABLE test_attempts ADD COLUMN user_rating INT CHECK (user_rating >= 1 AND user_rating <= 5);
        RAISE NOTICE 'Added user_rating column to test_attempts table';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'created_at') THEN
        ALTER TABLE test_attempts ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column to test_attempts table';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'updated_at') THEN
        ALTER TABLE test_attempts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to test_attempts table';
    END IF;

    -- Rename old columns if they exist
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'time_spent') THEN
        ALTER TABLE test_attempts RENAME COLUMN time_spent TO time_spent_seconds;
        RAISE NOTICE 'Renamed time_spent to time_spent_seconds';
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'time_allowed') THEN
        ALTER TABLE test_attempts RENAME COLUMN time_allowed TO time_allowed_seconds;
        RAISE NOTICE 'Renamed time_allowed to time_allowed_seconds';
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'test_subject') THEN
        -- We'll handle this in the API instead of renaming, as it might conflict with the tests table relationship
        RAISE NOTICE 'Found test_subject column - will handle in API';
    END IF;
END $$;

-- Create or update test_answers table
DO $$
BEGIN
    -- Create test_answers table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_answers') THEN
        CREATE TABLE test_answers (
            id SERIAL PRIMARY KEY,
            attempt_id UUID NOT NULL,
            question_id INT,
            question_text TEXT,
            user_answer TEXT,
            correct_answer TEXT,
            is_correct BOOLEAN,
            time_spent_on_question_seconds INT,
            subject_area TEXT,
            difficulty TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created test_answers table';
    ELSE
        RAISE NOTICE 'Test_answers table already exists';
    END IF;

    -- Add missing columns to test_answers table
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_answers' AND column_name = 'time_spent_on_question_seconds') THEN
        ALTER TABLE test_answers ADD COLUMN time_spent_on_question_seconds INT;
        RAISE NOTICE 'Added time_spent_on_question_seconds column to test_answers table';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_answers' AND column_name = 'subject_area') THEN
        ALTER TABLE test_answers ADD COLUMN subject_area TEXT;
        RAISE NOTICE 'Added subject_area column to test_answers table';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_answers' AND column_name = 'difficulty') THEN
        ALTER TABLE test_answers ADD COLUMN difficulty TEXT;
        RAISE NOTICE 'Added difficulty column to test_answers table';
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key from test_attempts to auth.users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'test_attempts_user_id_fkey' 
        AND table_name = 'test_attempts'
    ) THEN
        -- Check if auth.users table exists first
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
            ALTER TABLE test_attempts ADD CONSTRAINT test_attempts_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint from test_attempts to auth.users';
        ELSE
            RAISE NOTICE 'auth.users table not found - skipping foreign key constraint';
        END IF;
    END IF;

    -- Add foreign key from test_attempts to tests if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'test_attempts_test_id_fkey' 
        AND table_name = 'test_attempts'
    ) THEN
        ALTER TABLE test_attempts ADD CONSTRAINT test_attempts_test_id_fkey 
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint from test_attempts to tests';
    END IF;

    -- Add foreign key from test_answers to test_attempts if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'test_answers_attempt_id_fkey' 
        AND table_name = 'test_answers'
    ) THEN
        ALTER TABLE test_answers ADD CONSTRAINT test_answers_attempt_id_fkey 
        FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint from test_answers to test_attempts';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_completed_at ON test_attempts(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_answers_attempt_id ON test_answers(attempt_id);

-- Create or replace function to update 'updated_at' column
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_tests') THEN
    CREATE TRIGGER set_timestamp_tests
    BEFORE UPDATE ON tests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
    RAISE NOTICE 'Created trigger for tests table';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_test_attempts') THEN
    CREATE TRIGGER set_timestamp_test_attempts
    BEFORE UPDATE ON test_attempts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
    RAISE NOTICE 'Created trigger for test_attempts table';
  END IF;
END $$;

-- Final verification - show current schema
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Final schema verification:';
    
    FOR rec IN 
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name IN ('tests', 'test_attempts', 'test_answers') 
        AND table_schema = 'public'
        ORDER BY table_name, ordinal_position
    LOOP
        RAISE NOTICE '  %.% (%) ', rec.table_name, rec.column_name, rec.data_type;
    END LOOP;
END $$;
