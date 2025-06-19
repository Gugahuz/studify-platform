-- Complete mock exam integration with proper user association and result calculation
-- This script ensures proper data flow from attempts to results

-- First, let's check and fix the mock_exam_attempts table structure
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mock_exam_attempts' AND column_name = 'percentage') THEN
        ALTER TABLE mock_exam_attempts ADD COLUMN percentage DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mock_exam_attempts' AND column_name = 'total_points') THEN
        ALTER TABLE mock_exam_attempts ADD COLUMN total_points DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mock_exam_attempts' AND column_name = 'max_points') THEN
        ALTER TABLE mock_exam_attempts ADD COLUMN max_points DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    RAISE NOTICE '✅ Mock exam attempts table structure verified';
END $$;

-- Create function to calculate exam results
CREATE OR REPLACE FUNCTION calculate_exam_results(attempt_uuid UUID)
RETURNS TABLE(
    total_questions INTEGER,
    answered_questions INTEGER,
    correct_answers INTEGER,
    incorrect_answers INTEGER,
    skipped_questions INTEGER,
    total_points DECIMAL,
    max_points DECIMAL,
    percentage DECIMAL
) AS $$
DECLARE
    result_record RECORD;
BEGIN
    -- Calculate results from responses
    SELECT 
        COUNT(*) as total_q,
        COUNT(CASE WHEN mer.user_answer IS NOT NULL AND mer.user_answer != '' THEN 1 END) as answered_q,
        COUNT(CASE WHEN mer.is_correct = true THEN 1 END) as correct_q,
        COUNT(CASE WHEN mer.user_answer IS NOT NULL AND mer.user_answer != '' AND mer.is_correct = false THEN 1 END) as incorrect_q,
        COUNT(CASE WHEN mer.user_answer IS NULL OR mer.user_answer = '' THEN 1 END) as skipped_q,
        COALESCE(SUM(CASE WHEN mer.is_correct = true THEN COALESCE(meq.points, 1) ELSE 0 END), 0) as total_pts,
        COALESCE(SUM(COALESCE(meq.points, 1)), 0) as max_pts
    INTO result_record
    FROM mock_exam_responses mer
    LEFT JOIN mock_exam_questions meq ON mer.question_id = meq.id
    WHERE mer.attempt_id = attempt_uuid;
    
    -- Return calculated values
    total_questions := COALESCE(result_record.total_q, 0);
    answered_questions := COALESCE(result_record.answered_q, 0);
    correct_answers := COALESCE(result_record.correct_q, 0);
    incorrect_answers := COALESCE(result_record.incorrect_q, 0);
    skipped_questions := COALESCE(result_record.skipped_q, 0);
    total_points := COALESCE(result_record.total_pts, 0);
    max_points := COALESCE(result_record.max_pts, 0);
    
    -- Calculate percentage
    IF max_points > 0 THEN
        percentage := ROUND((total_points / max_points) * 100, 2);
    ELSE
        percentage := 0;
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Create function to update attempt with calculated results
CREATE OR REPLACE FUNCTION update_attempt_results(attempt_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    calc_results RECORD;
BEGIN
    -- Get calculated results
    SELECT * INTO calc_results FROM calculate_exam_results(attempt_uuid);
    
    -- Update the attempt record
    UPDATE mock_exam_attempts SET
        total_questions = calc_results.total_questions,
        answered_questions = calc_results.answered_questions,
        correct_answers = calc_results.correct_answers,
        incorrect_answers = calc_results.incorrect_answers,
        skipped_questions = calc_results.skipped_questions,
        total_points = calc_results.total_points,
        max_points = calc_results.max_points,
        percentage = calc_results.percentage,
        updated_at = NOW()
    WHERE id = attempt_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update results when responses change
CREATE OR REPLACE FUNCTION trigger_update_attempt_results()
RETURNS TRIGGER AS $$
BEGIN
    -- Update results for the affected attempt
    PERFORM update_attempt_results(COALESCE(NEW.attempt_id, OLD.attempt_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_update_attempt_results ON mock_exam_responses;

-- Create trigger on responses table
CREATE TRIGGER auto_update_attempt_results
    AFTER INSERT OR UPDATE OR DELETE ON mock_exam_responses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_attempt_results();

-- Ensure proper user association by creating a function to get or create test user
CREATE OR REPLACE FUNCTION get_or_create_test_user()
RETURNS UUID AS $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
    user_exists BOOLEAN;
BEGIN
    -- Check if test user exists in profiles
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = test_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Create test user profile
        INSERT INTO profiles (id, email, full_name, created_at, updated_at)
        VALUES (
            test_user_id,
            'test@studify.com',
            'Usuário de Teste',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE '✅ Test user created: %', test_user_id;
    END IF;
    
    RETURN test_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for exam history with proper joins
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
    p.full_name as user_name,
    p.email as user_email
FROM mock_exam_attempts mea
LEFT JOIN mock_exam_templates met ON mea.template_id = met.id
LEFT JOIN profiles p ON mea.user_id = p.id
WHERE mea.status = 'completed'
ORDER BY mea.completed_at DESC;

-- Grant permissions
GRANT SELECT ON exam_history_view TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION calculate_exam_results TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION update_attempt_results TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_or_create_test_user TO authenticated, anon, service_role;

-- Update existing attempts to have proper results
DO $$
DECLARE
    attempt_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    FOR attempt_record IN 
        SELECT id FROM mock_exam_attempts 
        WHERE status = 'completed' AND (percentage IS NULL OR percentage = 0)
    LOOP
        PERFORM update_attempt_results(attempt_record.id);
        updated_count := updated_count + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Updated % existing attempts with calculated results', updated_count;
END $$;

-- Verify the setup
DO $$
DECLARE
    template_count INTEGER;
    question_count INTEGER;
    attempt_count INTEGER;
    response_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM mock_exam_templates;
    SELECT COUNT(*) INTO question_count FROM mock_exam_questions;
    SELECT COUNT(*) INTO attempt_count FROM mock_exam_attempts;
    SELECT COUNT(*) INTO response_count FROM mock_exam_responses;
    
    RAISE NOTICE '📊 Database Status:';
    RAISE NOTICE '   Templates: %', template_count;
    RAISE NOTICE '   Questions: %', question_count;
    RAISE NOTICE '   Attempts: %', attempt_count;
    RAISE NOTICE '   Responses: %', response_count;
    
    IF template_count > 0 AND question_count > 0 THEN
        RAISE NOTICE '✅ Mock exam system is ready!';
    ELSE
        RAISE NOTICE '⚠️ Please run the data population scripts first';
    END IF;
END $$;
