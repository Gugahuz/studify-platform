import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: Request, { params }: { params: { attemptId: string } }) {
  try {
    const attemptId = params.attemptId

    console.log("📊 Fetching exam results for attempt:", attemptId)

    // Get attempt with template info
    const { data: attempt, error: attemptError } = await supabase
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
          passing_score
        )
      `)
      .eq("id", attemptId)
      .single()

    if (attemptError || !attempt) {
      console.error("❌ Attempt not found:", attemptError)
      return NextResponse.json({ success: false, error: "Attempt not found" }, { status: 404 })
    }

    // Get responses with question details
    const { data: responses, error: responsesError } = await supabase
      .from("mock_exam_responses")
      .select(`
        *,
        mock_exam_questions (
          id,
          question_number,
          question_text,
          options,
          correct_answer,
          explanation,
          subject_area,
          points
        )
      `)
      .eq("attempt_id", attemptId)
      .order("mock_exam_questions(question_number)")

    if (responsesError) {
      console.error("❌ Error fetching responses:", responsesError)
      return NextResponse.json({ success: false, error: "Failed to fetch responses" }, { status: 500 })
    }

    // Calculate subject performance
    const subjectStats: Record<string, any> = {}
    responses?.forEach((response) => {
      const subject = response.mock_exam_questions?.subject_area || "Geral"
      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, correct: 0 }
      }
      subjectStats[subject].total++
      if (response.is_correct) {
        subjectStats[subject].correct++
      }
    })

    const subjectPerformance = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      total: stats.total,
      correct: stats.correct,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }))

    console.log("✅ Results fetched successfully")

    return NextResponse.json({
      success: true,
      data: {
        attempt,
        responses: responses || [],
        statistics: {
          totalQuestions: attempt.total_questions,
          answeredQuestions: attempt.answered_questions,
          correctAnswers: attempt.correct_answers,
          incorrectAnswers: attempt.incorrect_answers,
          skippedQuestions: attempt.skipped_questions,
          scorePercentage: attempt.percentage,
          totalPoints: attempt.total_points,
          maxPoints: attempt.max_points,
          timeSpent: attempt.time_spent_seconds,
          timeLimit: (attempt.mock_exam_templates?.time_limit_minutes || 0) * 60,
          passed: (attempt.percentage || 0) >= (attempt.mock_exam_templates?.passing_score || 60),
        },
        subjectPerformance,
      },
    })
  } catch (error: any) {
    console.error("❌ Error fetching results:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
