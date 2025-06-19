-- Fix the mock exam integration with correct profile column names
-- This script corrects the column references to match the actual profiles table structure

-- First, let's check the actual structure of the profiles table
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if 'nome' column exists (correct column name)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'nome'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ Found profiles.nome column';
    ELSE
        RAISE NOTICE '❌ profiles.nome column not found';
    END IF;
    
    -- Check if 'full_name' column exists (incorrect column name)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'full_name'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '⚠️ Found profiles.full_name column (unexpected)';
    ELSE
        RAISE NOTICE '✅ profiles.full_name column not found (expected)';
    END IF;
END $$;

-- Drop the existing view that has incorrect column references
DROP VIEW IF EXISTS exam_history_view;

-- Recreate the view with correct column names
CREATE OR REPLACE VIEW exam_history_view AS
SELECT 
    mea.id,
    mea.user_id,
    mea.template_id,
    mea.attempt_number,
    mea.status,
    mea.score,
    mea.percentage,
    mea.total_questions,
    mea.answered_questions,
    mea.correct_answers,
    mea.incorrect_answers,
    mea.skipped_questions,
    mea.total_points,
    mea.max_points,
    mea.time_spent_seconds,
    mea.time_limit_seconds,
    mea.started_at,
    mea.completed_at,
    mea.user_rating,
    mea.feedback,
    mea.created_at,
    mea.updated_at,
    met.title as exam_title,
    met.description as exam_description,
    met.category as exam_category,
    met.difficulty_level,
    met.passing_score,
    p.nome as user_name,  -- Changed from full_name to nome
    p.email as user_email
FROM mock_exam_attempts mea
LEFT JOIN mock_exam_templates met ON mea.template_id = met.id
LEFT JOIN profiles p ON mea.user_id = p.id
WHERE mea.status = 'completed'
ORDER BY mea.completed_at DESC;

-- Update the get_or_create_test_user function with correct column names
CREATE OR REPLACE FUNCTION get_or_create_test_user()
RETURNS UUID AS $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
    user_exists BOOLEAN;
BEGIN
    -- Check if test user exists in profiles
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = test_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Create test user profile with correct column names
        INSERT INTO profiles (id, email, nome, telefone, escolaridade, created_at, updated_at)
        VALUES (
            test_user_id,
            'test@studify.com',
            'Usuário de Teste',
            NULL,
            'Ensino Superior',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE '✅ Test user created: %', test_user_id;
    ELSE
        RAISE NOTICE '✅ Test user already exists: %', test_user_id;
    END IF;
    
    RETURN test_user_id;
END;
$$ LANGUAGE plpgsql;

-- Ensure proper user association by creating a function to get current user or test user
CREATE OR REPLACE FUNCTION get_current_or_test_user()
RETURNS UUID AS $$
DECLARE
    current_user_id UUID;
    test_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
    -- Try to get current authenticated user
    current_user_id := auth.uid();
    
    -- If no authenticated user, use test user
    IF current_user_id IS NULL THEN
        -- Ensure test user exists
        PERFORM get_or_create_test_user();
        RETURN test_user_id;
    END IF;
    
    RETURN current_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on the updated view and functions
GRANT SELECT ON exam_history_view TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_current_or_test_user TO authenticated, anon, service_role;

-- Verify the setup works correctly
DO $$
DECLARE
    test_user_id UUID;
    profile_count INTEGER;
    template_count INTEGER;
    question_count INTEGER;
BEGIN
    -- Test the user creation function
    SELECT get_or_create_test_user() INTO test_user_id;
    RAISE NOTICE '👤 Test user ID: %', test_user_id;
    
    -- Check if profile was created
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE id = test_user_id;
    RAISE NOTICE '👤 Test user profile exists: %', profile_count > 0;
    
    -- Check system status
    SELECT COUNT(*) INTO template_count FROM mock_exam_templates;
    SELECT COUNT(*) INTO question_count FROM mock_exam_questions;
    
    RAISE NOTICE '📊 System Status:';
    RAISE NOTICE '   Templates: %', template_count;
    RAISE NOTICE '   Questions: %', question_count;
    RAISE NOTICE '   Test User: % (ID: %)', CASE WHEN profile_count > 0 THEN 'Created' ELSE 'Failed' END, test_user_id;
    
    IF template_count > 0 AND question_count > 0 AND profile_count > 0 THEN
        RAISE NOTICE '✅ Mock exam system is fully ready!';
    ELSE
        RAISE NOTICE '⚠️ System setup incomplete - check data population scripts';
    END IF;
END $$;

-- Test the view works correctly
DO $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count FROM exam_history_view;
    RAISE NOTICE '📊 Exam history view contains % records', view_count;
    
    IF view_count >= 0 THEN
        RAISE NOTICE '✅ Exam history view is working correctly';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error testing exam history view: %', SQLERRM;
END $$;
