-- Create comprehensive mock exam history system with 10 simulation limit
-- This script creates tables, triggers, and functions for managing simulation history

-- Drop existing objects if they exist (for safe re-execution)
DROP TRIGGER IF EXISTS update_mock_exam_attempts_updated_at ON mock_exam_attempts;
DROP TRIGGER IF EXISTS enforce_max_attempts_per_user ON mock_exam_attempts;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS enforce_max_attempts_limit();
DROP FUNCTION IF EXISTS cleanup_old_attempts();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to enforce maximum attempts per user (10 limit)
CREATE OR REPLACE FUNCTION enforce_max_attempts_limit()
RETURNS TRIGGER AS $$
DECLARE
    attempt_count INTEGER;
    oldest_attempt_id UUID;
BEGIN
    -- Count current attempts for this user
    SELECT COUNT(*) INTO attempt_count
    FROM mock_exam_attempts
    WHERE user_id = NEW.user_id AND status = 'completed';
    
    -- If we have 10 or more completed attempts, remove the oldest one
    IF attempt_count >= 10 THEN
        -- Get the oldest completed attempt
        SELECT id INTO oldest_attempt_id
        FROM mock_exam_attempts
        WHERE user_id = NEW.user_id AND status = 'completed'
        ORDER BY completed_at ASC
        LIMIT 1;
        
        -- Delete responses for the oldest attempt
        DELETE FROM mock_exam_responses WHERE attempt_id = oldest_attempt_id;
        
        -- Delete the oldest attempt
        DELETE FROM mock_exam_attempts WHERE id = oldest_attempt_id;
        
        -- Log the cleanup
        RAISE NOTICE 'Cleaned up oldest attempt % for user %', oldest_attempt_id, NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to manually cleanup old attempts (can be called via API)
CREATE OR REPLACE FUNCTION cleanup_old_attempts(target_user_id UUID DEFAULT NULL)
RETURNS TABLE(cleaned_attempts INTEGER, user_id UUID) AS $$
DECLARE
    user_record RECORD;
    attempt_count INTEGER;
    cleanup_count INTEGER := 0;
    oldest_attempt_id UUID;
BEGIN
    -- If specific user provided, clean only that user
    IF target_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO attempt_count
        FROM mock_exam_attempts
        WHERE mock_exam_attempts.user_id = target_user_id AND status = 'completed';
        
        WHILE attempt_count > 10 LOOP
            SELECT id INTO oldest_attempt_id
            FROM mock_exam_attempts
            WHERE mock_exam_attempts.user_id = target_user_id AND status = 'completed'
            ORDER BY completed_at ASC
            LIMIT 1;
            
            DELETE FROM mock_exam_responses WHERE attempt_id = oldest_attempt_id;
            DELETE FROM mock_exam_attempts WHERE id = oldest_attempt_id;
            
            cleanup_count := cleanup_count + 1;
            attempt_count := attempt_count - 1;
        END LOOP;
        
        RETURN QUERY SELECT cleanup_count, target_user_id;
    ELSE
        -- Clean up for all users
        FOR user_record IN 
            SELECT DISTINCT mock_exam_attempts.user_id
            FROM mock_exam_attempts
            WHERE status = 'completed'
        LOOP
            SELECT COUNT(*) INTO attempt_count
            FROM mock_exam_attempts
            WHERE mock_exam_attempts.user_id = user_record.user_id AND status = 'completed';
            
            WHILE attempt_count > 10 LOOP
                SELECT id INTO oldest_attempt_id
                FROM mock_exam_attempts
                WHERE mock_exam_attempts.user_id = user_record.user_id AND status = 'completed'
                ORDER BY completed_at ASC
                LIMIT 1;
                
                DELETE FROM mock_exam_responses WHERE attempt_id = oldest_attempt_id;
                DELETE FROM mock_exam_attempts WHERE id = oldest_attempt_id;
                
                cleanup_count := cleanup_count + 1;
                attempt_count := attempt_count - 1;
            END LOOP;
            
            RETURN QUERY SELECT cleanup_count, user_record.user_id;
        END LOOP;
    END IF;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_mock_exam_attempts_updated_at
    BEFORE UPDATE ON mock_exam_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER enforce_max_attempts_per_user
    AFTER UPDATE ON mock_exam_attempts
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION enforce_max_attempts_limit();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mock_exam_attempts_user_status_completed 
ON mock_exam_attempts(user_id, completed_at DESC) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_mock_exam_attempts_user_created 
ON mock_exam_attempts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mock_exam_responses_attempt 
ON mock_exam_responses(attempt_id);

-- Create view for user history summary
CREATE OR REPLACE VIEW user_mock_exam_history AS
SELECT 
    mea.user_id,
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE mea.status = 'completed') as completed_attempts,
    AVG(mea.percentage) FILTER (WHERE mea.status = 'completed') as average_score,
    MAX(mea.percentage) FILTER (WHERE mea.status = 'completed') as best_score,
    MIN(mea.percentage) FILTER (WHERE mea.status = 'completed') as worst_score,
    SUM(mea.time_spent_seconds) FILTER (WHERE mea.status = 'completed') as total_time_spent,
    MAX(mea.completed_at) as last_attempt_date,
    COUNT(DISTINCT mea.template_id) FILTER (WHERE mea.status = 'completed') as unique_templates_completed
FROM mock_exam_attempts mea
GROUP BY mea.user_id;

-- Grant permissions
GRANT SELECT ON user_mock_exam_history TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_attempts TO authenticated;

-- Insert sample data if tables are empty (for testing)
DO $$
DECLARE
    template_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM mock_exam_templates;
    
    IF template_count = 0 THEN
        RAISE NOTICE 'No templates found. Please run script 015-populate-mock-exam-questions.sql first.';
    ELSE
        RAISE NOTICE 'Mock exam history system created successfully. Found % templates.', template_count;
    END IF;
END $$;
