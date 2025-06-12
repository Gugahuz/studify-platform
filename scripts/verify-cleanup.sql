-- Verification script to check the status after cleanup

-- Check remaining tables
SELECT 'REMAINING TABLES IN PUBLIC SCHEMA:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if test tables were removed
SELECT 'TEST TABLES STATUS:' as status;
SELECT 
  NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tests') as tests_removed,
  NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_attempts') as test_attempts_removed,
  NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_answers') as test_answers_removed;

-- Check database size after cleanup
SELECT 'DATABASE SIZE AFTER CLEANUP:' as status;
SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Check for any remaining test-related objects
SELECT 'REMAINING TEST-RELATED OBJECTS:' as status;
SELECT 
  objtype, 
  objname
FROM (
  -- Tables
  SELECT 'table' as objtype, table_name as objname
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name LIKE '%test%'
  
  UNION ALL
  
  -- Functions
  SELECT 'function' as objtype, proname as objname
  FROM pg_proc
  JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
  WHERE nspname = 'public' AND proname LIKE '%test%'
  
  UNION ALL
  
  -- Indexes
  SELECT 'index' as objtype, indexname as objname
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname LIKE '%test%'
  
  UNION ALL
  
  -- Triggers
  SELECT 'trigger' as objtype, tgname as objname
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND tgname LIKE '%test%'
) as objects
ORDER BY objtype, objname;
