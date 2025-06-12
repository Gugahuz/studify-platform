-- Final verification script
DO $$
DECLARE
    rec RECORD;
    user_id_type TEXT;
    auth_users_id_type TEXT;
BEGIN
    RAISE NOTICE '=== FINAL SCHEMA VERIFICATION ===';
    
    -- Check user_id types
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_name = 'test_attempts' 
    AND column_name = 'user_id' 
    AND table_schema = 'public';
    
    SELECT data_type INTO auth_users_id_type
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'id' 
    AND table_schema = 'auth';
    
    RAISE NOTICE 'USER ID TYPES:';
    RAISE NOTICE '  test_attempts.user_id: %', COALESCE(user_id_type, 'NOT FOUND');
    RAISE NOTICE '  auth.users.id: %', COALESCE(auth_users_id_type, 'NOT FOUND');
    RAISE NOTICE '  Types compatible: %', CASE WHEN user_id_type = auth_users_id_type THEN 'YES' ELSE 'NO' END;
    
    RAISE NOTICE '';
    RAISE NOTICE 'TEST_ATTEMPTS TABLE COLUMNS:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'test_attempts' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  % (%) - nullable: %', rec.column_name, rec.data_type, rec.is_nullable;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'FOREIGN KEY CONSTRAINTS:';
    FOR rec IN 
        SELECT tc.constraint_name, tc.table_name, kcu.column_name, 
               ccu.table_name AS foreign_table_name,
               ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('test_attempts', 'test_answers')
        ORDER BY tc.table_name, tc.constraint_name
    LOOP
        RAISE NOTICE '  %.% -> %.%', rec.table_name, rec.column_name, rec.foreign_table_name, rec.foreign_column_name;
    END LOOP;
    
    -- Check if we have any test data
    SELECT COUNT(*) INTO rec FROM test_attempts;
    RAISE NOTICE '';
    RAISE NOTICE 'EXISTING DATA: % test attempts found', rec;
    
    RAISE NOTICE '=== VERIFICATION COMPLETED ===';
END $$;
