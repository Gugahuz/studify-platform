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
    const { attempt_id, question_id, user_answer, time_spent_seconds = 0 } = await request.json()

    if (!attempt_id || !question_id) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    console.log("💾 Saving response:", { attempt_id, question_id, user_answer })

    // Get the question to check correct answer
    const { data: question, error: questionError } = await supabase
      .from("mock_exam_questions")
      .select("correct_answer, points")
      .eq("id", question_id)
      .single()

    if (questionError || !question) {
      console.error("❌ Question not found:", questionError)
      return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 })
    }

    // Check if answer is correct
    const isCorrect = user_answer && user_answer.trim() === question.correct_answer?.trim()
    const pointsEarned = isCorrect ? question.points || 1 : 0

    // Save/update response
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
          answered_at: user_answer ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "attempt_id,question_id",
        },
      )
      .select()
      .single()

    if (responseError) {
      console.error("❌ Error saving response:", responseError)
      return NextResponse.json({ success: false, error: "Failed to save response" }, { status: 500 })
    }

    console.log("✅ Response saved successfully")

    return NextResponse.json({
      success: true,
      data: {
        response,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      },
    })
  } catch (error: any) {
    console.error("❌ Error saving response:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
