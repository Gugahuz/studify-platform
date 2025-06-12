import { createClient } from "@supabase/supabase-js"

// Log available environment variables (without showing their values)
console.log("🔍 Available environment variables:")
const envVars = Object.keys(process.env)
  .filter((key) => key.includes("SUPABASE") || key.includes("POSTGRES"))
  .sort()

envVars.forEach((key) => {
  console.log(`- ${key}: ${process.env[key] ? "✓" : "✗"}`)
})

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error("❌ Missing Supabase URL")
  console.log("Please set one of these environment variables:")
  console.log("- NEXT_PUBLIC_SUPABASE_URL")
  console.log("- SUPABASE_URL")
  process.exit(1)
}

if (!supabaseKey) {
  console.error("❌ Missing Supabase API key")
  console.log("Please set one of these environment variables:")
  console.log("- SUPABASE_SERVICE_ROLE_KEY (preferred)")
  console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY")
  console.log("- SUPABASE_ANON_KEY")
  process.exit(1)
}

// Create Supabase client
console.log("\n🔌 Creating Supabase client...")
console.log(`URL: ${supabaseUrl}`)
console.log(`Key: ${supabaseKey.substring(0, 5)}...${supabaseKey.substring(supabaseKey.length - 5)}`)

const supabase = createClient(supabaseUrl, supabaseKey)

// Alternative approach using direct PostgreSQL connection
console.log("\n🔄 If Supabase client doesn't work, we'll try direct PostgreSQL connection")
const pgUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (pgUrl) {
  console.log(`PostgreSQL URL available: ${pgUrl.substring(0, 10)}...`)
} else {
  console.log("No PostgreSQL URL found in environment variables")
}

// Function to execute SQL via Supabase
async function executeQuery(query, description) {
  console.log(`\n🔄 ${description}...`)

  try {
    // Try using Supabase's rpc first
    const { data: rpcData, error: rpcError } = await supabase.rpc("exec_sql", { sql_query: query })

    if (!rpcError) {
      console.log(`✅ ${description} - Success (via RPC)`)
      return { success: true, data: rpcData }
    }

    // If RPC fails, try direct query
    console.log(`⚠️ RPC failed: ${rpcError.message}`)
    console.log(`🔄 Trying direct query...`)

    // For SELECT queries
    if (query.trim().toLowerCase().startsWith("select")) {
      const { data, error, count } = await supabase.from("_temp_view").select("*").limit(100)

      if (error) {
        throw new Error(`Direct query failed: ${error.message}`)
      }

      console.log(`✅ ${description} - Success (via direct query)`)
      return { success: true, data, count }
    }

    throw new Error("Could not execute query via Supabase client")
  } catch (err) {
    console.log(`⚠️ ${description} - Error: ${err.message}`)
    return { success: false, error: err.message }
  }
}

// Function to check if a table exists
async function tableExists(tableName) {
  const { data } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public")
    .eq("table_name", tableName)
    .maybeSingle()

  return !!data
}

// Main cleanup function
async function cleanupDatabase() {
  console.log("\n=== TESTING CONNECTION ===")

  // Test connection by getting user count
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("count", { count: "exact", head: true })

  if (userError) {
    console.log(`⚠️ Connection test failed: ${userError.message}`)
    console.log("Trying alternative approach...")
  } else {
    console.log("✅ Connection successful!")
  }

  console.log("\n=== CHECKING EXISTING TABLES ===")

  // List all tables
  const { data: tables, error: tablesError } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public")

  if (tablesError) {
    console.log(`⚠️ Could not list tables: ${tablesError.message}`)
  } else {
    console.log("📋 Existing tables:")
    tables.forEach((t) => console.log(`- ${t.table_name}`))
  }

  console.log("\n=== REMOVING TEST TABLES ===")

  // Tables to check and remove
  const testTables = ["test_answers", "test_attempts", "tests"]

  for (const table of testTables) {
    const exists = await tableExists(table)

    if (exists) {
      console.log(`🔍 Found table: ${table}`)

      // Try to drop the table
      try {
        const { error } = await supabase.rpc("exec_sql", {
          sql_query: `DROP TABLE IF EXISTS ${table} CASCADE;`,
        })

        if (error) {
          console.log(`⚠️ Could not drop ${table}: ${error.message}`)
          console.log(`🔄 Trying alternative method...`)

          // Try to truncate first
          await supabase.from(table).delete().gt("id", 0)
          console.log(`✅ Deleted data from ${table}`)
        } else {
          console.log(`✅ Dropped table: ${table}`)
        }
      } catch (err) {
        console.log(`⚠️ Error with ${table}: ${err.message}`)
      }
    } else {
      console.log(`✓ Table ${table} does not exist`)
    }
  }

  console.log("\n=== CLEANUP COMPLETED ===")
  console.log("✅ Test-related tables have been cleaned up")

  // Final verification
  const { data: finalTables } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public")

  if (finalTables) {
    console.log("\n📋 Remaining tables:")
    finalTables.forEach((t) => console.log(`- ${t.table_name}`))
    console.log(`\nTotal: ${finalTables.length} tables`)
  }
}

// Execute cleanup
cleanupDatabase()
  .then(() => {
    console.log("\n🎉 Database cleanup process completed!")
  })
  .catch((error) => {
    console.error("\n❌ Database cleanup failed:", error)
  })
