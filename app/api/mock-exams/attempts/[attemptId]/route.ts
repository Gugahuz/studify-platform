import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key for admin operations
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Get specific mock exam attempt with responses
export async function GET(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    console.log("📊 GET attempt:", params.attemptId)

    const attemptId = params.attemptId

    if (!attemptId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId)) {
      return NextResponse.json({ success: false, error: "Valid attempt ID is required" }, { status: 400 })
    }

    // Get attempt details
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
          passing_score,
          instructions
        )
      `)
      .eq("id", attemptId)
      .single()

    if (attemptError || !attempt) {
      console.error("❌ Error fetching attempt:", attemptError)
      return NextResponse.json({ success: false, error: "Attempt not found" }, { status: 404 })
    }

    // Get responses with questions
    const { data: responses, error: responsesError } = await supabase
      .from("mock_exam_responses")
      .select(`
        *,
        mock_exam_questions (
          id,
          question_number,
          question_text,
          question_type,
          options,
          correct_answer,
          explanation,
          subject_area,
          difficulty_level,
          points,
          time_estimate_seconds,
          tags
        )
      `)
      .eq("attempt_id", attemptId)
      .order("mock_exam_questions(question_number)", { ascending: true })

    if (responsesError) {
      console.error("❌ Error fetching responses:", responsesError)
      return NextResponse.json({ success: false, error: "Failed to fetch responses" }, { status: 500 })
    }

    console.log(`✅ Found attempt with ${responses?.length || 0} responses`)

    return NextResponse.json({
      success: true,
      data: {
        attempt,
        responses: responses || [],
      },
    })
  } catch (error: any) {
    console.error("❌ Error in mock-exams/attempts/[attemptId] GET:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Update mock exam attempt (save progress, complete, pause)
export async function PUT(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    console.log("📝 PUT attempt:", params.attemptId)

    const attemptId = params.attemptId
    const body = await request.json()

    console.log("📝 Update data:", body)

    if (!attemptId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId)) {
      return NextResponse.json({ success: false, error: "Valid attempt ID is required" }, { status: 400 })
    }

    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    // Set completion timestamp if completing
    if (body.status === "completed" && !body.completed_at) {
      updateData.completed_at = new Date().toISOString()
    }

    // Set pause timestamp if pausing
    if (body.status === "paused") {
      updateData.paused_at = new Date().toISOString()
    }

    console.log("📝 Final update data:", updateData)

    const { data: attempt, error } = await supabase
      .from("mock_exam_attempts")
      .update(updateData)
      .eq("id", attemptId)
      .select()
      .single()

    if (error) {
      console.error("❌ Error updating attempt:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("✅ Mock exam attempt updated:", attempt)

    return NextResponse.json({
      success: true,
      data: { attempt },
    })
  } catch (error: any) {
    console.error("❌ Error in mock-exams/attempts/[attemptId] PUT:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// PATCH method for partial updates (like finishing exam)
export async function PATCH(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    console.log("🔄 PATCH attempt:", params.attemptId)

    const attemptId = params.attemptId
    const body = await request.json()

    console.log("🔄 PATCH data:", body)

    if (!attemptId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId)) {
      return NextResponse.json({ success: false, error: "Valid attempt ID is required" }, { status: 400 })
    }

    // First, check if attempt exists
    const { data: existingAttempt, error: checkError } = await supabase
      .from("mock_exam_attempts")
      .select("id, status")
      .eq("id", attemptId)
      .single()

    if (checkError || !existingAttempt) {
      console.error("❌ Attempt not found:", checkError)
      return NextResponse.json({ success: false, error: "Attempt not found" }, { status: 404 })
    }

    console.log("✅ Found existing attempt:", existingAttempt)

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Add fields from body
    if (body.status) {
      updateData.status = body.status
    }

    if (body.time_spent_seconds !== undefined) {
      updateData.time_spent_seconds = body.time_spent_seconds
    }

    if (body.score !== undefined) {
      updateData.score = body.score
    }

    // Set completion timestamp if completing
    if (body.status === "completed") {
      updateData.completed_at = new Date().toISOString()
    }

    // Set pause timestamp if pausing
    if (body.status === "paused") {
      updateData.paused_at = new Date().toISOString()
    }

    console.log("🔄 Final PATCH data:", updateData)

    const { data: attempt, error } = await supabase
      .from("mock_exam_attempts")
      .update(updateData)
      .eq("id", attemptId)
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
      .single()

    if (error) {
      console.error("❌ Error updating attempt:", error)
      return NextResponse.json(
        { success: false, error: error.message || "Internal server error", details: error.stack },
        { status: 500 },
      )
    }

    console.log("✅ Mock exam attempt updated successfully")

    return NextResponse.json({
      success: true,
      data: { attempt },
    })
  } catch (error: any) {
    console.error("❌ Error in mock-exams/attempts/[attemptId] PATCH:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error", details: error.stack },
      { status: 500 },
    )
  }
}
