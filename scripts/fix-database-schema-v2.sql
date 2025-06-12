-- Enhanced database schema fix with better column checking
DO $$
BEGIN
    RAISE NOTICE 'Starting enhanced database schema fix...';
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

-- Create or update test_attempts table with smart column handling
DO $$
DECLARE
    has_time_spent BOOLEAN;
    has_time_spent_seconds BOOLEAN;
    has_time_allowed BOOLEAN;
    has_time_allowed_seconds BOOLEAN;
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

    -- Check which time columns exist
    SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'time_spent') INTO has_time_spent;
    SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'time_spent_seconds') INTO has_time_spent_seconds;
    SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'time_allowed') INTO has_time_allowed;
    SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'time_allowed_seconds') INTO has_time_allowed_seconds;

    RAISE NOTICE 'Column status: time_spent=%, time_spent_seconds=%, time_allowed=%, time_allowed_seconds=%', 
                 has_time_spent, has_time_spent_seconds, has_time_allowed, has_time_allowed_seconds;

    -- Handle time_spent columns
    IF has_time_spent AND NOT has_time_spent_seconds THEN
        -- Rename old column to new name
        ALTER TABLE test_attempts RENAME COLUMN time_spent TO time_spent_seconds;
        RAISE NOTICE 'Renamed time_spent to time_spent_seconds';
    ELSIF NOT has_time_spent AND NOT has_time_spent_seconds THEN
        -- Neither exists, create the new one
        ALTER TABLE test_attempts ADD COLUMN time_spent_seconds INT;
        RAISE NOTICE 'Added time_spent_seconds column';
    ELSIF has_time_spent AND has_time_spent_seconds THEN
        -- Both exist, drop the old one after copying data if needed
        EXECUTE 'UPDATE test_attempts SET time_spent_seconds = COALESCE(time_spent_seconds, time_spent) WHERE time_spent_seconds IS NULL AND time_spent IS NOT NULL';
        ALTER TABLE test_attempts DROP COLUMN time_spent;
        RAISE NOTICE 'Merged time_spent into time_spent_seconds and dropped old column';
    ELSE
        -- Only time_spent_seconds exists, which is what we want
        RAISE NOTICE 'time_spent_seconds already exists and is correct';
    END IF;

    -- Handle time_allowed columns
    IF has_time_allowed AND NOT has_time_allowed_seconds THEN
        -- Rename old column to new name
        ALTER TABLE test_attempts RENAME COLUMN time_allowed TO time_allowed_seconds;
        RAISE NOTICE 'Renamed time_allowed to time_allowed_seconds';
    ELSIF NOT has_time_allowed AND NOT has_time_allowed_seconds THEN
        -- Neither exists, create the new one
        ALTER TABLE test_attempts ADD COLUMN time_allowed_seconds INT;
        RAISE NOTICE 'Added time_allowed_seconds column';
    ELSIF has_time_allowed AND has_time_allowed_seconds THEN
        -- Both exist, drop the old one after copying data if needed
        EXECUTE 'UPDATE test_attempts SET time_allowed_seconds = COALESCE(time_allowed_seconds, time_allowed) WHERE time_allowed_seconds IS NULL AND time_allowed IS NOT NULL';
        ALTER TABLE test_attempts DROP COLUMN time_allowed;
        RAISE NOTICE 'Merged time_allowed into time_allowed_seconds and dropped old column';
    ELSE
        -- Only time_allowed_seconds exists, which is what we want
        RAISE NOTICE 'time_allowed_seconds already exists and is correct';
    END IF;

    -- Add other missing columns
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

    -- Add test_subject column for backward compatibility
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'test_subject') THEN
        ALTER TABLE test_attempts ADD COLUMN test_subject TEXT;
        RAISE NOTICE 'Added test_subject column to test_attempts table for backward compatibility';
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
    RAISE NOTICE '=== FINAL SCHEMA VERIFICATION ===';
    
    RAISE NOTICE 'TESTS TABLE:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'tests' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  % (%) - nullable: %', rec.column_name, rec.data_type, rec.is_nullable;
    END LOOP;
    
    RAISE NOTICE 'TEST_ATTEMPTS TABLE:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'test_attempts' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  % (%) - nullable: %', rec.column_name, rec.data_type, rec.is_nullable;
    END LOOP;
    
    RAISE NOTICE 'TEST_ANSWERS TABLE:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'test_answers' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  % (%) - nullable: %', rec.column_name, rec.data_type, rec.is_nullable;
    END LOOP;

    RAISE NOTICE '=== FOREIGN KEY CONSTRAINTS ===';
    FOR rec IN 
        SELECT tc.constraint_name, tc.table_name, kcu.column_name, 
               ccu.table_name AS foreign_table_name,
               ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('test_attempts', 'test_answers')
        ORDER BY tc.table_name, tc.constraint_name
    LOOP
        RAISE NOTICE '  %.% -> %.%', rec.table_name, rec.column_name, rec.foreign_table_name, rec.foreign_column_name;
    END LOOP;
    
    RAISE NOTICE '=== SCHEMA FIX COMPLETED SUCCESSFULLY ===';
END $$;
