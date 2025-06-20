-- Test the user statistics system

-- Check if table exists and has data
SELECT 
    'user_stats table check' as test_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Has data'
        ELSE '⚠️ No data yet'
    END as status
FROM user_stats;

-- Check table structure
SELECT 
    'Table structure check' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_stats' 
ORDER BY ordinal_position;

-- Check if function exists
SELECT 
    'Function check' as test_name,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'update_user_stats' THEN '✅ Function exists'
        ELSE '❌ Function missing'
    END as status
FROM information_schema.routines 
WHERE routine_name = 'update_user_stats';

-- Check RLS policies
SELECT 
    'RLS Policy check' as test_name,
    policyname,
    CASE 
        WHEN policyname = 'Users can manage their own stats' THEN '✅ Policy exists'
        ELSE '❌ Policy missing'
    END as status
FROM pg_policies 
WHERE tablename = 'user_stats';

-- Test function (if user exists)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test the function
        PERFORM update_user_stats(test_user_id, 90.5, 20, 18, 25);
        RAISE NOTICE '✅ Function test completed successfully';
    ELSE
        RAISE NOTICE '⚠️ No users found for function testing';
    END IF;
END $$;

-- Final status
SELECT 
    '🎯 System Status' as final_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM user_stats) 
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_user_stats')
        AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats')
        THEN '✅ All systems operational!'
        ELSE '⚠️ Some components missing'
    END as status;
