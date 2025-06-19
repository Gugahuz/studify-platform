-- Fix UUID/text type mismatch in profiles table and functions
-- This script addresses the column type mismatch error

-- First, let's check the current structure of profiles table
DO $$
BEGIN
    -- Check if profiles.id is uuid or text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'profiles.id is UUID type - will fix functions to match';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'id' 
        AND data_type = 'text'
    ) THEN
        RAISE NOTICE 'profiles.id is TEXT type - will fix functions to match';
    ELSE
        RAISE NOTICE 'profiles.id type unknown - will standardize to UUID';
    END IF;
END $$;

-- Clean up any existing null IDs first
UPDATE profiles 
SET id = gen_random_uuid()
WHERE id IS NULL;

-- Ensure profiles table uses UUID consistently
-- If the column is text, convert it to UUID
DO $$
BEGIN
    -- Check if id column is text and convert to UUID if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'id' 
        AND data_type = 'text'
    ) THEN
        -- Convert text IDs to UUIDs where possible
        UPDATE profiles 
        SET id = gen_random_uuid()
        WHERE id IS NULL OR id = '' OR LENGTH(id) != 36;
        
        -- Change column type to UUID
        ALTER TABLE profiles 
        ALTER COLUMN id TYPE uuid USING id::uuid;
        
        RAISE NOTICE 'Converted profiles.id from text to uuid';
    END IF;
END $$;

-- Ensure NOT NULL constraint
ALTER TABLE profiles 
ALTER COLUMN id SET NOT NULL;

-- Drop existing functions to recreate with correct types
DROP FUNCTION IF EXISTS get_or_create_test_user();
DROP FUNCTION IF EXISTS get_current_or_test_user();

-- Create function that returns UUID (matching profiles.id type)
CREATE OR REPLACE FUNCTION get_current_or_test_user()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
    test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
    -- Try to get current authenticated user
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        RAISE LOG 'Using authenticated user: %', current_user_id;
        RETURN current_user_id;
    END IF;
    
    -- Return test user UUID
    RAISE LOG 'Using test user: %', test_user_id;
    RETURN test_user_id;
END;
$$;

-- Create function specifically for getting user as text (for compatibility)
CREATE OR REPLACE FUNCTION get_current_or_test_user_text()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uuid uuid;
BEGIN
    user_uuid := get_current_or_test_user();
    RETURN user_uuid::text;
END;
$$;

-- Update complete_exam_attempt function with correct UUID handling
CREATE OR REPLACE FUNCTION complete_exam_attempt(
    attempt_uuid uuid,
    user_responses jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    attempt_record mock_exam_attempts;
    template_record mock_exam_templates;
    questions_data jsonb;
    response_record jsonb;
    correct_count integer := 0;
    total_questions integer := 0;
    total_points numeric := 0;
    max_points numeric := 0;
    percentage numeric := 0;
    current_user_id uuid;
    result jsonb;
BEGIN
    -- Get current user (returns UUID)
    current_user_id := get_current_or_test_user();
    
    RAISE LOG 'Completing exam for user: %, attempt: %', current_user_id, attempt_uuid;
    
    -- Get the attempt
    SELECT * INTO attempt_record
    FROM mock_exam_attempts
    WHERE id = attempt_uuid
    AND user_id = current_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Attempt not found or access denied',
            'debug', jsonb_build_object(
                'attempt_id', attempt_uuid,
                'user_id', current_user_id
            )
        );
    END IF;
    
    -- Check if already completed
    IF attempt_record.status = 'completed' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Attempt already completed'
        );
    END IF;
    
    -- Get template and questions
    SELECT * INTO template_record
    FROM mock_exam_templates
    WHERE id = attempt_record.template_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Template not found'
        );
    END IF;
    
    -- Get questions for this attempt
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', q.id,
            'question_text', q.question_text,
            'options', q.options,
            'correct_answer', q.correct_answer,
            'explanation', q.explanation,
            'points', q.points
        )
    ) INTO questions_data
    FROM mock_exam_questions q
    WHERE q.template_id = attempt_record.template_id;
    
    -- Calculate results
    total_questions := jsonb_array_length(questions_data);
    
    -- Process each response if provided
    IF user_responses IS NOT NULL THEN
        FOR response_record IN SELECT * FROM jsonb_array_elements(user_responses)
        LOOP
            DECLARE
                question_id uuid;
                user_answer text;
                correct_answer text;
                question_points numeric;
            BEGIN
                question_id := (response_record->>'question_id')::uuid;
                user_answer := response_record->>'selected_answer';
                
                -- Get correct answer and points for this question
                SELECT 
                    q.correct_answer,
                    COALESCE(q.points, 1)
                INTO correct_answer, question_points
                FROM mock_exam_questions q
                WHERE q.id = question_id;
                
                max_points := max_points + question_points;
                
                -- Check if answer is correct
                IF user_answer = correct_answer THEN
                    correct_count := correct_count + 1;
                    total_points := total_points + question_points;
                END IF;
                
                -- Insert/update response
                INSERT INTO mock_exam_responses (
                    id,
                    attempt_id,
                    question_id,
                    selected_answer,
                    is_correct,
                    points_earned,
                    created_at
                ) VALUES (
                    gen_random_uuid(),
                    attempt_uuid,
                    question_id,
                    user_answer,
                    (user_answer = correct_answer),
                    CASE WHEN user_answer = correct_answer THEN question_points ELSE 0 END,
                    NOW()
                )
                ON CONFLICT (attempt_id, question_id) 
                DO UPDATE SET
                    selected_answer = EXCLUDED.selected_answer,
                    is_correct = EXCLUDED.is_correct,
                    points_earned = EXCLUDED.points_earned,
                    updated_at = NOW();
            END;
        END LOOP;
    ELSE
        -- If no responses provided, calculate from existing responses
        SELECT 
            COUNT(*) FILTER (WHERE r.is_correct = true),
            COUNT(*),
            COALESCE(SUM(r.points_earned), 0),
            COALESCE(SUM(q.points), total_questions)
        INTO correct_count, total_questions, total_points, max_points
        FROM mock_exam_responses r
        JOIN mock_exam_questions q ON r.question_id = q.id
        WHERE r.attempt_id = attempt_uuid;
    END IF;
    
    -- Calculate percentage
    IF max_points > 0 THEN
        percentage := (total_points / max_points) * 100;
    END IF;
    
    -- Update attempt with results
    UPDATE mock_exam_attempts
    SET
        status = 'completed',
        completed_at = NOW(),
        correct_answers = correct_count,
        incorrect_answers = total_questions - correct_count,
        total_points = total_points,
        max_points = max_points,
        percentage = percentage,
        updated_at = NOW()
    WHERE id = attempt_uuid;
    
    -- Return success result
    result := jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'attempt_id', attempt_uuid,
            'correct_answers', correct_count,
            'incorrect_answers', total_questions - correct_count,
            'total_questions', total_questions,
            'total_points', total_points,
            'max_points', max_points,
            'percentage', percentage,
            'status', 'completed'
        )
    );
    
    RAISE LOG 'Exam completed successfully: %', result;
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error completing exam: % %', SQLSTATE, SQLERRM;
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;

-- Update get_exam_history function with correct UUID handling
CREATE OR REPLACE FUNCTION get_exam_history(
    user_uuid uuid,
    page_num integer DEFAULT 1,
    page_size integer DEFAULT 10
)
RETURNS jsonb[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_data jsonb;
    total_count integer;
    offset_val integer;
BEGIN
    -- Calculate offset
    offset_val := (page_num - 1) * page_size;
    
    -- Get total count
    SELECT COUNT(*)
    INTO total_count
    FROM mock_exam_attempts mea
    WHERE mea.user_id = user_uuid
    AND mea.status = 'completed';
    
    -- Get paginated attempts with template data
    SELECT jsonb_build_object(
        'attempts', COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', mea.id,
                'template_id', mea.template_id,
                'status', mea.status,
                'created_at', mea.created_at,
                'completed_at', mea.completed_at,
                'correct_answers', mea.correct_answers,
                'incorrect_answers', mea.incorrect_answers,
                'total_points', mea.total_points,
                'max_points', mea.max_points,
                'percentage', mea.percentage,
                'time_spent_seconds', mea.time_spent_seconds,
                'template', jsonb_build_object(
                    'id', met.id,
                    'title', met.title,
                    'description', met.description,
                    'category', met.category,
                    'difficulty_level', met.difficulty_level,
                    'time_limit_minutes', met.time_limit_minutes,
                    'passing_score', met.passing_score,
                    'is_featured', met.is_featured
                )
            )
            ORDER BY mea.completed_at DESC
        ), '[]'::jsonb),
        'total_count', total_count
    )
    INTO result_data
    FROM mock_exam_attempts mea
    LEFT JOIN mock_exam_templates met ON mea.template_id = met.id
    WHERE mea.user_id = user_uuid
    AND mea.status = 'completed'
    ORDER BY mea.completed_at DESC
    LIMIT page_size
    OFFSET offset_val;
    
    RETURN ARRAY[result_data];
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in get_exam_history: % %', SQLSTATE, SQLERRM;
    RETURN ARRAY[jsonb_build_object(
        'attempts', '[]'::jsonb,
        'total_count', 0,
        'error', SQLERRM
    )];
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_current_or_test_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_current_or_test_user_text() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION complete_exam_attempt(uuid, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_exam_history(uuid, integer, integer) TO anon, authenticated;

-- Ensure test user exists with correct UUID type
INSERT INTO profiles (
    id,
    nome,
    email,
    telefone,
    escolaridade,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Usuário Teste',
    'teste@studify.com',
    '(11) 99999-9999',
    'superior',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_mock_exam_attempts_user_status ON mock_exam_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_mock_exam_responses_attempt ON mock_exam_responses(attempt_id);

-- Verify the fix worked
DO $$
DECLARE
    test_user_id uuid;
    profile_exists boolean;
BEGIN
    -- Test the function
    test_user_id := get_current_or_test_user();
    RAISE NOTICE 'Function returned user ID: %', test_user_id;
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = test_user_id) INTO profile_exists;
    RAISE NOTICE 'Profile exists: %', profile_exists;
    
    IF NOT profile_exists THEN
        RAISE EXCEPTION 'Test user profile not found after creation';
    END IF;
    
    RAISE NOTICE 'UUID/text type fix completed successfully';
END $$;
