-- Fix exam completion flow and ensure data integrity
-- This script addresses issues with exam completion, result calculation, and history display

-- First, let's ensure the mock_exam_attempts table has all required columns
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mock_exam_attempts' AND column_name = 'completed_at') THEN
        ALTER TABLE mock_exam_attempts ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mock_exam_attempts' AND column_name = 'time_spent_seconds') THEN
        ALTER TABLE mock_exam_attempts ADD COLUMN time_spent_seconds INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mock_exam_attempts' AND column_name = 'answered_questions') THEN
        ALTER TABLE mock_exam_attempts ADD COLUMN answered_questions INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mock_exam_attempts' AND column_name = 'correct_answers') THEN
        ALTER TABLE mock_exam_attempts ADD COLUMN correct_answers INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mock_exam_attempts' AND column_name = 'incorrect_answers') THEN
        ALTER TABLE mock_exam_attempts ADD COLUMN incorrect_answers INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mock_exam_attempts' AND column_name = 'skipped_questions') THEN
        ALTER TABLE mock_exam_attempts ADD COLUMN skipped_questions INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create or replace function to complete an exam attempt
CREATE OR REPLACE FUNCTION complete_exam_attempt(
    p_attempt_id UUID,
    p_user_id UUID,
    p_time_spent_seconds INTEGER DEFAULT 0
)
RETURNS TABLE(
    attempt_id UUID,
    status TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_questions INTEGER,
    answered_questions INTEGER,
    correct_answers INTEGER,
    percentage INTEGER,
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_attempt mock_exam_attempts%ROWTYPE;
    v_total_questions INTEGER := 0;
    v_answered_questions INTEGER := 0;
    v_correct_answers INTEGER := 0;
    v_incorrect_answers INTEGER := 0;
    v_skipped_questions INTEGER := 0;
    v_percentage INTEGER := 0;
    v_total_points INTEGER := 0;
BEGIN
    -- Get the attempt
    SELECT * INTO v_attempt
    FROM mock_exam_attempts
    WHERE id = p_attempt_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            p_attempt_id,
            'error'::TEXT,
            NULL::TIMESTAMP WITH TIME ZONE,
            0,
            0,
            0,
            0,
            FALSE,
            'Attempt not found or access denied'::TEXT;
        RETURN;
    END IF;
    
    -- Check if already completed
    IF v_attempt.status = 'completed' THEN
        RETURN QUERY SELECT 
            v_attempt.id,
            v_attempt.status::TEXT,
            v_attempt.completed_at,
            v_attempt.total_questions,
            v_attempt.answered_questions,
            v_attempt.correct_answers,
            v_attempt.percentage,
            TRUE,
            'Attempt already completed'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate statistics from responses
    SELECT 
        COUNT(*) FILTER (WHERE user_answer IS NOT NULL AND user_answer != ''),
        COUNT(*) FILTER (WHERE is_correct = TRUE),
        COALESCE(SUM(points_earned), 0)
    INTO v_answered_questions, v_correct_answers, v_total_points
    FROM mock_exam_responses
    WHERE attempt_id = p_attempt_id;
    
    -- Get total questions from template or attempt
    v_total_questions := COALESCE(v_attempt.total_questions, 0);
    
    -- Calculate derived statistics
    v_incorrect_answers := v_answered_questions - v_correct_answers;
    v_skipped_questions := v_total_questions - v_answered_questions;
    v_percentage := CASE 
        WHEN v_total_questions > 0 THEN ROUND((v_correct_answers::DECIMAL / v_total_questions) * 100)
        ELSE 0 
    END;
    
    -- Update the attempt
    UPDATE mock_exam_attempts
    SET 
        status = 'completed',
        completed_at = NOW(),
        time_spent_seconds = p_time_spent_seconds,
        answered_questions = v_answered_questions,
        correct_answers = v_correct_answers,
        incorrect_answers = v_incorrect_answers,
        skipped_questions = v_skipped_questions,
        percentage = v_percentage,
        score = v_correct_answers,
        total_points = v_total_points,
        updated_at = NOW()
    WHERE id = p_attempt_id AND user_id = p_user_id;
    
    -- Return success result
    RETURN QUERY SELECT 
        p_attempt_id,
        'completed'::TEXT,
        NOW(),
        v_total_questions,
        v_answered_questions,
        v_correct_answers,
        v_percentage,
        TRUE,
        'Exam completed successfully'::TEXT;
END;
$$;

-- Create or replace function to get exam history
CREATE OR REPLACE FUNCTION get_exam_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    attempt_id UUID,
    template_id UUID,
    template_title TEXT,
    template_category TEXT,
    difficulty_level TEXT,
    attempt_number INTEGER,
    status TEXT,
    score INTEGER,
    percentage INTEGER,
    total_questions INTEGER,
    answered_questions INTEGER,
    correct_answers INTEGER,
    time_spent_seconds INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ma.id as attempt_id,
        ma.template_id,
        met.title as template_title,
        met.category as template_category,
        met.difficulty_level,
        ma.attempt_number,
        ma.status,
        ma.score,
        ma.percentage,
        ma.total_questions,
        ma.answered_questions,
        ma.correct_answers,
        ma.time_spent_seconds,
        ma.started_at,
        ma.completed_at,
        ma.created_at
    FROM mock_exam_attempts ma
    JOIN mock_exam_templates met ON ma.template_id = met.id
    WHERE ma.user_id = p_user_id
        AND ma.status = 'completed'
        AND met.is_active = TRUE
    ORDER BY ma.completed_at DESC NULLS LAST, ma.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Create or replace function to calculate exam results
CREATE OR REPLACE FUNCTION calculate_exam_results(p_attempt_id UUID)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    total_questions INTEGER,
    answered_questions INTEGER,
    correct_answers INTEGER,
    incorrect_answers INTEGER,
    skipped_questions INTEGER,
    score INTEGER,
    percentage INTEGER,
    total_points INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_attempt mock_exam_attempts%ROWTYPE;
    v_total_questions INTEGER := 0;
    v_answered_questions INTEGER := 0;
    v_correct_answers INTEGER := 0;
    v_incorrect_answers INTEGER := 0;
    v_skipped_questions INTEGER := 0;
    v_percentage INTEGER := 0;
    v_total_points INTEGER := 0;
BEGIN
    -- Get the attempt
    SELECT * INTO v_attempt
    FROM mock_exam_attempts
    WHERE id = p_attempt_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE,
            'Attempt not found'::TEXT,
            0, 0, 0, 0, 0, 0, 0, 0;
        RETURN;
    END IF;
    
    -- Get statistics from responses
    SELECT 
        COUNT(*) FILTER (WHERE user_answer IS NOT NULL AND user_answer != ''),
        COUNT(*) FILTER (WHERE is_correct = TRUE),
        COALESCE(SUM(points_earned), 0)
    INTO v_answered_questions, v_correct_answers, v_total_points
    FROM mock_exam_responses
    WHERE attempt_id = p_attempt_id;
    
    -- Get total questions
    v_total_questions := COALESCE(v_attempt.total_questions, 0);
    
    -- Calculate derived statistics
    v_incorrect_answers := v_answered_questions - v_correct_answers;
    v_skipped_questions := v_total_questions - v_answered_questions;
    v_percentage := CASE 
        WHEN v_total_questions > 0 THEN ROUND((v_correct_answers::DECIMAL / v_total_questions) * 100)
        ELSE 0 
    END;
    
    -- Return results
    RETURN QUERY SELECT 
        TRUE,
        'Results calculated successfully'::TEXT,
        v_total_questions,
        v_answered_questions,
        v_correct_answers,
        v_incorrect_answers,
        v_skipped_questions,
        v_correct_answers, -- score = correct answers
        v_percentage,
        v_total_points;
END;
$$;

-- Update any existing incomplete attempts to have proper structure
UPDATE mock_exam_attempts 
SET 
    answered_questions = COALESCE(answered_questions, 0),
    correct_answers = COALESCE(correct_answers, 0),
    incorrect_answers = COALESCE(incorrect_answers, 0),
    skipped_questions = COALESCE(skipped_questions, 0),
    time_spent_seconds = COALESCE(time_spent_seconds, 0)
WHERE answered_questions IS NULL 
   OR correct_answers IS NULL 
   OR incorrect_answers IS NULL 
   OR skipped_questions IS NULL 
   OR time_spent_seconds IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mock_exam_attempts_user_status 
ON mock_exam_attempts(user_id, status);

CREATE INDEX IF NOT EXISTS idx_mock_exam_attempts_completed_at 
ON mock_exam_attempts(completed_at DESC) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_mock_exam_responses_attempt_answer 
ON mock_exam_responses(attempt_id, user_answer) 
WHERE user_answer IS NOT NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION complete_exam_attempt(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_exam_history(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_exam_results(UUID) TO authenticated;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Exam completion flow fixes applied successfully';
    RAISE NOTICE 'Functions created: complete_exam_attempt, get_exam_history, calculate_exam_results';
    RAISE NOTICE 'Indexes created for better performance';
END $$;
