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
    console.log("💾 Save response request:", body)

    const { attempt_id, question_id, user_answer, time_spent_seconds = 0, is_flagged = false } = body

    if (!attempt_id || !question_id) {
      return NextResponse.json({ success: false, error: "Attempt ID and Question ID are required" }, { status: 400 })
    }

    // Get the question to check correct answer
    const { data: question, error: questionError } = await supabase
      .from("mock_exam_questions")
      .select("id, correct_answer, points")
      .eq("id", question_id)
      .single()

    if (questionError || !question) {
      console.error("❌ Error fetching question:", questionError)
      return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 })
    }

    // Determine if answer is correct
    const isCorrect = user_answer && user_answer.trim() === question.correct_answer?.trim()
    const pointsEarned = isCorrect ? question.points || 1 : 0

    console.log("🔍 Answer check:", {
      user_answer,
      correct_answer: question.correct_answer,
      isCorrect,
      pointsEarned,
    })

    // Upsert the response
    const { data: response, error: responseError } = await supabase
      .from("mock_exam_responses")
      .upsert(
        {
          attempt_id,
          question_id,
          user_answer: user_answer || null,
          is_correct: isCorrect,
          points_earned: pointsEarned,
          time_spent_seconds,
          is_flagged,
          answered_at: user_answer ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "attempt_id,question_id",
        },
      )
      .select()
      .single()

    if (responseError) {
      console.error("❌ Error saving response:", responseError)
      return NextResponse.json({ success: false, error: responseError.message }, { status: 500 })
    }

    console.log("✅ Response saved successfully:", response.id)

    // The trigger will automatically update the attempt results
    return NextResponse.json({
      success: true,
      data: {
        response,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      },
    })
  } catch (error: any) {
    console.error("❌ Error in responses POST:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}
