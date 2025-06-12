-- Fix user_id type compatibility - Version 2 (Simplified)

-- First, let's check what we're working with
DO $$
DECLARE
    user_id_type TEXT;
    auth_users_id_type TEXT;
    test_attempts_exists BOOLEAN;
    auth_users_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Starting user_id type fix...';
    
    -- Check if tables exist
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_attempts'
    ) INTO test_attempts_exists;
    
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users'
    ) INTO auth_users_exists;
    
    RAISE NOTICE 'Tables exist - test_attempts: %, auth.users: %', test_attempts_exists, auth_users_exists;
    
    IF test_attempts_exists THEN
        SELECT data_type INTO user_id_type
        FROM information_schema.columns 
        WHERE table_name = 'test_attempts' 
        AND column_name = 'user_id' 
        AND table_schema = 'public';
        
        RAISE NOTICE 'Current test_attempts.user_id type: %', COALESCE(user_id_type, 'NOT FOUND');
    END IF;
    
    IF auth_users_exists THEN
        SELECT data_type INTO auth_users_id_type
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'id' 
        AND table_schema = 'auth';
        
        RAISE NOTICE 'Current auth.users.id type: %', COALESCE(auth_users_id_type, 'NOT FOUND');
    END IF;
END $$;

-- Drop existing foreign key constraints if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'test_attempts_user_id_fkey' 
        AND table_name = 'test_attempts'
    ) THEN
        ALTER TABLE test_attempts DROP CONSTRAINT test_attempts_user_id_fkey;
        RAISE NOTICE 'Dropped existing test_attempts_user_id_fkey constraint';
    END IF;
END $$;

-- Fix user_id column type if needed
DO $$
DECLARE
    user_id_type TEXT;
    auth_users_id_type TEXT;
    needs_conversion BOOLEAN := FALSE;
BEGIN
    -- Get current types
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
    
    -- Check if conversion is needed
    IF user_id_type IS NOT NULL AND auth_users_id_type IS NOT NULL THEN
        IF user_id_type != auth_users_id_type THEN
            needs_conversion := TRUE;
            RAISE NOTICE 'Type conversion needed: % -> %', user_id_type, auth_users_id_type;
        END IF;
    END IF;
    
    -- Convert if needed
    IF needs_conversion THEN
        IF auth_users_id_type = 'uuid' AND user_id_type = 'text' THEN
            -- Convert text to uuid
            RAISE NOTICE 'Converting user_id from text to uuid...';
            
            -- First, clean up any invalid UUIDs
            DELETE FROM test_attempts 
            WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
            
            -- Convert the column type
            ALTER TABLE test_attempts ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
            RAISE NOTICE 'Successfully converted user_id to uuid';
            
        ELSIF auth_users_id_type = 'text' AND user_id_type = 'uuid' THEN
            -- Convert uuid to text
            RAISE NOTICE 'Converting user_id from uuid to text...';
            ALTER TABLE test_attempts ALTER COLUMN user_id TYPE text USING user_id::text;
            RAISE NOTICE 'Successfully converted user_id to text';
        ELSE
            RAISE NOTICE 'Unsupported type conversion: % to %', user_id_type, auth_users_id_type;
        END IF;
    ELSE
        RAISE NOTICE 'No type conversion needed';
    END IF;
END $$;

-- Add foreign key constraint if types are compatible
DO $$
DECLARE
    user_id_type TEXT;
    auth_users_id_type TEXT;
    auth_users_exists BOOLEAN;
BEGIN
    -- Check if auth.users exists
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users'
    ) INTO auth_users_exists;
    
    IF auth_users_exists THEN
        -- Get current types after potential conversion
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
        
        IF user_id_type = auth_users_id_type THEN
            -- Types are compatible, add foreign key
            ALTER TABLE test_attempts ADD CONSTRAINT test_attempts_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint test_attempts_user_id_fkey';
        ELSE
            RAISE NOTICE 'Types still incompatible after conversion: % vs %', user_id_type, auth_users_id_type;
        END IF;
    ELSE
        RAISE NOTICE 'auth.users table not found - skipping foreign key constraint';
    END IF;
END $$;

-- Add other foreign key constraints
DO $$
BEGIN
    -- Add foreign key from test_attempts to tests if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'test_attempts_test_id_fkey' 
        AND table_name = 'test_attempts'
    ) THEN
        ALTER TABLE test_attempts ADD CONSTRAINT test_attempts_test_id_fkey 
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint test_attempts_test_id_fkey';
    END IF;

    -- Add foreign key from test_answers to test_attempts if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'test_answers_attempt_id_fkey' 
        AND table_name = 'test_answers'
    ) THEN
        ALTER TABLE test_answers ADD CONSTRAINT test_answers_attempt_id_fkey 
        FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint test_answers_attempt_id_fkey';
    END IF;
END $$;

-- Final status
DO $$
DECLARE
    user_id_type TEXT;
    auth_users_id_type TEXT;
    fk_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== FINAL STATUS ===';
    
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
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'test_attempts_user_id_fkey' 
        AND table_name = 'test_attempts'
    ) INTO fk_exists;
    
    RAISE NOTICE 'test_attempts.user_id type: %', COALESCE(user_id_type, 'NOT FOUND');
    RAISE NOTICE 'auth.users.id type: %', COALESCE(auth_users_id_type, 'NOT FOUND');
    RAISE NOTICE 'Foreign key exists: %', fk_exists;
    RAISE NOTICE 'Types compatible: %', CASE WHEN user_id_type = auth_users_id_type THEN 'YES' ELSE 'NO' END;
    
    RAISE NOTICE 'User ID type fix completed successfully!';
END $$;
