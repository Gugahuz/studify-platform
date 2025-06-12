console.log("🔍 DEBUGGING ENVIRONMENT VARIABLES")
console.log("=".repeat(50))

// List ALL environment variables
console.log("📋 All available environment variables:")
const allEnvVars = Object.keys(process.env).sort()

allEnvVars.forEach((key) => {
  const value = process.env[key]
  if (key.includes("POSTGRES") || key.includes("DATABASE") || key.includes("SUPABASE")) {
    console.log(`🔑 ${key}: ${value ? value.substring(0, 20) + "..." : "undefined"}`)
  }
})

console.log(`\n📊 Total environment variables: ${allEnvVars.length}`)

// Check specific variables we expect
const expectedVars = [
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
]

console.log("\n🎯 Checking expected database variables:")
expectedVars.forEach((varName) => {
  const value = process.env[varName]
  console.log(`${value ? "✅" : "❌"} ${varName}: ${value ? "SET" : "NOT SET"}`)
})

// Show a sample of other environment variables
console.log("\n🔍 Other environment variables (first 20):")
allEnvVars.slice(0, 20).forEach((key) => {
  if (!expectedVars.includes(key)) {
    console.log(`- ${key}`)
  }
})

// Try to construct a connection string from individual components
console.log("\n🔧 Attempting to construct connection from components:")
const host = process.env.POSTGRES_HOST
const user = process.env.POSTGRES_USER
const password = process.env.POSTGRES_PASSWORD
const database = process.env.POSTGRES_DATABASE

console.log(`Host: ${host || "NOT SET"}`)
console.log(`User: ${user || "NOT SET"}`)
console.log(`Password: ${password ? "SET" : "NOT SET"}`)
console.log(`Database: ${database || "NOT SET"}`)

if (host && user && password && database) {
  const constructedUrl = `postgresql://${user}:${password}@${host}/${database}`
  console.log(`\n🔗 Constructed URL: postgresql://${user}:***@${host}/${database}`)

  // Test this connection
  try {
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(constructedUrl)
    const result = await sql`SELECT 1 as test`
    console.log("✅ Constructed connection works!")
  } catch (error) {
    console.log(`❌ Constructed connection failed: ${error.message}`)
  }
}

console.log("\n" + "=".repeat(50))
