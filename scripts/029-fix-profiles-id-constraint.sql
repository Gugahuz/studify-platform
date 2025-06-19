-- Fix profiles table ID constraint and user functions
-- This script addresses the null ID constraint violation

-- First, let's check and fix any existing null IDs in profiles
UPDATE profiles 
SET id = gen_random_uuid()::text 
WHERE id IS NULL;

-- Ensure the profiles table has proper constraints
ALTER TABLE profiles 
ALTER COLUMN id SET NOT NULL;

-- Drop and recreate the get_or_create_test_user function with better error handling
DROP FUNCTION IF EXISTS get_or_create_test_user();

CREATE OR REPLACE FUNCTION get_or_create_test_user()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
    test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
    test_user_exists boolean := false;
BEGIN
    -- Try to get current authenticated user first
    BEGIN
        current_user_id := auth.uid();
        
        -- If we have an authenticated user, return their ID
        IF current_user_id IS NOT NULL THEN
            RAISE LOG 'Using authenticated user: %', current_user_id;
            RETURN current_user_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'No authenticated user found, using test user';
    END;
    
    -- Check if test user exists in profiles
    SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE id = test_user_id::text
    ) INTO test_user_exists;
    
    -- Create test user if it doesn't exist
    IF NOT test_user_exists THEN
        RAISE LOG 'Creating test user profile';
        
        INSERT INTO profiles (
            id,
            nome,
            email,
            telefone,
            escolaridade,
            created_at,
            updated_at
        ) VALUES (
            test_user_id::text,
            'Usuário Teste',
            'teste@studify.com',
            '(11) 99999-9999',
            'superior',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
    
    RAISE LOG 'Using test user: %', test_user_id;
    RETURN test_user_id;
END;
$$;

-- Create a simpler function that just gets current user or returns test user
CREATE OR REPLACE FUNCTION get_current_or_test_user()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
    test_user_id text := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Try to get current authenticated user
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        RETURN current_user_id::text;
    END IF;
    
    -- Return test user ID
    RETURN test_user_id;
END;
$$;

-- Update the complete_exam_attempt function to use the corrected user function
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
    current_user_id text;
    result jsonb;
BEGIN
    -- Get current user
    current_user_id := get_current_or_test_user();
    
    -- Get the attempt
    SELECT * INTO attempt_record
    FROM mock_exam_attempts
    WHERE id = attempt_uuid
    AND user_id = current_user_id::uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Attempt not found or access denied'
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
    
    -- Process each response
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
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_or_create_test_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_current_or_test_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION complete_exam_attempt(uuid, jsonb) TO anon, authenticated;

-- Ensure test user exists
INSERT INTO profiles (
    id,
    nome,
    email,
    telefone,
    escolaridade,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Usuário Teste',
    'teste@studify.com',
    '(11) 99999-9999',
    'superior',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_mock_exam_attempts_user_status ON mock_exam_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_mock_exam_responses_attempt ON mock_exam_responses(attempt_id);
