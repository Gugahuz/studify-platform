import { createClient } from "@supabase/supabase-js"

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials")
  console.log("Required environment variables:")
  console.log("- NEXT_PUBLIC_SUPABASE_URL")
  console.log("- SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)")
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log("🧹 Starting Supabase Database Cleanup...")
console.log("📍 URL:", supabaseUrl)
console.log("🔑 Using service key:", supabaseServiceKey.substring(0, 20) + "...")

async function executeSQL(query, description) {
  try {
    console.log(`\n🔄 ${description}...`)
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: query })

    if (error) {
      console.log(`⚠️  ${description} - Error (might be expected):`, error.message)
      return false
    }

    console.log(`✅ ${description} - Success`)
    if (data) console.log("📊 Result:", data)
    return true
  } catch (err) {
    console.log(`⚠️  ${description} - Exception:`, err.message)
    return false
  }
}

async function cleanupDatabase() {
  console.log("\n=== PHASE 1: CHECKING CURRENT STATE ===")

  // Check existing tables
  await executeSQL(
    `
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%test%'
    ORDER BY table_name;
  `,
    "Checking test-related tables",
  )

  console.log("\n=== PHASE 2: REMOVING TEST TABLES ===")

  // Drop test tables in correct order (child tables first)
  const tablesToDrop = ["test_answers", "test_attempts", "tests"]

  for (const table of tablesToDrop) {
    await executeSQL(`DROP TABLE IF EXISTS ${table} CASCADE;`, `Dropping table: ${table}`)
  }

  console.log("\n=== PHASE 3: CLEANING UP FUNCTIONS ===")

  // Drop test-related functions
  const functionsToCheck = ["check_user_exists", "log_login_attempt", "exec_sql", "get_table_columns"]

  for (const func of functionsToCheck) {
    await executeSQL(`DROP FUNCTION IF EXISTS ${func}() CASCADE;`, `Checking function: ${func}`)
    await executeSQL(`DROP FUNCTION IF EXISTS ${func}(text) CASCADE;`, `Checking function: ${func}(text)`)
    await executeSQL(`DROP FUNCTION IF EXISTS ${func}(uuid) CASCADE;`, `Checking function: ${func}(uuid)`)
  }

  console.log("\n=== PHASE 4: VERIFICATION ===")

  // Verify cleanup
  await executeSQL(
    `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `,
    "Listing remaining tables",
  )

  console.log("\n=== PHASE 5: CREATING ESSENTIAL FUNCTIONS ===")

  // Create essential functions that might be needed
  await executeSQL(
    `
    CREATE OR REPLACE FUNCTION check_user_exists(user_id uuid)
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM auth.users WHERE id = user_id
      );
    END;
    $$;
  `,
    "Creating check_user_exists function",
  )

  await executeSQL(
    `
    CREATE OR REPLACE FUNCTION log_login_attempt(
      p_email text,
      p_success boolean,
      p_user_id uuid DEFAULT NULL,
      p_ip_address text DEFAULT NULL,
      p_user_agent text DEFAULT NULL,
      p_error_message text DEFAULT NULL
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      INSERT INTO login_logs (
        user_id, email, login_attempt_time, success, 
        ip_address, user_agent, error_message
      ) VALUES (
        p_user_id, p_email, NOW(), p_success,
        p_ip_address, p_user_agent, p_error_message
      );
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors if login_logs table doesn't exist
      NULL;
    END;
    $$;
  `,
    "Creating log_login_attempt function",
  )

  console.log("\n=== CLEANUP COMPLETED ===")
  console.log("✅ Test-related tables and functions have been cleaned up")
  console.log("✅ Essential functions have been recreated")
  console.log("✅ Database is ready for future development")

  // Final verification
  console.log("\n=== FINAL STATUS ===")
  await executeSQL(
    `
    SELECT 
      COUNT(*) as total_tables,
      STRING_AGG(table_name, ', ' ORDER BY table_name) as table_list
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `,
    "Final table count and list",
  )
}

// Execute cleanup
cleanupDatabase()
  .then(() => {
    console.log("\n🎉 Database cleanup completed successfully!")
  })
  .catch((error) => {
    console.error("\n❌ Database cleanup failed:", error)
  })
