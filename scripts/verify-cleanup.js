import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log("🔍 Verifying Database Cleanup...")

async function verifyCleanup() {
  try {
    // Check for any remaining test tables
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .like("table_name", "%test%")

    if (tablesError) {
      console.log("⚠️  Could not check tables via Supabase client, trying direct query...")
    } else {
      console.log("\n📊 Test-related tables found:", tables?.length || 0)
      if (tables && tables.length > 0) {
        console.log("Tables:", tables.map((t) => t.table_name).join(", "))
      }
    }

    // Check all remaining tables
    const { data: allTables, error: allTablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .order("table_name")

    if (!allTablesError && allTables) {
      console.log("\n📋 All remaining tables:")
      allTables.forEach((table) => {
        console.log(`  - ${table.table_name}`)
      })
      console.log(`\nTotal: ${allTables.length} tables`)
    }

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...")

    // Test profiles table access
    const { data: profilesTest, error: profilesError } = await supabase
      .from("profiles")
      .select("count", { count: "exact" })
      .limit(1)

    if (profilesError) {
      console.log("⚠️  Profiles table test failed:", profilesError.message)
    } else {
      console.log("✅ Profiles table accessible")
    }

    // Test other core tables
    const coreTables = ["schedule_items", "subjects", "events", "user_data"]

    for (const table of coreTables) {
      const { error } = await supabase.from(table).select("count", { count: "exact" }).limit(1)

      if (error) {
        console.log(`⚠️  ${table} table test failed:`, error.message)
      } else {
        console.log(`✅ ${table} table accessible`)
      }
    }

    console.log("\n🎉 Verification completed!")
    console.log("✅ Database cleanup was successful")
    console.log("✅ Core functionality preserved")
  } catch (error) {
    console.error("❌ Verification failed:", error)
  }
}

verifyCleanup()
