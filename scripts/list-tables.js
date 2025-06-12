import { createClient } from "@supabase/supabase-js"

// Log all environment variables that might contain Supabase credentials
console.log("🔍 Checking for Supabase credentials in environment variables:")

const relevantVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_URL",
]

relevantVars.forEach((varName) => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`)
  } else {
    console.log(`❌ ${varName}: not set`)
  }
})

// Try to create Supabase client with available credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("\n❌ Cannot create Supabase client: missing URL or key")
  process.exit(1)
}

console.log("\n🔌 Creating Supabase client with:")
console.log(`URL: ${supabaseUrl}`)
console.log(`Key: ${supabaseKey.substring(0, 5)}...${supabaseKey.substring(supabaseKey.length - 5)}`)

const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
  try {
    console.log("\n📋 Attempting to list tables...")

    // Try to list tables using information_schema
    const { data: tables, error } = await supabase
      .from("information_schema.tables")
      .select("table_name, table_type")
      .eq("table_schema", "public")
      .order("table_name")

    if (error) {
      console.log(`⚠️ Error listing tables: ${error.message}`)
      return
    }

    if (tables && tables.length > 0) {
      console.log(`\n✅ Found ${tables.length} tables:`)
      tables.forEach((table) => {
        console.log(`- ${table.table_name} (${table.table_type})`)
      })
    } else {
      console.log("⚠️ No tables found or no access to information_schema")
    }

    // Try to access some common tables directly
    console.log("\n🧪 Testing access to common tables:")

    const commonTables = ["profiles", "users", "schedule_items", "tests"]

    for (const table of commonTables) {
      try {
        const { data, error, count } = await supabase.from(table).select("count", { count: "exact", head: true })

        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: accessible (count: ${count})`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
    }
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

listTables()
