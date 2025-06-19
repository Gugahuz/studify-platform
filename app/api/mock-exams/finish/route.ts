import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: Request) {
  try {
    const { attempt_id, time_spent_seconds = 0 } = await request.json()

    if (!attempt_id) {
      return NextResponse.json({ success: false, error: "Attempt ID is required" }, { status: 400 })
    }

    console.log("🏁 Finishing exam attempt:", attempt_id)

    // Get attempt details
    const { data: attempt, error: attemptError } = await supabase
      .from("mock_exam_attempts")
      .select("*")
      .eq("id", attempt_id)
      .single()

    if (attemptError || !attempt) {
      console.error("❌ Attempt not found:", attemptError)
      return NextResponse.json({ success: false, error: "Attempt not found" }, { status: 404 })
    }

    if (attempt.status === "completed") {
      return NextResponse.json({ success: true, message: "Attempt already completed" })
    }

    // Get all responses for this attempt
    const { data: responses, error: responsesError } = await supabase
      .from("mock_exam_responses")
      .select("*")
      .eq("attempt_id", attempt_id)

    if (responsesError) {
      console.error("❌ Error fetching responses:", responsesError)
      return NextResponse.json({ success: false, error: "Failed to fetch responses" }, { status: 500 })
    }

    // Calculate results
    const totalQuestions = attempt.total_questions || 0
    const answeredQuestions = responses?.filter((r) => r.user_answer && r.user_answer.trim()).length || 0
    const correctAnswers = responses?.filter((r) => r.is_correct).length || 0
    const incorrectAnswers = answeredQuestions - correctAnswers
    const skippedQuestions = totalQuestions - answeredQuestions
    const totalPoints = responses?.reduce((sum, r) => sum + (r.points_earned || 0), 0) || 0
    const maxPoints = attempt.max_points || totalQuestions
    const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0

    // Update attempt with results
    const { data: updatedAttempt, error: updateError } = await supabase
      .from("mock_exam_attempts")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        time_spent_seconds,
        answered_questions: answeredQuestions,
        correct_answers: correctAnswers,
        incorrect_answers: incorrectAnswers,
        skipped_questions: skippedQuestions,
        total_points: totalPoints,
        percentage: percentage,
        score: correctAnswers, // Simple scoring
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt_id)
      .select(`
        *,
        mock_exam_templates (
          id,
          title,
          category,
          difficulty_level,
          time_limit_minutes,
          passing_score
        )
      `)
      .single()

    if (updateError) {
      console.error("❌ Error updating attempt:", updateError)
      return NextResponse.json({ success: false, error: "Failed to complete attempt" }, { status: 500 })
    }

    console.log("✅ Exam completed successfully:", {
      percentage,
      correctAnswers,
      totalQuestions,
    })

    return NextResponse.json({
      success: true,
      data: {
        attempt: updatedAttempt,
        results: {
          totalQuestions,
          answeredQuestions,
          correctAnswers,
          incorrectAnswers,
          skippedQuestions,
          percentage,
          totalPoints,
          maxPoints,
          passed: percentage >= (updatedAttempt.mock_exam_templates?.passing_score || 60),
        },
      },
    })
  } catch (error: any) {
    console.error("❌ Error finishing exam:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
