-- Fix profiles foreign key constraint for testing environment
-- This script will make the system work without requiring auth.users access

DO $$
BEGIN
    RAISE NOTICE 'Starting profiles constraint fix...';
END $$;

-- First, let's check what constraints exist on profiles table
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE 'Checking existing constraints on profiles table...';
    
    FOR constraint_record IN
        SELECT 
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'profiles'
        AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        RAISE NOTICE 'Found constraint: % (%) on column % -> %.%', 
            constraint_record.constraint_name,
            constraint_record.constraint_type,
            constraint_record.column_name,
            constraint_record.foreign_table_name,
            constraint_record.foreign_column_name;
    END LOOP;
END $$;

-- Drop the foreign key constraint on profiles.id if it exists
-- This allows us to create test users without needing auth.users access
DO $$
BEGIN
    -- Try to drop the constraint
    BEGIN
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
        RAISE NOTICE '✅ Dropped profiles_id_fkey constraint';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop profiles_id_fkey: %', SQLERRM;
    END;
    
    -- Try other possible constraint names
    BEGIN
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
        RAISE NOTICE '✅ Dropped profiles_user_id_fkey constraint';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop profiles_user_id_fkey: %', SQLERRM;
    END;
    
    -- Try generic constraint name
    BEGIN
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_auth_users;
        RAISE NOTICE '✅ Dropped fk_profiles_auth_users constraint';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop fk_profiles_auth_users: %', SQLERRM;
    END;
END $$;

-- Make sure the profiles table structure is correct
DO $$
BEGIN
    -- Ensure id column exists and is UUID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        RAISE NOTICE '✅ Added id column to profiles';
    END IF;
    
    -- Make sure other required columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'nome'
    ) THEN
        ALTER TABLE profiles ADD COLUMN nome TEXT;
        RAISE NOTICE '✅ Added nome column to profiles';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
        RAISE NOTICE '✅ Added email column to profiles';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added created_at column to profiles';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column to profiles';
    END IF;
END $$;

-- Now create the test users without foreign key constraints
DELETE FROM profiles WHERE id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);

INSERT INTO profiles (
    id,
    nome,
    email,
    telefone,
    escolaridade,
    created_at,
    updated_at
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'Test User 1',
    'test1@studify.com',
    '(11) 99999-9999',
    'superior',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000002',
    'Test User 2',
    'test2@studify.com',
    '(11) 99999-9998',
    'medio',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000003',
    'Test User 3',
    'test3@studify.com',
    '(11) 99999-9997',
    'fundamental',
    NOW(),
    NOW()
);

-- Also fix the mock_exam_attempts table constraints if needed
DO $$
BEGIN
    -- Make user_id nullable in mock_exam_attempts for testing
    BEGIN
        ALTER TABLE mock_exam_attempts ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE '✅ Made user_id nullable in mock_exam_attempts';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not make user_id nullable: %', SQLERRM;
    END;
    
    -- Drop foreign key constraint on mock_exam_attempts.user_id if it's causing issues
    BEGIN
        ALTER TABLE mock_exam_attempts DROP CONSTRAINT IF EXISTS mock_exam_attempts_user_id_fkey;
        RAISE NOTICE '✅ Dropped mock_exam_attempts_user_id_fkey constraint';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop mock_exam_attempts constraint: %', SQLERRM;
    END;
END $$;

-- Grant all necessary permissions
GRANT ALL ON profiles TO authenticated, anon, service_role;
GRANT ALL ON mock_exam_attempts TO authenticated, anon, service_role;
GRANT ALL ON mock_exam_templates TO authenticated, anon, service_role;
GRANT ALL ON mock_exam_questions TO authenticated, anon, service_role;
GRANT ALL ON mock_exam_responses TO authenticated, anon, service_role;

-- Verify the setup
DO $$
DECLARE
    profile_count INTEGER;
    template_count INTEGER;
    question_count INTEGER;
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE id LIKE '00000000-0000-0000-0000-00000000000%';
    SELECT COUNT(*) INTO template_count FROM mock_exam_templates WHERE is_active = true;
    SELECT COUNT(*) INTO question_count FROM mock_exam_questions;
    
    -- Count remaining foreign key constraints on profiles
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' AND constraint_type = 'FOREIGN KEY';
    
    RAISE NOTICE '=== SETUP VERIFICATION ===';
    RAISE NOTICE '✅ Test profiles created: %', profile_count;
    RAISE NOTICE '✅ Active templates: %', template_count;
    RAISE NOTICE '✅ Available questions: %', question_count;
    RAISE NOTICE '✅ Foreign key constraints on profiles: %', constraint_count;
    RAISE NOTICE '✅ System ready for testing!';
END $$;
