import { neon } from "@neondatabase/serverless"

console.log("🔧 ATTEMPTING DATABASE CLEANUP WITH CONSTRUCTED URL")
console.log("=".repeat(60))

// Try to get database connection from various sources
let databaseUrl = null
let connectionSource = ""

// Method 1: Direct environment variables
const directUrls = [
  { name: "POSTGRES_URL", value: process.env.POSTGRES_URL },
  { name: "POSTGRES_PRISMA_URL", value: process.env.POSTGRES_PRISMA_URL },
  { name: "POSTGRES_URL_NON_POOLING", value: process.env.POSTGRES_URL_NON_POOLING },
  { name: "DATABASE_URL", value: process.env.DATABASE_URL },
]

for (const url of directUrls) {
  if (url.value) {
    databaseUrl = url.value
    connectionSource = url.name
    console.log(`✅ Found connection string in ${url.name}`)
    break
  }
}

// Method 2: Construct from components
if (!databaseUrl) {
  const host = process.env.POSTGRES_HOST
  const user = process.env.POSTGRES_USER
  const password = process.env.POSTGRES_PASSWORD
  const database = process.env.POSTGRES_DATABASE

  if (host && user && password && database) {
    databaseUrl = `postgresql://${user}:${password}@${host}/${database}`
    connectionSource = "CONSTRUCTED"
    console.log(`✅ Constructed connection string from components`)
  }
}

if (!databaseUrl) {
  console.error("❌ Could not find or construct database connection!")
  console.log("\n🔍 Available environment variables:")
  Object.keys(process.env).forEach((key) => {
    if (key.includes("POSTGRES") || key.includes("DATABASE")) {
      console.log(`- ${key}: ${process.env[key] ? "SET" : "NOT SET"}`)
    }
  })
  process.exit(1)
}

console.log(`🔌 Using connection from: ${connectionSource}`)
console.log(`🔗 Connection: ${databaseUrl.substring(0, 30)}...`)

// Create Neon client
const sql = neon(databaseUrl)

async function cleanupDatabase() {
  try {
    console.log("\n=== TESTING CONNECTION ===")

    // Test connection
    const testResult = await sql`SELECT current_database(), current_user, now() as current_time`
    console.log("✅ Database connection successful!")
    console.log(`📊 Database: ${testResult[0].current_database}`)
    console.log(`👤 User: ${testResult[0].current_user}`)
    console.log(`⏰ Time: ${testResult[0].current_time}`)

    console.log("\n=== LISTING ALL TABLES ===")

    // List all tables
    const allTables = await sql`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    console.log(`📋 Found ${allTables.length} tables in public schema:`)
    allTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name} (${table.table_type})`)
    })

    console.log("\n=== IDENTIFYING TEST TABLES ===")

    // Check for test-related tables
    const testTableNames = ["tests", "test_attempts", "test_answers"]
    const existingTestTables = []

    for (const tableName of testTableNames) {
      const tableExists = allTables.find((t) => t.table_name === tableName)
      if (tableExists) {
        existingTestTables.push(tableName)
        console.log(`🔴 FOUND: ${tableName}`)

        // Get row count
        try {
          const count = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`
          console.log(`   📊 Rows: ${count[0].count}`)
        } catch (error) {
          console.log(`   ⚠️ Could not count rows: ${error.message}`)
        }
      } else {
        console.log(`🟢 NOT FOUND: ${tableName}`)
      }
    }

    if (existingTestTables.length === 0) {
      console.log("\n✅ No test tables found! Database is already clean.")
      return
    }

    console.log(`\n🗑️ REMOVING ${existingTestTables.length} TEST TABLES`)

    // Remove tables in correct order (child tables first)
    const removalOrder = ["test_answers", "test_attempts", "tests"]

    for (const tableName of removalOrder) {
      if (existingTestTables.includes(tableName)) {
        try {
          console.log(`\n🔄 Processing table: ${tableName}`)

          // Get table structure first
          const columns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = ${tableName} AND table_schema = 'public'
            ORDER BY ordinal_position
          `

          console.log(`   📋 Columns (${columns.length}): ${columns.map((c) => c.column_name).join(", ")}`)

          // Drop the table
          await sql`DROP TABLE IF EXISTS ${sql(tableName)} CASCADE`
          console.log(`   ✅ Successfully dropped: ${tableName}`)
        } catch (error) {
          console.log(`   ❌ Error dropping ${tableName}: ${error.message}`)
        }
      }
    }

    console.log("\n=== FINAL VERIFICATION ===")

    // Check remaining tables
    const finalTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    console.log(`📋 Remaining tables (${finalTables.length}):`)
    finalTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`)
    })

    // Verify test tables are gone
    const remainingTestTables = finalTables.filter((t) => testTableNames.includes(t.table_name))

    if (remainingTestTables.length === 0) {
      console.log("\n🎉 SUCCESS! All test tables have been removed!")
      console.log("✅ Database cleanup completed successfully")
    } else {
      console.log("\n⚠️ WARNING: Some test tables still exist:")
      remainingTestTables.forEach((t) => console.log(`- ${t.table_name}`))
    }
  } catch (error) {
    console.error("\n❌ CLEANUP FAILED:")
    console.error(`Error: ${error.message}`)
    console.error(`Stack: ${error.stack}`)
  }
}

// Execute the cleanup
cleanupDatabase()
