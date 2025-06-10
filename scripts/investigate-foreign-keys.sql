-- Check foreign key constraints on test_attempts table
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='test_attempts';

-- Check what tables exist that might contain tests
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%test%' 
    OR table_name LIKE '%quiz%' 
    OR table_name LIKE '%exam%'
ORDER BY table_name;

-- Check if there's a tests table and what it contains
SELECT * FROM information_schema.tables WHERE table_name = 'tests' LIMIT 1;

-- If tests table exists, show its structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tests'
ORDER BY ordinal_position;

-- If tests table exists, show sample data
SELECT * FROM tests LIMIT 5;

-- Check test_attempts table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'test_attempts'
ORDER BY ordinal_position;

-- Show any existing data in test_attempts
SELECT * FROM test_attempts LIMIT 5;
