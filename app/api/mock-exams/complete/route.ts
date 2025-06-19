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
    console.log("🏁 Starting exam completion...")

    const body = await request.json()
    const { attemptId, responses } = body

    if (!attemptId) {
      return NextResponse.json({ success: false, error: "Attempt ID is required" }, { status: 400 })
    }

    console.log("📋 Completion request:", {
      attemptId,
      responsesCount: responses?.length || 0,
    })

    // Get current user
    let userId: string
    try {
      const { data: userResult, error: userError } = await supabase.rpc("get_current_or_test_user")

      if (userError || !userResult) {
        console.log("⚠️ Using fallback test user")
        userId = "00000000-0000-0000-0000-000000000001"
      } else {
        userId = userResult
      }

      console.log("👤 Using user ID:", userId)
    } catch (userError) {
      console.log("⚠️ Error getting user, using fallback:", userError)
      userId = "00000000-0000-0000-0000-000000000001"
    }

    // Verify the attempt belongs to the user
    const { data: attempt, error: attemptError } = await supabase
      .from("mock_exam_attempts")
      .select("*")
      .eq("id", attemptId)
      .eq("user_id", userId)
      .single()

    if (attemptError || !attempt) {
      console.error("❌ Attempt not found or access denied:", attemptError)
      return NextResponse.json(
        {
          success: false,
          error: "Attempt not found or access denied",
          debug: { attemptId, userId, error: attemptError?.message },
        },
        { status: 404 },
      )
    }

    if (attempt.status === "completed") {
      console.log("ℹ️ Attempt already completed")
      return NextResponse.json({
        success: true,
        data: {
          attempt_id: attemptId,
          status: "already_completed",
          message: "Exam was already completed",
        },
      })
    }

    // Use the database function to complete the exam
    try {
      const { data: completionResult, error: completionError } = await supabase.rpc("complete_exam_attempt", {
        attempt_uuid: attemptId,
        user_responses: responses || null,
      })

      if (completionError) {
        console.error("❌ Error in completion function:", completionError)
        throw completionError
      }

      if (!completionResult?.success) {
        console.error("❌ Completion function returned error:", completionResult)
        return NextResponse.json(
          {
            success: false,
            error: completionResult?.error || "Unknown completion error",
            debug: completionResult,
          },
          { status: 500 },
        )
      }

      console.log("✅ Exam completed successfully via function")
      return NextResponse.json({
        success: true,
        data: completionResult.data,
        message: "Exam completed successfully",
      })
    } catch (functionError: any) {
      console.log("⚠️ Function failed, using manual completion:", functionError.message)

      // Fallback: manual completion
      try {
        // Save responses first if provided
        if (responses && responses.length > 0) {
          const responsesToInsert = responses.map((response: any) => ({
            id: crypto.randomUUID(),
            attempt_id: attemptId,
            question_id: response.question_id,
            selected_answer: response.selected_answer,
            created_at: new Date().toISOString(),
          }))

          const { error: responsesError } = await supabase.from("mock_exam_responses").upsert(responsesToInsert, {
            onConflict: "attempt_id,question_id",
          })

          if (responsesError) {
            console.error("❌ Error saving responses:", responsesError)
            throw responsesError
          }
        }

        // Calculate results manually
        const { data: questionsData, error: questionsError } = await supabase
          .from("mock_exam_questions")
          .select("*")
          .eq("template_id", attempt.template_id)

        if (questionsError || !questionsData) {
          throw new Error("Could not fetch questions for result calculation")
        }

        const { data: responsesData, error: responsesError } = await supabase
          .from("mock_exam_responses")
          .select("*")
          .eq("attempt_id", attemptId)

        if (responsesError) {
          throw new Error("Could not fetch responses for result calculation")
        }

        // Calculate scores
        let correctCount = 0
        let totalPoints = 0
        let maxPoints = 0

        questionsData.forEach((question) => {
          const response = responsesData?.find((r) => r.question_id === question.id)
          const questionPoints = question.points || 1
          maxPoints += questionPoints

          if (response && response.selected_answer === question.correct_answer) {
            correctCount++
            totalPoints += questionPoints
          }
        })

        const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0

        // Update attempt with results
        const { data: updatedAttempt, error: updateError } = await supabase
          .from("mock_exam_attempts")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            correct_answers: correctCount,
            incorrect_answers: questionsData.length - correctCount,
            total_points: totalPoints,
            max_points: maxPoints,
            percentage: percentage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", attemptId)
          .select()
          .single()

        if (updateError) {
          console.error("❌ Error updating attempt:", updateError)
          throw updateError
        }

        console.log("✅ Exam completed successfully via manual method")

        return NextResponse.json({
          success: true,
          data: {
            attempt_id: attemptId,
            correct_answers: correctCount,
            incorrect_answers: questionsData.length - correctCount,
            total_questions: questionsData.length,
            total_points: totalPoints,
            max_points: maxPoints,
            percentage: Math.round(percentage),
            status: "completed",
          },
          message: "Exam completed successfully (manual method)",
        })
      } catch (manualError: any) {
        console.error("❌ Manual completion also failed:", manualError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to complete exam",
            debug: {
              functionError: functionError.message,
              manualError: manualError.message,
            },
          },
          { status: 500 },
        )
      }
    }
  } catch (error: any) {
    console.error("❌ Unexpected error in exam completion:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        debug: {
          message: error.message,
          stack: error.stack?.split("\n").slice(0, 5),
        },
      },
      { status: 500 },
    )
  }
}
