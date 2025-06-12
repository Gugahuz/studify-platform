-- =============================================
-- COMPREHENSIVE SUPABASE CLEANUP SCRIPT
-- =============================================
-- This script will systematically remove test-related data and configurations
-- while preserving core functionality of the application.
-- CAUTION: This will permanently delete data. Make sure you have backups if needed.

-- Start transaction for safety
BEGIN;

-- =============================================
-- 1. LOGGING SETUP
-- =============================================
CREATE OR REPLACE FUNCTION _log_cleanup_action(action_type text, target_name text, details text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  RAISE NOTICE '% - %: %', action_type, target_name, COALESCE(details, 'completed');
END;
$$ LANGUAGE plpgsql;

-- Log start of cleanup process
SELECT _log_cleanup_action('INFO', 'Cleanup Process', 'Starting comprehensive cleanup');

-- =============================================
-- 2. DISABLE TRIGGERS AND CONSTRAINTS
-- =============================================
-- Temporarily disable triggers to avoid cascading issues
SET session_replication_role = 'replica';

SELECT _log_cleanup_action('CONFIG', 'Triggers', 'Temporarily disabled');

-- =============================================
-- 3. TEST-RELATED TABLES CLEANUP
-- =============================================

-- First, check if test-related tables exist and drop them in the correct order
DO $$
DECLARE
  table_exists boolean;
BEGIN
  -- Check and drop test_answers table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'test_answers'
  ) INTO table_exists;
  
  IF table_exists THEN
    DROP TABLE IF EXISTS public.test_answers;
    PERFORM _log_cleanup_action('DROP', 'test_answers table');
  ELSE
    PERFORM _log_cleanup_action('SKIP', 'test_answers table', 'Table does not exist');
  END IF;

  -- Check and drop test_attempts table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'test_attempts'
  ) INTO table_exists;
  
  IF table_exists THEN
    DROP TABLE IF EXISTS public.test_attempts;
    PERFORM _log_cleanup_action('DROP', 'test_attempts table');
  ELSE
    PERFORM _log_cleanup_action('SKIP', 'test_attempts table', 'Table does not exist');
  END IF;

  -- Check and drop tests table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tests'
  ) INTO table_exists;
  
  IF table_exists THEN
    DROP TABLE IF EXISTS public.tests;
    PERFORM _log_cleanup_action('DROP', 'tests table');
  ELSE
    PERFORM _log_cleanup_action('SKIP', 'tests table', 'Table does not exist');
  END IF;
END $$;

-- =============================================
-- 4. CLEAN UP RELATED FUNCTIONS AND TRIGGERS
-- =============================================

-- Drop the timestamp trigger function if it exists and is not used elsewhere
DO $$
DECLARE
  function_exists boolean;
  function_used boolean;
BEGIN
  -- Check if function exists
  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'trigger_set_timestamp'
  ) INTO function_exists;
  
  -- Check if function is used by other triggers
  IF function_exists THEN
    SELECT EXISTS (
      SELECT FROM pg_trigger t
      JOIN pg_proc p ON p.oid = t.tgfoid
      WHERE p.proname = 'trigger_set_timestamp'
    ) INTO function_used;
    
    IF NOT function_used THEN
      DROP FUNCTION IF EXISTS trigger_set_timestamp();
      PERFORM _log_cleanup_action('DROP', 'trigger_set_timestamp function', 'No longer used');
    ELSE
      PERFORM _log_cleanup_action('KEEP', 'trigger_set_timestamp function', 'Still in use by other triggers');
    END IF;
  ELSE
    PERFORM _log_cleanup_action('SKIP', 'trigger_set_timestamp function', 'Function does not exist');
  END IF;
END $$;

-- =============================================
-- 5. CLEAN UP INDEXES
-- =============================================

-- Remove any orphaned indexes that might have been created for test tables
DO $$
DECLARE
  idx_record record;
BEGIN
  FOR idx_record IN 
    SELECT indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND (
      indexname LIKE 'idx_test_%' OR 
      indexname LIKE '%_test_%_idx'
    )
  LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || idx_record.indexname;
    PERFORM _log_cleanup_action('DROP', 'Index', idx_record.indexname);
  END LOOP;
END $$;

-- =============================================
-- 6. CLEAN UP OTHER VISIBLE TABLES FROM SCREENSHOT
-- =============================================

-- Clean up other tables visible in the screenshot if they're test-related
-- Only drop if they're confirmed to be test data and not essential

-- For tests table (already handled above)
SELECT _log_cleanup_action('INFO', 'tests table', 'Already processed');

-- =============================================
-- 7. VACUUM AND ANALYZE
-- =============================================

-- Re-enable triggers
SET session_replication_role = 'origin';
SELECT _log_cleanup_action('CONFIG', 'Triggers', 'Re-enabled');

-- Vacuum the database to reclaim space and update statistics
VACUUM FULL;
ANALYZE;

SELECT _log_cleanup_action('MAINTENANCE', 'VACUUM FULL', 'Reclaimed space from deleted data');
SELECT _log_cleanup_action('MAINTENANCE', 'ANALYZE', 'Updated database statistics');

-- =============================================
-- 8. CLEANUP TEMPORARY OBJECTS
-- =============================================

-- Drop the logging function
DROP FUNCTION IF EXISTS _log_cleanup_action(text, text, text);

-- =============================================
-- 9. FINAL STATUS
-- =============================================

-- Show remaining tables for verification
SELECT 'Remaining tables in public schema:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Commit the transaction
COMMIT;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'CLEANUP COMPLETED SUCCESSFULLY';
  RAISE NOTICE '================================================';
END $$;
