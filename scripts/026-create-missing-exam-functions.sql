-- Create the missing functions for exam result calculations
-- This script creates all the functions needed for the mock exam system

-- Function to calculate exam results for a specific attempt
CREATE OR REPLACE FUNCTION calculate_exam_results(attempt_uuid UUID)
RETURNS TABLE(
    total_questions INTEGER,
    answered_questions INTEGER,
    correct_answers INTEGER,
    incorrect_answers INTEGER,
    skipped_questions INTEGER,
    total_points NUMERIC,
    max_points NUMERIC,
    percentage NUMERIC
) AS $$
DECLARE
    result_record RECORD;
BEGIN
    -- Calculate all statistics in one query
    SELECT 
        COUNT(*)::INTEGER as total_q,
        COUNT(CASE WHEN mer.user_answer IS NOT NULL AND mer.user_answer != '' THEN 1 END)::INTEGER as answered_q,
        COUNT(CASE WHEN mer.is_correct = true THEN 1 END)::INTEGER as correct_q,
        COUNT(CASE WHEN mer.user_answer IS NOT NULL AND mer.user_answer != '' AND mer.is_correct = false THEN 1 END)::INTEGER as incorrect_q,
        COUNT(CASE WHEN mer.user_answer IS NULL OR mer.user_answer = '' THEN 1 END)::INTEGER as skipped_q,
        COALESCE(SUM(mer.points_earned), 0) as total_pts,
        COALESCE(SUM(meq.points), COUNT(*)) as max_pts
    INTO result_record
    FROM mock_exam_responses mer
    JOIN mock_exam_questions meq ON mer.question_id = meq.id
    WHERE mer.attempt_id = attempt_uuid;
    
    -- Calculate percentage
    DECLARE
        calc_percentage NUMERIC := 0;
    BEGIN
        IF result_record.max_pts > 0 THEN
            calc_percentage := ROUND((result_record.total_pts / result_record.max_pts) * 100, 2);
        END IF;
    END;
    
    -- Return the calculated values
    total_questions := result_record.total_q;
    answered_questions := result_record.answered_q;
    correct_answers := result_record.correct_q;
    incorrect_answers := result_record.incorrect_q;
    skipped_questions := result_record.skipped_q;
    total_points := result_record.total_pts;
    max_points := result_record.max_pts;
    percentage := calc_percentage;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to update attempt results
CREATE OR REPLACE FUNCTION update_attempt_results(attempt_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    calc_results RECORD;
    attempt_exists BOOLEAN;
BEGIN
    -- Check if attempt exists
    SELECT EXISTS(SELECT 1 FROM mock_exam_attempts WHERE id = attempt_uuid) INTO attempt_exists;
    
    IF NOT attempt_exists THEN
        RAISE EXCEPTION 'Attempt with ID % not found', attempt_uuid;
    END IF;
    
    -- Get calculated results
    SELECT * INTO calc_results FROM calculate_exam_results(attempt_uuid) LIMIT 1;
    
    -- Update the attempt with calculated results
    UPDATE mock_exam_attempts 
    SET 
        total_questions = calc_results.total_questions,
        answered_questions = calc_results.answered_questions,
        correct_answers = calc_results.correct_answers,
        incorrect_answers = calc_results.incorrect_answers,
        skipped_questions = calc_results.skipped_questions,
        total_points = calc_results.total_points,
        max_points = calc_results.max_points,
        percentage = calc_results.percentage,
        score = calc_results.percentage, -- For compatibility
        updated_at = NOW()
    WHERE id = attempt_uuid;
    
    RAISE NOTICE '✅ Updated attempt % with results: %% (%/%)', 
        attempt_uuid, calc_results.percentage, calc_results.correct_answers, calc_results.total_questions;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error updating attempt results: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update results when responses change
CREATE OR REPLACE FUNCTION trigger_update_attempt_results()
RETURNS TRIGGER AS $$
BEGIN
    -- Update results for the affected attempt
    PERFORM update_attempt_results(COALESCE(NEW.attempt_id, OLD.attempt_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update results when responses change
DROP TRIGGER IF EXISTS auto_update_attempt_results ON mock_exam_responses;
CREATE TRIGGER auto_update_attempt_results
    AFTER INSERT OR UPDATE OR DELETE ON mock_exam_responses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_attempt_results();

-- Grant permissions on the functions
GRANT EXECUTE ON FUNCTION calculate_exam_results(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION update_attempt_results(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION trigger_update_attempt_results() TO authenticated, anon, service_role;

-- Test the functions work correctly
DO $$
DECLARE
    test_user_id UUID;
    test_template_id UUID;
    test_attempt_id UUID;
    test_question_id UUID;
    calc_results RECORD;
BEGIN
    -- Get or create test user
    SELECT get_or_create_test_user() INTO test_user_id;
    
    -- Get a template
    SELECT id INTO test_template_id FROM mock_exam_templates LIMIT 1;
    
    IF test_template_id IS NULL THEN
        RAISE NOTICE '⚠️ No templates found - run data population scripts first';
        RETURN;
    END IF;
    
    -- Create a test attempt
    INSERT INTO mock_exam_attempts (
        user_id, template_id, attempt_number, status, started_at
    ) VALUES (
        test_user_id, test_template_id, 1, 'in_progress', NOW()
    ) RETURNING id INTO test_attempt_id;
    
    -- Get a question from this template
    SELECT id INTO test_question_id 
    FROM mock_exam_questions 
    WHERE template_id = test_template_id 
    LIMIT 1;
    
    IF test_question_id IS NOT NULL THEN
        -- Add a test response
        INSERT INTO mock_exam_responses (
            attempt_id, question_id, user_answer, is_correct, points_earned
        ) VALUES (
            test_attempt_id, test_question_id, 'A', true, 1
        );
        
        -- Test the calculation function
        SELECT * INTO calc_results FROM calculate_exam_results(test_attempt_id) LIMIT 1;
        
        RAISE NOTICE '🧮 Test calculation results:';
        RAISE NOTICE '   Total Questions: %', calc_results.total_questions;
        RAISE NOTICE '   Correct Answers: %', calc_results.correct_answers;
        RAISE NOTICE '   Percentage: %%', calc_results.percentage;
        
        -- Test the update function
        IF update_attempt_results(test_attempt_id) THEN
            RAISE NOTICE '✅ Functions are working correctly!';
        ELSE
            RAISE NOTICE '❌ Update function failed';
        END IF;
        
        -- Clean up test data
        DELETE FROM mock_exam_responses WHERE attempt_id = test_attempt_id;
        DELETE FROM mock_exam_attempts WHERE id = test_attempt_id;
        
    ELSE
        RAISE NOTICE '⚠️ No questions found for template - check data population';
        DELETE FROM mock_exam_attempts WHERE id = test_attempt_id;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error testing functions: %', SQLERRM;
        -- Clean up on error
        DELETE FROM mock_exam_responses WHERE attempt_id = test_attempt_id;
        DELETE FROM mock_exam_attempts WHERE id = test_attempt_id;
END $$;

-- Verify all functions exist
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname IN ('calculate_exam_results', 'update_attempt_results', 'get_or_create_test_user');
    
    RAISE NOTICE '📊 Found % required functions', func_count;
    
    IF func_count >= 3 THEN
        RAISE NOTICE '✅ All required functions are available!';
    ELSE
        RAISE NOTICE '⚠️ Some functions may be missing';
    END IF;
END $$;
