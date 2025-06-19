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
    console.log("📊 Fetching exam history...")

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 50)

    const userId = "00000000-0000-0000-0000-000000000001"
    const offset = (page - 1) * limit

    // Get completed attempts with template info
    const { data: attempts, error: attemptsError } = await supabase
      .from("mock_exam_attempts")
      .select(`
        *,
        mock_exam_templates (
          id,
          title,
          description,
          category,
          difficulty_level,
          time_limit_minutes,
          passing_score,
          is_featured
        )
      `)
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (attemptsError) {
      console.error("❌ Error fetching attempts:", attemptsError)
      return NextResponse.json({ success: false, error: attemptsError.message }, { status: 500 })
    }

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("mock_exam_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed")

    if (countError) {
      console.log("⚠️ Error getting count:", countError.message)
    }

    const total = totalCount || 0
    const totalPages = Math.ceil(total / limit)

    console.log(`✅ Found ${attempts?.length || 0} completed attempts`)

    return NextResponse.json({
      success: true,
      data: {
        attempts: attempts || [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error: any) {
    console.error("❌ Error fetching history:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
