-- Create simple user statistics table
-- This script adds statistics tracking without modifying existing structure

-- Create user exam statistics table
CREATE TABLE IF NOT EXISTS user_exam_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Overall statistics
    total_exams_taken INTEGER DEFAULT 0,
    total_exams_completed INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    total_time_spent_seconds INTEGER DEFAULT 0,
    
    -- Performance metrics
    average_score DECIMAL(5,2) DEFAULT 0.00,
    best_score DECIMAL(5,2) DEFAULT 0.00,
    worst_score DECIMAL(5,2) DEFAULT 100.00,
    
    -- Streak and consistency
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_exam_date TIMESTAMP WITH TIME ZONE,
    
    -- Subject performance (JSON for flexibility)
    subject_performance JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_exam_statistics_user_id ON user_exam_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_statistics_updated_at ON user_exam_statistics(updated_at DESC);

-- Enable RLS
ALTER TABLE user_exam_statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own statistics" ON user_exam_statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own statistics" ON user_exam_statistics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert statistics" ON user_exam_statistics
    FOR INSERT WITH CHECK (true);

-- Function to update statistics when exam is completed
CREATE OR REPLACE FUNCTION update_user_exam_statistics(
    p_user_id UUID,
    p_score DECIMAL,
    p_total_questions INTEGER,
    p_correct_answers INTEGER,
    p_time_spent INTEGER,
    p_subject_areas JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
    current_stats RECORD;
    new_average DECIMAL;
    days_since_last INTEGER;
    new_streak INTEGER;
BEGIN
    -- Get or create user statistics
    SELECT * INTO current_stats 
    FROM user_exam_statistics 
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Create new statistics record
        INSERT INTO user_exam_statistics (
            user_id,
            total_exams_taken,
            total_exams_completed,
            total_questions_answered,
            total_correct_answers,
            total_time_spent_seconds,
            average_score,
            best_score,
            worst_score,
            current_streak,
            longest_streak,
            last_exam_date,
            subject_performance
        ) VALUES (
            p_user_id,
            1,
            1,
            p_total_questions,
            p_correct_answers,
            p_time_spent,
            p_score,
            p_score,
            p_score,
            1,
            1,
            NOW(),
            p_subject_areas
        );
    ELSE
        -- Calculate new average
        new_average := ((current_stats.average_score * current_stats.total_exams_completed) + p_score) / 
                      (current_stats.total_exams_completed + 1);
        
        -- Calculate streak
        IF current_stats.last_exam_date IS NOT NULL THEN
            days_since_last := EXTRACT(DAY FROM (NOW() - current_stats.last_exam_date));
            IF days_since_last <= 1 THEN
                new_streak := current_stats.current_streak + 1;
            ELSE
                new_streak := 1;
            END IF;
        ELSE
            new_streak := 1;
        END IF;
        
        -- Update existing statistics
        UPDATE user_exam_statistics SET
            total_exams_taken = current_stats.total_exams_taken + 1,
            total_exams_completed = current_stats.total_exams_completed + 1,
            total_questions_answered = current_stats.total_questions_answered + p_total_questions,
            total_correct_answers = current_stats.total_correct_answers + p_correct_answers,
            total_time_spent_seconds = current_stats.total_time_spent_seconds + p_time_spent,
            average_score = new_average,
            best_score = GREATEST(current_stats.best_score, p_score),
            worst_score = LEAST(current_stats.worst_score, p_score),
            current_streak = new_streak,
            longest_streak = GREATEST(current_stats.longest_streak, new_streak),
            last_exam_date = NOW(),
            subject_performance = COALESCE(current_stats.subject_performance, '{}') || p_subject_areas,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON user_exam_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_exam_statistics TO authenticated;

-- Create view for easy statistics access
CREATE OR REPLACE VIEW user_statistics_summary AS
SELECT 
    user_id,
    total_exams_completed,
    total_questions_answered,
    total_correct_answers,
    CASE 
        WHEN total_questions_answered > 0 
        THEN ROUND((total_correct_answers::DECIMAL / total_questions_answered) * 100, 2)
        ELSE 0 
    END as overall_accuracy,
    average_score,
    best_score,
    worst_score,
    current_streak,
    longest_streak,
    EXTRACT(EPOCH FROM total_time_spent_seconds * INTERVAL '1 second') / 3600 as total_hours_studied,
    last_exam_date,
    created_at
FROM user_exam_statistics;

GRANT SELECT ON user_statistics_summary TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'User exam statistics system created successfully!';
    RAISE NOTICE 'Table: user_exam_statistics';
    RAISE NOTICE 'Function: update_user_exam_statistics()';
    RAISE NOTICE 'View: user_statistics_summary';
END $$;
