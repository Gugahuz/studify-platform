-- Simple user statistics system (Safe version)
-- This creates a minimal, working statistics system

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own stats" ON user_stats;

-- Create simple user stats table
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic counters
    total_exams INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    
    -- Performance
    best_score DECIMAL(5,2) DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    
    -- Time tracking
    total_time_minutes INTEGER DEFAULT 0,
    
    -- Last activity
    last_exam_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user
    UNIQUE(user_id)
);

-- Create index (safe)
DROP INDEX IF EXISTS idx_user_stats_user_id;
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (fresh)
CREATE POLICY "Users can manage their own stats" ON user_stats
    FOR ALL USING (auth.uid() = user_id);

-- Drop and recreate function to ensure it's updated
DROP FUNCTION IF EXISTS update_user_stats(UUID, DECIMAL, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION update_user_stats(
    p_user_id UUID,
    p_score DECIMAL,
    p_total_questions INTEGER,
    p_correct_answers INTEGER,
    p_time_minutes INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_stats (
        user_id,
        total_exams,
        total_correct,
        total_questions,
        best_score,
        average_score,
        total_time_minutes,
        last_exam_date
    ) VALUES (
        p_user_id,
        1,
        p_correct_answers,
        p_total_questions,
        p_score,
        p_score,
        p_time_minutes,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_exams = user_stats.total_exams + 1,
        total_correct = user_stats.total_correct + p_correct_answers,
        total_questions = user_stats.total_questions + p_total_questions,
        best_score = GREATEST(user_stats.best_score, p_score),
        average_score = ROUND(((user_stats.average_score * user_stats.total_exams) + p_score) / (user_stats.total_exams + 1), 2),
        total_time_minutes = user_stats.total_time_minutes + p_time_minutes,
        last_exam_date = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON user_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_stats TO authenticated;

-- Insert some test data for current user (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
        INSERT INTO user_stats (
            user_id,
            total_exams,
            total_correct,
            total_questions,
            best_score,
            average_score,
            total_time_minutes,
            last_exam_date
        ) 
        SELECT 
            id,
            5,
            45,
            60,
            85.5,
            75.2,
            120,
            NOW() - INTERVAL '1 day'
        FROM auth.users 
        LIMIT 1
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;

-- Success message
SELECT 'Simple user statistics system created successfully!' as message,
       'Table created: user_stats' as table_info,
       'Function created: update_user_stats()' as function_info,
       'Sample data inserted for testing' as test_data;
