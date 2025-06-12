import { neon } from "@neondatabase/serverless"

// Check available environment variables
console.log("🔍 Checking available database credentials:")

const dbVars = ["POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING", "DATABASE_URL"]

dbVars.forEach((varName) => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 15)}...`)
  } else {
    console.log(`❌ ${varName}: not set`)
  }
})

// Get the database URL
const databaseUrl =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("❌ No PostgreSQL connection string found!")
  console.log("Available environment variables:")
  Object.keys(process.env).forEach((key) => {
    if (key.includes("POSTGRES") || key.includes("DATABASE")) {
      console.log(`- ${key}`)
    }
  })
  process.exit(1)
}

console.log(`\n🔌 Using database connection: ${databaseUrl.substring(0, 20)}...`)

// Create Neon client
const sql = neon(databaseUrl)

async function cleanupDatabase() {
  try {
    console.log("\n=== TESTING CONNECTION ===")

    // Test connection
    const testResult = await sql`SELECT current_database(), current_user, version()`
    console.log("✅ Database connection successful!")
    console.log(`Database: ${testResult[0].current_database}`)
    console.log(`User: ${testResult[0].current_user}`)

    console.log("\n=== LISTING CURRENT TABLES ===")

    // List all tables in public schema
    const tables = await sql`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    console.log(`Found ${tables.length} tables:`)
    tables.forEach((table) => {
      console.log(`- ${table.table_name} (${table.table_type})`)
    })

    console.log("\n=== CHECKING FOR TEST-RELATED TABLES ===")

    // Check for test-related tables
    const testTables = ["tests", "test_attempts", "test_answers"]
    const existingTestTables = []

    for (const tableName of testTables) {
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )
      `

      if (exists[0].exists) {
        existingTestTables.push(tableName)
        console.log(`🔍 Found test table: ${tableName}`)
      } else {
        console.log(`✓ Table ${tableName} does not exist`)
      }
    }

    if (existingTestTables.length === 0) {
      console.log("\n✅ No test-related tables found. Database is already clean!")
      return
    }

    console.log("\n=== REMOVING TEST TABLES ===")

    // Remove test tables in correct order (respecting foreign keys)
    const removalOrder = ["test_answers", "test_attempts", "tests"]

    for (const tableName of removalOrder) {
      if (existingTestTables.includes(tableName)) {
        try {
          console.log(`🗑️ Dropping table: ${tableName}`)

          // First, get table info
          const tableInfo = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = ${tableName} 
            AND table_schema = 'public'
          `

          console.log(`   Columns: ${tableInfo.map((col) => col.column_name).join(", ")}`)

          // Drop the table
          await sql`DROP TABLE IF EXISTS ${sql(tableName)} CASCADE`
          console.log(`✅ Successfully dropped table: ${tableName}`)
        } catch (error) {
          console.log(`⚠️ Error dropping ${tableName}: ${error.message}`)
        }
      }
    }

    console.log("\n=== CLEANING UP RELATED OBJECTS ===")

    // Remove any test-related functions
    try {
      const functions = await sql`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE '%test%'
      `

      for (const func of functions) {
        try {
          await sql`DROP FUNCTION IF EXISTS ${sql(func.routine_name)} CASCADE`
          console.log(`✅ Dropped function: ${func.routine_name}`)
        } catch (error) {
          console.log(`⚠️ Could not drop function ${func.routine_name}: ${error.message}`)
        }
      }
    } catch (error) {
      console.log(`⚠️ Error checking functions: ${error.message}`)
    }

    console.log("\n=== FINAL VERIFICATION ===")

    // List remaining tables
    const finalTables = await sql`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    console.log(`\n📋 Remaining tables (${finalTables.length}):`)
    finalTables.forEach((table) => {
      console.log(`- ${table.table_name}`)
    })

    // Check if any test tables still exist
    const remainingTestTables = finalTables.filter((table) => testTables.includes(table.table_name))

    if (remainingTestTables.length === 0) {
      console.log("\n🎉 SUCCESS: All test-related tables have been removed!")
    } else {
      console.log("\n⚠️ WARNING: Some test tables still exist:")
      remainingTestTables.forEach((table) => {
        console.log(`- ${table.table_name}`)
      })
    }

    console.log("\n=== CLEANUP COMPLETED ===")
  } catch (error) {
    console.error("❌ Database cleanup failed:", error)
    console.error("Error details:", error.message)
  }
}

// Execute cleanup
cleanupDatabase()
