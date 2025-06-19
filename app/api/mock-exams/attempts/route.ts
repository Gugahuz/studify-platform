import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with service role for admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Get user's mock exam attempts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("template_id")
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Use mock user ID for testing
    const mockUserId = "00000000-0000-0000-0000-000000000001"

    console.log("📊 Fetching mock exam attempts for user:", mockUserId)

    let query = supabaseAdmin
      .from("mock_exam_attempts")
      .select(`
        *,
        mock_exam_templates (
          id,
          title,
          category,
          difficulty_level,
          time_limit_minutes
        )
      `)
      .eq("user_id", mockUserId)
      .order("created_at", { ascending: false })

    if (templateId) {
      query = query.eq("template_id", templateId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: attempts, error } = await query

    if (error) {
      console.error("❌ Error fetching attempts:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to fetch attempts",
        },
        { status: 500 },
      )
    }

    console.log(`✅ Found ${attempts?.length || 0} mock exam attempts`)

    return NextResponse.json({
      success: true,
      data: attempts || [],
    })
  } catch (error: any) {
    console.error("❌ Error in mock-exams/attempts GET:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

// Start new mock exam attempt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template_id } = body

    if (!template_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Template ID is required",
        },
        { status: 400 },
      )
    }

    // Use mock user ID for testing (this user should exist after running script 022)
    const mockUserId = "00000000-0000-0000-0000-000000000001"

    console.log("🚀 Starting mock exam attempt for template:", template_id)
    console.log("👤 Using user ID:", mockUserId)

    // Verify template exists and is active
    const { data: template, error: templateError } = await supabaseAdmin
      .from("mock_exam_templates")
      .select("*")
      .eq("id", template_id)
      .eq("is_active", true)
      .single()

    if (templateError || !template) {
      console.error("❌ Template error:", templateError)
      return NextResponse.json(
        {
          success: false,
          error: "Template not found or inactive",
        },
        { status: 404 },
      )
    }

    console.log("✅ Template found:", template.title)

    // Get attempt number for this user and template
    const { data: existingAttempts, error: countError } = await supabaseAdmin
      .from("mock_exam_attempts")
      .select("attempt_number")
      .eq("user_id", mockUserId)
      .eq("template_id", template_id)
      .order("attempt_number", { ascending: false })
      .limit(1)

    if (countError) {
      console.error("❌ Count error:", countError)
    }

    const attemptNumber = (existingAttempts?.[0]?.attempt_number || 0) + 1
    console.log("📊 Attempt number:", attemptNumber)

    // Create new attempt with all required fields
    const attemptData = {
      user_id: mockUserId,
      template_id,
      attempt_number: attemptNumber,
      status: "started" as const,
      total_questions: template.total_questions,
      time_limit_seconds: template.time_limit_minutes * 60,
      max_points: template.total_questions,
      score: 0,
      percentage: 0,
      answered_questions: 0,
      correct_answers: 0,
      incorrect_answers: 0,
      skipped_questions: 0,
      total_points: 0,
      time_spent_seconds: 0,
      started_at: new Date().toISOString(),
    }

    console.log("📝 Creating attempt with data:", attemptData)

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("mock_exam_attempts")
      .insert(attemptData)
      .select()
      .single()

    if (attemptError) {
      console.error("❌ Error creating attempt:", attemptError)
      console.error("❌ Error details:", {
        message: attemptError.message,
        details: attemptError.details,
        hint: attemptError.hint,
        code: attemptError.code,
      })
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create attempt: ${attemptError.message}`,
        },
        { status: 500 },
      )
    }

    console.log("✅ Attempt created:", attempt.id)

    // Get questions for this template
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("mock_exam_questions")
      .select("*")
      .eq("template_id", template_id)
      .order("question_number", { ascending: true })

    if (questionsError) {
      console.error("❌ Error fetching questions:", questionsError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch questions",
        },
        { status: 500 },
      )
    }

    if (!questions || questions.length === 0) {
      console.error("❌ No questions found for template:", template_id)
      return NextResponse.json(
        {
          success: false,
          error: "No questions found for this template",
        },
        { status: 404 },
      )
    }

    console.log(`✅ Found ${questions.length} questions`)

    // Create initial responses for all questions
    const responses = questions.map((question) => ({
      attempt_id: attempt.id,
      question_id: question.id,
      points_earned: 0,
      time_spent_seconds: 0,
      is_flagged: false,
    }))

    const { error: responsesError } = await supabaseAdmin.from("mock_exam_responses").insert(responses)

    if (responsesError) {
      console.error("❌ Error creating responses:", responsesError)
      // Don't fail the request if responses creation fails
    } else {
      console.log(`✅ Created ${responses.length} response records`)
    }

    console.log("🎉 Mock exam attempt started successfully:", attempt.id)

    return NextResponse.json({
      success: true,
      data: {
        attempt,
        template,
        questions: questions || [],
      },
    })
  } catch (error: any) {
    console.error("❌ Error in mock-exams/attempts POST:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
