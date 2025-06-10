-- Debug script to check test_attempts table
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'test_attempts'
ORDER BY ordinal_position;

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'test_attempts'
) as table_exists;

-- Get sample data
SELECT * FROM test_attempts LIMIT 5;

-- Count total records
SELECT COUNT(*) as total_records FROM test_attempts;

-- Check for specific user (replace with actual user ID)
SELECT * FROM test_attempts WHERE user_id::text LIKE '%your-user-id%';
