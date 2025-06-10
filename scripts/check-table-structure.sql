-- Check if test_attempts table exists and show its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'test_attempts'
ORDER BY ordinal_position;

-- If the table doesn't exist, let's see what tables do exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check for any tables that might be related to tests/attempts
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND (table_name LIKE '%test%' OR table_name LIKE '%attempt%' OR table_name LIKE '%quiz%' OR table_name LIKE '%assessment%')
ORDER BY table_name;
