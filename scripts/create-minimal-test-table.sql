-- Create a minimal test_attempts table with only essential fields
CREATE TABLE IF NOT EXISTS test_attempts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    test_id INTEGER NOT NULL,
    score DECIMAL(5,2) DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert a sample record to test
INSERT INTO test_attempts (user_id, test_id, score, total_questions, correct_answers, incorrect_answers)
VALUES ('00000000-0000-0000-0000-000000000000', 1, 85.5, 10, 8, 2)
ON CONFLICT DO NOTHING;

-- Check if the table was created successfully
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'test_attempts'
ORDER BY ordinal_position;

-- Count total records
SELECT COUNT(*) as total_records FROM test_attempts;
