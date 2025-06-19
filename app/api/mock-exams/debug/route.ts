import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Starting basic debug check...")

    // First, check if we can create a basic response
    const basicCheck = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    console.log("Basic check:", basicCheck)

    // Try to import and create Supabase client
    let supabaseStatus = "not_tested"
    let supabaseError = null
    let connectionTest = null
    let tablesCheck = null

    try {
      const { createClient } = await import("@supabase/supabase-js")

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Missing Supabase environment variables")
      }

      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

      supabaseStatus = "client_created"

      // Test basic connection with a simple query
      console.log("Testing basic connection...")
      const { data: basicData, error: basicError } = await supabase
        .from("profiles")
        .select("count", { count: "exact", head: true })

      if (basicError) {
        console.log("Basic connection failed, trying alternative...")
        supabaseError = basicError.message
        supabaseStatus = "basic_connection_failed"

        // Try a different approach - check if we can access system tables
        const { data: altData, error: altError } = await supabase.rpc("version")

        if (altError) {
          supabaseStatus = "connection_failed"
          supabaseError = `Basic: ${basicError.message}, Alt: ${altError.message}`
        } else {
          supabaseStatus = "connected_alt"
          connectionTest = { method: "rpc_version", result: altData }
        }
      } else {
        supabaseStatus = "connected"
        connectionTest = { method: "profiles_count", count: basicData }
      }

      // Check for mock exam tables specifically
      if (supabaseStatus.includes("connected")) {
        console.log("Checking mock exam tables...")
        const tableChecks = {
          mock_exam_templates: false,
          mock_exam_questions: false,
          mock_exam_attempts: false,
          mock_exam_responses: false,
        }

        // Check each table
        for (const tableName of Object.keys(tableChecks)) {
          try {
            const { error } = await supabase.from(tableName).select("count", { count: "exact", head: true })
            tableChecks[tableName as keyof typeof tableChecks] = !error
          } catch (e) {
            tableChecks[tableName as keyof typeof tableChecks] = false
          }
        }

        tablesCheck = tableChecks
      }
    } catch (error: any) {
      console.error("Supabase error:", error)
      supabaseError = error.message
      supabaseStatus = "import_failed"
    }

    return NextResponse.json({
      success: true,
      debug: {
        basic: basicCheck,
        supabase: {
          status: supabaseStatus,
          error: supabaseError,
          connectionTest,
          tablesCheck,
        },
      },
    })
  } catch (error: any) {
    console.error("❌ Debug error:", error)

    // Return a simple JSON response even if everything fails
    return NextResponse.json(
      {
        success: false,
        error: "Debug check failed",
        details: error.message,
        stack: error.stack?.split("\n").slice(0, 5), // First 5 lines of stack
      },
      { status: 500 },
    )
  }
}
