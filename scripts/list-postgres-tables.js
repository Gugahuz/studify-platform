import { neon } from "@neondatabase/serverless"

// Get the database URL
const databaseUrl =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("❌ No PostgreSQL connection string found!")
  process.exit(1)
}

console.log(`🔌 Connecting to database...`)

// Create Neon client
const sql = neon(databaseUrl)

async function listTables() {
  try {
    // Test connection and get basic info
    const info = await sql`SELECT current_database(), current_user, version()`
    console.log("✅ Connected successfully!")
    console.log(`Database: ${info[0].current_database}`)
    console.log(`User: ${info[0].current_user}`)

    // List all tables
    const tables = await sql`
      SELECT 
        table_name, 
        table_type,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    console.log(`\n📋 Found ${tables.length} tables in public schema:`)

    tables.forEach((table) => {
      console.log(`- ${table.table_name} (${table.column_count} columns)`)
    })

    // Check specifically for test-related tables
    console.log("\n🔍 Checking for test-related tables:")
    const testTables = ["tests", "test_attempts", "test_answers"]

    for (const tableName of testTables) {
      const exists = tables.find((t) => t.table_name === tableName)
      if (exists) {
        console.log(`🔴 ${tableName} - EXISTS`)

        // Get column details
        const columns = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = ${tableName} AND table_schema = 'public'
          ORDER BY ordinal_position
        `

        console.log(`   Columns: ${columns.map((col) => `${col.column_name}(${col.data_type})`).join(", ")}`)
      } else {
        console.log(`🟢 ${tableName} - NOT FOUND`)
      }
    }

    // Show table sizes if possible
    console.log("\n📊 Attempting to get table sizes:")
    try {
      const sizes = await sql`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        LIMIT 10
      `

      if (sizes.length > 0) {
        console.log("Sample table statistics available")
      }
    } catch (error) {
      console.log("⚠️ Could not get table statistics (this is normal)")
    }
  } catch (error) {
    console.error("❌ Error:", error.message)
  }
}

listTables()
