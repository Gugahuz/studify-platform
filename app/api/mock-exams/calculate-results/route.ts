import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key for admin operations
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🧮 Calculate results request body:", body)

    const { attempt_id, attemptId } = body
    const finalAttemptId = attempt_id || attemptId

    console.log("🧮 Calculating results for attempt:", finalAttemptId)

    if (!finalAttemptId) {
      console.error("❌ No attempt ID provided in request")
      return NextResponse.json({ success: false, error: "Attempt ID is required" }, { status: 400 })
    }

    // Try to use the database function first
    console.log("📊 Attempting to use update_attempt_results function...")
    let functionResult = null
    let functionError = null

    try {
      const { data: updateResult, error: updateError } = await supabase.rpc("update_attempt_results", {
        attempt_uuid: finalAttemptId,
      })
      functionResult = updateResult
      functionError = updateError
    } catch (error: any) {
      console.log("⚠️ Function not available, using fallback calculation:", error.message)
      functionError = error
    }

    // If function failed, do manual calculation
    if (functionError) {
      console.log("🔄 Using manual calculation fallback...")
      await performManualCalculation(finalAttemptId)
    } else {
      console.log("✅ Function calculation successful:", functionResult)
    }

    // Get the updated attempt with all calculated data
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
      .eq("id", finalAttemptId)
      .single()

    if (attemptError || !attempt) {
      console.error("❌ Error fetching updated attempt:", attemptError)
      return NextResponse.json({ success: false, error: "Failed to fetch updated attempt" }, { status: 500 })
    }

    console.log("📋 Updated attempt data:", {
      id: attempt.id,
      percentage: attempt.percentage,
      correct_answers: attempt.correct_answers,
      total_questions: attempt.total_questions,
    })

    // Get all responses for this attempt with question details
    const { data: responses, error: responsesError } = await supabase
      .from("mock_exam_responses")
      .select(`
        *,
        mock_exam_questions (
          id,
          question_number,
          question_text,
          correct_answer,
          points,
          subject_area,
          options,
          explanation
        )
      `)
      .eq("attempt_id", finalAttemptId)
      .order("mock_exam_questions(question_number)", { ascending: true })

    if (responsesError) {
      console.error("❌ Error fetching responses:", responsesError)
      return NextResponse.json({ success: false, error: "Failed to fetch responses" }, { status: 500 })
    }

    console.log(`📊 Found ${responses?.length || 0} responses`)

    // Ensure responses is always an array
    const safeResponses = Array.isArray(responses) ? responses : []

    // Calculate subject performance
    const subjectStats: Record<string, any> = {}
    safeResponses.forEach((response) => {
      const subject = response.mock_exam_questions?.subject_area || "Geral"
      if (!subjectStats[subject]) {
        subjectStats[subject] = {
          total: 0,
          correct: 0,
          answered: 0,
        }
      }
      subjectStats[subject].total++
      if (response.user_answer && response.user_answer.trim() !== "") {
        subjectStats[subject].answered++
        if (response.is_correct) {
          subjectStats[subject].correct++
        }
      }
    })

    // Convert to array with percentages
    const subjectPerformance = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      total: stats.total,
      correct: stats.correct,
      answered: stats.answered,
      percentage: stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0,
    }))

    const results = {
      attempt,
      responses: safeResponses,
      statistics: {
        totalQuestions: attempt.total_questions || safeResponses.length,
        answeredQuestions:
          attempt.answered_questions ||
          safeResponses.filter((r) => r.user_answer && r.user_answer.trim() !== "").length,
        unansweredQuestions:
          attempt.skipped_questions ||
          safeResponses.filter((r) => !r.user_answer || r.user_answer.trim() === "").length,
        correctAnswers: attempt.correct_answers || safeResponses.filter((r) => r.is_correct).length,
        incorrectAnswers:
          attempt.incorrect_answers ||
          safeResponses.filter((r) => r.user_answer && r.user_answer.trim() !== "" && !r.is_correct).length,
        scorePercentage: attempt.percentage || 0,
        totalPoints: attempt.total_points || safeResponses.reduce((sum, r) => sum + (r.points_earned || 0), 0),
        maxPoints:
          attempt.max_points || safeResponses.reduce((sum, r) => sum + (r.mock_exam_questions?.points || 1), 0),
        timeSpent: attempt.time_spent_seconds || 0,
        timeLimit: (attempt.mock_exam_templates?.time_limit_minutes || 0) * 60,
        passed: (attempt.percentage || 0) >= (attempt.mock_exam_templates?.passing_score || 60),
      },
      subjectPerformance,
    }

    console.log("✅ Results calculated successfully:", {
      totalQuestions: results.statistics.totalQuestions,
      answeredQuestions: results.statistics.answeredQuestions,
      correctAnswers: results.statistics.correctAnswers,
      scorePercentage: results.statistics.scorePercentage,
    })

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error: any) {
    console.error("❌ Error calculating results:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}

// Manual calculation fallback function
async function performManualCalculation(attemptId: string) {
  try {
    console.log("🔧 Performing manual calculation for attempt:", attemptId)

    // Get all responses for this attempt
    const { data: responses, error: responsesError } = await supabase
      .from("mock_exam_responses")
      .select(`
        *,
        mock_exam_questions (
          points
        )
      `)
      .eq("attempt_id", attemptId)

    if (responsesError || !responses) {
      console.error("❌ Error fetching responses for manual calculation:", responsesError)
      return
    }

    // Calculate statistics
    const totalQuestions = responses.length
    const answeredQuestions = responses.filter((r) => r.user_answer && r.user_answer.trim() !== "").length
    const correctAnswers = responses.filter((r) => r.is_correct).length
    const incorrectAnswers = answeredQuestions - correctAnswers
    const skippedQuestions = totalQuestions - answeredQuestions
    const totalPoints = responses.reduce((sum, r) => sum + (r.points_earned || 0), 0)
    const maxPoints = responses.reduce((sum, r) => sum + (r.mock_exam_questions?.points || 1), 0)
    const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0

    // Update the attempt
    const { error: updateError } = await supabase
      .from("mock_exam_attempts")
      .update({
        total_questions: totalQuestions,
        answered_questions: answeredQuestions,
        correct_answers: correctAnswers,
        incorrect_answers: incorrectAnswers,
        skipped_questions: skippedQuestions,
        total_points: totalPoints,
        max_points: maxPoints,
        percentage: percentage,
        score: percentage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attemptId)

    if (updateError) {
      console.error("❌ Error updating attempt manually:", updateError)
    } else {
      console.log("✅ Manual calculation completed:", { percentage, correctAnswers, totalQuestions })
    }
  } catch (error) {
    console.error("❌ Error in manual calculation:", error)
  }
}
