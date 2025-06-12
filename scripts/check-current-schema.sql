-- Quick script to check the current state of our tables
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=== CURRENT DATABASE SCHEMA STATUS ===';
    
    -- Check if tables exist
    FOR rec IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('tests', 'test_attempts', 'test_answers')
        ORDER BY tablename
    LOOP
        RAISE NOTICE 'Table exists: %', rec.tablename;
    END LOOP;
    
    -- Check test_attempts columns specifically
    RAISE NOTICE '';
    RAISE NOTICE 'TEST_ATTEMPTS COLUMNS:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'test_attempts' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  % (%) - nullable: %', rec.column_name, rec.data_type, rec.is_nullable;
    END LOOP;
    
    -- Check for specific problematic columns
    RAISE NOTICE '';
    RAISE NOTICE 'CHECKING SPECIFIC COLUMNS:';
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'time_spent') THEN
        RAISE NOTICE '  ✓ time_spent column exists';
    ELSE
        RAISE NOTICE '  ✗ time_spent column does NOT exist';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'time_spent_seconds') THEN
        RAISE NOTICE '  ✓ time_spent_seconds column exists';
    ELSE
        RAISE NOTICE '  ✗ time_spent_seconds column does NOT exist';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'time_allowed') THEN
        RAISE NOTICE '  ✓ time_allowed column exists';
    ELSE
        RAISE NOTICE '  ✗ time_allowed column does NOT exist';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'time_allowed_seconds') THEN
        RAISE NOTICE '  ✓ time_allowed_seconds column exists';
    ELSE
        RAISE NOTICE '  ✗ time_allowed_seconds column does NOT exist';
    END IF;
    
    RAISE NOTICE '=== END SCHEMA CHECK ===';
END $$;
