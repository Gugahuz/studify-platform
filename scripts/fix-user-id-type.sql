-- Fix user_id type compatibility issues
DO $$
DECLARE
    user_id_type TEXT;
    auth_users_id_type TEXT;
BEGIN
    RAISE NOTICE 'Starting user_id type compatibility fix...';
    
    -- Check the current type of user_id in test_attempts
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_name = 'test_attempts' 
    AND column_name = 'user_id' 
    AND table_schema = 'public';
    
    -- Check the type of id in auth.users if it exists
    SELECT data_type INTO auth_users_id_type
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'id' 
    AND table_schema = 'auth';
    
    RAISE NOTICE 'Current user_id type in test_attempts: %', COALESCE(user_id_type, 'NOT FOUND');
    RAISE NOTICE 'Current id type in auth.users: %', COALESCE(auth_users_id_type, 'NOT FOUND');
    
    -- If auth.users exists and types don't match, fix the type
    IF auth_users_id_type IS NOT NULL AND user_id_type IS NOT NULL THEN
        IF user_id_type != auth_users_id_type THEN
            RAISE NOTICE 'Type mismatch detected. Converting user_id from % to %', user_id_type, auth_users_id_type;
            
            -- Drop existing foreign key constraint if it exists
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'test_attempts_user_id_fkey' 
                AND table_name = 'test_attempts'
            ) THEN
                ALTER TABLE test_attempts DROP CONSTRAINT test_attempts_user_id_fkey;
                RAISE NOTICE 'Dropped existing foreign key constraint';
            END IF;
            
            -- Convert the column type based on what auth.users uses
            IF auth_users_id_type = 'uuid' THEN
                -- Convert text to uuid
                RAISE NOTICE 'Converting user_id from text to uuid...';
                
                -- First, let's see if we have any data that's not valid UUID
                IF EXISTS (
                    SELECT 1 FROM test_attempts 
                    WHERE user_id IS NOT NULL 
                    AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                ) THEN
                    RAISE NOTICE 'Found non-UUID values in user_id. Cleaning up...';
                    -- You might want to handle this differently based on your data
                    -- For now, we'll set invalid UUIDs to NULL
                    UPDATE test_attempts 
                    SET user_id = NULL 
                    WHERE user_id IS NOT NULL 
                    AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
                END IF;
                
                -- Now convert the column type
                ALTER TABLE test_attempts ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
                RAISE NOTICE 'Successfully converted user_id to UUID type';
                
            ELSIF auth_users_id_type = 'text' THEN
                -- Convert uuid to text (less common)
                RAISE NOTICE 'Converting user_id from uuid to text...';
                ALTER TABLE test_attempts ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
                RAISE NOTICE 'Successfully converted user_id to TEXT type';
            END IF;
            
        ELSE
            RAISE NOTICE 'Types already match: %', user_id_type;
        END IF;
    ELSE
        RAISE NOTICE 'Cannot determine type compatibility - auth.users may not exist or columns not found';
    END IF;
    
END $$;

-- Now run the main schema fix without the problematic foreign key
DO $$
BEGIN
    RAISE NOTICE 'Running main schema fix without foreign key constraints...';
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
    current_user_id_type TEXT;
BEGIN
    -- Get current user_id type
    SELECT data_type INTO current_user_id_type
    FROM information_schema.columns 
    WHERE table_name = 'test_attempts' 
    AND column_name = 'user_id' 
    AND table_schema = 'public';

    -- Create test_attempts table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_attempts') THEN
        -- Use UUID type for user_id by default (most common in Supabase)
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
            test_subject TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created test_attempts table with UUID user_id';
    ELSE
        RAISE NOTICE 'Test_attempts table already exists with user_id type: %', current_user_id_type;
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
        ALTER TABLE test_attempts RENAME COLUMN time_spent TO time_spent_seconds;
        RAISE NOTICE 'Renamed time_spent to time_spent_seconds';
    ELSIF NOT has_time_spent AND NOT has_time_spent_seconds THEN
        ALTER TABLE test_attempts ADD COLUMN time_spent_seconds INT;
        RAISE NOTICE 'Added time_spent_seconds column';
    ELSIF has_time_spent AND has_time_spent_seconds THEN
        EXECUTE 'UPDATE test_attempts SET time_spent_seconds = COALESCE(time_spent_seconds, time_spent) WHERE time_spent_seconds IS NULL AND time_spent IS NOT NULL';
        ALTER TABLE test_attempts DROP COLUMN time_spent;
        RAISE NOTICE 'Merged time_spent into time_spent_seconds and dropped old column';
    END IF;

    -- Handle time_allowed columns
    IF has_time_allowed AND NOT has_time_allowed_seconds THEN
        ALTER TABLE test_attempts RENAME COLUMN time_allowed TO time_allowed_seconds;
        RAISE NOTICE 'Renamed time_allowed to time_allowed_seconds';
    ELSIF NOT has_time_allowed AND NOT has_time_allowed_seconds THEN
        ALTER TABLE test_attempts ADD COLUMN time_allowed_seconds INT;
        RAISE NOTICE 'Added time_allowed_seconds column';
    ELSIF has_time_allowed AND has_time_allowed_seconds THEN
        EXECUTE 'UPDATE test_attempts SET time_allowed_seconds = COALESCE(time_allowed_seconds, time_allowed) WHERE time_allowed_seconds IS NULL AND time_allowed IS NOT NULL';
        ALTER TABLE test_attempts DROP COLUMN time_allowed;
        RAISE NOTICE 'Merged time_allowed into time_allowed_seconds and dropped old column';
    END IF;

    -- Add other missing columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'user_rating') THEN
        ALTER TABLE test_attempts ADD COLUMN user_rating INT CHECK (user_rating >= 1 AND user_rating <= 5);
        RAISE NOTICE 'Added user_rating column to test_attempts table';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'test_subject') THEN
        ALTER TABLE test_attempts ADD COLUMN test_subject TEXT;
        RAISE NOTICE 'Added test_subject column to test_attempts table';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'created_at') THEN
        ALTER TABLE test_attempts ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column to test_attempts table';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'updated_at') THEN
        ALTER TABLE test_attempts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to test_attempts table';
    END IF;
END $$;

-- Create or update test_answers table
DO $$
BEGIN
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
    END IF;

    -- Add missing columns
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

-- Add safe foreign key constraints
DO $$
DECLARE
    user_id_type TEXT;
    auth_users_id_type TEXT;
BEGIN
    -- Check types again after potential conversion
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_name = 'test_attempts' 
    AND column_name = 'user_id' 
    AND table_schema = 'public';
    
    SELECT data_type INTO auth_users_id_type
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'id' 
    AND table_schema = 'auth';

    -- Only add foreign key if types match and auth.users exists
    IF auth_users_id_type IS NOT NULL AND user_id_type = auth_users_id_type THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'test_attempts_user_id_fkey' 
            AND table_name = 'test_attempts'
        ) THEN
            ALTER TABLE test_attempts ADD CONSTRAINT test_attempts_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint from test_attempts to auth.users';
        END IF;
    ELSE
        RAISE NOTICE 'Skipping auth.users foreign key - types: test_attempts.user_id=%, auth.users.id=%', 
                     user_id_type, COALESCE(auth_users_id_type, 'NOT_FOUND');
    END IF;

    -- Add foreign key from test_attempts to tests
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'test_attempts_test_id_fkey' 
        AND table_name = 'test_attempts'
    ) THEN
        ALTER TABLE test_attempts ADD CONSTRAINT test_attempts_test_id_fkey 
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint from test_attempts to tests';
    END IF;

    -- Add foreign key from test_answers to test_attempts
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

RAISE NOTICE '=== USER ID TYPE FIX COMPLETED ===';
