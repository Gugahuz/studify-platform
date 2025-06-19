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
    const { template_id } = await request.json()

    if (!template_id) {
      return NextResponse.json({ success: false, error: "Template ID is required" }, { status: 400 })
    }

    console.log("🚀 Starting mock exam for template:", template_id)

    // Get test user UUID
    const userId = "00000000-0000-0000-0000-000000000001"

    // Verify template exists
    const { data: template, error: templateError } = await supabase
      .from("mock_exam_templates")
      .select("*")
      .eq("id", template_id)
      .eq("is_active", true)
      .single()

    if (templateError || !template) {
      console.error("❌ Template not found:", templateError)
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 })
    }

    // Get next attempt number
    const { data: existingAttempts } = await supabase
      .from("mock_exam_attempts")
      .select("attempt_number")
      .eq("user_id", userId)
      .eq("template_id", template_id)
      .order("attempt_number", { ascending: false })
      .limit(1)

    const attemptNumber = (existingAttempts?.[0]?.attempt_number || 0) + 1

    // Create new attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("mock_exam_attempts")
      .insert({
        user_id: userId,
        template_id,
        attempt_number: attemptNumber,
        status: "started",
        total_questions: template.total_questions,
        time_limit_seconds: template.time_limit_minutes * 60,
        max_points: template.total_questions, // 1 point per question
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (attemptError) {
      console.error("❌ Error creating attempt:", attemptError)
      return NextResponse.json({ success: false, error: "Failed to create attempt" }, { status: 500 })
    }

    // Get questions
    const { data: questions, error: questionsError } = await supabase
      .from("mock_exam_questions")
      .select("*")
      .eq("template_id", template_id)
      .order("question_number")

    if (questionsError) {
      console.error("❌ Error fetching questions:", questionsError)
      return NextResponse.json({ success: false, error: "Failed to fetch questions" }, { status: 500 })
    }

    // Create initial responses
    const responses = questions?.map((question) => ({
      attempt_id: attempt.id,
      question_id: question.id,
      points_earned: 0,
      time_spent_seconds: 0,
      is_flagged: false,
    }))

    if (responses && responses.length > 0) {
      const { error: responsesError } = await supabase.from("mock_exam_responses").insert(responses)

      if (responsesError) {
        console.error("❌ Error creating responses:", responsesError)
      }
    }

    console.log("✅ Mock exam started successfully")

    return NextResponse.json({
      success: true,
      data: {
        session: {
          attempt,
          template,
          questions: questions || [],
          currentQuestionIndex: 0,
          timeRemaining: template.time_limit_minutes * 60,
          isComplete: false,
          isPaused: false,
        },
      },
    })
  } catch (error: any) {
    console.error("❌ Error starting exam:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
