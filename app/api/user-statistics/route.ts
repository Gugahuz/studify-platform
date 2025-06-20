import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("🔍 Fetching statistics for user:", userId)

    // Get user statistics
    const { data: stats, error: statsError } = await supabase
      .from("user_statistics_summary")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (statsError && statsError.code !== "PGRST116") {
      console.error("❌ Error fetching statistics:", statsError)
      return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
    }

    // If no statistics found, return default values
    if (!stats) {
      console.log("📊 No statistics found, returning defaults")
      return NextResponse.json({
        statistics: {
          total_exams_completed: 0,
          total_questions_answered: 0,
          total_correct_answers: 0,
          overall_accuracy: 0,
          average_score: 0,
          best_score: 0,
          worst_score: 0,
          current_streak: 0,
          longest_streak: 0,
          total_hours_studied: 0,
          last_exam_date: null,
          created_at: null,
        },
      })
    }

    console.log("✅ Statistics fetched successfully")
    return NextResponse.json({ statistics: stats })
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
