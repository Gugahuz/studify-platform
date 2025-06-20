import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const { data, error } = await supabase.from("user_stats").select("*").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching stats:", error)
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }

    // Return default stats if none found
    const stats = data || {
      total_exams: 0,
      total_correct: 0,
      total_questions: 0,
      best_score: 0,
      average_score: 0,
      total_time_minutes: 0,
      last_exam_date: null,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, score, totalQuestions, correctAnswers, timeMinutes } = body

    if (!userId || score === undefined || !totalQuestions || correctAnswers === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { error } = await supabase.rpc("update_user_stats", {
      p_user_id: userId,
      p_score: score,
      p_total_questions: totalQuestions,
      p_correct_answers: correctAnswers,
      p_time_minutes: timeMinutes || 0,
    })

    if (error) {
      console.error("Error updating stats:", error)
      return NextResponse.json({ error: "Failed to update stats" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
