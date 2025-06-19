import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: Request) {
  try {
    console.log("🔍 Fetching mock exam templates...")

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const featured = searchParams.get("featured")

    let query = supabase
      .from("mock_exam_templates")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    if (featured === "true") {
      query = query.eq("is_featured", true)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error("❌ Database error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Database query failed",
          templates: [],
        },
        { status: 500 },
      )
    }

    console.log(`✅ Found ${templates?.length || 0} templates`)

    return NextResponse.json({
      success: true,
      templates: templates || [],
      count: templates?.length || 0,
    })
  } catch (error: any) {
    console.error("❌ API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        templates: [],
      },
      { status: 500 },
    )
  }
}
